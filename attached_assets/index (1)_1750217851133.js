const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// In-memory storage for OAuth installations
const installations = new Map();

// Initialize with your current installation
installations.set('install_1750106970265', {
  id: 'install_1750106970265',
  accessToken: process.env.GHL_ACCESS_TOKEN || null,
  locationId: 'WAvk87RmW9rBSDJHeOpH',
  scopes: 'products/prices.write products/prices.readonly products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write products/collection.write users.readonly',
  tokenStatus: process.env.GHL_ACCESS_TOKEN ? 'valid' : 'missing',
  createdAt: new Date().toISOString()
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend',
    version: '1.2.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    activeInstallations: installations.size
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasToken: !!process.env.GHL_ACCESS_TOKEN,
    installations: installations.size,
    installationIds: Array.from(installations.keys())
  });
});

// OAuth status
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
    scopes: installation.scopes,
    tokenStatus: installation.tokenStatus,
    hasAccessToken: !!installation.accessToken
  });
});

// Test connection
app.get('/api/ghl/test-connection', async (req, res) => {
  try {
    const { installationId } = req.query;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token not available for installation: ' + installationId,
        availableInstallations: Array.from(installations.keys())
      });
    }

    const response = await axios.get(
      `https://services.leadconnectorhq.com/locations/${installation.locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      success: true,
      message: 'GoHighLevel connection successful',
      locationId: installation.locationId,
      locationData: response.data
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Connection failed',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// Create product
app.post('/api/ghl/products/create', async (req, res) => {
  try {
    const { name, description, price, installationId, productType = 'DIGITAL' } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token not available for installation: ' + installationId,
        availableInstallations: Array.from(installations.keys())
      });
    }

    const productData = {
      name,
      description,
      locationId: installation.locationId,
      productType,
      availableInStore: true
    };

    if (price && !isNaN(parseFloat(price))) {
      productData.price = parseFloat(price);
    }

    console.log('Creating product with data:', productData);
    console.log('Using access token for location:', installation.locationId);

    const response = await axios.post(
      'https://services.leadconnectorhq.com/products/',
      productData,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      success: true,
      message: 'Product created successfully in GoHighLevel',
      product: response.data.product,
      productId: response.data.product?.id,
      locationId: installation.locationId
    });

  } catch (error) {
    console.error('Product creation error:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error: 'Product creation failed',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// Get products
app.get('/api/ghl/products', async (req, res) => {
  try {
    const { installationId, limit = 20, offset = 0 } = req.query;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token not available',
        availableInstallations: Array.from(installations.keys())
      });
    }

    const response = await axios.get(
      `https://services.leadconnectorhq.com/products/?locationId=${installation.locationId}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      success: true,
      products: response.data.products || [],
      total: response.data.total || 0,
      locationId: installation.locationId
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.response?.data || error.message
    });
  }
});

// OAuth callback (primary route)
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('Processing OAuth callback with code:', code);
    
    // Create URL-encoded form data for GoHighLevel OAuth token exchange
    const formData = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    });
    
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });

    const tokenData = tokenResponse.data;
    const installationId = `install_${Date.now()}`;
    
    console.log('Token exchange successful, creating installation:', installationId);
    console.log('Location ID:', tokenData.locationId);
    
    installations.set(installationId, {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      locationId: tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenData.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    console.log('Installation created successfully:', installationId);

    // Redirect to welcome page instead of showing JSON
    const welcomeUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&welcome=true`;
    res.redirect(welcomeUrl);

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth failed', message: error.message });
  }
});

// OAuth callback with API prefix (for GoHighLevel compatibility)
app.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('Processing OAuth callback with code:', code);
    
    // Create URL-encoded form data for GoHighLevel OAuth token exchange
    const formData = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback'
    });
    
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });

    const tokenData = tokenResponse.data;
    const installationId = `install_${Date.now()}`;
    
    console.log('Token exchange successful, creating installation:', installationId);
    console.log('Location ID:', tokenData.locationId);
    
    installations.set(installationId, {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      locationId: tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenData.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    console.log('Installation created successfully:', installationId);

    // Redirect to welcome page instead of showing JSON
    const welcomeUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&welcome=true`;
    res.redirect(welcomeUrl);

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OAuth failed', 
      message: error.message,
      details: error.response?.data 
    });
  }
});

// Create contact (test with available scope)
app.post('/api/ghl/contacts/create', async (req, res) => {
  try {
    const { firstName, lastName, email, installationId, phone } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token not available for installation: ' + installationId,
        availableInstallations: Array.from(installations.keys())
      });
    }

    const contactData = {
      firstName: firstName || 'Test',
      lastName: lastName || 'Contact',
      email: email || `test${Date.now()}@example.com`,
      locationId: installation.locationId,
      source: 'OAuth Integration Test'
    };

    if (phone) {
      contactData.phone = phone;
    }

    console.log('Creating contact with data:', contactData);

    const response = await axios.post(
      'https://services.leadconnectorhq.com/contacts/',
      contactData,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      success: true,
      message: 'Contact created successfully in GoHighLevel',
      contact: response.data.contact,
      contactId: response.data.contact?.id,
      locationId: installation.locationId
    });

  } catch (error) {
    console.error('Contact creation error:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error: 'Contact creation failed',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// Test product creation with a new installation
app.post('/api/ghl/test-product', async (req, res) => {
  try {
    const { installationId } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation || !installation.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token not available for installation: ' + installationId,
        availableInstallations: Array.from(installations.keys())
      });
    }

    const testProduct = {
      name: 'Test Product from OAuth Integration',
      description: 'This product was created automatically via the production OAuth marketplace integration to verify API functionality',
      locationId: installation.locationId,
      productType: 'DIGITAL',
      availableInStore: true,
      price: 29.99
    };

    console.log('Creating test product:', testProduct);

    const response = await axios.post(
      'https://services.leadconnectorhq.com/products/',
      testProduct,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      success: true,
      message: 'Test product created successfully in GoHighLevel',
      product: response.data.product,
      productId: response.data.product?.id,
      installationId: installationId,
      locationId: installation.locationId
    });

  } catch (error) {
    console.error('Test product creation error:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error: 'Test product creation failed',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`GoHighLevel API Backend v1.2.0 running on port ${port}`);
  console.log(`Health check: /health`);
  console.log(`OAuth callback: /api/oauth/callback`);
  console.log(`Access token: ${process.env.GHL_ACCESS_TOKEN ? 'Present' : 'Missing - Will be captured via OAuth'}`);
  console.log(`Active installations: ${installations.size}`);
});

module.exports = app;
