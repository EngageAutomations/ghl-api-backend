import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionRouting } from "./production-router";
import { privateDeploymentGuard, ipWhitelist } from "./privacy";
import { setupDomainRedirects, setupCORS } from "./domain-config";

const app = express();

// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Critical: Register OAuth callback routes FIRST to prevent routing conflicts
  app.get(['/api/oauth/callback', '/oauth/callback'], async (req: any, res: any) => {
    try {
      console.log('✅ Callback route reached with code:', req.query.code);
      console.log('Full query params:', req.query);
      
      // Test response to confirm route works
      if (!req.query.code || req.query.code === 'TEST123') {
        return res.send('OAuth callback hit successfully - route is working!');
      }
      
      const { code, state, error } = req.query;
      
      if (error) {
        console.log('OAuth error:', error);
        return res.redirect(`/oauth-error?error=${error}`);
      }

      if (!code) {
        console.log('No authorization code');
        return res.redirect('/oauth-error?error=no_code');
      }

      // Import OAuth service inline to avoid circular dependencies
      const { ghlOAuth } = await import('./ghl-oauth');
      const { storage } = await import('./storage');
      const jwt = require('jsonwebtoken');

      console.log('Exchanging code for tokens...');
      const tokens = await ghlOAuth.exchangeCodeForTokens(code as string);
      
      console.log('Getting user info...');
      const userInfo = await ghlOAuth.getUserInfo(tokens.access_token);
      
      // Check if user exists
      let user = await storage.getUserByGhlId(userInfo.id);
      
      if (!user) {
        // Create username from email
        const username = userInfo.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 8);
        const tokenExpiryDate = new Date(Date.now() + (tokens.expires_in * 1000));
        
        user = await storage.createOAuthUser({
          username: username,
          displayName: userInfo.name,
          email: userInfo.email,
          ghlUserId: userInfo.id,
          ghlAccessToken: tokens.access_token,
          ghlRefreshToken: tokens.refresh_token,
          ghlTokenExpiry: tokenExpiryDate,
          ghlScopes: tokens.scope,
          ghlLocationId: '',
          ghlLocationName: '',
          authType: 'oauth',
          isActive: true
        });
        
        console.log('Created new OAuth user:', user.id);
      } else {
        // Update tokens
        const tokenExpiryDate = new Date(Date.now() + (tokens.expires_in * 1000));
        await storage.updateUserOAuthTokens(user.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokenExpiryDate,
        });
        console.log('Updated existing user tokens:', user.id);
      }

      // Create session
      const sessionToken = jwt.sign(
        { userId: user.id, authType: 'oauth' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      console.log('✅ OAuth authentication successful, redirecting to dashboard');
      res.redirect('/dashboard');
      
    } catch (error) {
      console.error('Production OAuth callback error:', error);
      res.redirect('/oauth-error?error=callback_failed');
    }
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    setupProductionRouting(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
