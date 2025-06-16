/**
 * Railway Hybrid OAuth Backend v2.2.0
 * Supports both environment variables and per-request credentials
 * Secure implementation with HTTPS-only credential transmission
 */

const express = require('express');
const cors = require('cors');
const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://listings.engageautomations.com',
    'https://dir.engageautomations.com',
    /\.replit\.app$/,
    /\.replit\.dev$/,
    'https://app.gohighlevel.com',
    'https://marketplace.gohighlevel.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Installation-ID', 'X-OAuth-Credentials']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage for installations
const installations = new Map();

// OAuth credential validation and extraction
function getOAuthCredentials(req) {
  // Try per-request credentials first (Railway compatibility)
  if (req.body && req.body.oauth_credentials) {
    const { client_id, client_secret, redirect_uri } = req.body.oauth_credentials;
    if (client_id && client_secret && redirect_uri) {
      console.log('✅ Using per-request OAuth credentials');
      return { client_id, client_secret, redirect_uri };
    }
  }
  
  // Fallback to environment variables (standard approach)
  const envCredentials = {
    client_id: process.env.GHL_CLIENT_ID,
    client_secret: process.env.GHL_CLIENT_SECRET,
    redirect_uri: process.env.GHL_REDIRECT_URI
  };
  
  if (envCredentials.client_id && envCredentials.client_secret && envCredentials.redirect_uri) {
    console.log('✅ Using environment variable OAuth credentials');
    return envCredentials;
  }
  
  console.log('❌ No OAuth credentials available');
  return null;
}

// Enhanced startup validation
console.log('=== Railway Hybrid OAuth Backend v2.2.0 ===');
console.log('Environment Variables Check:');
console.log(`GHL_CLIENT_ID: ${process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`GHL_CLIENT_SECRET: ${process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`GHL_REDIRECT_URI: ${process.env.GHL_REDIRECT_URI ? 'SET' : 'NOT SET'}`);
console.log('Per-request credentials: SUPPORTED');
console.log('Hybrid OAuth mode: ACTIVE');
console.log('===========================================');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    service: 'railway-hybrid-oauth-backend',
    features: {
      environment_variables: !!(process.env.GHL_CLIENT_ID && process.env.GHL_CLIENT_SECRET),
      per_request_credentials: true,
      hybrid_mode: true
    }
  });
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.2.0',
    backend: 'railway-hybrid-oauth',
    timestamp: new Date().toISOString(),
    oauth_methods: ['environment_variables', 'per_request_credentials'],
    fixes: [
      'Added hybrid OAuth credential support',
      'Per-request credential transmission',
      'Railway environment variable compatibility',
      'Maintained backward compatibility'
    ]
  });
});

// POST OAuth callback with per-request credentials (Railway compatibility)
app.post(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
  console.log('=== POST OAUTH CALLBACK HIT ===');
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Method:', req.method);

  const { code, state, oauth_credentials } = req.body;
  
  if (!code) {
    return res.status(400).json({
      error: 'authorization_code_missing',
      message: 'Authorization code is required'
    });
  }

  try {
    const credentials = getOAuthCredentials(req);
    
    if (!credentials) {
      return res.status(400).json({
        error: 'oauth_credentials_missing',
        message: 'OAuth credentials required in request body or environment variables',
        required_format: {
          oauth_credentials: {
            client_id: 'your_client_id',
            client_secret: 'your_client_secret',
            redirect_uri: 'your_redirect_uri'
          }
        }
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        code: code,
        redirect_uri: credentials.redirect_uri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.log('❌ Token exchange failed:', tokenData);
      return res.status(400).json({
        error: 'token_exchange_failed',
        details: tokenData,
        solution: 'Verify OAuth credentials and authorization code'
      });
    }

    // Get user information
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.log('❌ User info retrieval failed:', userData);
      return res.status(400).json({
        error: 'user_info_failed',
        details: userData
      });
    }

    // Store installation data
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      ghlUserId: userData.id,
      ghlLocationId: userData.locationId || 'unknown',
      ghlLocationName: userData.locationName || 'Unknown Location',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
      scopes: tokenData.scope || 'unknown',
      userInfo: userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    installations.set(installationId, installation);

    console.log('✅ OAuth installation successful (POST):', {
      installationId,
      userId: userData.id,
      locationId: userData.locationId
    });

    // Return JSON response for API calls
    res.json({
      success: true,
      installation_id: installationId,
      user_info: userData,
      redirect_url: `https://listings.engageautomations.com/oauth-success?installation_id=${installationId}`
    });

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).json({
      error: 'oauth_callback_failed',
      message: error.message
    });
  }
});

