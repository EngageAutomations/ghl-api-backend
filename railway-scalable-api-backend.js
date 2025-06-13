// Complete Scalable GoHighLevel API Backend for Railway
// Handles multiple API categories with dynamic routing and authentication

const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for OAuth installations
let oauthInstallations = [];

// Storage functions
const storage = {
  createInstallation(installationData) {
    const installation = {
      id: oauthInstallations.length + 1,
      ...installationData,
      installationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    oauthInstallations.push(installation);
    return installation;
  },

  getAllInstallations() {
    return oauthInstallations.sort((a, b) => new Date(b.installationDate) - new Date(a.installationDate));
  },

  getInstallationByUserId(ghlUserId) {
    return oauthInstallations
      .filter(install => install.ghlUserId === ghlUserId)
      .sort((a, b) => new Date(b.installationDate) - new Date(a.installationDate))[0];
  }
};

// GoHighLevel API Manager Class
class GoHighLevelAPIManager {
  constructor(accessToken, locationId) {
    this.accessToken = accessToken;
    this.locationId = locationId;
    this.baseURL = 'https://services.leadconnectorhq.com';
    this.version = '2021-07-28';
  }

  async makeRequest(config) {
    try {
      const requestConfig = {
        method: config.method,
        url: `${this.baseURL}${config.endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Version': this.version,
          ...config.headers
        },
        timeout: 15000
      };

      if (config.data) {
        requestConfig.data = config.data;
      }

      if (config.params) {
        requestConfig.params = config.params;
      }

      console.log(`[GHL API] ${config.method} ${config.endpoint}`);
      
      const response = await axios(requestConfig);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };

    } catch (error) {
      console.error(`[GHL API Error] ${config.method} ${config.endpoint}:`, error.message);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  }

  // Products API
  async createProduct(productData) {
    return this.makeRequest({
      endpoint: '/products/',
      method: 'POST',
      data: {
        ...productData,
        locationId: productData.locationId || this.locationId
      }
    });
  }

  async getProducts(locationId, limit = 100, offset = 0) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  async getProduct(productId, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}`,
      method: 'GET'
    });
  }

  async updateProduct(productId, updates, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}`,
      method: 'PUT',
      data: updates
    });
  }

  async deleteProduct(productId, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}`,
      method: 'DELETE'
    });
  }

  // Product Prices
  async createProductPrice(productId, priceData, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}/prices`,
      method: 'POST',
      data: priceData
    });
  }

  async getProductPrices(productId, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}/prices`,
      method: 'GET'
    });
  }

  // Contacts API
  async createContact(contactData, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts`,
      method: 'POST',
      data: contactData
    });
  }

  async getContacts(locationId, limit = 100, offset = 0) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  async getContact(contactId, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts/${contactId}`,
      method: 'GET'
    });
  }

  async updateContact(contactId, updates, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts/${contactId}`,
      method: 'PUT',
      data: updates
    });
  }

  // Locations API
  async getLocations() {
    return this.makeRequest({
      endpoint: '/locations/',
      method: 'GET'
    });
  }

  async getLocation(locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}`,
      method: 'GET'
    });
  }

  // Opportunities API
  async createOpportunity(opportunityData, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/opportunities`,
      method: 'POST',
      data: opportunityData
    });
  }

  async getOpportunities(locationId, limit = 100, offset = 0) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/opportunities`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  // Workflows API
  async getWorkflows(locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/workflows`,
      method: 'GET'
    });
  }

  async triggerWorkflow(workflowId, contactId, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/workflows/${workflowId}/contacts/${contactId}`,
      method: 'POST'
    });
  }

  // Forms API
  async getForms(locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/forms`,
      method: 'GET'
    });
  }

  async getFormSubmissions(formId, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/forms/${formId}/submissions`,
      method: 'GET'
    });
  }

  // Media API
  async uploadMedia(file, locationId) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/medias/upload-file`,
      method: 'POST',
      data: file,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async getMediaFiles(locationId, limit = 100, offset = 0) {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/medias`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  // OAuth & User Info
  async getUserInfo() {
    return this.makeRequest({
      endpoint: '/oauth/userinfo',
      method: 'GET'
    });
  }

  async getMe() {
    return this.makeRequest({
      endpoint: '/users/me',
      method: 'GET'
    });
  }

  // Utility Methods
  async testConnection() {
    try {
      const userInfo = await this.getUserInfo();
      if (userInfo.success) {
        return {
          success: true,
          data: {
            tokenValid: true,
            userInfo: userInfo.data,
            locationId: this.locationId
          }
        };
      } else {
        return userInfo;
      }
    } catch (error) {
      return {
        success: false,
        error: 'Connection test failed',
        details: error.message
      };
    }
  }
}

