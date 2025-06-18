/**
 * Railway GoHighLevel API Backend v4.1.0
 * Fixed for Railway deployment with proper error handling
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS for Railway
app.use(cors({
  origin: [
    'https://listings.engageautomations.com',
    'https://dir.engageautomations.com',
    /\.replit\.app$/,
    /\.replit\.co$/,
    /\.replit\.dev$/,
    /\.railway\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage for OAuth installations
const installations = new Map();

// Initialize with your current installation
installations.set('install_1750106970265', {
  id: 'install_1750106970265',
  accessToken: process.env.GHL_ACCESS_TOKEN || 'missing_token',
  locationId: 'WAvk87RmW9rBSDJHeOpH',
  scopes: 'products/prices.write products/prices.readonly products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write products/collection.write users.readonly',
  tokenStatus: process.env.GHL_ACCESS_TOKEN ? 'valid' : 'missing',
  createdAt: new Date().toISOString()
});

// GoHighLevel API Helper
class GHLApi {
  constructor(accessToken, locationId) {
    this.accessToken = accessToken;
    this.locationId = locationId;
    this.baseURL = 'https://services.leadconnectorhq.com';
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.accessToken || this.accessToken === 'missing_token') {
      return { 
        success: false, 
        error: 'GHL_ACCESS_TOKEN environment variable not set',
        status: 401
      };
    }

    const config = {
      ...options,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      },
      timeout: 30000
    };

    try {
      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('GHL API Error:', error.message);
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend',
    version: '4.1.0',
    status: 'running',
    features: ['oauth', 'products', 'media', 'real_api'],
    endpoints: [
      'GET /health',
      'GET /api/installations',
      'GET /api/oauth/status',
      'GET /api/ghl/test-connection',
      'POST /api/ghl/products/create',
      'GET /api/ghl/products',
      'PUT /api/ghl/products/:id',
      'DELETE /api/ghl/products/:id',
      'POST /api/ghl/media/upload'
    ]
  });
});

// Health check with detailed status
app.get('/health', (req, res) => {
  const hasToken = process.env.GHL_ACCESS_TOKEN && process.env.GHL_ACCESS_TOKEN !== 'missing_token';
  
  res.json({ 
    status: 'healthy', 
    service: 'GoHighLevel API Backend',
    version: '4.1.0',
    timestamp: new Date().toISOString(),
    environment: {
      port: port,
      nodeEnv: process.env.NODE_ENV || 'production',
      hasAccessToken: hasToken
    },
    features: ['oauth', 'products', 'media', 'real_api'],
    installations: installations.size
  });
});

// OAuth callback
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    }, { timeout: 30000 });

    const tokenData = tokenResponse.data;
    const installationId = `install_${Date.now()}`;
    
    installations.set(installationId, {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      locationId: tokenData.locationId || 'extracted_from_token',
      scopes: tokenData.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      installationId: installationId,
      redirectUrl: `https://listings.engageautomations.com/?installation_id=${installationId}`
    });

  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.status(500).json({ error: 'OAuth failed', message: error.message });
  }
});

// Get installations
app.get('/api/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    scopes: inst.scopes,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt
  }));

  res.json({ 
    success: true, 
    count: installationList.length, 
    installations: installationList 
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
    tokenStatus: installation.tokenStatus
  });
});

// Test connection
app.get('/api/ghl/test-connection', async (req, res) => {
  try {
    const { installationId } = req.query;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    const ghl = new GHLApi(installation.accessToken, installation.locationId);
    const result = await ghl.makeRequest(`/locations/${installation.locationId}`);

    if (result.success) {
      res.json({
        success: true,
        message: 'GoHighLevel connection successful',
        locationId: installation.locationId,
        locationData: result.data
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: 'Connection failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test connection error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create product
app.post('/api/ghl/products/create', async (req, res) => {
  try {
    const { name, description, price, installationId, productType = 'DIGITAL' } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    const productData = {
      name,
      description,
      locationId: installation.locationId,
      productType,
      availableInStore: true
    };

    if (price) {
      productData.price = parseFloat(price);
    }

    const ghl = new GHLApi(installation.accessToken, installation.locationId);
    const result = await ghl.makeRequest('/products/', {
      method: 'POST',
      data: productData
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Product created successfully',
        product: result.data.product,
        productId: result.data.product?.id
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: 'Product creation failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get products
app.get('/api/ghl/products', async (req, res) => {
  try {
    const { installationId, limit = 20, offset = 0 } = req.query;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    const ghl = new GHLApi(installation.accessToken, installation.locationId);
    const result = await ghl.makeRequest(`/products/?locationId=${installation.locationId}&limit=${limit}&offset=${offset}`);

    if (result.success) {
      res.json({
        success: true,
        products: result.data.products || [],
        total: result.data.total || 0
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: 'Failed to fetch products',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product
app.put('/api/ghl/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { installationId, ...updateData } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    const ghl = new GHLApi(installation.accessToken, installation.locationId);
    const result = await ghl.makeRequest(`/products/${productId}`, {
      method: 'PUT',
      data: { ...updateData, locationId: installation.locationId }
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Product updated successfully',
        product: result.data.product
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: 'Product update failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
app.delete('/api/ghl/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { installationId } = req.query;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    const ghl = new GHLApi(installation.accessToken, installation.locationId);
    const result = await ghl.makeRequest(`/products/${productId}?locationId=${installation.locationId}`, {
      method: 'DELETE'
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: 'Product deletion failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload media
app.post('/api/ghl/media/upload', async (req, res) => {
  try {
    const { installationId, mediaUrl, fileName } = req.body;
    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }

    const ghl = new GHLApi(installation.accessToken, installation.locationId);
    const result = await ghl.makeRequest('/medias/upload-file', {
      method: 'POST',
      data: {
        fileUrl: mediaUrl,
        fileName: fileName || 'uploaded-file',
        locationId: installation.locationId
      }
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Media uploaded successfully',
        media: result.data
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: 'Media upload failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Upload media error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/installations',
      'GET /api/oauth/status',
      'GET /api/ghl/test-connection',
      'POST /api/ghl/products/create',
      'GET /api/ghl/products',
      'PUT /api/ghl/products/:id',
      'DELETE /api/ghl/products/:id',
      'POST /api/ghl/media/upload'
    ]
  });
});

// Start server with proper error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 GoHighLevel API Backend v4.1.0 running on port ${port}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔑 Access Token: ${process.env.GHL_ACCESS_TOKEN ? 'Set' : 'Missing'}`);
  console.log(`📡 Health Check: /health`);
  console.log(`🎯 Ready for Railway deployment`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});