/**
 * Railway Hybrid OAuth Backend v2.2.2
 * Corrected GoHighLevel user API endpoint with proper user ID
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
console.log('=== Railway Hybrid OAuth Backend v2.2.2 ===');
console.log('Environment Variables Check:');
console.log(`GHL_CLIENT_ID: ${process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`GHL_CLIENT_SECRET: ${process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`GHL_REDIRECT_URI: ${process.env.GHL_REDIRECT_URI ? 'SET' : 'NOT SET'}`);
console.log('Per-request credentials: SUPPORTED');
console.log('User API endpoint: CORRECTED with proper user ID');
console.log('===========================================');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.2.2',
    timestamp: new Date().toISOString(),
    service: 'railway-hybrid-oauth-backend',
    features: {
      environment_variables: !!(process.env.GHL_CLIENT_ID && process.env.GHL_CLIENT_SECRET),
      per_request_credentials: true,
      hybrid_mode: true,
      corrected_user_endpoint: true
    }
  });
});

// Function to get user info using proper GoHighLevel API format
async function getUserInfo(accessToken, userId = null) {
  console.log('🔍 Getting user info with access token...');
  
  // Method 1: Try with specific user ID if available
  if (userId) {
    console.log(`Attempting /users/${userId} endpoint...`);
    try {
      const userResponse = await fetch(`https://services.leadconnectorhq.com/users/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28'
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ User info retrieved with specific user ID');
        return { success: true, data: userData, method: 'specific_user_id' };
      } else {
        const errorData = await userResponse.json();
        console.log(`❌ /users/${userId} failed:`, errorData);
      }
    } catch (error) {
      console.log(`❌ Error calling /users/${userId}:`, error.message);
    }
  }
  
  // Method 2: Try OAuth userinfo endpoint (standard approach)
  console.log('Attempting /oauth/userinfo endpoint...');
  try {
    const userInfoResponse = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (userInfoResponse.ok) {
      const userInfoData = await userInfoResponse.json();
      console.log('✅ User info retrieved from OAuth userinfo');
      
      // Extract user ID from userinfo response
      const extractedUserId = userInfoData.sub || userInfoData.user_id || userInfoData.id;
      
      // If we got a user ID, try the specific endpoint again
      if (extractedUserId && !userId) {
        console.log(`🔄 Retrying with extracted user ID: ${extractedUserId}`);
        const retryResult = await getUserInfo(accessToken, extractedUserId);
        if (retryResult.success) {
          return retryResult;
        }
      }
      
      return { success: true, data: userInfoData, method: 'oauth_userinfo' };
    } else {
      const errorData = await userInfoResponse.json();
      console.log('❌ /oauth/userinfo failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Error calling /oauth/userinfo:', error.message);
  }
  
  // Method 3: Try users search endpoint as final fallback
  console.log('Attempting /users/search endpoint as fallback...');
  try {
    const searchResponse = await fetch('https://services.leadconnectorhq.com/users/search', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ User info retrieved from search fallback');
      return { success: true, data: searchData, method: 'users_search' };
    } else {
      const errorData = await searchResponse.json();
      console.log('❌ /users/search failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Error calling /users/search:', error.message);
  }
  
  return { success: false, error: 'All user info methods failed' };
}

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

    console.log('✅ Token exchange successful, getting user info...');

    // CORRECTED: Get user information using proper GoHighLevel API format
    const userInfoResult = await getUserInfo(tokenData.access_token);
    
    if (!userInfoResult.success) {
      return res.status(400).json({
        error: 'user_info_failed',
        message: 'Unable to retrieve user information from any endpoint',
        attempted_methods: ['specific_user_id', 'oauth_userinfo', 'users_search']
      });
    }

    console.log(`✅ User info retrieved using method: ${userInfoResult.method}`);

    // Process user data based on response format
    let processedUserData;
    const userData = userInfoResult.data;
    
    if (userInfoResult.method === 'specific_user_id') {
      // Direct user endpoint response
      processedUserData = {
        id: userData.id || 'unknown',
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        email: userData.email || 'unknown@example.com',
        locationId: userData.locationId || userData.location?.id || 'unknown',
        locationName: userData.locationName || userData.location?.name || 'Unknown Location'
      };
    } else if (userInfoResult.method === 'oauth_userinfo') {
      // OAuth userinfo response
      processedUserData = {
        id: userData.sub || userData.user_id || userData.id || 'unknown',
        name: userData.name || userData.given_name || 'Unknown User',
        email: userData.email || 'unknown@example.com',
        locationId: userData.locationId || userData.location_id || 'unknown',
        locationName: userData.locationName || userData.location_name || 'Unknown Location'
      };
    } else {
      // Users search response
      if (userData.users && userData.users.length > 0) {
        const user = userData.users[0];
        processedUserData = {
          id: user.id || 'unknown',
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email || 'unknown@example.com',
          locationId: user.locationId || 'unknown',
          locationName: user.locationName || 'Unknown Location'
        };
      } else {
        processedUserData = {
          id: userData.id || 'unknown',
          name: userData.name || 'Unknown User',
          email: userData.email || 'unknown@example.com',
          locationId: userData.locationId || 'unknown',
          locationName: userData.locationName || 'Unknown Location'
        };
      }
    }

    // Store installation data
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      ghlUserId: processedUserData.id,
      ghlLocationId: processedUserData.locationId,
      ghlLocationName: processedUserData.locationName,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
      scopes: tokenData.scope || 'unknown',
      userInfo: processedUserData,
      createdAt: new Date(),
      updatedAt: new Date(),
      retrievalMethod: userInfoResult.method
    };

    installations.set(installationId, installation);

    console.log('✅ OAuth installation successful (POST):', {
      installationId,
      userId: processedUserData.id,
      locationId: processedUserData.locationId,
      method: userInfoResult.method
    });

    // Return JSON response for API calls
    res.json({
      success: true,
      installation_id: installationId,
      user_info: processedUserData,
      redirect_url: `https://listings.engageautomations.com/oauth-success?installation_id=${installationId}`,
      endpoint_used: userInfoResult.method
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

    console.log('✅ Token exchange successful, getting user info...');

    // CORRECTED: Get user information using proper GoHighLevel API format
    const userInfoResult = await getUserInfo(tokenData.access_token);
    
    if (!userInfoResult.success) {
      return res.status(400).json({
        error: 'user_info_failed',
        message: 'Unable to retrieve user information from any endpoint'
      });
    }

    console.log(`✅ User info retrieved using method: ${userInfoResult.method}`);

    // Process user data (same logic as POST)
    let processedUserData;
    const userData = userInfoResult.data;
    
    if (userInfoResult.method === 'specific_user_id') {
      processedUserData = {
        id: userData.id || 'unknown',
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        email: userData.email || 'unknown@example.com',
        locationId: userData.locationId || userData.location?.id || 'unknown',
        locationName: userData.locationName || userData.location?.name || 'Unknown Location'
      };
    } else if (userInfoResult.method === 'oauth_userinfo') {
      processedUserData = {
        id: userData.sub || userData.user_id || userData.id || 'unknown',
        name: userData.name || userData.given_name || 'Unknown User',
        email: userData.email || 'unknown@example.com',
        locationId: userData.locationId || userData.location_id || 'unknown',
        locationName: userData.locationName || userData.location_name || 'Unknown Location'
      };
    } else {
      if (userData.users && userData.users.length > 0) {
        const user = userData.users[0];
        processedUserData = {
          id: user.id || 'unknown',
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email || 'unknown@example.com',
          locationId: user.locationId || 'unknown',
          locationName: user.locationName || 'Unknown Location'
        };
      } else {
        processedUserData = {
          id: userData.id || 'unknown',
          name: userData.name || 'Unknown User',
          email: userData.email || 'unknown@example.com',
          locationId: userData.locationId || 'unknown',
          locationName: userData.locationName || 'Unknown Location'
        };
      }
    }

    // Store installation data
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      ghlUserId: processedUserData.id,
      ghlLocationId: processedUserData.locationId,
      ghlLocationName: processedUserData.locationName,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
      scopes: tokenData.scope || 'unknown',
      userInfo: processedUserData,
      createdAt: new Date(),
      updatedAt: new Date(),
      retrievalMethod: userInfoResult.method
    };

    installations.set(installationId, installation);

    console.log('✅ OAuth installation successful:', {
      installationId,
      userId: processedUserData.id,
      locationId: processedUserData.locationId,
      method: userInfoResult.method
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
    location_name: installation.ghlLocationName,
    retrieval_method: installation.retrievalMethod
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
    tokenStatus: install.tokenExpiry > new Date() ? 'valid' : 'expired',
    retrievalMethod: install.retrievalMethod
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
  console.log(`🚀 Railway Hybrid OAuth Backend v2.2.2 running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 OAuth callback: http://localhost:${PORT}/oauth/callback`);
  console.log(`📊 Features: Environment variables + Per-request credentials + Corrected user endpoint`);
});

module.exports = app;