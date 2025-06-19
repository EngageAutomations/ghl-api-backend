const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// In-memory storage for installations
const installations = new Map();

// Token refresh timers
const refreshTimers = new Map();

// Required environment variables
const {
  GHL_CLIENT_ID,
  GHL_CLIENT_SECRET,
  GHL_REDIRECT_URI,
  GHL_ACCESS_TOKEN // Optional seed token for testing
} = process.env;

if (!GHL_CLIENT_ID || !GHL_CLIENT_SECRET || !GHL_REDIRECT_URI) {
  console.error('Missing required environment variables: GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_REDIRECT_URI');
  process.exit(1);
}

// Utility functions
function log(message, data = '') {
  console.log(`[${new Date().toISOString()}] ${message}`, data);
}

function generateInstallationId() {
  return `install_${Date.now()}`;
}

// Token lifecycle management
async function refreshAccessToken(installationId) {
  const installation = installations.get(installationId);
  if (!installation) {
    log(`[REFRESH-FAIL] ${installationId} - Installation not found`);
    return;
  }

  try {
    log(`[REFRESH] ${installationId} - Refreshing token`);
    
    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: installation.refreshToken,
      client_id: GHL_CLIENT_ID,
      client_secret: GHL_CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Update installation
    installation.accessToken = access_token;
    installation.refreshToken = refresh_token;
    installation.expiresIn = expires_in;
    installation.expiresAt = Date.now() + (expires_in * 1000);
    installation.tokenStatus = 'valid';

    log(`[REFRESH] ${installationId} - New token good for ${(expires_in / 3600).toFixed(1)} hours`);
    
    // Schedule next refresh
    scheduleTokenRefresh(installationId);
    
  } catch (error) {
    log(`[REFRESH-FAIL] ${installationId}`, error.response?.data || error.message);
    installation.tokenStatus = 'invalid';
    
    // Clear timer on failure
    if (refreshTimers.has(installationId)) {
      clearTimeout(refreshTimers.get(installationId));
      refreshTimers.delete(installationId);
    }
  }
}

function scheduleTokenRefresh(installationId) {
  const installation = installations.get(installationId);
  if (!installation) return;

  // Clear existing timer
  if (refreshTimers.has(installationId)) {
    clearTimeout(refreshTimers.get(installationId));
  }

  // Calculate refresh time (5 minutes before expiry)
  const refreshAt = installation.expiresAt - (5 * 60 * 1000);
  const delay = Math.max(0, refreshAt - Date.now());

  const timer = setTimeout(() => {
    refreshAccessToken(installationId);
  }, delay);

  refreshTimers.set(installationId, timer);
  
  log(`[SCHEDULE] ${installationId} - Next refresh in ${Math.round(delay / 1000 / 60)} minutes`);
}

async function ensureFreshToken(installationId) {
  const installation = installations.get(installationId);
  if (!installation) {
    throw new Error('Installation not found');
  }

  // Check if token expires within 5 minutes
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  if (installation.expiresAt <= fiveMinutesFromNow) {
    log(`[ENSURE-FRESH] ${installationId} - Token expiring soon, refreshing synchronously`);
    await refreshAccessToken(installationId);
  }

  if (installation.tokenStatus !== 'valid') {
    throw new Error('Token is invalid - user needs to re-authenticate');
  }

  return installation.accessToken;
}

// OAuth endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    installations: installations.size,
    activeTimers: refreshTimers.size
  });
});

app.get('/oauth/callback', handleOAuthCallback);
app.get('/api/oauth/callback', handleOAuthCallback);

