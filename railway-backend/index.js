// Universal GoHighLevel API Backend - Handles all endpoints dynamically
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for OAuth installations
let oauthInstallations = [];

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

// Comprehensive GoHighLevel API endpoint configurations
const GHL_API_ENDPOINTS = [
  // Products API
  { path: '/products', method: 'GET', ghlEndpoint: '/products/', requiresLocationId: true, scope: 'products.readonly' },
  { path: '/products', method: 'POST', ghlEndpoint: '/products/', requiresLocationId: true, scope: 'products.write' },
  { path: '/products/:productId', method: 'GET', ghlEndpoint: '/products/{productId}', requiresLocationId: true, scope: 'products.readonly' },
  { path: '/products/:productId', method: 'PUT', ghlEndpoint: '/products/{productId}', requiresLocationId: false, scope: 'products.write' },
  { path: '/products/:productId', method: 'DELETE', ghlEndpoint: '/products/{productId}', requiresLocationId: false, scope: 'products.write' },
  
  // Product Prices API
  { path: '/products/:productId/prices', method: 'GET', ghlEndpoint: '/products/{productId}/prices', requiresLocationId: false, scope: 'products/prices.readonly' },
  { path: '/products/:productId/prices', method: 'POST', ghlEndpoint: '/products/{productId}/prices', requiresLocationId: false, scope: 'products/prices.write' },
  { path: '/products/:productId/prices/:priceId', method: 'GET', ghlEndpoint: '/products/{productId}/prices/{priceId}', requiresLocationId: false, scope: 'products/prices.readonly' },
  { path: '/products/:productId/prices/:priceId', method: 'PUT', ghlEndpoint: '/products/{productId}/prices/{priceId}', requiresLocationId: false, scope: 'products/prices.write' },
  { path: '/products/:productId/prices/:priceId', method: 'DELETE', ghlEndpoint: '/products/{productId}/prices/{priceId}', requiresLocationId: false, scope: 'products/prices.write' },
  
  // Contacts API
  { path: '/contacts', method: 'GET', ghlEndpoint: '/locations/{locationId}/contacts', requiresLocationId: true, scope: 'contacts.readonly' },
  { path: '/contacts', method: 'POST', ghlEndpoint: '/locations/{locationId}/contacts', requiresLocationId: true, scope: 'contacts.write' },
  { path: '/contacts/:contactId', method: 'GET', ghlEndpoint: '/locations/{locationId}/contacts/{contactId}', requiresLocationId: true, scope: 'contacts.readonly' },
  { path: '/contacts/:contactId', method: 'PUT', ghlEndpoint: '/locations/{locationId}/contacts/{contactId}', requiresLocationId: true, scope: 'contacts.write' },
  { path: '/contacts/:contactId', method: 'DELETE', ghlEndpoint: '/locations/{locationId}/contacts/{contactId}', requiresLocationId: true, scope: 'contacts.write' },
  
  // Opportunities API
  { path: '/opportunities', method: 'GET', ghlEndpoint: '/locations/{locationId}/opportunities', requiresLocationId: true, scope: 'opportunities.readonly' },
  { path: '/opportunities', method: 'POST', ghlEndpoint: '/locations/{locationId}/opportunities', requiresLocationId: true, scope: 'opportunities.write' },
  { path: '/opportunities/:opportunityId', method: 'GET', ghlEndpoint: '/locations/{locationId}/opportunities/{opportunityId}', requiresLocationId: true, scope: 'opportunities.readonly' },
  { path: '/opportunities/:opportunityId', method: 'PUT', ghlEndpoint: '/locations/{locationId}/opportunities/{opportunityId}', requiresLocationId: true, scope: 'opportunities.write' },
  { path: '/opportunities/:opportunityId', method: 'DELETE', ghlEndpoint: '/locations/{locationId}/opportunities/{opportunityId}', requiresLocationId: true, scope: 'opportunities.write' },
  
  // Locations API
  { path: '/locations', method: 'GET', ghlEndpoint: '/locations/', requiresLocationId: false, scope: 'locations.readonly' },
  { path: '/locations/:locationId', method: 'GET', ghlEndpoint: '/locations/{locationId}', requiresLocationId: false, scope: 'locations.readonly' },
  { path: '/locations/:locationId', method: 'PUT', ghlEndpoint: '/locations/{locationId}', requiresLocationId: false, scope: 'locations.write' },
  
  // Workflows API
  { path: '/workflows', method: 'GET', ghlEndpoint: '/locations/{locationId}/workflows', requiresLocationId: true, scope: 'workflows.readonly' },
  { path: '/workflows/:workflowId/contacts/:contactId', method: 'POST', ghlEndpoint: '/locations/{locationId}/workflows/{workflowId}/contacts/{contactId}', requiresLocationId: true, scope: 'workflows.write' },
  
  // Forms API
  { path: '/forms', method: 'GET', ghlEndpoint: '/locations/{locationId}/forms', requiresLocationId: true, scope: 'forms.readonly' },
  { path: '/forms/:formId', method: 'GET', ghlEndpoint: '/locations/{locationId}/forms/{formId}', requiresLocationId: true, scope: 'forms.readonly' },
  { path: '/forms/:formId/submissions', method: 'GET', ghlEndpoint: '/locations/{locationId}/forms/{formId}/submissions', requiresLocationId: true, scope: 'forms.readonly' },
  
  // Surveys API
  { path: '/surveys', method: 'GET', ghlEndpoint: '/locations/{locationId}/surveys', requiresLocationId: true, scope: 'surveys.readonly' },
  { path: '/surveys/:surveyId/submissions', method: 'GET', ghlEndpoint: '/locations/{locationId}/surveys/{surveyId}/submissions', requiresLocationId: true, scope: 'surveys.readonly' },
  
  // Media API
  { path: '/media', method: 'GET', ghlEndpoint: '/locations/{locationId}/medias', requiresLocationId: true, scope: 'medias.readonly' },
  { path: '/media/upload', method: 'POST', ghlEndpoint: '/locations/{locationId}/medias/upload-file', requiresLocationId: true, scope: 'medias.write' },
  { path: '/media/:mediaId', method: 'GET', ghlEndpoint: '/locations/{locationId}/medias/{mediaId}', requiresLocationId: true, scope: 'medias.readonly' },
  { path: '/media/:mediaId', method: 'DELETE', ghlEndpoint: '/locations/{locationId}/medias/{mediaId}', requiresLocationId: true, scope: 'medias.write' },
  
  // Calendars API
  { path: '/calendars', method: 'GET', ghlEndpoint: '/locations/{locationId}/calendars', requiresLocationId: true, scope: 'calendars.readonly' },
  { path: '/calendars/:calendarId/events', method: 'GET', ghlEndpoint: '/locations/{locationId}/calendars/{calendarId}/events', requiresLocationId: true, scope: 'calendars.readonly' },
  { path: '/calendars/:calendarId/events', method: 'POST', ghlEndpoint: '/locations/{locationId}/calendars/{calendarId}/events', requiresLocationId: true, scope: 'calendars.write' },
  
  // User Info API
  { path: '/user/info', method: 'GET', ghlEndpoint: '/oauth/userinfo', requiresLocationId: false, scope: 'oauth' },
  { path: '/user/me', method: 'GET', ghlEndpoint: '/users/me', requiresLocationId: false, scope: 'users.readonly' }
];

