/**
 * Railway Minimal OAuth Backend v5.2.3
 * Simplified deployment to fix service unavailable issues
 */

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['https://listings.engageautomations.com', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple token storage
const installations = new Map();

// Initialize with existing installation data
const initializeTokenStorage = () => {
  installations.set('install_1750131573635', {
    id: 'install_1750131573635',
    locationId: 'WAvk87RmW9rBSDJHeOpH',
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN,
    expiresAt: new Date('2025-06-18T05:26:13.635Z'),
    createdAt: new Date()
  });
};

initializeTokenStorage();

// OAuth token exchange function
async function exchangeCodeForToken(code) {
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}

// Try multiple OAuth user info endpoints
async function getUserInfo(accessToken) {
  const endpoints = [
    'https://services.leadconnectorhq.com/oauth/userinfo',
    'https://services.leadconnectorhq.com/users/me',
    'https://services.leadconnectorhq.com/oauth/me'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Version': '2021-07-28'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log(`SUCCESS with ${endpoint}`);
        return {
          ...userData,
          _endpoint: endpoint,
          _success: true
        };
      } else {
        const errorText = await response.text();
        console.log(`${endpoint} failed:`, response.status, errorText);
      }
    } catch (error) {
      console.log(`${endpoint} error:`, error.message);
    }
  }

  throw new Error('All OAuth user info endpoints failed');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    installations: installations.size,
    version: '5.2.3',
    fixes: ['simplified-deployment', 'minimal-dependencies'],
    features: ['oauth-callback', 'basic-api-proxy']
  });
});

// OAuth callback endpoint
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK v5.2.3 ===');
  
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('OAuth error:', error, error_description);
    return res.status(400).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #e74c3c;">OAuth Error</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${error_description || 'Unknown error'}</p>
          <a href="https://listings.engageautomations.com" style="color: #3498db;">Return to Application</a>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #e74c3c;">OAuth Error</h1>
          <p>No authorization code received</p>
          <a href="https://listings.engageautomations.com" style="color: #3498db;">Return to Application</a>
        </body>
      </html>
    `);
  }

  try {
    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokenData = await exchangeCodeForToken(code);
    console.log('Token exchange successful');

    // Try multiple user info endpoints
    console.log('Attempting user info retrieval...');
    const userInfo = await getUserInfo(tokenData.access_token);
    console.log('User info retrieved using:', userInfo._endpoint);

    // Create installation
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      locationId: userInfo.locationId || userInfo.companyId,
      userId: userInfo.id || userInfo.sub,
      userEmail: userInfo.email,
      successfulEndpoint: userInfo._endpoint,
      tokenScope: tokenData.scope,
      createdAt: new Date()
    };

    installations.set(installationId, installation);
    console.log('Installation created:', installationId);

    // Success page
    res.send(`
      <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .success { color: #27ae60; font-size: 24px; margin-bottom: 20px; }
            .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✅ OAuth Integration Successful!</h1>
            <p>Your GoHighLevel account has been successfully connected.</p>
            <p><strong>Installation ID:</strong> ${installationId}</p>
            <p><strong>Working Endpoint:</strong> ${installation.successfulEndpoint}</p>
            <div style="margin-top: 30px;">
              <a href="https://listings.engageautomations.com" class="button">Continue to Application</a>
            </div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #e74c3c;">OAuth Processing Error</h1>
          <p>Error: ${error.message}</p>
          <a href="https://listings.engageautomations.com" style="color: #3498db;">Return to Application</a>
        </body>
      </html>
    `);
  }
});

// OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  const installationId = req.query.installation_id;
  
  if (!installationId) {
    return res.status(400).json({ error: 'Installation ID required' });
  }

  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  res.json({
    status: 'connected',
    installationId: installation.id,
    locationId: installation.locationId,
    userEmail: installation.userEmail,
    expiresAt: installation.expiresAt,
    hasValidToken: installation.expiresAt > new Date(),
    successfulEndpoint: installation.successfulEndpoint,
    version: '5.2.3'
  });
});

// Basic API proxy endpoint
app.all('/api/ghl/*', async (req, res) => {
  console.log('=== API PROXY REQUEST ===');
  
  try {
    // Get installation from existing data
    const installation = installations.get('install_1750131573635');
    
    if (!installation) {
      return res.status(404).json({ error: 'No installation found' });
    }

    // Extract path after /api/ghl/
    const ghlPath = req.path.replace('/api/ghl/', '');
    const ghlUrl = `https://services.leadconnectorhq.com/${ghlPath}`;
    
    console.log('Proxying to:', ghlUrl);

    const response = await fetch(ghlUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const responseText = await response.text();
    res.status(response.status).type('json').send(responseText);

  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({
      error: 'API proxy failed',
      message: error.message
    });
  }
});

// Installation endpoints
app.get('/api/installations', (req, res) => {
  try {
    const installationList = Array.from(installations.values()).map(inst => ({
      id: inst.id,
      locationId: inst.locationId,
      userEmail: inst.userEmail,
      hasToken: !!inst.accessToken,
      expiresAt: inst.expiresAt,
      successfulEndpoint: inst.successfulEndpoint,
      createdAt: inst.createdAt
    }));
    res.json(installationList);
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Railway Minimal OAuth Backend v5.2.3 running on port ${port}`);
  console.log('Features: Simplified OAuth callback, Basic API proxy');
  console.log('Fixes: Minimal dependencies, Reduced resource usage');
  console.log(`Installations loaded: ${installations.size}`);
});