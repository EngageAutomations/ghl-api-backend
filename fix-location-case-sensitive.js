// OAuth Backend with Case-Sensitive Location Authentication
// Version: 8.5.8-location-case-fix

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error', message: error.message });
});

// In-memory installations store
const installations = new Map();

// OAuth configuration with correct credentials
const OAUTH_CONFIG = {
  clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
  clientSecret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  redirectUri: 'https://dir.engageautomations.com/api/oauth/callback',
  scope: 'businesses.readonly businesses.write calendars.readonly calendars.write campaigns.readonly campaigns.write companies.readonly companies.write contacts.readonly contacts.write conversations.readonly conversations.write courses.readonly courses.write forms.readonly forms.write links.readonly links.write locations.readonly locations.write medias.readonly medias.write opportunities.readonly opportunities.write payments.write products.readonly products.write snapshots.readonly surveys.readonly surveys.write users.readonly users.write workflows.readonly workflows.write',
  authorizationUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
  tokenUrl: 'https://services.leadconnectorhq.com/oauth/token'
};

// Health check routes
app.get('/', (req, res) => {
  try {
    const authenticatedCount = Array.from(installations.values()).filter(inst => inst.active).length;
    res.json({
      service: "GoHighLevel OAuth Backend",
      version: "8.5.8-location-case-fix",
      installs: installations.size,
      authenticated: authenticatedCount,
      status: "operational",
      features: ["oauth-location", "token-refresh", "media-upload", "case-sensitive-location"],
      debug: "using case-sensitive Location authentication for media upload access",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Root endpoint error:', error);
    res.status(500).json({ error: 'Service error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Installations endpoint
app.get('/installations', (req, res) => {
  try {
    const installList = Array.from(installations.values()).map(inst => ({
      id: inst.id,
      location_id: inst.location_id,
      active: inst.active,
      created_at: inst.created_at,
      token_status: inst.token_status || 'valid',
      auth_class: inst.auth_class || 'unknown',
      scopes: inst.scopes || 'full'
    }));
    
    res.json({
      count: installations.size,
      installations: installList
    });
  } catch (error) {
    console.error('Installations endpoint error:', error);
    res.status(500).json({ error: 'Failed to retrieve installations' });
  }
});

// OAuth callback with CASE-SENSITIVE Location authentication
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK START ===');
  console.log('Query params:', req.query);
  console.log('Using CASE-SENSITIVE "Location" authentication for media upload access');
  
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('OAuth error from GHL:', error);
      return res.status(400).json({ 
        error: 'OAuth authorization failed', 
        details: error,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!code) {
      console.error('No authorization code received');
      return res.status(400).json({ 
        error: 'Authorization code required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Starting token exchange with CASE-SENSITIVE "Location" authentication...');
    
    // CASE-SENSITIVE Location token exchange - FIXED with capital "L"
    const tokenData = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      user_type: 'Location'  // ✅ CAPITAL "L" - THIS IS THE KEY FIX
    });
    
    console.log('Making LOCATION token exchange request...');
    console.log('Client ID:', OAUTH_CONFIG.clientId);
    console.log('Redirect URI:', OAUTH_CONFIG.redirectUri);
    console.log('User Type: "Location" (case-sensitive for media upload access)');
    console.log('Authorization code:', code.substring(0, 10) + '...');
    
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true
    });
    
    console.log(`Token exchange response: ${response.status}`);
    console.log('Response data keys:', Object.keys(response.data || {}));
    
    if (response.status !== 200) {
      console.error('Token exchange failed:', response.data);
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: response.data,
        status: response.status,
        credentials_used: {
          client_id: OAUTH_CONFIG.clientId,
          redirect_uri: OAUTH_CONFIG.redirectUri,
          user_type: 'Location'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('LOCATION token exchange successful with correct case!');
    console.log('Token data:', {
      access_token: response.data.access_token ? 'received' : 'missing',
      refresh_token: response.data.refresh_token ? 'received' : 'missing',
      expires_in: response.data.expires_in,
      location_id: response.data.locationId || 'not provided',
      scope: response.data.scope
    });
    
    // Decode JWT to verify Location auth class
    let authClass = 'unknown';
    let jwtLocationId = 'unknown';
    try {
      if (response.data.access_token) {
        const payload = JSON.parse(Buffer.from(response.data.access_token.split('.')[1], 'base64').toString());
        authClass = payload.authClass || 'unknown';
        jwtLocationId = payload.locationId || 'not found';
        console.log('JWT Auth Class:', authClass);
        console.log('JWT Location ID:', jwtLocationId);
        
        if (authClass === 'Location') {
          console.log('✅ SUCCESS: Location-level authentication achieved!');
        } else {
          console.log('⚠️ WARNING: Auth class is not Location:', authClass);
        }
      }
    } catch (jwtError) {
      console.error('JWT decode error:', jwtError.message);
    }
    
    // Store installation with auth class info
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      expires_at: Date.now() + (response.data.expires_in * 1000),
      location_id: response.data.locationId || jwtLocationId,
      scopes: response.data.scope || OAUTH_CONFIG.scope,
      active: true,
      created_at: new Date().toISOString(),
      token_status: 'valid',
      auth_class: authClass,
      user_type: 'Location',
      client_id: OAUTH_CONFIG.clientId
    };
    
    installations.set(installationId, installation);
    
    console.log(`Installation stored: ${installationId}`);
    console.log(`Location ID: ${installation.location_id}`);
    console.log(`Auth Class: ${installation.auth_class}`);
    
    // Schedule token refresh
    try {
      scheduleTokenRefresh(installationId);
    } catch (refreshError) {
      console.error('Token refresh scheduling failed:', refreshError);
    }
    
    // Redirect to frontend
    const redirectUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&location_id=${installation.location_id}&auth_class=${authClass}&welcome=true`;
    console.log(`Redirecting to: ${redirectUrl}`);
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    res.status(500).json({ 
      error: 'OAuth processing failed',
      message: error.message,
      credentials_used: {
        client_id: OAUTH_CONFIG.clientId,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        user_type: 'Location'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Token access endpoint
app.get('/api/token-access/:installationId', async (req, res) => {
  try {
    const { installationId } = req.params;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ 
        error: 'Installation not found',
        installation_id: installationId,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!installation.active) {
      return res.status(400).json({ 
        error: 'Installation not active',
        installation_id: installationId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if token needs refresh
    const timeUntilExpiry = installation.expires_at - Date.now();
    if (timeUntilExpiry < 600000) { // 10 minutes
      console.log(`Token needs refresh for ${installationId}`);
      try {
        await refreshToken(installationId);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    res.json({
      access_token: installation.access_token,
      location_id: installation.location_id,
      expires_in: Math.floor(timeUntilExpiry / 1000),
      auth_class: installation.auth_class,
      user_type: installation.user_type,
      client_id: installation.client_id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token access error:', error);
    res.status(500).json({ 
      error: 'Token access failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Token refresh function with case-sensitive Location authentication
async function refreshToken(installationId) {
  const installation = installations.get(installationId);
  if (!installation?.refresh_token) {
    throw new Error('No refresh token available');
  }
  
  try {
    const refreshData = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: installation.refresh_token,
      user_type: 'Location'  // ✅ MAINTAIN CASE-SENSITIVE "Location" ON REFRESH
    });
    
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, refreshData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true
    });
    
    if (response.status !== 200) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    // Update installation
    installation.access_token = response.data.access_token;
    installation.refresh_token = response.data.refresh_token || installation.refresh_token;
    installation.expires_in = response.data.expires_in;
    installation.expires_at = Date.now() + (response.data.expires_in * 1000);
    installation.token_status = 'valid';
    installation.last_refresh = new Date().toISOString();
    
    // Update auth class from refreshed token
    try {
      if (response.data.access_token) {
        const payload = JSON.parse(Buffer.from(response.data.access_token.split('.')[1], 'base64').toString());
        installation.auth_class = payload.authClass || installation.auth_class;
      }
    } catch (jwtError) {
      console.error('JWT decode error on refresh:', jwtError.message);
    }
    
    console.log(`Token refreshed successfully for ${installationId} (auth class: ${installation.auth_class})`);
    
    // Schedule next refresh
    scheduleTokenRefresh(installationId);
    
  } catch (error) {
    console.error('Token refresh failed:', error);
    installation.token_status = 'refresh_failed';
    installation.active = false;
    throw error;
  }
}

// Token refresh scheduling
function scheduleTokenRefresh(installationId) {
  try {
    const installation = installations.get(installationId);
    if (!installation) return;
    
    const timeUntilRefresh = Math.max(installation.expires_at - Date.now() - 600000, 60000);
    
    setTimeout(async () => {
      try {
        await refreshToken(installationId);
      } catch (error) {
        console.error(`Scheduled refresh failed for ${installationId}:`, error);
      }
    }, timeUntilRefresh);
    
    console.log(`Token refresh scheduled for ${installationId} in ${Math.round(timeUntilRefresh / 60000)} minutes`);
    
  } catch (error) {
    console.error('Token refresh scheduling error:', error);
  }
}

// Start server
const server = app.listen(port, () => {
  console.log(`OAuth Backend running on port ${port}`);
  console.log('Version: 8.5.8-location-case-fix');
  console.log('Features: CASE-SENSITIVE "Location" authentication for media upload access');
  console.log('Client ID:', OAUTH_CONFIG.clientId);
  console.log('Auth Type: "Location" (capital L) for media upload');
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

module.exports = app;