// Universal API Handler Class
class UniversalAPIHandler {
  static findEndpointConfig(method, path) {
    return GHL_API_ENDPOINTS.find(endpoint => {
      if (endpoint.method !== method) return false;
      
      const pattern = endpoint.path
        .replace(/:[^\/]+/g, '[^/]+')
        .replace(/\//g, '\\/');
      
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });
  }

  static extractPathParams(pattern, actualPath) {
    const params = {};
    const patternParts = pattern.split('/');
    const actualParts = actualPath.split('/');
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params[paramName] = actualParts[i];
      }
    }
    
    return params;
  }

  static buildGHLEndpoint(config, pathParams, locationId) {
    let endpoint = config.ghlEndpoint;
    
    Object.entries(pathParams).forEach(([key, value]) => {
      endpoint = endpoint.replace(`{${key}}`, value);
    });
    
    if (config.requiresLocationId && locationId) {
      endpoint = endpoint.replace('{locationId}', locationId);
    }
    
    return endpoint;
  }

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

  static async makeGHLRequest(config, pathParams, queryParams, body, headers, installation, locationId) {
    const ghlEndpoint = this.buildGHLEndpoint(config, pathParams, locationId || installation.ghlLocationId);
    
    const requestConfig = {
      method: config.method,
      url: `https://services.leadconnectorhq.com${ghlEndpoint}`,
      headers: {
        'Authorization': `Bearer ${installation.ghlAccessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
        ...headers
      },
      timeout: 15000
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      requestConfig.data = body;
    }

    if (queryParams && Object.keys(queryParams).length > 0) {
      requestConfig.params = queryParams;
    }

    console.log(`[GHL API] ${config.method} ${ghlEndpoint}`);
    
    try {
      const response = await axios(requestConfig);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`[GHL API Error] ${config.method} ${ghlEndpoint}:`, error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  }

  static async handleUniversalRequest(req, res) {
    try {
      const method = req.method;
      const path = req.path.replace('/api/ghl', '');
      
      console.log(`[Universal API] ${method} ${path}`);
      
      const config = this.findEndpointConfig(method, path);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'API endpoint not found',
          method,
          path,
          availableEndpoints: GHL_API_ENDPOINTS.map(e => `${e.method} ${e.path}`)
        });
      }
      
      const installationId = req.query.installationId || req.headers['x-installation-id'];
      const locationId = req.query.locationId || req.headers['x-location-id'];
      
      const installation = await this.getInstallation(installationId);
      const pathParams = this.extractPathParams(config.path, path);
      
      // Filter query parameters (remove our internal params)
      const queryParams = { ...req.query };
      delete queryParams.installationId;
      delete queryParams.locationId;
      
      // Add locationId to query for endpoints that require it in query params
      if (config.requiresLocationId && (config.ghlEndpoint.includes('products/') || config.path.includes('/products/'))) {
        queryParams.locationId = locationId || installation.ghlLocationId;
      }
      
      const result = await this.makeGHLRequest(
        config,
        pathParams,
        queryParams,
        req.body,
        {},
        installation,
        locationId
      );
      
      if (result.success) {
        res.status(result.status || 200).json(result);
      } else {
        res.status(result.status || 400).json(result);
      }
      
    } catch (error) {
      console.error('[Universal API Error]:', error);
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
  origin: ['https://listings.engageautomations.com', 'https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Universal GHL API Backend', 
    timestamp: new Date().toISOString(),
    installationsCount: oauthInstallations.length,
    supportedEndpoints: GHL_API_ENDPOINTS.length
  });
});

// OAuth endpoints
app.get('/api/oauth/url', (req, res) => {
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://listings.engageautomations.com/api/oauth/callback';
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
  const { code, state, error } = req.query;

  if (error) {
    const errorUrl = `https://listings.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`;
    return res.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = `https://listings.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`;
    return res.redirect(errorUrl);
  }

  try {
    const tokenRequestData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: String(code),
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://listings.engageautomations.com/api/oauth/callback'
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

    // Get user info
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

    const successUrl = `https://listings.engageautomations.com/oauth-success?${params.toString()}`;
    return res.redirect(successUrl);

  } catch (error) {
    console.error('Token exchange failed:', error.message);
    const errorUrl = `https://listings.engageautomations.com/oauth-error?error=${encodeURIComponent(error.message)}`;
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

// Installation details endpoint - provides complete installation data for development
app.get('/api/installations/:id/details', (req, res) => {
  const installation = storage.getAllInstallations().find(inst => inst.id == req.params.id);
  if (installation) {
    res.json({
      success: true,
      installation: {
        id: installation.id,
        ghlUserId: installation.ghlUserId,
        ghlLocationId: installation.ghlLocationId,
        ghlAccessToken: installation.ghlAccessToken,
        ghlRefreshToken: installation.ghlRefreshToken,
        ghlTokenType: installation.ghlTokenType,
        ghlScopes: installation.ghlScopes,
        installationDate: installation.installationDate,
        isActive: installation.isActive
      }
    });
  } else {
    res.status(404).json({ success: false, error: 'Installation not found' });
  }
});

// Latest installation endpoint - provides most recent installation details
app.get('/api/installations/latest', (req, res) => {
  const installations = storage.getAllInstallations();
  if (installations.length > 0) {
    const latest = installations.sort((a, b) => new Date(b.installationDate) - new Date(a.installationDate))[0];
    res.json({
      success: true,
      installation: {
        id: latest.id,
        ghlUserId: latest.ghlUserId,
        ghlLocationId: latest.ghlLocationId,
        ghlAccessToken: latest.ghlAccessToken,
        ghlRefreshToken: latest.ghlRefreshToken,
        ghlTokenType: latest.ghlTokenType,
        ghlScopes: latest.ghlScopes,
        installationDate: latest.installationDate,
        isActive: latest.isActive
      }
    });
  } else {
    res.status(404).json({ success: false, error: 'No installations found' });
  }
});

// API Documentation
app.get('/api/ghl/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      baseUrl: '/api/ghl',
      authentication: 'OAuth2 Bearer Token (stored from installation)',
      totalEndpoints: GHL_API_ENDPOINTS.length,
      endpoints: GHL_API_ENDPOINTS.map(endpoint => ({
        method: endpoint.method,
        path: `/api/ghl${endpoint.path}`,
        scope: endpoint.scope,
        requiresLocationId: endpoint.requiresLocationId
      })),
      parameters: {
        headers: {
          'x-installation-id': 'Optional: Specific installation ID',
          'x-location-id': 'Optional: Override location ID'
        },
        query: {
          limit: 'Pagination limit',
          offset: 'Pagination offset',
          search: 'Search term (for products)',
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
    const installation = await UniversalAPIHandler.getInstallation(installationId);
    
    const testResults = {};
    const testEndpoints = [
      { method: 'GET', path: '/products', name: 'products' },
      { method: 'GET', path: '/contacts', name: 'contacts' },
      { method: 'GET', path: '/locations', name: 'locations' },
      { method: 'GET', path: '/workflows', name: 'workflows' },
      { method: 'GET', path: '/forms', name: 'forms' },
      { method: 'GET', path: '/media', name: 'media' },
      { method: 'GET', path: '/user/info', name: 'userInfo' }
    ];
    
    for (const testEndpoint of testEndpoints) {
      try {
        const config = UniversalAPIHandler.findEndpointConfig(testEndpoint.method, testEndpoint.path);
        if (config) {
          const result = await UniversalAPIHandler.makeGHLRequest(
            config, 
            {}, 
            { limit: 5 }, 
            null, 
            {}, 
            installation, 
            installation.ghlLocationId
          );
          testResults[testEndpoint.name] = {
            success: result.success,
            status: result.status,
            hasData: !!result.data
          };
        }
      } catch (error) {
        testResults[testEndpoint.name] = { 
          success: false, 
          error: error.message 
        };
      }
    }
    
    res.json({
      success: true,
      installation: {
        id: installation.id,
        locationId: installation.ghlLocationId
      },
      testResults
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

// Universal API router - handles ALL GoHighLevel endpoints dynamically
app.all('/api/ghl/*', requireOAuth, UniversalAPIHandler.handleUniversalRequest);

// Legacy test endpoint for compatibility
app.post('/api/test/ghl-product', requireOAuth, async (req, res) => {
  const testProductData = {
    name: req.body.name || `Test Product ${Date.now()}`,
    description: req.body.description || 'Test product created via universal API',
    productType: req.body.productType || 'DIGITAL',
    availableInStore: req.body.availableInStore !== undefined ? req.body.availableInStore : true
  };
  
  try {
    const installation = await UniversalAPIHandler.getInstallation();
    const config = UniversalAPIHandler.findEndpointConfig('POST', '/products');
    
    const result = await UniversalAPIHandler.makeGHLRequest(
      config,
      {},
      { locationId: installation.ghlLocationId },
      testProductData,
      {},
      installation,
      installation.ghlLocationId
    );
    
    if (result.success) {
      result.installation = {
        id: installation.id,
        ghlLocationId: installation.ghlLocationId
      };
    }
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

// Error handling
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
  console.log(`✅ Universal GHL API Backend Running`);
  console.log(`Port: ${PORT}`);
  console.log(`Supported endpoints: ${GHL_API_ENDPOINTS.length}`);
  console.log(`API Documentation: http://0.0.0.0:${PORT}/api/ghl/docs`);
  console.log(`Universal router: /api/ghl/* handles all endpoints automatically`);
  console.log('');
  console.log('🚀 API Categories:');
  const categories = [...new Set(GHL_API_ENDPOINTS.map(e => e.scope.split('.')[0]))];
  categories.forEach(cat => console.log(`   • ${cat.charAt(0).toUpperCase() + cat.slice(1)}`));
});

module.exports = app;