// Enhanced Railway Backend with Replit OAuth Bridge
// Fetches OAuth credentials from Replit and handles marketplace installations

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['https://listings.engageautomations.com', 'https://replit.app'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory storage
const installations = new Map();
const tokensByLocation = new Map();

// Configuration from Replit
let oauthConfig = null;
let configLastFetched = 0;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Replit bridge configuration
const REPLIT_BRIDGE_URL = process.env.REPLIT_BRIDGE_URL || 'https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev';
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || 'replit-railway-bridge-2025';

async function fetchOAuthConfigFromReplit() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (oauthConfig && (now - configLastFetched) < CONFIG_CACHE_DURATION) {
    return oauthConfig;
  }

  try {
    console.log('🔄 Fetching OAuth config from Replit bridge...');
    
    const response = await fetch(`${REPLIT_BRIDGE_URL}/api/oauth-config`, {
      headers: {
        'Authorization': `Bearer ${BRIDGE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Replit bridge responded with ${response.status}`);
    }

    const config = await response.json();
    
    console.log('✅ OAuth config received from Replit:', {
      clientId: config.clientId ? '[LOADED]' : '[MISSING]',
      timestamp: new Date(config.timestamp).toISOString()
    });

    oauthConfig = config;
    configLastFetched = now;
    
    return oauthConfig;
    
  } catch (error) {
    console.error('❌ Failed to fetch OAuth config from Replit:', error.message);
    
    // Fallback to environment variables
    return {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: 'https://dir.engageautomations.com/api/oauth/callback',
      fallback: true
    };
  }
}

// OAuth callback - enhanced with Replit bridge
app.get('/api/oauth/callback', async (req, res) => {
  console.log('🔄 OAuth callback received:', {
    code: req.query.code ? '[PRESENT]' : '[MISSING]',
    location_id: req.query.location_id,
    user_id: req.query.user_id
  });

  const { code, location_id, user_id } = req.query;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    // Get OAuth config from Replit
    const config = await fetchOAuthConfigFromReplit();
    
    if (!config.clientId || !config.clientSecret) {
      console.error('❌ OAuth credentials not available from Replit');
      return res.status(500).send('OAuth not configured');
    }

    console.log(`🔐 Using OAuth config from ${config.fallback ? 'fallback' : 'Replit bridge'}`);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
      return res.status(400).send('OAuth failed');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Get user information
    const userResponse = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('❌ Failed to get user info:', userResponse.status);
      return res.status(400).send('Failed to get user info');
    }

    const userData = await userResponse.json();
    console.log('👤 User data received:', {
      id: userData.id,
      email: userData.email,
      name: userData.name
    });

    // Store installation
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      user_id: user_id || userData.id,
      location_id: location_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      created_at: new Date().toISOString(),
      user_data: userData,
      scopes: tokenData.scope
    };

    installations.set(installationId, installation);
    
    // Store token by location for quick access
    if (location_id) {
      tokensByLocation.set(location_id, {
        installation_id: installationId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: installation.expires_at
      });
    }

    console.log('💾 Installation stored:', {
      id: installationId,
      location_id: location_id,
      expires_at: new Date(installation.expires_at).toISOString()
    });

    // Sync installation back to Replit
    try {
      await fetch(`${REPLIT_BRIDGE_URL}/api/sync-installation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BRIDGE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(installation)
      });
      console.log('🔄 Installation synced to Replit');
    } catch (syncError) {
      console.warn('⚠️ Failed to sync installation to Replit:', syncError.message);
    }

    // Redirect to success page with installation ID
    res.redirect(`https://listings.engageautomations.com/?installation_id=${installationId}&location_id=${location_id}`);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).send('OAuth processing failed');
  }
});

// OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.json({ authenticated: false, error: 'Missing installation_id' });
  }

  const installation = installations.get(installation_id);
  if (!installation) {
    return res.json({ authenticated: false, error: 'Installation not found' });
  }

  const isExpired = Date.now() > installation.expires_at;
  
  res.json({
    authenticated: !isExpired,
    installation_id: installation_id,
    location_id: installation.location_id,
    user_id: installation.user_id,
    expires_at: installation.expires_at,
    expired: isExpired,
    scopes: installation.scopes
  });
});

// Product management endpoints (using stored tokens)
app.post('/api/ghl/locations/:locationId/products', async (req, res) => {
  const { locationId } = req.params;
  const productData = req.body;

  try {
    const tokenInfo = tokensByLocation.get(locationId);
    if (!tokenInfo) {
      return res.status(401).json({ error: 'No token found for location' });
    }

    if (Date.now() > tokenInfo.expires_at) {
      return res.status(401).json({ error: 'Token expired' });
    }

    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenInfo.access_token}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        ...productData,
        locationId: locationId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    console.log('✅ Product created via Railway-Replit bridge:', result._id);

    res.json(result);

  } catch (error) {
    console.error('❌ Product creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check with bridge status
app.get('/', async (req, res) => {
  try {
    // Test bridge connection
    const bridgeResponse = await fetch(`${REPLIT_BRIDGE_URL}/api/bridge/health`, {
      headers: { 'Authorization': `Bearer ${BRIDGE_TOKEN}` }
    });
    
    const bridgeStatus = bridgeResponse.ok ? 'Connected' : 'Disconnected';
    
    res.json({
      service: 'GHL proxy with Replit bridge',
      version: '1.6.0-bridge',
      installs: installations.size,
      authenticated: tokensByLocation.size,
      bridge_status: bridgeStatus,
      replit_url: REPLIT_BRIDGE_URL,
      ts: Date.now()
    });
  } catch (error) {
    res.json({
      service: 'GHL proxy with Replit bridge',
      version: '1.6.0-bridge',
      installs: installations.size,
      authenticated: tokensByLocation.size,
      bridge_status: 'Error',
      bridge_error: error.message,
      ts: Date.now()
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway backend with Replit bridge running on port ${PORT}`);
  console.log(`🌉 Bridge URL: ${REPLIT_BRIDGE_URL}`);
  console.log('📋 Ready to fetch OAuth config from Replit and handle installations');
});

module.exports = app;