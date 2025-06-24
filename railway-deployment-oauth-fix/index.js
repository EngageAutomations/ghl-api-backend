// Railway Backend with Bridge Endpoints - Version 1.6.3
// Self-contained OAuth system with Replit bridge integration

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

// Bridge Configuration - Calls Replit for OAuth credentials
const BRIDGE_CONFIG = {
  replicUrl: 'https://your-replit-domain.replit.app',
  fallbackCredentials: {
    clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
    clientSecret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
    redirectUri: 'https://dir.engageautomations.com/api/oauth/callback'
  }
};

// OAuth Configuration - Bridge-enabled
let OAUTH_CONFIG = null;

async function initializeOAuthConfig() {
  try {
    // Try to get credentials from Replit bridge
    const response = await fetch(`${BRIDGE_CONFIG.replicUrl}/api/bridge/oauth-credentials`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        OAUTH_CONFIG = {
          clientId: data.credentials.client_id,
          clientSecret: data.credentials.client_secret,
          redirectUri: data.credentials.redirect_uri,
          jwtSecret: 'railway-bridge-jwt-secret-2025',
          bridgeSource: 'replit'
        };
        console.log('OAuth Configuration loaded from Replit bridge:', {
          clientId: OAUTH_CONFIG.clientId ? '[CONFIGURED]' : '[MISSING]',
          clientSecret: OAUTH_CONFIG.clientSecret ? '[CONFIGURED]' : '[MISSING]',
          bridgeSource: OAUTH_CONFIG.bridgeSource
        });
        return;
      }
    }
  } catch (error) {
    console.log('Bridge connection failed, using fallback credentials');
  }
  
  // Fallback to embedded credentials
  OAUTH_CONFIG = {
    clientId: BRIDGE_CONFIG.fallbackCredentials.clientId,
    clientSecret: BRIDGE_CONFIG.fallbackCredentials.clientSecret,
    redirectUri: BRIDGE_CONFIG.fallbackCredentials.redirectUri,
    jwtSecret: 'railway-fallback-jwt-secret-2025',
    bridgeSource: 'fallback'
  };
  
  console.log('OAuth Configuration using fallback credentials:', {
    clientId: OAUTH_CONFIG.clientId ? '[CONFIGURED]' : '[MISSING]',
    clientSecret: OAUTH_CONFIG.clientSecret ? '[CONFIGURED]' : '[MISSING]',
    bridgeSource: OAUTH_CONFIG.bridgeSource
  });
}

