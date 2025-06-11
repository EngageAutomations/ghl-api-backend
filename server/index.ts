import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionRouting } from "./production-router";
import { privateDeploymentGuard, ipWhitelist } from "./privacy";
import { setupDomainRedirects, setupCORS } from "./domain-config";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module compatibility fixes for __dirname error
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make available globally for compatibility with any legacy code
global.__dirname = __dirname;
global.__filename = __filename;

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
  // OAuth callback test endpoint for debugging
  app.get('/oauth/test', (req, res) => {
    res.json({
      message: 'OAuth test endpoint working',
      timestamp: new Date().toISOString(),
      query: req.query
    });
  });

  // Test authorization endpoint with simpler path
  app.get("/auth/ghl/start", (req, res) => {
    console.log('Simple OAuth auth endpoint hit');
    res.json({
      message: 'OAuth auth endpoint accessible',
      timestamp: new Date().toISOString()
    });
  });

  // Add OAuth routes before Vite middleware to prevent catch-all interference
  const { ghlOAuth } = await import('./ghl-oauth.js');
  const jwt = (await import('jsonwebtoken')).default;
  
  // OAuth authorization endpoint
  app.get("/api/auth/ghl/authorize", (req, res) => {
    console.log('OAuth authorization endpoint hit');
    
    const state = Math.random().toString(36).substring(2, 15);
    
    // Set state cookie for validation
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    
    const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
    console.log('Redirecting to GHL auth URL:', authUrl);
    
    res.redirect(authUrl);
  });

  // OAuth callback endpoint  
  app.get("/api/oauth/callback", async (req, res) => {
    console.log('=== OAUTH CALLBACK STARTED ===');
    console.log('Query params:', req.query);
    
    // Handle authorization initiation
    if (req.query.action === 'authorize') {
      console.log('OAuth authorization request');
      
      const state = Math.random().toString(36).substring(2, 15);
      
      // Set state cookie for validation
      res.cookie('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
      });
      
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
      console.log('Redirecting to GHL auth URL:', authUrl);
      
      return res.redirect(authUrl);
    }
    
    if (!req.query.code) {
      console.log('No code provided - returning test response');
      return res.send('OAuth callback hit successfully - route is working!');
    }
    
    try {
      console.log('Processing OAuth callback with code length:', req.query.code.length);
      
      const { code, state, error } = req.query;
      
      if (error) {
        console.log("OAuth error received:", error);
        return res.redirect(`/oauth-error?error=${error}`);
      }

      if (!code) {
        console.log("No authorization code received");
        return res.redirect("/oauth-error?error=no_code");
      }

      console.log("Processing OAuth callback with code:", code?.toString().substring(0, 10) + "...");

      // Exchange code for tokens
      console.log("Exchanging code for tokens...");
      let tokens;
      try {
        tokens = await ghlOAuth.exchangeCodeForTokens(code as string);
        console.log("Token exchange successful:", { 
          access_token: tokens.access_token ? "present" : "missing",
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
          scope: tokens.scope
        });
      } catch (tokenError) {
        console.error("=== TOKEN EXCHANGE ERROR CAUGHT ===");
        console.error("Error:", tokenError.message);
        console.error("Stack:", tokenError.stack);
        console.error("===================================");
        throw tokenError;
      }
      
      // Get user info from GHL
      console.log("Getting user info from GHL...");
      const userInfo = await ghlOAuth.getUserInfo(tokens.access_token);
      console.log("User info received:", {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name
      });
      
      // Create session token for successful OAuth
      const sessionToken = jwt.sign(
        { userId: userInfo.id, authType: 'oauth', email: userInfo.email },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Set session cookie
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Clear state cookie
      res.clearCookie('oauth_state');

      // Redirect to dashboard
      res.redirect('/');
    } catch (error) {
      console.error("=== OAUTH CALLBACK ERROR ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Request query:", req.query);
      console.error("================================");
      res.redirect("/oauth-error?error=callback_failed");
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
  const nodeEnv = process.env.NODE_ENV || "development";
  const isDevelopment = nodeEnv === "development";
  console.log(`Environment: ${nodeEnv}, isDevelopment: ${isDevelopment}`);
  
  // Force development mode for Replit environment to ensure OAuth routes work
  const isReplit = process.env.REPLIT_DOMAIN || process.env.REPL_ID;
  const forceDevMode = isReplit && !process.env.FORCE_PRODUCTION;
  
  if (isDevelopment || forceDevMode) {
    console.log("Setting up development mode with Vite...");
    await setupVite(app, server);
  } else {
    console.log("Setting up production routing...");
    setupProductionRouting(app);
  }

  // Use Cloud Run's PORT environment variable (default 8080) or fallback to 5000 for local dev
  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log('='.repeat(50));
    console.log('🚀 Server Running');
    console.log('='.repeat(50));
    console.log(`Port: ${port}`);
    console.log(`Host: 0.0.0.0`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`ES Module compatibility: ✓`);
    console.log(`__dirname available: ${__dirname}`);
    console.log('='.repeat(50));
    log(`serving on port ${port}`);
  });
})();