// API Endpoint Router
class APIRouter {
  static async getInstallation(installationId) {
    const installations = storage.getAllInstallations();
    
    if (installations.length === 0) {
      throw new Error('No OAuth installations found');
    }
    
    const installation = installationId 
      ? installations.find(i => i.id.toString() === installationId)
      : installations[0];
    
    if (!installation) {
      throw new Error('Installation not found');
    }
    
    if (!installation.ghlAccessToken) {
      throw new Error('No access token available');
    }
    
    return installation;
  }

  static async createAPIManager(installationId, locationId) {
    const installation = await this.getInstallation(installationId);
    const targetLocationId = locationId || installation.ghlLocationId;
    return new GoHighLevelAPIManager(installation.ghlAccessToken, targetLocationId);
  }

  static async handleRequest(req, res, handler, args = []) {
    try {
      const installationId = req.query.installationId || req.headers['x-installation-id'];
      const locationId = req.query.locationId || req.headers['x-location-id'];
      
      const apiManager = await this.createAPIManager(installationId, locationId);
      const result = await apiManager[handler](...args);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(result.status || 400).json(result);
      }
      
    } catch (error) {
      console.error(`[API Router Error] ${handler}:`, error);
      res.status(500).json({
        success: false,
        error: 'API request failed',
        details: error.message
      });
    }
  }
}

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Authentication middleware
function requireOAuth(req, res, next) {
  const installations = storage.getAllInstallations();
  
  if (installations.length === 0) {
    return res.status(401).json({
      success: false,
      error: 'No OAuth installations found. Complete OAuth setup first.',
      hint: 'Visit /api/oauth/url to start OAuth flow'
    });
  }
  
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Scalable GHL API Backend', 
    timestamp: new Date().toISOString(),
    installationsCount: oauthInstallations.length,
    endpoints: [
      'Products', 'Contacts', 'Locations', 'Opportunities', 
      'Workflows', 'Forms', 'Media', 'User Info'
    ]
  });
});

