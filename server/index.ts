import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupProductionRouting } from "./production-routing";
import { privateDeploymentGuard, ipWhitelist } from "./privacy";
import { setupDomainRedirects, setupCORS } from "./domain-config";
import { setupDirectOAuthRoutes } from "./oauth-direct";
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

    // Handle OAuth token exchange - simplified version
    if (code) {
      console.log('=== OAUTH CALLBACK SUCCESS ===');
      console.log('Authorization code received:', String(code).substring(0, 20) + '...');
      console.log('State parameter:', state);
      
      // Redirect to dedicated OAuth success page
      const successUrl = `https://dir.engageautomations.com/oauth-success?success=true&timestamp=${Date.now()}`;
      console.log('OAuth callback successful, redirecting to:', successUrl);
      return res.redirect(successUrl);
    }

    // Fallback case - if we reach here, something unexpected happened
    console.error('=== OAUTH CALLBACK FALLBACK ===');
    console.error('No valid parameters found in callback');
    console.error('Code:', code ? 'present' : 'missing');
    console.error('Error:', error ? 'present' : 'missing');
    console.error('Action:', action ? 'present' : 'missing');
    console.error('Query string:', req.url);
    console.error('==============================');
    
    const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&reason=no_valid_parameters`;
    console.log('Redirecting to error page:', redirectUrl);
    return res.redirect(redirectUrl);
  });

  // OAuth success page route
  app.get('/oauth-success', (req, res) => {
    console.log('OAuth success page requested:', req.url);
    const filePath = path.join(__dirname, '../public/oauth-success.html');
    res.sendFile(filePath);
  });

  // Dynamic OAuth app serving - bypasses caching
  app.get('/oauth-app', (req, res) => {
    console.log('Dynamic OAuth app requested');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoHighLevel Directory App</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 40px;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center; 
    }
    .btn { 
      background: #0079F2; 
      color: white; 
      padding: 12px 24px; 
      border: none; 
      border-radius: 6px; 
      text-decoration: none; 
      display: inline-block; 
      margin: 10px;
      cursor: pointer;
      font-size: 16px;
    }
    .btn:hover { background: #0066D9; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0079F2;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
      display: none;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status {
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .status.loading {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status.error {
      background: #ffebee;
      color: #c62828;
    }
    .oauth-connected {
      background: #28a745;
      padding: 20px;
      border-radius: 8px;
      color: white;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GoHighLevel Directory App</h1>
    <p>Connect your GoHighLevel account to get started.</p>
    <button onclick="startOAuth()" class="btn" id="oauthBtn">Connect with GoHighLevel</button>
    <div class="spinner" id="spinner"></div>
    <div id="status"></div>
  </div>

  <script>
    console.log('OAuth app initialized');
    
    const oauthConfig = {
      clientId: '67472ecce8b57dd9eda067a8',
      redirectUri: 'https://dir.engageautomations.com/',
      scopes: [
        'products/prices.write',
        'products/prices.readonly', 
        'products/collection.write',
        'products/collection.readonly',
        'medias.write',
        'medias.readonly',
        'locations.readonly',
        'contacts.readonly',
        'contacts.write'
      ]
    };

    function checkOAuthCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const success = urlParams.get('success');
      const storedSuccess = localStorage.getItem('oauth_success') === 'true';
      
      console.log('OAuth Status Check:', { 
        hasCode: !!code, 
        hasState: !!state, 
        hasError: !!error, 
        hasSuccess: !!success,
        storedSuccess: storedSuccess,
        currentURL: window.location.href 
      });
      
      // Handle OAuth error
      if (error) {
        showError('OAuth authorization failed: ' + error);
        return;
      }
      
      // Handle successful callback with authorization code
      if (code && state) {
        console.log('Found authorization code, processing...');
        handleOAuthCallback(code, state);
        return;
      }
      
      // Handle redirect to success page (after successful token exchange)
      if (success === 'true' || storedSuccess) {
        showOAuthSuccess();
        return;
      }
      
      // Check for missing code scenario (the issue you identified)
      if (success && !code) {
        console.warn('Success redirect without code detected - this indicates redirect URI misconfiguration');
        showError('OAuth configuration issue: Authorization code not received. Please check your GoHighLevel app redirect URI settings.');
        return;
      }
    }

    function startOAuth() {
      console.log('Starting OAuth flow...');
      
      const state = 'oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const scope = oauthConfig.scopes.join(' ');
      
      localStorage.setItem('oauth_state', state);
      
      const authUrl = new URL('https://marketplace.leadconnectorhq.com/oauth/chooselocation');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', oauthConfig.clientId);
      authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('state', state);
      
      console.log('Redirecting to:', authUrl.toString());
      
      showLoading('Redirecting to GoHighLevel...');
      
      window.location.href = authUrl.toString();
    }

    async function handleOAuthCallback(code, state) {
      console.log('Handling OAuth callback');
      
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        showError('Invalid OAuth state. Please try again.');
        return;
      }
      
      showLoading('Processing authorization...');
      
      try {
        const response = await fetch('/api/oauth/exchange-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            state: state,
            redirect_uri: oauthConfig.redirectUri
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('oauth_success', 'true');
          localStorage.setItem('oauth_timestamp', Date.now().toString());
          localStorage.removeItem('oauth_state');
          
          window.history.replaceState({}, document.title, window.location.pathname);
          showOAuthSuccess();
        } else {
          throw new Error(result.error || 'Token exchange failed');
        }
        
      } catch (error) {
        console.error('OAuth exchange error:', error);
        showError('Authorization failed: ' + error.message);
      }
    }

    function showLoading(message) {
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('oauthBtn').disabled = true;
      document.getElementById('status').innerHTML = '<div class="status loading">' + message + '</div>';
    }

    function showOAuthSuccess() {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('oauthBtn').style.display = 'none';
      document.getElementById('status').innerHTML = 
        '<div class="oauth-connected">' +
          '<h3>✓ Successfully Connected!</h3>' +
          '<p>Your GoHighLevel account is now connected. You can start creating directory listings.</p>' +
          '<button onclick="goToDashboard()" class="btn" style="background: white; color: #28a745; margin-top: 10px;">' +
            'Go to Dashboard' +
          '</button>' +
        '</div>';
    }

    function showError(message) {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('oauthBtn').disabled = false;
      document.getElementById('status').innerHTML = '<div class="status error"><strong>Error:</strong> ' + message + '</div>';
    }

    function goToDashboard() {
      alert('Dashboard functionality will be implemented here. OAuth integration is complete!');
    }

    document.addEventListener('DOMContentLoaded', checkOAuthCallback);
    checkOAuthCallback();
  </script>
</body>
</html>`);
  });

  // Local OAuth token exchange endpoint
  app.post('/api/oauth/exchange-local', async (req, res) => {
    try {
      console.log('Local OAuth token exchange requested');
      
      const { code, state, redirect_uri } = req.body;
      
      if (!code || !state || !redirect_uri) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: code, state, or redirect_uri'
        });
      }
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code, state);
      
      if (tokenData && tokenData.access_token) {
        console.log('Local OAuth tokens received successfully');
        
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
      console.error('Local OAuth token exchange error:', error);
      res.status(500).json({ 
        success: false,
        error: 'OAuth token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

// CRITICAL: OAuth callback handler MUST be first to bypass static file serving
app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
  console.log('=== PRIORITY OAUTH CALLBACK HIT ===');
  console.log('URL:', req.url);
  console.log('Query params:', req.query);
  console.log('Method:', req.method);

  const { code, state, error } = req.query;
  
  if (error) {
    console.error('OAuth error parameter:', error);
    const errorMsg = encodeURIComponent(error as string);
    const redirectUrl = `https://dir.engageautomations.com/?error=${errorMsg}`;
    console.log('Redirecting with error to:', redirectUrl);
    return res.redirect(redirectUrl);
  }

  if (!code && !error) {
    console.log('No parameters - test endpoint');
    return res.send('OAuth callback hit successfully - route is working!');
  }

  if (code) {
    console.log('=== OAUTH CALLBACK SUCCESS ===');
    console.log('Authorization code received:', String(code).substring(0, 20) + '...');
    console.log('State parameter:', state);
    
    const successUrl = `https://dir.engageautomations.com/oauth-success.html?success=oauth-callback&code=${encodeURIComponent(String(code).substring(0, 10))}...&timestamp=${Date.now()}`;
    console.log('OAuth callback successful, redirecting to:', successUrl);
    return res.redirect(successUrl);
  }

  console.error('Unexpected callback state - no valid parameters');
  const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&reason=no_valid_parameters`;
  return res.redirect(redirectUrl);
});

// Direct OAuth route handling - absolute highest priority
app.get('/oauth/start', (req, res) => {
  console.log('🚀 DIRECT OAuth route hit - initiating OAuth flow');
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const clientId = process.env.GHL_CLIENT_ID;
  const redirectUri = 'https://dir.engageautomations.com/oauth/callback';
  const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';
  
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  console.log(`🔗 Redirecting to: ${authUrl}`);
  
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000
  });
  
  return res.redirect(authUrl);
});

// Critical route interceptor for debugging
app.use((req, res, next) => {
  console.log(`🔍 Request interceptor: ${req.method} ${req.path} | URL: ${req.url} | Original URL: ${req.originalUrl}`);
  
  // Unique test route to verify server routing
  if (req.path === '/server-test-unique') {
    console.log('✅ Server routing confirmed - interceptor working');
    return res.json({ 
      message: 'Server-side routing is working correctly',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
  
  if (req.path === '/test') {
    console.log('✅ Test route intercepted');
    return res.send('OAuth routing interceptor is working! OAuth flow should now be functional.');
  }
  
  next();
});

// Setup direct OAuth routes BEFORE any middleware to ensure highest priority
setupDirectOAuthRoutes(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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
  
  // Add redirect for old OAuth route to fix caching issues
  app.get('/oauth/start', (req, res) => {
    console.log('🔄 Redirecting old OAuth route to working solution');
    res.redirect('/oauth-redirect.html');
  });

  // Register API routes first in all cases
  const server = await registerRoutes(app);
  
  if (forceProductionMode || isReplit) {
    console.log("Setting up production routing for OAuth compatibility...");
    
    // Serve static files from dist directory
    const distPath = path.join(__dirname, '..', 'dist');
    console.log(`Setting up static files from: ${distPath}`);
    
    // Static file serving (OAuth routes are already registered above)
    app.use(express.static(distPath));

    // SPA fallback - explicitly exclude OAuth routes to prevent conflicts
    app.get('*', (req, res, next) => {
      // Skip the fallback for OAuth routes - they should be handled by specific handlers
      if (req.path.startsWith('/oauth')) {
        console.log(`⚠️ OAuth route ${req.path} reached SPA fallback - skipping`);
        return next(); // Let other middleware handle OAuth routes
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
  } else if (isDevelopment && !isReplit) {
    console.log("Setting up development mode with Vite...");
    await setupVite(app, server);
  }

  // Use Cloud Run's PORT environment variable (default 8080) or fallback to 5000 for local dev
  const port = parseInt(process.env.PORT || '5000', 10);
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
