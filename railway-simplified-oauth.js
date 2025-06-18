/**
 * Railway Simplified OAuth Backend v2.3.0
 * Removes user info retrieval - only stores access token for API calls
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
console.log('=== Railway Simplified OAuth Backend v2.3.0 ===');
console.log('Environment Variables Check:');
console.log(`GHL_CLIENT_ID: ${process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`GHL_CLIENT_SECRET: ${process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`GHL_REDIRECT_URI: ${process.env.GHL_REDIRECT_URI ? 'SET' : 'NOT SET'}`);
console.log('User info retrieval: DISABLED (simplified flow)');
console.log('===========================================');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.3.0',
    timestamp: new Date().toISOString(),
    service: 'railway-simplified-oauth-backend',
    features: {
      environment_variables: !!(process.env.GHL_CLIENT_ID && process.env.GHL_CLIENT_SECRET),
      per_request_credentials: true,
      hybrid_mode: true,
      simplified_flow: true,
      user_info_retrieval: false
    }
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

    console.log('✅ Token exchange successful');

    // SIMPLIFIED: Skip user info retrieval, just store the token
    // The token contains location context and can be used for API calls
    
    // Extract location ID from token scope or use fallback
    const locationId = extractLocationFromToken(tokenData) || 'unknown';
    
    // Create minimal installation record
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
      scopes: tokenData.scope || 'unknown',
      locationId: locationId,
      tokenType: tokenData.token_type || 'Bearer',
      createdAt: new Date(),
      updatedAt: new Date(),
      flow: 'simplified'
    };

    installations.set(installationId, installation);

    console.log('✅ OAuth installation successful (POST - simplified):', {
      installationId,
      locationId,
      scopes: tokenData.scope,
      expiresIn: tokenData.expires_in
    });

    // Return JSON response for API calls
    res.json({
      success: true,
      installation_id: installationId,
      location_id: locationId,
      scopes: tokenData.scope,
      expires_in: tokenData.expires_in,
      redirect_url: `https://listings.engageautomations.com/oauth-success?installation_id=${installationId}`,
      flow: 'simplified'
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

    console.log('✅ Token exchange successful');

    // SIMPLIFIED: Skip user info retrieval, just store the token
    const locationId = extractLocationFromToken(tokenData) || 'unknown';
    
    // Store installation data
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
      scopes: tokenData.scope || 'unknown',
      locationId: locationId,
      tokenType: tokenData.token_type || 'Bearer',
      createdAt: new Date(),
      updatedAt: new Date(),
      flow: 'simplified'
    };

    installations.set(installationId, installation);

    console.log('✅ OAuth installation successful (simplified):', {
      installationId,
      locationId,
      scopes: tokenData.scope
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

// Helper function to extract location ID from token metadata
function extractLocationFromToken(tokenData) {
  try {
    // GoHighLevel tokens often contain location info in the scope or token structure
    if (tokenData.scope && tokenData.scope.includes('location')) {
      // Parse location from scope if available
      const scopeParts = tokenData.scope.split(' ');
      const locationScope = scopeParts.find(scope => scope.includes('location'));
      if (locationScope) {
        // Extract location ID from scope format
        const match = locationScope.match(/location[:\.]([a-zA-Z0-9]+)/);
        if (match) return match[1];
      }
    }
    
    // If token is JWT, decode to get location info
    if (tokenData.access_token && tokenData.access_token.includes('.')) {
      try {
        const payload = JSON.parse(atob(tokenData.access_token.split('.')[1]));
        return payload.authClassId || payload.locationId || payload.location_id;
      } catch (e) {
        console.log('Could not decode JWT token');
      }
    }
    
    return null;
  } catch (error) {
    console.log('Error extracting location from token:', error.message);
    return null;
  }
}

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
    token_status: isExpired ? 'expired' : 'valid',
    expires_at: installation.tokenExpiry,
    scopes: installation.scopes,
    location_id: installation.locationId,
    token_type: installation.tokenType,
    flow: installation.flow
  });
});

// Installation management endpoint
app.get('/api/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(install => ({
    id: install.id,
    locationId: install.locationId,
    scopes: install.scopes,
    createdAt: install.createdAt,
    tokenStatus: install.tokenExpiry > new Date() ? 'valid' : 'expired',
    flow: install.flow
  }));

  res.json({
    success: true,
    count: installationList.length,
    installations: installationList
  });
});

// GoHighLevel API proxy (ready for implementation)
app.all('/api/ghl/*', (req, res) => {
  res.json({
    message: 'GoHighLevel API proxy endpoint',
    path: req.path,
    method: req.method,
    status: 'ready_for_implementation',
    note: 'Use installation access token for authenticated requests'
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
  console.log(`🚀 Railway Simplified OAuth Backend v2.3.0 running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 OAuth callback: http://localhost:${PORT}/oauth/callback`);
  console.log(`📊 Features: Simplified flow without user info retrieval`);
});

module.exports = app;