async function handleOAuthCallback(req, res) {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    log('[OAUTH] Exchanging code for tokens');
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: GHL_CLIENT_ID,
      client_secret: GHL_CLIENT_SECRET,
      redirect_uri: GHL_REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Version: '2021-07-28'
      }
    });

    const userInfo = userResponse.data;
    const installationId = generateInstallationId();

    // Create installation object
    const installation = {
      id: installationId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + (expires_in * 1000),
      scope,
      tokenStatus: 'valid',
      userInfo,
      locationId: userInfo.companyId || userInfo.locationIds?.[0],
      createdAt: new Date().toISOString()
    };

    installations.set(installationId, installation);
    scheduleTokenRefresh(installationId);

    log(`[OAUTH] Created installation ${installationId} for location ${installation.locationId}`);

    // Return success page with installation ID
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Success</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; }
          .code { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="success">
          <h2>✅ OAuth Success</h2>
          <p>Your GoHighLevel account has been connected successfully!</p>
          <p><strong>Installation ID:</strong></p>
          <div class="code">${installationId}</div>
          <p>Use this installation ID in your API calls.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    log('[OAUTH-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OAuth failed', 
      details: error.response?.data || error.message 
    });
  }
}

// API status endpoint
app.get('/api/oauth/status', (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({ error: 'installation_id required' });
  }

  const installation = installations.get(installation_id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  res.json({
    installationId: installation.id,
    tokenStatus: installation.tokenStatus,
    expiresAt: installation.expiresAt,
    locationId: installation.locationId,
    scope: installation.scope,
    userInfo: installation.userInfo
  });
});

// GHL API proxy endpoints
app.get('/api/ghl/test-connection', async (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({ error: 'installation_id required' });
  }

  try {
    const accessToken = await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);

    const response = await axios.get('https://services.leadconnectorhq.com/locations/', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28'
      }
    });

    res.json({
      success: true,
      locationId: installation.locationId,
      locations: response.data
    });

  } catch (error) {
    log('[TEST-CONNECTION-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Test connection failed', 
      details: error.response?.data || error.message 
    });
  }
});

app.get('/api/ghl/products', async (req, res) => {
  const { installation_id, limit = 20, offset = 0 } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({ error: 'installation_id required' });
  }

  try {
    const accessToken = await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);

    const response = await axios.get('https://services.leadconnectorhq.com/products/', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28'
      },
      params: {
        locationId: installation.locationId,
        limit,
        offset
      }
    });

    res.json(response.data);

  } catch (error) {
    log('[PRODUCTS-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      details: error.response?.data || error.message 
    });
  }
});

app.post('/api/ghl/products/create', async (req, res) => {
  const { installationId, ...productData } = req.body;
  
  if (!installationId) {
    return res.status(400).json({ error: 'installationId required' });
  }

  try {
    const accessToken = await ensureFreshToken(installationId);
    const installation = installations.get(installationId);

    // Ensure required fields
    const ghlProductData = {
      name: productData.name,
      description: productData.description || '',
      productType: productData.productType || 'DIGITAL',
      locationId: installation.locationId,
      ...productData
    };

    const response = await axios.post('https://services.leadconnectorhq.com/products/', ghlProductData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    log(`[PRODUCT-CREATE] ${installationId} - Created product: ${response.data.id}`);

    res.json({
      success: true,
      productId: response.data.id,
      locationId: installation.locationId,
      product: response.data
    });

  } catch (error) {
    log('[PRODUCT-CREATE-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create product', 
      details: error.response?.data || error.message 
    });
  }
});

app.post('/api/ghl/contacts/create', async (req, res) => {
  const { installationId, ...contactData } = req.body;
  
  if (!installationId) {
    return res.status(400).json({ error: 'installationId required' });
  }

  try {
    const accessToken = await ensureFreshToken(installationId);
    const installation = installations.get(installationId);

    const ghlContactData = {
      locationId: installation.locationId,
      ...contactData
    };

    const response = await axios.post('https://services.leadconnectorhq.com/contacts/', ghlContactData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      contactId: response.data.id,
      locationId: installation.locationId,
      contact: response.data
    });

  } catch (error) {
    log('[CONTACT-CREATE-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create contact', 
      details: error.response?.data || error.message 
    });
  }
});

