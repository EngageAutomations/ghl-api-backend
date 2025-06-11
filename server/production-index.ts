// Production server with ES module compatibility fixes
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './routes.js';
import { setupProductionRouting } from './production-router.js';
import { setupDomainRedirects, setupCORS } from './domain-config.js';

// OAuth setup function for production
async function setupOAuthRoutes(app: express.Express) {
  console.log('Setting up OAuth routes for production...');
  
  // Test route to verify backend routing
  app.get('/test', (req, res) => {
    console.log('✅ /test route hit - production backend is running');
    res.send('Production server test route is working! Backend routing confirmed.');
  });

  // OAuth callback redirect to static bridge page
  app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
    console.log('✅ OAuth callback endpoint accessed - production routing is working');
    console.log('Query params:', req.query);
    console.log('URL:', req.url);

    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;
    
    if (!code && !error) {
      console.log('No parameters - test endpoint');
      return res.send('OAuth callback hit successfully - production route is working!');
    }
    
    // Redirect to static OAuth complete page with parameters preserved
    const params = new URLSearchParams();
    if (code) params.set('code', code as string);
    if (state) params.set('state', state as string);
    if (error) params.set('error', error as string);
    
    const redirectUrl = `/oauth-complete.html?${params.toString()}`;
    console.log('Redirecting to OAuth complete page:', redirectUrl);
    
    res.redirect(redirectUrl);
  });

  // OAuth token exchange endpoint
  app.post('/api/oauth/exchange', async (req, res) => {
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

  // OAuth URL generation endpoint
  app.post('/api/oauth/url', async (req, res) => {
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
}

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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

      console.log(logLine);
    }
  });

  next();
});

// Setup routes and production routing
async function initializeServer() {
  try {
    // Register OAuth routes BEFORE other routes and static serving
    await setupOAuthRoutes(app);
    
    // Register API routes
    registerRoutes(app);
    
    // Setup production static file serving
    setupProductionRouting(app);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Start server on all interfaces for Cloud Run
    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`=== Production Server Started ===`);
      console.log(`Port: ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`Ready for connections on 0.0.0.0:${port}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();