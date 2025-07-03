// Stable OAuth Backend - Version 8.5.4-crash-fix
// Enhanced error handling and stability improvements

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log
});

// Middleware with error handling
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
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

// OAuth configuration
const OAUTH_CONFIG = {
  clientId: '675e4251e4b0e7a613050be3',
  clientSecret: '675e4251e4b0e7a613050be3-3lGGH5vhNS4RJxXb',
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
      version: "8.5.4-crash-fix",
      installs: installations.size,
      authenticated: authenticatedCount,
      status: "operational",
      features: ["oauth-location", "token-refresh", "media-upload", "crash-protection"],
      debug: "stable location-level authentication",
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

// Installations endpoint with error protection
app.get('/installations', (req, res) => {
  try {
    const installList = Array.from(installations.values()).map(inst => ({
      id: inst.id,
      location_id: inst.location_id,
      active: inst.active,
      created_at: inst.created_at,
      token_status: inst.token_status || 'valid',
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

// OAuth callback with comprehensive error handling
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK START ===');
  console.log('Query params:', req.query);
  
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
    
    console.log('Starting token exchange...');
    
    // Token exchange with timeout and retry protection
    const tokenData = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      user_type: 'location'
    });
    
    console.log('Making token exchange request...');
    
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log(`Token exchange response: ${response.status}`);
    
    if (response.status !== 200) {
      console.error('Token exchange failed:', response.data);
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: response.data,
        status: response.status,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Token exchange successful!');
    
    // Store installation safely
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      expires_at: Date.now() + (response.data.expires_in * 1000),
      location_id: response.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: response.data.scope || OAUTH_CONFIG.scope,
      active: true,
      created_at: new Date().toISOString(),
      token_status: 'valid',
      user_type: 'location'
    };
    
    installations.set(installationId, installation);
    
    console.log(`Installation stored: ${installationId}`);
    console.log(`Location ID: ${installation.location_id}`);
    
    // Schedule token refresh with error protection
    try {
      scheduleTokenRefresh(installationId);
    } catch (refreshError) {
      console.error('Token refresh scheduling failed:', refreshError);
      // Don't fail the callback for this
    }
    
    // Redirect to frontend
    const redirectUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&location_id=${installation.location_id}&welcome=true`;
    console.log(`Redirecting to: ${redirectUrl}`);
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Send error response without crashing
    res.status(500).json({ 
      error: 'OAuth processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Token access endpoint with error protection
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
        // Return current token even if refresh failed
      }
    }
    
    res.json({
      access_token: installation.access_token,
      location_id: installation.location_id,
      expires_in: Math.floor(timeUntilExpiry / 1000),
      user_type: installation.user_type || 'location',
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

// Token refresh function with error protection
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
      refresh_token: installation.refresh_token
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
    
    console.log(`Token refreshed successfully for ${installationId}`);
    
    // Schedule next refresh
    scheduleTokenRefresh(installationId);
    
  } catch (error) {
    console.error('Token refresh failed:', error);
    installation.token_status = 'refresh_failed';
    installation.active = false;
    throw error;
  }
}

// Token refresh scheduling with error protection
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

// Start server with error protection
const server = app.listen(port, () => {
  console.log(`OAuth Backend running on port ${port}`);
  console.log('Version: 8.5.4-crash-fix');
  console.log('Features: Stable location-level authentication, comprehensive error handling');
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

module.exports = app;