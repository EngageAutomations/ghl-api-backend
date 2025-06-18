/**
 * Fixed Railway OAuth Backend - Corrected GoHighLevel User API Endpoint
 * Addresses both "user_info_failed" and missing endpoint issues
 */

const express = require('express');
const cors = require('cors');

// Environment variable validation
console.log('=== Environment Variables Check ===');
console.log('GHL_CLIENT_ID:', process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GHL_CLIENT_SECRET:', process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('GHL_REDIRECT_URI:', process.env.GHL_REDIRECT_URI || 'NOT SET');

if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET || !process.env.GHL_REDIRECT_URI) {
  console.error('❌ Missing required environment variables:');
  if (!process.env.GHL_CLIENT_ID) console.error('  - GHL_CLIENT_ID');
  if (!process.env.GHL_CLIENT_SECRET) console.error('  - GHL_CLIENT_SECRET');
  if (!process.env.GHL_REDIRECT_URI) console.error('  - GHL_REDIRECT_URI');
  console.error('⚠️  OAuth functionality will fail without these variables');
}

const app = express();

// Enhanced CORS for OAuth and embedded access
const corsOptions = {
  origin: [
    'https://app.gohighlevel.com',
    'https://dir.engageautomations.com',
    'https://listings.engageautomations.com',
    /\.replit\.app$/,
    /\.railway\.app$/,
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Version'
  ]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory storage for OAuth installations
const installations = new Map();

/**
 * FIXED: OAuth Auth Endpoint - Frontend compatibility
 * This endpoint was missing, causing 404 errors on retry
 */
app.get('/api/oauth/auth', async (req, res) => {
  console.log('OAuth Auth endpoint hit:', req.query);
  
  const installationId = req.query.installation_id;
  
  if (!installationId) {
    return res.status(400).json({
      success: false,
      error: 'missing_installation_id',
      message: 'Installation ID is required for OAuth authentication'
    });
  }
  
  // Check if installation exists
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'installation_not_found',
      message: 'OAuth installation not found. Please reinstall the app.',
      installation_id: installationId
    });
  }
  
  try {
    // FIXED: Use correct GoHighLevel user endpoint
    const userInfoResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('GoHighLevel user info failed:', userInfoResponse.status, errorText);
      
      // Handle token refresh if needed
      if (userInfoResponse.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'token_expired',
          message: 'Access token expired. Please reconnect your GoHighLevel account.'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'user_info_failed',
        message: `Failed to retrieve user information: ${userInfoResponse.status}`
      });
    }
    
    const userData = await userInfoResponse.json();
    
    // Update installation with fresh user data
    installation.userInfo = userData;
    installation.lastUpdated = new Date().toISOString();
    
    res.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name || userData.firstName + ' ' + userData.lastName,
        email: userData.email,
        locationId: installation.locationId,
        locationName: installation.locationName
      },
      installation: {
        id: installationId,
        scopes: installation.scopes,
        created_at: installation.createdAt
      }
    });
    
  } catch (error) {
    console.error('OAuth auth endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'user_info_failed',
      message: 'Failed to retrieve user information from GoHighLevel'
    });
  }
});

/**
 * OAuth Status Endpoint - Production endpoint
 */
app.get('/api/oauth/status', async (req, res) => {
  console.log('OAuth Status endpoint hit:', req.query);
  
  const installationId = req.query.installation_id;
  
  if (!installationId) {
    return res.status(400).json({
      success: false,
      error: 'missing_installation_id',
      message: 'Installation ID is required'
    });
  }
  
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'installation_not_found',
      message: 'Installation not found',
      installation_id: installationId
    });
  }
  
  try {
    // FIXED: Use correct GoHighLevel user endpoint
    const userInfoResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('GoHighLevel user info failed:', userInfoResponse.status, errorText);
      
      return res.status(500).json({
        success: false,
        error: 'user_info_failed',
        message: `Failed to retrieve user information: ${userInfoResponse.status}`,
        details: errorText
      });
    }
    
    const userData = await userInfoResponse.json();
    
    res.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name || userData.firstName + ' ' + userData.lastName,
        email: userData.email,
        locationId: installation.locationId,
        locationName: installation.locationName
      },
      installation: {
        id: installationId,
        scopes: installation.scopes,
        created_at: installation.createdAt
      }
    });
    
  } catch (error) {
    console.error('OAuth status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'user_info_failed',
      message: 'Failed to retrieve user information from GoHighLevel'
    });
  }
});