// OAuth endpoints (existing implementation)
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
  const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly';
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== RAILWAY OAUTH CALLBACK ===');
  const { code, state, error } = req.query;

  if (error) {
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`;
    return res.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`;
    return res.redirect(errorUrl);
  }

  try {
    const tokenRequestData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: String(code),
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback'
    });

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      tokenRequestData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    // Get user info to extract locationId
    let userInfo = null;
    try {
      const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        },
        timeout: 5000
      });
      userInfo = userResponse.data;
    } catch (userError) {
      console.warn('Failed to get user info:', userError.message);
    }

    // Store OAuth installation
    const installationData = {
      ghlUserId: userInfo?.userId || `user_${Date.now()}`,
      ghlLocationId: userInfo?.locationId,
      ghlCompanyId: userInfo?.companyId,
      ghlAccessToken: response.data.access_token,
      ghlRefreshToken: response.data.refresh_token,
      ghlTokenType: response.data.token_type || 'Bearer',
      ghlExpiresIn: response.data.expires_in || 3600,
      ghlScopes: response.data.scope,
      isActive: true
    };

    const savedInstallation = storage.createInstallation(installationData);
    console.log('✅ OAuth installation saved with ID:', savedInstallation.id);

    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString(),
      locationId: userInfo?.locationId || 'unknown',
      installationId: savedInstallation.id.toString()
    });

    const successUrl = `https://dir.engageautomations.com/oauth-success?${params.toString()}`;
    return res.redirect(successUrl);

  } catch (error) {
    console.error('Token exchange failed:', error.message);
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error.message)}`;
    return res.redirect(errorUrl);
  }
});

// Debug endpoints
app.get('/api/debug/installations', (req, res) => {
  const installations = storage.getAllInstallations();
  res.json({
    success: true,
    count: installations.length,
    installations: installations.map(install => ({
      id: install.id,
      ghlUserId: install.ghlUserId,
      ghlLocationId: install.ghlLocationId,
      hasAccessToken: !!install.ghlAccessToken,
      scopes: install.ghlScopes,
      installationDate: install.installationDate
    }))
  });
});

// ============================================================================
// SCALABLE API ENDPOINTS
// ============================================================================

// Products API
app.post('/api/ghl/products', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'createProduct', [req.body]);
});

app.get('/api/ghl/products', requireOAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  APIRouter.handleRequest(req, res, 'getProducts', [undefined, limit, offset]);
});

app.get('/api/ghl/products/:productId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getProduct', [req.params.productId]);
});

app.put('/api/ghl/products/:productId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'updateProduct', [req.params.productId, req.body]);
});

app.delete('/api/ghl/products/:productId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'deleteProduct', [req.params.productId]);
});

// Product Prices
app.post('/api/ghl/products/:productId/prices', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'createProductPrice', [req.params.productId, req.body]);
});

app.get('/api/ghl/products/:productId/prices', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getProductPrices', [req.params.productId]);
});

// Contacts API
app.post('/api/ghl/contacts', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'createContact', [req.body]);
});

app.get('/api/ghl/contacts', requireOAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  APIRouter.handleRequest(req, res, 'getContacts', [undefined, limit, offset]);
});

app.get('/api/ghl/contacts/:contactId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getContact', [req.params.contactId]);
});

app.put('/api/ghl/contacts/:contactId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'updateContact', [req.params.contactId, req.body]);
});

// Locations API
app.get('/api/ghl/locations', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getLocations', []);
});

app.get('/api/ghl/locations/:locationId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getLocation', [req.params.locationId]);
});

// Opportunities API
app.post('/api/ghl/opportunities', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'createOpportunity', [req.body]);
});

app.get('/api/ghl/opportunities', requireOAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  APIRouter.handleRequest(req, res, 'getOpportunities', [undefined, limit, offset]);
});

// Workflows API
app.get('/api/ghl/workflows', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getWorkflows', []);
});

app.post('/api/ghl/workflows/:workflowId/contacts/:contactId', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'triggerWorkflow', [req.params.workflowId, req.params.contactId]);
});

// Forms API
app.get('/api/ghl/forms', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getForms', []);
});

app.get('/api/ghl/forms/:formId/submissions', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getFormSubmissions', [req.params.formId]);
});

// Media API
app.post('/api/ghl/media/upload', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'uploadMedia', [req.body]);
});

app.get('/api/ghl/media', requireOAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  APIRouter.handleRequest(req, res, 'getMediaFiles', [undefined, limit, offset]);
});

// User Info API
app.get('/api/ghl/user/info', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getUserInfo', []);
});

app.get('/api/ghl/user/me', requireOAuth, (req, res) => {
  APIRouter.handleRequest(req, res, 'getMe', []);
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

// API Documentation
app.get('/api/ghl/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      baseUrl: '/api/ghl',
      authentication: 'OAuth2 Bearer Token (stored from installation)',
      categories: {
        products: ['POST /products', 'GET /products', 'GET /products/:id', 'PUT /products/:id', 'DELETE /products/:id'],
        contacts: ['POST /contacts', 'GET /contacts', 'GET /contacts/:id', 'PUT /contacts/:id'],
        locations: ['GET /locations', 'GET /locations/:id'],
        opportunities: ['POST /opportunities', 'GET /opportunities'],
        workflows: ['GET /workflows', 'POST /workflows/:workflowId/contacts/:contactId'],
        forms: ['GET /forms', 'GET /forms/:formId/submissions'],
        media: ['POST /media/upload', 'GET /media'],
        users: ['GET /user/info', 'GET /user/me']
      },
      parameters: {
        headers: {
          'x-installation-id': 'Optional: Specific installation ID',
          'x-location-id': 'Optional: Override location ID'
        },
        query: {
          limit: 'Pagination limit (default: 100)',
          offset: 'Pagination offset (default: 0)',
          installationId: 'Alternative to header',
          locationId: 'Alternative to header'
        }
      }
    }
  });
});

// Test all endpoints
app.get('/api/ghl/test/all', requireOAuth, async (req, res) => {
  try {
    const installationId = req.query.installationId;
    const installation = await APIRouter.getInstallation(installationId);
    const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
    
    const results = {};
    
    // Test connection
    results.connection = await apiManager.testConnection();
    
    if (results.connection.success) {
      // Test each category
      try { results.products = await apiManager.getProducts(); } catch (e) { results.products = { success: false, error: e.message }; }
      try { results.contacts = await apiManager.getContacts(); } catch (e) { results.contacts = { success: false, error: e.message }; }
      try { results.locations = await apiManager.getLocations(); } catch (e) { results.locations = { success: false, error: e.message }; }
      try { results.workflows = await apiManager.getWorkflows(); } catch (e) { results.workflows = { success: false, error: e.message }; }
      try { results.forms = await apiManager.getForms(); } catch (e) { results.forms = { success: false, error: e.message }; }
      try { results.media = await apiManager.getMediaFiles(); } catch (e) { results.media = { success: false, error: e.message }; }
      try { results.userInfo = await apiManager.getUserInfo(); } catch (e) { results.userInfo = { success: false, error: e.message }; }
    }
    
    res.json({
      success: true,
      installation: {
        id: installation.id,
        locationId: installation.ghlLocationId
      },
      testResults: results
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

// Health check for GHL API
app.get('/api/ghl/health', requireOAuth, async (req, res) => {
  try {
    const installation = await APIRouter.getInstallation();
    const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
    
    const healthCheck = await apiManager.testConnection();
    
    res.json({
      success: healthCheck.success,
      health: {
        apiConnection: healthCheck.success,
        tokenValid: healthCheck.success,
        locationId: installation.ghlLocationId,
        scopes: installation.ghlScopes
      },
      installation: {
        id: installation.id,
        installationDate: installation.installationDate
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// Legacy test endpoint
app.post('/api/test/ghl-product', requireOAuth, (req, res) => {
  const testProductData = {
    name: req.body.name || `Test Product ${Date.now()}`,
    description: req.body.description || 'Test product created via scalable API',
    productType: req.body.productType || 'DIGITAL',
    availableInStore: req.body.availableInStore !== undefined ? req.body.availableInStore : true
  };
  
  APIRouter.handleRequest(req, res, 'createProduct', [testProductData]);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Scalable GHL API Backend Running`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`API Documentation: http://0.0.0.0:${PORT}/api/ghl/docs`);
  console.log(`OAuth URL: http://0.0.0.0:${PORT}/api/oauth/url`);
  console.log(`Test All APIs: http://0.0.0.0:${PORT}/api/ghl/test/all`);
  console.log('');
  console.log('🚀 Supported API Categories:');
  console.log('   • Products (CRUD + Prices)');
  console.log('   • Contacts (CRUD)');
  console.log('   • Locations (Read/Update)');
  console.log('   • Opportunities (CRUD)');
  console.log('   • Workflows (Read/Trigger)');
  console.log('   • Forms (Read + Submissions)');
  console.log('   • Media (Upload/Read)');
  console.log('   • User Info (OAuth/Profile)');
});

module.exports = app;