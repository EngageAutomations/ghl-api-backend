/**
 * Railway Diagnostic OAuth Backend v2.2.3
 * Enhanced logging to diagnose user API endpoint issues
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

// In-memory storage for installations and diagnostics
const installations = new Map();
const diagnosticLogs = [];

function addDiagnosticLog(message, data = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    data: data ? JSON.stringify(data, null, 2) : null
  };
  diagnosticLogs.push(logEntry);
  console.log(`[DIAGNOSTIC] ${message}`, data || '');
  
  // Keep only last 50 logs
  if (diagnosticLogs.length > 50) {
    diagnosticLogs.shift();
  }
}

// OAuth credential validation and extraction
function getOAuthCredentials(req) {
  // Try per-request credentials first (Railway compatibility)
  if (req.body && req.body.oauth_credentials) {
    const { client_id, client_secret, redirect_uri } = req.body.oauth_credentials;
    if (client_id && client_secret && redirect_uri) {
      addDiagnosticLog('Using per-request OAuth credentials');
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
    addDiagnosticLog('Using environment variable OAuth credentials');
    return envCredentials;
  }
  
  addDiagnosticLog('No OAuth credentials available');
  return null;
}

// Enhanced startup validation
console.log('=== Railway Diagnostic OAuth Backend v2.2.3 ===');
console.log('Environment Variables Check:');
console.log(`GHL_CLIENT_ID: ${process.env.GHL_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`GHL_CLIENT_SECRET: ${process.env.GHL_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`GHL_REDIRECT_URI: ${process.env.GHL_REDIRECT_URI ? 'SET' : 'NOT SET'}`);
console.log('Diagnostic logging: ENABLED');
console.log('===========================================');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.2.3',
    timestamp: new Date().toISOString(),
    service: 'railway-diagnostic-oauth-backend',
    features: {
      environment_variables: !!(process.env.GHL_CLIENT_ID && process.env.GHL_CLIENT_SECRET),
      per_request_credentials: true,
      hybrid_mode: true,
      diagnostic_logging: true
    }
  });
});

// Diagnostic logs endpoint
app.get('/api/diagnostic-logs', (req, res) => {
  res.json({
    success: true,
    count: diagnosticLogs.length,
    logs: diagnosticLogs.slice(-20) // Return last 20 logs
  });
});

// Enhanced user info function with detailed logging
async function getUserInfo(accessToken, userId = null) {
  addDiagnosticLog('Starting user info retrieval', { userId, hasAccessToken: !!accessToken });
  
  // Method 1: Try with specific user ID if available
  if (userId) {
    addDiagnosticLog(`Attempting /users/${userId} endpoint`);
    try {
      const userResponse = await fetch(`https://services.leadconnectorhq.com/users/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28'
        }
      });

      const responseText = await userResponse.text();
      addDiagnosticLog(`/users/${userId} response`, {
        status: userResponse.status,
        statusText: userResponse.statusText,
        headers: Object.fromEntries(userResponse.headers.entries()),
        body: responseText
      });

      if (userResponse.ok) {
        const userData = JSON.parse(responseText);
        addDiagnosticLog('User info retrieved with specific user ID', userData);
        return { success: true, data: userData, method: 'specific_user_id' };
      }
    } catch (error) {
      addDiagnosticLog(`Error calling /users/${userId}`, { message: error.message, stack: error.stack });
    }
  }
  
  // Method 2: Try OAuth userinfo endpoint
  addDiagnosticLog('Attempting /oauth/userinfo endpoint');
  try {
    const userInfoResponse = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const responseText = await userInfoResponse.text();
    addDiagnosticLog('/oauth/userinfo response', {
      status: userInfoResponse.status,
      statusText: userInfoResponse.statusText,
      headers: Object.fromEntries(userInfoResponse.headers.entries()),
      body: responseText
    });

    if (userInfoResponse.ok) {
      const userInfoData = JSON.parse(responseText);
      addDiagnosticLog('User info retrieved from OAuth userinfo', userInfoData);
      
      // Extract user ID from userinfo response
      const extractedUserId = userInfoData.sub || userInfoData.user_id || userInfoData.id;
      
      // If we got a user ID, try the specific endpoint again
      if (extractedUserId && !userId) {
        addDiagnosticLog(`Retrying with extracted user ID: ${extractedUserId}`);
        const retryResult = await getUserInfo(accessToken, extractedUserId);
        if (retryResult.success) {
          return retryResult;
        }
      }
      
      return { success: true, data: userInfoData, method: 'oauth_userinfo' };
    }
  } catch (error) {
    addDiagnosticLog('Error calling /oauth/userinfo', { message: error.message, stack: error.stack });
  }
  
  // Method 3: Try users search endpoint
  addDiagnosticLog('Attempting /users/search endpoint');
  try {
    const searchResponse = await fetch('https://services.leadconnectorhq.com/users/search', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      }
    });

    const responseText = await searchResponse.text();
    addDiagnosticLog('/users/search response', {
      status: searchResponse.status,
      statusText: searchResponse.statusText,
      headers: Object.fromEntries(searchResponse.headers.entries()),
      body: responseText
    });

    if (searchResponse.ok) {
      const searchData = JSON.parse(responseText);
      addDiagnosticLog('User info retrieved from search fallback', searchData);
      return { success: true, data: searchData, method: 'users_search' };
    }
  } catch (error) {
    addDiagnosticLog('Error calling /users/search', { message: error.message, stack: error.stack });
  }
  
  addDiagnosticLog('All user info methods failed');
  return { success: false, error: 'All user info methods failed' };
}

// OAuth callback with enhanced diagnostics
app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
  addDiagnosticLog('OAuth callback initiated', { query: req.query, method: req.method });

  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    addDiagnosticLog('OAuth error detected', { error, description: req.query.error_description });
    const errorMsg = encodeURIComponent(error);
    const redirectUrl = `https://listings.engageautomations.com/?error=${errorMsg}`;
    return res.redirect(redirectUrl);
  }

  if (!code) {
    addDiagnosticLog('No authorization code provided');
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
      addDiagnosticLog('OAuth credentials missing from environment');
      return res.status(500).json({
        error: 'oauth_credentials_missing',
        message: 'OAuth credentials not configured.'
      });
    }

    addDiagnosticLog('Starting token exchange', { 
      code: code.substring(0, 10) + '...', 
      client_id: credentials.client_id 
    });

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

    const tokenText = await tokenResponse.text();
    addDiagnosticLog('Token exchange response', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      body: tokenText
    });

    if (!tokenResponse.ok) {
      const tokenData = JSON.parse(tokenText);
      addDiagnosticLog('Token exchange failed', tokenData);
      return res.status(400).json({
        error: 'token_exchange_failed',
        details: tokenData
      });
    }

    const tokenData = JSON.parse(tokenText);
    addDiagnosticLog('Token exchange successful', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope
    });

    // Get user information using enhanced diagnostics
    const userInfoResult = await getUserInfo(tokenData.access_token);
    
    if (!userInfoResult.success) {
      addDiagnosticLog('User info retrieval completely failed');
      return res.status(400).json({
        error: 'user_info_failed',
        message: 'Unable to retrieve user information from any endpoint',
        diagnostic_url: 'https://dir.engageautomations.com/api/diagnostic-logs'
      });
    }

    addDiagnosticLog(`User info retrieval successful using method: ${userInfoResult.method}`);

    // Process user data
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

    addDiagnosticLog('OAuth installation successful', {
      installationId,
      userId: processedUserData.id,
      locationId: processedUserData.locationId,
      method: userInfoResult.method
    });

    // Redirect to success page
    const successUrl = `https://listings.engageautomations.com/oauth-success?installation_id=${installationId}`;
    res.redirect(successUrl);

  } catch (error) {
    addDiagnosticLog('OAuth callback error', { message: error.message, stack: error.stack });
    res.status(500).json({
      error: 'oauth_callback_failed',
      message: error.message
    });
  }
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

// Catch-all for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'endpoint_not_found',
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /oauth/callback',
      'GET /api/installations',
      'GET /api/diagnostic-logs'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  addDiagnosticLog('Unhandled error', { message: error.message, stack: error.stack });
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway Diagnostic OAuth Backend v2.2.3 running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 OAuth callback: http://localhost:${PORT}/oauth/callback`);
  console.log(`📊 Diagnostic logs: http://localhost:${PORT}/api/diagnostic-logs`);
});

module.exports = app;