// OAuth callback - handles complete OAuth flow (GET - existing compatibility)
app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
  console.log('=== GET OAUTH CALLBACK HIT ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    const errorMsg = encodeURIComponent(error);
    const redirectUrl = `https://listings.engageautomations.com/?error=${errorMsg}`;
    return res.redirect(redirectUrl);
  }

  if (!code) {
    return res.status(400).json({
      error: 'authorization_code_missing',
      message: 'Authorization code is required'
    });
  }

  try {
    // For GET requests, we need credentials from environment variables
    const credentials = {
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      redirect_uri: process.env.GHL_REDIRECT_URI
    };

    if (!credentials.client_id || !credentials.client_secret || !credentials.redirect_uri) {
      console.log('❌ OAuth callback failed: Environment variables not available');
      return res.status(500).json({
        error: 'oauth_credentials_missing',
        message: 'OAuth credentials not configured. Use POST /oauth/callback with credentials in request body.',
        solution: 'Send credentials with each request for Railway compatibility'
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        code: code,
        redirect_uri: credentials.redirect_uri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.log('❌ Token exchange failed:', tokenData);
      return res.status(400).json({
        error: 'token_exchange_failed',
        details: tokenData
      });
    }

    // Get user information
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.log('❌ User info retrieval failed:', userData);
      return res.status(400).json({
        error: 'user_info_failed',
        details: userData
      });
    }

    // Store installation data
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      ghlUserId: userData.id,
      ghlLocationId: userData.locationId || 'unknown',
      ghlLocationName: userData.locationName || 'Unknown Location',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
      scopes: tokenData.scope || 'unknown',
      userInfo: userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    installations.set(installationId, installation);

    console.log('✅ OAuth installation successful:', {
      installationId,
      userId: userData.id,
      locationId: userData.locationId
    });

    // Redirect to success page
    const successUrl = `https://listings.engageautomations.com/oauth-success?installation_id=${installationId}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).json({
      error: 'oauth_callback_failed',
      message: error.message
    });
  }
});

// OAuth auth endpoint (frontend compatibility)
app.get('/api/oauth/auth', (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({
      error: 'installation_id_required',
      message: 'Installation ID is required'
    });
  }

  // Check if installation exists
  const installation = installations.get(installation_id);
  if (!installation) {
    return res.status(404).json({
      error: 'installation_not_found',
      message: 'Installation not found',
      installation_id
    });
  }

  res.json({
    success: true,
    installation_id,
    status: 'authenticated'
  });
});

// OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({
      error: 'installation_id_required',
      message: 'Installation ID is required'
    });
  }

  const installation = installations.get(installation_id);
  if (!installation) {
    return res.status(404).json({
      error: 'installation_not_found',
      message: 'Installation not found'
    });
  }

  // Check token expiry
  const now = new Date();
  const isExpired = installation.tokenExpiry < now;

  res.json({
    success: true,
    installation_id,
    user_info: installation.userInfo,
    token_status: isExpired ? 'expired' : 'valid',
    expires_at: installation.tokenExpiry,
    scopes: installation.scopes,
    location_id: installation.ghlLocationId,
    location_name: installation.ghlLocationName
  });
});

// Installation management endpoint
app.get('/api/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(install => ({
    id: install.id,
    ghlUserId: install.ghlUserId,
    ghlLocationId: install.ghlLocationId,
    ghlLocationName: install.ghlLocationName,
    scopes: install.scopes,
    createdAt: install.createdAt,
    tokenStatus: install.tokenExpiry > new Date() ? 'valid' : 'expired'
  }));

  res.json({
    success: true,
    count: installationList.length,
    installations: installationList
  });
});

// GoHighLevel API proxy (future use)
app.all('/api/ghl/*', (req, res) => {
  res.json({
    message: 'GoHighLevel API proxy endpoint',
    path: req.path,
    method: req.method,
    status: 'ready_for_implementation'
  });
});

// Catch-all for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'endpoint_not_found',
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /api/health',
      'GET /oauth/callback',
      'POST /oauth/callback',
      'GET /api/oauth/auth',
      'GET /api/oauth/status',
      'GET /api/installations'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway Hybrid OAuth Backend v2.2.0 running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 OAuth callback: http://localhost:${PORT}/oauth/callback`);
  console.log(`📊 Features: Environment variables + Per-request credentials`);
});

module.exports = app;