// OAuth callback - Bridge-enhanced processing
app.get('/api/oauth/callback', async (req, res) => {
  console.log('OAuth callback received:', {
    code: req.query.code ? '[PRESENT]' : '[MISSING]',
    location_id: req.query.location_id,
    user_id: req.query.user_id,
    bridge_source: OAUTH_CONFIG?.bridgeSource || 'uninitialized'
  });

  const { code, location_id, user_id } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  if (!OAUTH_CONFIG) {
    return res.status(500).send('OAuth not configured - bridge initialization failed');
  }

  try {
    // Try bridge processing first
    if (OAUTH_CONFIG.bridgeSource === 'replit') {
      try {
        const bridgeResponse = await fetch(`${BRIDGE_CONFIG.replicUrl}/api/bridge/process-oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, location_id, user_id })
        });
        
        if (bridgeResponse.ok) {
          const bridgeData = await bridgeResponse.json();
          if (bridgeData.success) {
            console.log('OAuth processed by Replit bridge:', bridgeData.installation.id);
            
            // Store installation locally
            installations.set(bridgeData.installation.id, bridgeData.installation);
            if (bridgeData.installation.location_id) {
              tokensByLocation.set(bridgeData.installation.location_id, {
                accessToken: bridgeData.installation.access_token,
                refreshToken: bridgeData.installation.refresh_token,
                expiresAt: bridgeData.installation.expires_at
              });
            }
            
            return res.redirect(bridgeData.redirect_url);
          }
        }
      } catch (bridgeError) {
        console.log('Bridge processing failed, using local processing:', bridgeError.message);
      }
    }

    // Fallback to local OAuth processing
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      console.error('Token exchange failed:', errorText);
      return res.status(400).send('OAuth token exchange failed');
    }

    const tokens = await tokenResponse.json();
    const installationId = `install_${Date.now()}`;
    
    const installationData = {
      id: installationId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      locationId: tokens.location_id || location_id,
      userId: tokens.user_id || user_id,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      createdAt: new Date().toISOString(),
      bridgeSource: OAUTH_CONFIG.bridgeSource
    };

    installations.set(installationId, installationData);
    
    if (installationData.locationId) {
      tokensByLocation.set(installationData.locationId, {
        accessToken: installationData.accessToken,
        refreshToken: installationData.refreshToken,
        expiresAt: installationData.expiresAt
      });
    }

    console.log('OAuth processed locally:', {
      installationId,
      locationId: installationData.locationId,
      bridgeSource: OAUTH_CONFIG.bridgeSource
    });

    res.redirect(`https://listings.engageautomations.com/?installation_id=${installationId}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('OAuth processing failed');
  }
});

// Health endpoint with bridge status
app.get('/', (req, res) => {
  res.json({
    service: 'GHL proxy with bridge',
    version: '1.6.3-bridge',
    oauth_configured: OAUTH_CONFIG ? true : false,
    bridge_source: OAUTH_CONFIG?.bridgeSource || 'uninitialized',
    installs: installations.size,
    authenticated: tokensByLocation.size,
    ts: Date.now()
  });
});

// Bridge endpoints for self-hosting capability
app.get('/api/bridge/oauth-credentials', (req, res) => {
  if (!OAUTH_CONFIG) {
    return res.status(500).json({
      error: 'OAuth not initialized',
      bridge_source: 'railway'
    });
  }
  
  res.json({
    success: true,
    credentials: {
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      redirect_uri: OAUTH_CONFIG.redirectUri
    },
    bridge_source: 'railway',
    timestamp: Date.now()
  });
});

app.post('/api/bridge/process-oauth', async (req, res) => {
  const { code, location_id, user_id } = req.body;
  
  if (!code || !OAUTH_CONFIG) {
    return res.status(400).json({
      error: 'Missing authorization code or OAuth not configured',
      bridge_source: 'railway'
    });
  }

  try {
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: OAUTH_CONFIG.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      return res.status(400).json({
        error: 'Token exchange failed',
        bridge_source: 'railway'
      });
    }

    const tokens = await tokenResponse.json();
    const installationId = `install_${Date.now()}`;
    
    const installationData = {
      id: installationId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      location_id: tokens.location_id || location_id,
      user_id: tokens.user_id || user_id,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      created_at: new Date().toISOString(),
      bridge_source: 'railway'
    };

    installations.set(installationId, installationData);

    res.json({
      success: true,
      installation: installationData,
      redirect_url: `https://listings.engageautomations.com/?installation_id=${installationId}`,
      bridge_source: 'railway'
    });

  } catch (error) {
    res.status(500).json({
      error: 'OAuth processing failed',
      message: error.message,
      bridge_source: 'railway'
    });
  }
});

// Universal API endpoint patterns
const API_ENDPOINTS = [
  { method: 'GET', pattern: '/api/ghl/products', ghlPath: '/products' },
  { method: 'POST', pattern: '/api/ghl/products', ghlPath: '/products' },
  { method: 'GET', pattern: '/api/ghl/products/:productId', ghlPath: '/products/{productId}' },
  { method: 'PUT', pattern: '/api/ghl/products/:productId', ghlPath: '/products/{productId}' },
  { method: 'DELETE', pattern: '/api/ghl/products/:productId', ghlPath: '/products/{productId}' },
  { method: 'POST', pattern: '/api/ghl/media/upload', ghlPath: '/medias/upload-file' },
  { method: 'GET', pattern: '/api/ghl/media', ghlPath: '/medias/files' },
  { method: 'POST', pattern: '/api/ghl/contacts', ghlPath: '/contacts' },
  { method: 'GET', pattern: '/api/ghl/contacts', ghlPath: '/contacts' }
];

// Universal API handler
async function handleUniversalAPI(req, res) {
  const installationId = req.query.installationId;
  const locationId = req.query.locationId;
  
  if (!installationId && !locationId) {
    return res.status(400).json({ error: 'Missing installationId or locationId' });
  }

  let tokens = null;
  if (locationId) {
    tokens = tokensByLocation.get(locationId);
  } else if (installationId) {
    const installation = installations.get(installationId);
    if (installation && installation.locationId) {
      tokens = tokensByLocation.get(installation.locationId);
    }
  }

  if (!tokens) {
    return res.status(401).json({ error: 'No valid authentication found' });
  }

  // Find matching endpoint
  const endpoint = API_ENDPOINTS.find(ep => 
    ep.method === req.method && req.path.startsWith(ep.pattern.replace(':productId', ''))
  );

  if (!endpoint) {
    return res.status(404).json({ error: 'API endpoint not supported' });
  }

  try {
    const ghlUrl = `https://services.leadconnectorhq.com${endpoint.ghlPath}`;
    const ghlResponse = await fetch(ghlUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await ghlResponse.json();
    res.status(ghlResponse.status).json(data);

  } catch (error) {
    console.error('Universal API error:', error);
    res.status(500).json({ error: 'API request failed' });
  }
}

// Register universal API routes
API_ENDPOINTS.forEach(endpoint => {
  if (endpoint.method === 'GET') {
    app.get(endpoint.pattern, handleUniversalAPI);
  } else if (endpoint.method === 'POST') {
    app.post(endpoint.pattern, handleUniversalAPI);
  } else if (endpoint.method === 'PUT') {
    app.put(endpoint.pattern, handleUniversalAPI);
  } else if (endpoint.method === 'DELETE') {
    app.delete(endpoint.pattern, handleUniversalAPI);
  }
});

// Installation status endpoint
app.get('/api/installations/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  res.json({ success: true, installation });
});

// Initialize OAuth and start server
async function startServer() {
  await initializeOAuthConfig();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Railway backend with bridge running on port ${PORT}`);
    console.log('Bridge configuration:', {
      replicUrl: BRIDGE_CONFIG.replicUrl,
      fallbackMode: OAUTH_CONFIG?.bridgeSource === 'fallback',
      endpoints: API_ENDPOINTS.length
    });
  });
}

startServer();