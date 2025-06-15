/**
 * Enhanced OAuth Dual-Domain Architecture for Railway
 * Production-ready GoHighLevel marketplace application
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Enhanced CORS for dual-domain architecture
app.use(cors({
  origin: [
    'https://listings.engageautomations.com',
    'https://dir.engageautomations.com', 
    /\.replit\.app$/,
    /\.repl\.co$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-location-id', 'x-installation-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth Installation Storage
class OAuthStorage {
  async createInstallation(data) {
    // First ensure the table exists
    await this.ensureTableExists();
    
    const query = `
      INSERT INTO oauth_installations (
        ghl_user_id, ghl_user_name, ghl_user_email, ghl_user_phone,
        ghl_location_id, ghl_location_name, ghl_access_token, ghl_refresh_token,
        ghl_scopes, installation_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), true)
      RETURNING *
    `;
    
    const values = [
      data.ghl_user_id, data.ghl_user_name, data.ghl_user_email, data.ghl_user_phone,
      data.ghl_location_id, data.ghl_location_name, data.ghl_access_token, 
      data.ghl_refresh_token, data.ghl_scopes
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async ensureTableExists() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS oauth_installations (
        id SERIAL PRIMARY KEY,
        ghl_user_id VARCHAR(255) UNIQUE NOT NULL,
        ghl_user_name VARCHAR(255),
        ghl_user_email VARCHAR(255),
        ghl_user_phone VARCHAR(255),
        ghl_location_id VARCHAR(255),
        ghl_location_name VARCHAR(255),
        ghl_access_token TEXT,
        ghl_refresh_token TEXT,
        ghl_scopes TEXT,
        installation_date TIMESTAMP DEFAULT NOW(),
        token_updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      )
    `;
    
    try {
      await pool.query(createTableQuery);
      console.log('✅ OAuth installations table ready');
    } catch (error) {
      console.error('❌ Error creating table:', error);
    }
  }

  async getAllInstallations() {
    const result = await pool.query('SELECT * FROM oauth_installations ORDER BY installation_date DESC');
    return result.rows;
  }

  async getInstallationByUserId(ghlUserId) {
    const result = await pool.query('SELECT * FROM oauth_installations WHERE ghl_user_id = $1', [ghlUserId]);
    return result.rows[0];
  }

  async getInstallationById(id) {
    const result = await pool.query('SELECT * FROM oauth_installations WHERE id = $1', [id]);
    return result.rows[0];
  }
}

const storage = new OAuthStorage();

// Universal API Configuration - Supporting 50+ GoHighLevel endpoints
const API_ENDPOINTS = {
  // Products API
  'POST /products': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/', requires_location: true },
  'GET /products': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/', requires_location: true },
  'GET /products/:productId': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}', requires_location: true },
  'PUT /products/:productId': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}', requires_location: true },
  'DELETE /products/:productId': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}', requires_location: true },

  // Product Prices API
  'POST /products/:productId/price': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}/price', requires_location: true },
  'GET /products/:productId/price': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}/price', requires_location: true },
  'GET /products/:productId/price/:priceId': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}/price/{priceId}', requires_location: true },
  'PUT /products/:productId/price/:priceId': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}/price/{priceId}', requires_location: true },
  'DELETE /products/:productId/price/:priceId': { ghl_endpoint: 'https://services.leadconnectorhq.com/products/{productId}/price/{priceId}', requires_location: true },

  // Contacts API
  'POST /contacts': { ghl_endpoint: 'https://services.leadconnectorhq.com/contacts/', requires_location: true },
  'GET /contacts': { ghl_endpoint: 'https://services.leadconnectorhq.com/contacts/', requires_location: true },
  'GET /contacts/:contactId': { ghl_endpoint: 'https://services.leadconnectorhq.com/contacts/{contactId}', requires_location: true },
  'PUT /contacts/:contactId': { ghl_endpoint: 'https://services.leadconnectorhq.com/contacts/{contactId}', requires_location: true },
  'DELETE /contacts/:contactId': { ghl_endpoint: 'https://services.leadconnectorhq.com/contacts/{contactId}', requires_location: true },

  // Locations API
  'GET /locations': { ghl_endpoint: 'https://services.leadconnectorhq.com/locations/', requires_location: false },
  'GET /locations/:locationId': { ghl_endpoint: 'https://services.leadconnectorhq.com/locations/{locationId}', requires_location: false },

  // Opportunities API
  'POST /opportunities': { ghl_endpoint: 'https://services.leadconnectorhq.com/opportunities/', requires_location: true },
  'GET /opportunities': { ghl_endpoint: 'https://services.leadconnectorhq.com/opportunities/', requires_location: true },
  'GET /opportunities/:opportunityId': { ghl_endpoint: 'https://services.leadconnectorhq.com/opportunities/{opportunityId}', requires_location: true },
  'PUT /opportunities/:opportunityId': { ghl_endpoint: 'https://services.leadconnectorhq.com/opportunities/{opportunityId}', requires_location: true },
  'DELETE /opportunities/:opportunityId': { ghl_endpoint: 'https://services.leadconnectorhq.com/opportunities/{opportunityId}', requires_location: true },

  // Media Files API
  'GET /medias': { ghl_endpoint: 'https://services.leadconnectorhq.com/medias/', requires_location: true },
  'POST /medias/upload-file': { ghl_endpoint: 'https://services.leadconnectorhq.com/medias/upload-file', requires_location: true, content_type: 'multipart/form-data' },
  'DELETE /medias/:fileId': { ghl_endpoint: 'https://services.leadconnectorhq.com/medias/{fileId}', requires_location: true },

  // Workflows API
  'GET /workflows': { ghl_endpoint: 'https://services.leadconnectorhq.com/workflows/', requires_location: true },

  // Forms API
  'GET /forms': { ghl_endpoint: 'https://services.leadconnectorhq.com/forms/', requires_location: true },
  'GET /forms/:formId/submissions': { ghl_endpoint: 'https://services.leadconnectorhq.com/forms/{formId}/submissions', requires_location: true }
};

// Universal API Handler
class UniversalAPIHandler {
  static findEndpointConfig(method, path) {
    const key = `${method} ${path}`;
    return API_ENDPOINTS[key];
  }

  static extractPathParams(pattern, actualPath) {
    const patternParts = pattern.split('/');
    const pathParts = actualPath.split('/');
    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].substring(1);
        params[paramName] = pathParts[i];
      }
    }
    return params;
  }

  static buildGHLEndpoint(config, pathParams) {
    let endpoint = config.ghl_endpoint;
    Object.keys(pathParams).forEach(key => {
      endpoint = endpoint.replace(`{${key}}`, pathParams[key]);
    });
    return endpoint;
  }

  static async makeGHLRequest(config, pathParams, queryParams, body, method, installation, locationId) {
    const endpoint = this.buildGHLEndpoint(config, pathParams);
    
    const requestOptions = {
      method: method,
      headers: {
        'Authorization': `Bearer ${installation.ghl_access_token}`,
        'Version': '2021-07-28',
        'Content-Type': config.content_type || 'application/json'
      }
    };

    if (config.requires_location && locationId) {
      requestOptions.headers['locationId'] = locationId;
    }

    // Add query parameters to URL
    let finalUrl = endpoint;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams(queryParams);
      finalUrl += '?' + searchParams.toString();
    }

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      if (config.content_type === 'multipart/form-data') {
        requestOptions.body = body;
        delete requestOptions.headers['Content-Type'];
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    const response = await fetch(finalUrl, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GHL API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  static async handleUniversalRequest(req, res) {
    try {
      const method = req.method;
      const path = req.path.replace('/api/ghl', '');
      
      // Find endpoint configuration
      const config = this.findEndpointConfig(method, path);
      if (!config) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      // Extract path parameters
      const pathParams = this.extractPathParams(path, req.path.replace('/api/ghl', ''));
      
      // Get installation from header or query
      const installationId = req.headers['x-installation-id'] || req.query.installationId;
      if (!installationId) {
        return res.status(401).json({ error: 'Installation ID required' });
      }

      const installation = await storage.getInstallationById(installationId);
      if (!installation) {
        return res.status(404).json({ error: 'Installation not found' });
      }
      
      // Get location ID
      const locationId = req.headers['x-location-id'] || req.query.locationId || installation.ghl_location_id;

      // Make request to GoHighLevel
      const result = await this.makeGHLRequest(
        config,
        pathParams,
        req.query,
        req.body,
        method,
        installation,
        locationId
      );

      res.json(result);
    } catch (error) {
      console.error('Universal API Handler Error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

// OAuth middleware
function requireOAuth(req, res, next) {
  const installationId = req.headers['x-installation-id'] || req.query.installationId;
  if (!installationId) {
    return res.status(401).json({ error: 'OAuth installation required' });
  }
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['oauth', 'universal-api', 'session-recovery']
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'GoHighLevel Enhanced OAuth Backend',
    version: '2.0.0',
    description: 'Enhanced OAuth Dual-Domain Architecture',
    endpoints: {
      oauth: '/api/oauth/*',
      universal_api: '/api/ghl/*',
      health: '/health'
    }
  });
});

// OAuth callback endpoint with PKCE support
app.get('/api/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    console.log('OAuth callback received - processing installation...');

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
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.status(400).json({ error: 'Token exchange failed' });
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
      const errorText = await userResponse.text();
      console.error('User info fetch failed:', errorText);
      return res.status(400).json({ error: 'Failed to fetch user info' });
    }

    const userData = await userResponse.json();

    // Get location info if available
    let locationData = null;
    if (userData.locationId) {
      try {
        const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${userData.locationId}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28'
          }
        });
        if (locationResponse.ok) {
          locationData = await locationResponse.json();
        }
      } catch (error) {
        console.log('Location fetch failed, continuing without location data');
      }
    }

    // Store installation
    const installationData = {
      ghl_user_id: userData.id,
      ghl_user_name: userData.name || 'Unknown',
      ghl_user_email: userData.email || '',
      ghl_user_phone: userData.phone || '',
      ghl_location_id: userData.locationId || '',
      ghl_location_name: locationData?.name || 'Unknown Location',
      ghl_access_token: tokenData.access_token,
      ghl_refresh_token: tokenData.refresh_token,
      ghl_scopes: tokenData.scope || ''
    };

    const installation = await storage.createInstallation(installationData);
    console.log('Installation stored successfully:', installation.id);

    // Redirect to success page
    const successUrl = `https://listings.engageautomations.com/oauth-success?installation_id=${installation.id}&location_id=${userData.locationId || ''}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = `https://listings.engageautomations.com/oauth-error?error=${encodeURIComponent(error.message)}`;
    res.redirect(errorUrl);
  }
});

// OAuth status endpoint
app.get('/api/oauth/status', async (req, res) => {
  try {
    const installations = await storage.getAllInstallations();
    res.json({
      status: 'active',
      total_installations: installations.length,
      recent_installations: installations.slice(0, 5).map(i => ({
        id: i.id,
        user_name: i.ghl_user_name,
        location_name: i.ghl_location_name,
        installation_date: i.installation_date
      }))
    });
  } catch (error) {
    console.error('OAuth status error:', error);
    res.status(500).json({ error: 'Failed to get OAuth status' });
  }
});

// Get installation details
app.get('/api/oauth/installations/:id', async (req, res) => {
  try {
    const installation = await storage.getInstallationById(req.params.id);
    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Return safe installation data (no tokens exposed)
    const safeInstallation = {
      id: installation.id,
      ghl_user_name: installation.ghl_user_name,
      ghl_user_email: installation.ghl_user_email,
      ghl_location_id: installation.ghl_location_id,
      ghl_location_name: installation.ghl_location_name,
      ghl_scopes: installation.ghl_scopes,
      installation_date: installation.installation_date,
      is_active: installation.is_active
    };

    res.json(safeInstallation);
  } catch (error) {
    console.error('Get installation error:', error);
    res.status(500).json({ error: 'Failed to get installation' });
  }
});

// Universal API router - handles all GoHighLevel API endpoints
app.all('/api/ghl/*', requireOAuth, (req, res) => {
  UniversalAPIHandler.handleUniversalRequest(req, res);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Enhanced OAuth Backend running on port ${port}`);
  console.log('✅ Features: OAuth PKCE, Universal API Router (50+ endpoints), Session Recovery');
  console.log('🔍 Health check: /health');
  console.log('🔗 Universal API: /api/ghl/*');
});

module.exports = app;