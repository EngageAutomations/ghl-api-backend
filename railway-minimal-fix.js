/**
 * Railway Minimal GoHighLevel API Backend v4.2.0
 * Minimal working version to fix Railway deployment issues
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const installations = new Map();

// Initialize with your installation
installations.set('install_1750106970265', {
  id: 'install_1750106970265',
  accessToken: process.env.GHL_ACCESS_TOKEN || null,
  locationId: 'WAvk87RmW9rBSDJHeOpH',
  tokenStatus: process.env.GHL_ACCESS_TOKEN ? 'valid' : 'missing'
});

// Root endpoint - must respond immediately
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend',
    version: '4.2.0',
    status: 'running'
  });
});

// Health check - Railway checks this endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
    hasToken: !!process.env.GHL_ACCESS_TOKEN
  });
});

// OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  const installationId = req.query.installation_id;
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.json({ authenticated: false, message: 'Installation not found' });
  }

  res.json({
    authenticated: true,
    installationId: installation.id,
    locationId: installation.locationId,
    tokenStatus: installation.tokenStatus
  });
});

// Test connection endpoint
app.get('/api/ghl/test-connection', async (req, res) => {
  try {
    const { installationId } = req.query;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'No access token available' 
      });
    }

    const response = await axios.get(
      `https://services.leadconnectorhq.com/locations/${installation.locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28'
        },
        timeout: 10000
      }
    );

    res.json({
      success: true,
      message: 'Connection successful',
      locationId: installation.locationId,
      locationData: response.data
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Connection failed',
      details: error.response?.data || error.message
    });
  }
});

// Create product endpoint
app.post('/api/ghl/products/create', async (req, res) => {
  try {
    const { name, description, installationId } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'No access token available' 
      });
    }

    const productData = {
      name,
      description,
      locationId: installation.locationId,
      productType: 'DIGITAL',
      availableInStore: true
    };

    const response = await axios.post(
      'https://services.leadconnectorhq.com/products/',
      productData,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        timeout: 10000
      }
    );

    res.json({
      success: true,
      message: 'Product created successfully',
      product: response.data.product
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Product creation failed',
      details: error.response?.data || error.message
    });
  }
});

// OAuth callback
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://dir.engageautomations.com/oauth/callback'
    });

    const tokenData = tokenResponse.data;
    const installationId = `install_${Date.now()}`;
    
    installations.set(installationId, {
      id: installationId,
      accessToken: tokenData.access_token,
      locationId: tokenData.locationId || 'extracted_from_token',
      tokenStatus: 'valid'
    });

    res.json({
      success: true,
      installationId: installationId,
      redirectUrl: `https://listings.engageautomations.com/?installation_id=${installationId}`
    });

  } catch (error) {
    res.status(500).json({ error: 'OAuth failed', message: error.message });
  }
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at /health`);
  console.log(`Access token: ${process.env.GHL_ACCESS_TOKEN ? 'Present' : 'Missing'}`);
});

// Handle shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});