/**
 * OAuth Callback Handler with real token exchange
 */
app.get('/oauth/callback', async (req, res) => {
  console.log('OAuth callback received:', req.query);
  
  const { code, state } = req.query;
  
  if (!code) {
    const redirectUrl = `https://listings.engageautomations.com/oauth-error?error=no_code`;
    return res.redirect(redirectUrl);
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      const redirectUrl = `https://listings.engageautomations.com/oauth-error?error=token_exchange_failed`;
      return res.redirect(redirectUrl);
    }
    
    const tokenData = await tokenResponse.json();
    
    // FIXED: Get user info with correct endpoint
    const userInfoResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info retrieval failed:', userInfoResponse.status, errorText);
      const redirectUrl = `https://listings.engageautomations.com/oauth-error?error=user_info_failed`;
      return res.redirect(redirectUrl);
    }
    
    const userData = await userInfoResponse.json();
    
    // Get location data if available
    let locationData = null;
    if (userData.locationId) {
      try {
        const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${userData.locationId}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28'
          }
        });
        if (locationResponse.ok) {
          locationData = await locationResponse.json();
        }
      } catch (error) {
        console.log('Location data fetch failed:', error.message);
      }
    }
    
    // Create installation record
    const installationId = `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const installation = {
      installationId,
      userId: userData.id,
      locationId: userData.locationId || locationData?.id,
      locationName: locationData?.name || 'Unknown Location',
      userInfo: userData,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      scopes: tokenData.scope,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      createdAt: new Date().toISOString()
    };
    
    installations.set(installationId, installation);
    
    console.log(`OAuth installation successful: ${installationId}`);
    
    // Redirect to success page
    const redirectUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&oauth_success=true`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    const redirectUrl = `https://listings.engageautomations.com/oauth-error?error=callback_failed`;
    res.redirect(redirectUrl);
  }
});

// Health check endpoint (NEW - version 2.0.0)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'oauth-backend',
    version: '2.0.0',
    fixes: [
      'Corrected GoHighLevel user API endpoint to /users/me',
      'Added missing /api/oauth/auth endpoint',
      'Enhanced error handling and token management'
    ]
  });
});

// Legacy health endpoint for compatibility
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'oauth-backend',
    version: '2.0.0',
    message: 'Railway OAuth Backend - Fixed and Updated'
  });
});

// Installation management
app.get('/api/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(inst => ({
    id: inst.installationId,
    userId: inst.userId,
    locationId: inst.locationId,
    locationName: inst.locationName,
    scopes: inst.scopes,
    createdAt: inst.createdAt
  }));
  
  res.json({
    installations: installationList,
    count: installationList.length
  });
});

// GoHighLevel API proxy
app.use('/api/ghl/*', (req, res) => {
  res.status(501).json({
    error: 'API proxy not implemented',
    message: 'GoHighLevel API proxy functionality coming soon'
  });
});

// 404 handler with available endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    available_endpoints: [
      'GET /api/health',
      'GET /health',
      'GET /api/oauth/auth',
      'GET /api/oauth/status', 
      'GET /oauth/callback',
      'GET /api/installations',
      'GET /api/ghl/*'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fixed OAuth Backend running on port ${PORT}`);
  console.log('✅ Corrected GoHighLevel user API endpoint: /users/me');
  console.log('✅ Added missing /api/oauth/auth endpoint');
  console.log('✅ Enhanced error handling and token management');
  console.log('✅ Updated version to 2.0.0');
});

module.exports = app;