app.post('/api/ghl/test-product', async (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({ error: 'installation_id required' });
  }

  const testProduct = {
    name: `Test Product ${Date.now()}`,
    description: 'Test product created via API',
    productType: 'DIGITAL',
    price: 99.99
  };

  try {
    const accessToken = await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);

    const response = await axios.post('https://services.leadconnectorhq.com/products/', {
      ...testProduct,
      locationId: installation.locationId
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: 'Test product created successfully',
      productId: response.data.id,
      product: response.data
    });

  } catch (error) {
    log('[TEST-PRODUCT-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create test product', 
      details: error.response?.data || error.message 
    });
  }
});

// Media upload endpoint
app.post('/api/ghl/media/upload', async (req, res) => {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.status(400).json({ error: 'installation_id required' });
  }

  try {
    const accessToken = await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);

    // Handle file upload (you'll need multer middleware for actual file handling)
    const form = new FormData();
    
    // Example for hosted file upload
    if (req.body.fileUrl) {
      form.append('hosted', 'true');
      form.append('fileUrl', req.body.fileUrl);
      form.append('fileName', req.body.fileName || 'uploaded-file');
    }
    
    form.append('locationId', installation.locationId);

    const response = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
        Version: '2021-07-28'
      },
      timeout: 15000
    });

    log(`[MEDIA-UPLOAD] ${installation_id} - Uploaded file: ${response.data.fileId}`);

    res.json({
      success: true,
      fileId: response.data.fileId,
      file: response.data
    });

  } catch (error) {
    log('[MEDIA-UPLOAD-FAIL]', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to upload media', 
      details: error.response?.data || error.message 
    });
  }
});

// Serve production frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Serve frontend for all other routes (SPA routing)
app.get('*', (req, res) => {
  // First try to serve from existing dist directory
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback to client directory for development
    const clientIndexPath = path.join(__dirname, 'client', 'index.html');
    if (fs.existsSync(clientIndexPath)) {
      res.sendFile(clientIndexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>GoHighLevel OAuth Backend</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .status { background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 5px; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="status">
            <h1>🚀 GoHighLevel OAuth Backend</h1>
            <p>Production backend is running successfully!</p>
            <p><strong>Status:</strong> Healthy</p>
            <p><strong>Port:</strong> ${PORT}</p>
          </div>
          
          <h2>Available Endpoints</h2>
          
          <h3>OAuth & Authentication</h3>
          <div class="endpoint">GET /oauth/callback - OAuth callback handler</div>
          <div class="endpoint">GET /api/oauth/status?installation_id=... - Installation status</div>
          
          <h3>GoHighLevel API Proxy</h3>
          <div class="endpoint">GET /api/ghl/test-connection?installation_id=... - Test API connection</div>
          <div class="endpoint">GET /api/ghl/products?installation_id=... - List products</div>
          <div class="endpoint">POST /api/ghl/products/create - Create product</div>
          <div class="endpoint">POST /api/ghl/contacts/create - Create contact</div>
          <div class="endpoint">POST /api/ghl/media/upload?installation_id=... - Upload media</div>
          
          <h3>System</h3>
          <div class="endpoint">GET /health - System health check</div>
          
          <p><em>All API endpoints require proper authentication and installation_id parameters.</em></p>
        </body>
        </html>
      `);
    }
  }
});

// Initialize with seed token if provided
if (GHL_ACCESS_TOKEN) {
  const seedInstallation = {
    id: 'install_seed',
    accessToken: GHL_ACCESS_TOKEN,
    refreshToken: null,
    expiresIn: 3600,
    expiresAt: Date.now() + (3600 * 1000),
    scope: 'products.write contacts.write medias.write',
    tokenStatus: 'valid',
    userInfo: { name: 'Seed User' },
    locationId: process.env.GHL_LOCATION_ID,
    createdAt: new Date().toISOString()
  };
  
  installations.set('install_seed', seedInstallation);
  log('[INIT] Seed installation created');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  log(`[SERVER] Running on port ${PORT}`);
  log(`[SERVER] Health check: http://localhost:${PORT}/health`);
  
  // Re-arm refresh timers for any existing installations
  for (const [id, installation] of installations) {
    if (installation.tokenStatus === 'valid' && installation.refreshToken) {
      scheduleTokenRefresh(id);
    }
  }
});