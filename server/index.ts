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

  // Add request tracing middleware to debug routing issues
  app.use((req, res, next) => {
    console.log(`🔍 Incoming request: ${req.method} ${req.url}`);
    next();
  });

  // OAuth callback handler with fallback mechanism
  app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
    console.log('OAuth callback endpoint accessed');
    console.log('Query params:', req.query);
    console.log('URL:', req.url);

    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;
    
    if (error) {
      console.log('OAuth error received:', error);
      return res.redirect(`/oauth-error?error=${error}`);
    }
    
    if (!code) {
      console.log('No authorization code - serving OAuth bridge page');
      // Serve a bridge page that can handle URL parameters via JavaScript
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Processing</title>
          <script>
            // Extract code from URL parameters using JavaScript
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            
            if (error) {
              window.location.href = '/oauth-error?error=' + error;
            } else if (code) {
              // Process OAuth code via JavaScript
              fetch('/api/oauth/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, state: state })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  window.location.href = '/dashboard?auth=success';
                } else {
                  window.location.href = '/oauth-error?error=token_exchange_failed';
                }
              })
              .catch(() => {
                window.location.href = '/oauth-error?error=callback_processing_failed';
              });
            } else {
              document.body.innerHTML = '<h2>OAuth Callback Working</h2><p>This endpoint is functioning correctly.</p>';
            }
          </script>
        </head>
        <body>
          <h2>Processing OAuth...</h2>
          <p>Please wait while we complete your authentication.</p>
        </body>
        </html>
      `);
    }

    console.log('Direct OAuth processing with code:', code?.substring(0, 10) + '...');
    
    try {
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code, state);
      
      if (tokenData.access_token) {
        console.log('OAuth tokens received successfully');
        // Set session and redirect
        res.cookie('oauth_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.redirect('/dashboard?auth=success');
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('OAuth processing failed:', error);
      res.redirect('/oauth-error?error=token_exchange_failed');
    }
  });

  // OAuth token exchange endpoint (must be before other routes)
  app.post('/api/oauth/exchange', async (req, res) => {
    try {
      console.log('OAuth token exchange endpoint hit');
      const { code, state } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      console.log('Processing OAuth code:', code.substring(0, 10) + '...');
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code, state);
      
      if (tokenData && tokenData.access_token) {
        console.log('OAuth tokens received successfully');
        
        // Store token in session/cookie
        res.cookie('oauth_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.json({ 
          success: true, 
          message: 'OAuth tokens exchanged successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No access token received from GoHighLevel');
      }
      
    } catch (error) {
      console.error('OAuth token exchange error:', error);
      res.status(500).json({ 
        success: false,
        error: 'OAuth token exchange failed',
        details: error.message 
      });
    }
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

  // OAuth authorization endpoint - initiate OAuth flow
  app.get("/api/oauth/authorize", async (req, res) => {
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
    
    res.redirect(authUrl);
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
