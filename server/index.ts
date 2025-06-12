import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionRouting } from "./production-routing";
import { privateDeploymentGuard, ipWhitelist } from "./privacy";
import { setupDomainRedirects, setupCORS } from "./domain-config";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// ES Module compatibility fixes for __dirname error
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make available globally for compatibility with any legacy code
global.__dirname = __dirname;
global.__filename = __filename;

// OAuth setup function for production mode - MUST be called before any middleware
function setupOAuthRoutesProduction(app: express.Express) {
  console.log('Setting up OAuth routes for production mode...');
  
  // Test route to verify backend routing
  app.get('/test', (req, res) => {
    console.log('✅ /test route hit - production backend is running');
    res.send('Production server test route is working! Backend routing confirmed.');
  });

  // OAuth start endpoint - initiates GoHighLevel OAuth flow
  app.get('/oauth/start', async (req, res) => {
    try {
      console.log('OAuth start request received');
      const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Generate authorization URL
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
      
      console.log('Generated OAuth URL:', authUrl);
      console.log('OAuth state generated:', state.slice(0, 8) + '...');
      
      // Store state in secure session cookie for validation
      res.cookie('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('OAuth start error:', error);
      res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
  });

  // OAuth callback - handles complete OAuth flow
  app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
    console.log('=== OAUTH CALLBACK HIT ===');
    console.log('URL:', req.url);
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    console.log('Method:', req.method);

    const { code, state, error, action } = req.query;
    
    // Handle OAuth URL generation requests
    if (action === 'generate-url') {
      try {
        console.log('Generating OAuth URL via callback endpoint');
        const { ghlOAuth } = await import('./ghl-oauth.js');
        const authUrl = ghlOAuth.getAuthorizationUrl(state || `state_${Date.now()}`, true);
        
        return res.json({
          success: true,
          authUrl,
          state: state || `state_${Date.now()}`,
          clientId: process.env.GHL_CLIENT_ID,
          redirectUri: 'https://dir.engageautomations.com/oauth/callback'
        });
      } catch (error) {
        console.error('OAuth URL generation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate OAuth URL',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const errorMsg = encodeURIComponent(error as string);
      const redirectUrl = `https://dir.engageautomations.com/?error=${errorMsg}`;
      console.log('Redirecting with error to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Handle test endpoint (no parameters except action)
    if (!code && !error && !action) {
      console.log('No parameters - test endpoint');
      return res.send('OAuth callback hit successfully - route is working!');
    }

    // Handle OAuth token exchange
    if (code) {
      try {
        console.log('=== STARTING TOKEN EXCHANGE ===');
        console.log('Code (first 20 chars):', String(code).substring(0, 20));
        console.log('State:', state);
        
        const { ghlOAuth } = await import('./ghl-oauth.js');
        
        // Exchange code for tokens
        const tokenData = await ghlOAuth.exchangeCodeForTokens(String(code), String(state));
        
        console.log('=== TOKEN EXCHANGE RESULT ===');
        console.log('Token data received:', tokenData ? 'YES' : 'NO');
        if (tokenData) {
          console.log('Access token present:', tokenData.access_token ? 'YES' : 'NO');
          console.log('Token type:', tokenData.token_type);
          console.log('Expires in:', tokenData.expires_in);
        }
        
        if (tokenData && tokenData.access_token) {
          console.log('✅ OAuth tokens received successfully');
          
          // Store token in session/cookie
          res.cookie('oauth_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
          
          // Redirect to success page
          const successUrl = `https://dir.engageautomations.com/?success=oauth-complete&timestamp=${Date.now()}`;
          console.log('Redirecting to success page:', successUrl);
          return res.redirect(successUrl);
          
        } else {
          console.error('❌ No access token received from GoHighLevel');
          throw new Error('No access token received from GoHighLevel');
        }
        
      } catch (error) {
        console.error('=== OAUTH TOKEN EXCHANGE FAILED ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('======================================');
        
        const errorMsg = encodeURIComponent('Token exchange failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&details=${errorMsg}`;
        console.log('Redirecting to error page:', redirectUrl);
        return res.redirect(redirectUrl);
      }
    }
  });

  // OAuth token exchange endpoint - GET version to bypass infrastructure
  app.get('/api/oauth/exchange', async (req, res) => {
    try {
      console.log('OAuth token exchange endpoint hit via GET');
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      console.log('Processing OAuth code:', String(code).substring(0, 10) + '...');
      
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
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth token exchange endpoint (POST version for compatibility)
  app.post('/api/oauth/exchange', express.json(), async (req, res) => {
    try {
      console.log('OAuth token exchange endpoint hit in production');
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
        console.log('OAuth tokens received successfully in production');
        
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
      console.error('OAuth token exchange error in production:', error);
      res.status(500).json({ 
        success: false,
        error: 'OAuth token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth URL generation endpoint - using GET to bypass infrastructure
  app.get('/api/oauth/url', async (req, res) => {
    try {
      console.log('OAuth URL generation endpoint hit via GET');
      const state = req.query.state || `state_${Date.now()}`;
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Generate authorization URL
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
      
      console.log('Generated OAuth URL:', authUrl);
      
      res.json({
        success: true,
        authUrl,
        state,
        clientId: process.env.GHL_CLIENT_ID,
        redirectUri: 'https://dir.engageautomations.com/api/oauth/callback'
      });
      
    } catch (error) {
      console.error('OAuth URL generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate OAuth URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth URL generation endpoint (POST version for compatibility)
  app.post('/api/oauth/url', express.json(), async (req, res) => {
    try {
      console.log('OAuth URL generation endpoint hit in production');
      const { state, scopes } = req.body;
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Generate authorization URL
      const authUrl = ghlOAuth.getAuthorizationUrl(state || `state_${Date.now()}`, true);
      
      console.log('Generated OAuth URL in production:', authUrl);
      
      res.json({
        success: true,
        authUrl,
        clientId: process.env.GHL_CLIENT_ID,
        redirectUri: 'https://dir.engageautomations.com/oauth-complete.html'
      });
      
    } catch (error) {
      console.error('OAuth URL generation error in production:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate OAuth URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GoHighLevel API test endpoint
  app.get('/api/ghl/test', async (req, res) => {
    try {
      console.log('GoHighLevel API test endpoint hit in production');
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No access token provided' });
      }

      const accessToken = authHeader.replace('Bearer ', '');
      console.log('Testing GoHighLevel API with token in production');
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Test user info endpoint
      const userInfo = await ghlOAuth.getUserInfo(accessToken);
      
      console.log('GoHighLevel API test successful in production:', userInfo);
      
      res.json({
        success: true,
        message: 'GoHighLevel API access confirmed',
        userInfo: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email
        }
      });
      
    } catch (error) {
      console.error('GoHighLevel API test error in production:', error);
      
      if (error instanceof Error && error.message === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          message: 'Please re-authenticate with GoHighLevel'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'API test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  console.log('OAuth routes registered successfully for production');
  
  // Debug: Log all registered routes to verify OAuth endpoints
  console.log('=== REGISTERED ROUTES DEBUG ===');
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      console.log(`Route ${index}: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name && middleware.regexp) {
      console.log(`Middleware ${index}: ${middleware.name} - ${middleware.regexp}`);
    }
  });
  console.log('=== END ROUTES DEBUG ===');
}

const app = express();

// Essential middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CRITICAL: Register OAuth routes FIRST, before any other routes or static middleware
setupOAuthRoutesProduction(app);

// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

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

  // Add request tracing middleware to debug routing issues
  app.use((req, res, next) => {
    console.log(`🔍 Incoming request: ${req.method} ${req.url}`);
    
    // Special debug for OAuth routes
    if (req.url.includes('/api/oauth/')) {
      console.log(`🔧 OAuth route detected: ${req.method} ${req.url}`);
      console.log(`🔧 Content-Type: ${req.headers['content-type']}`);
    }
    
    next();
  });

  // OAuth routes are handled by setupOAuthRoutesProduction - no duplicates needed

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
  
  // Force production mode for OAuth routing to work properly
  const isReplit = process.env.REPLIT_DOMAIN || process.env.REPL_ID;
  const forceProductionMode = process.env.FORCE_PRODUCTION === 'true' || process.env.NODE_ENV === 'production' || isReplit;
  
  // Register API routes first in all cases
  const server = await registerRoutes(app);
  
  if (forceProductionMode || isReplit) {
    console.log("Setting up production routing for OAuth compatibility...");
    
    // Add static file serving AFTER API routes
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    
    // Final fallback for SPA routing - excludes API/OAuth paths
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/oauth')) {
        return res.status(404).json({ error: "API endpoint not found", path: req.path });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
  } else if (isDevelopment && !isReplit) {
    console.log("Setting up development mode with Vite...");
    await setupVite(app, server);
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
