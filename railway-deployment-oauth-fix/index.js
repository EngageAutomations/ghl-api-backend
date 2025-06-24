// Enhanced Railway Backend with OAuth Credentials - Version 1.6.2
// Fixes "OAuth not configured" error by embedding credentials directly

const express = require('express');
const cors = require('cors');

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

// OAuth Configuration - Embedded for reliability
const OAUTH_CONFIG = {
  clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
  clientSecret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  sharedSecret: '9c0512a2-4e44-4147-9ec9-a482a8be9ef2',
  redirectUri: 'https://dir.engageautomations.com/api/oauth/callback',
  jwtSecret: 'replit-ghl-oauth-jwt-secret-2025'
};

console.log('OAuth Configuration Status:', {
  clientId: OAUTH_CONFIG.clientId ? '[CONFIGURED]' : '[MISSING]',
  clientSecret: OAUTH_CONFIG.clientSecret ? '[CONFIGURED]' : '[MISSING]',
  redirectUri: OAUTH_CONFIG.redirectUri
});

// OAuth callback - enhanced with embedded credentials
app.get('/api/oauth/callback', async (req, res) => {
  console.log('OAuth callback received:', {
    code: req.query.code ? '[PRESENT]' : '[MISSING]',
    location_id: req.query.location_id,
    user_id: req.query.user_id
  });

  const { code, location_id, user_id } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    console.log('Using embedded OAuth configuration for token exchange');

    // Exchange authorization code for access token
    const fetch = (await import('node-fetch')).default;
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: OAUTH_CONFIG.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return res.status(400).send('OAuth token exchange failed');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get user information
    const userResponse = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userResponse.status);
      return res.status(400).send('Failed to get user info');
    }

    const userData = await userResponse.json();
    console.log('User data received:', {
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

    console.log('Installation stored:', {
      id: installationId,
      location_id: location_id,
      expires_at: new Date(installation.expires_at).toISOString()
    });

    // Redirect to success page
    res.redirect(`https://listings.engageautomations.com/?installation_id=${installationId}&location_id=${location_id}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
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

// Product management endpoints
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

    const fetch = (await import('node-fetch')).default;
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
    console.log('Product created:', result._id);

    res.json(result);

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'GHL OAuth Backend',
    version: '1.6.2-oauth-fixed',
    installs: installations.size,
    authenticated: tokensByLocation.size,
    oauth_configured: !!(OAUTH_CONFIG.clientId && OAUTH_CONFIG.clientSecret),
    ts: Date.now()
  });
});

// Legacy health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GHL OAuth Backend',
    version: '1.6.2-oauth-fixed',
    oauth_configured: true,
    ts: Date.now()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Railway OAuth backend running on port ${PORT}`);
  console.log('OAuth credentials configured and ready for installations');
  console.log(`Redirect URI: ${OAUTH_CONFIG.redirectUri}`);
});

module.exports = app;