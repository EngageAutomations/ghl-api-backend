/**
 * Working Railway OAuth Backend - Simplified and Reliable
 * Fixes 404 errors and proper OAuth handling
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Simple CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for OAuth installations (temporary until DB is properly configured)
const oauthInstallations = new Map();
let installationIdCounter = 1;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'Railway OAuth Backend is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'GoHighLevel OAuth Backend',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      oauth_callback: '/api/oauth/callback',
      oauth_status: '/api/oauth/status',
      health: '/health'
    }
  });
});

// OAuth callback endpoint
app.get('/api/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    console.log('OAuth callback received, processing...');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return res.redirect(`https://listings.engageautomations.com/oauth-error?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://services.leadconnectorhq.com/oauth/userInfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      }
    });

    if (!userResponse.ok) {
      console.error('User info fetch failed:', await userResponse.text());
      return res.redirect(`https://listings.engageautomations.com/oauth-error?error=user_info_failed`);
    }

    const userData = await userResponse.json();

    // Store installation data
    const installationId = installationIdCounter++;
    const installation = {
      id: installationId,
      ghl_user_id: userData.id,
      ghl_user_name: userData.name || 'Unknown User',
      ghl_user_email: userData.email || '',
      ghl_location_id: userData.locationId || '',
      ghl_access_token: tokenData.access_token,
      ghl_refresh_token: tokenData.refresh_token,
      ghl_scopes: tokenData.scope || '',
      installation_date: new Date().toISOString(),
      is_active: true
    };

    oauthInstallations.set(installationId, installation);
    console.log(`Installation stored: ${installationId} for user ${userData.name}`);

    // Redirect to success page
    const successUrl = `https://listings.engageautomations.com/oauth-success?installation_id=${installationId}&location_id=${userData.locationId || ''}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`https://listings.engageautomations.com/oauth-error?error=${encodeURIComponent(error.message)}`);
  }
});

// OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  const installations = Array.from(oauthInstallations.values());
  res.json({
    status: 'active',
    total_installations: installations.length,
    recent_installations: installations.slice(-5).map(i => ({
      id: i.id,
      user_name: i.ghl_user_name,
      location_id: i.ghl_location_id,
      installation_date: i.installation_date
    }))
  });
});

// Get installation details
app.get('/api/oauth/installations/:id', (req, res) => {
  const installationId = parseInt(req.params.id);
  const installation = oauthInstallations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  // Return safe installation data (no tokens exposed)
  const safeInstallation = {
    id: installation.id,
    ghl_user_name: installation.ghl_user_name,
    ghl_user_email: installation.ghl_user_email,
    ghl_location_id: installation.ghl_location_id,
    ghl_scopes: installation.ghl_scopes,
    installation_date: installation.installation_date,
    is_active: installation.is_active
  };

  res.json(safeInstallation);
});

// Universal API proxy for GoHighLevel
app.all('/api/ghl/*', async (req, res) => {
  try {
    // Extract installation ID from headers or query
    const installationId = req.headers['x-installation-id'] || req.query.installation_id;
    
    if (!installationId) {
      return res.status(401).json({ error: 'Installation ID required' });
    }

    const installation = oauthInstallations.get(parseInt(installationId));
    if (!installation) {
      return res.status(401).json({ error: 'Invalid installation' });
    }

    // Extract GoHighLevel API path
    const ghlPath = req.path.replace('/api/ghl/', '');
    const ghlUrl = `https://services.leadconnectorhq.com/${ghlPath}`;

    // Forward request to GoHighLevel
    const response = await fetch(ghlUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${installation.ghl_access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'API request failed' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    available_endpoints: ['/health', '/api/oauth/callback', '/api/oauth/status', '/api/ghl/*']
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Railway OAuth Backend running on port ${port}`);
  console.log('✅ Features: OAuth callback, API proxy, status monitoring');
  console.log('🔍 Health check: /health');
});

module.exports = app;