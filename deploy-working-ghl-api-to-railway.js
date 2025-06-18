/**
 * Deploy Working GoHighLevel API Implementation to Railway
 * Implements actual product creation endpoints using stored access tokens
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function createWorkingGHLBackend() {
  return `/**
 * Railway GoHighLevel API Backend v3.0.0
 * Working implementation with real product creation endpoints
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://listings.engageautomations.com',
    'https://dir.engageautomations.com',
    /\\.replit\\.app$/,
    /\\.replit\\.co$/,
    /\\.replit\\.dev$/,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage for OAuth installations
const installations = new Map();

// Helper function to get OAuth credentials
function getOAuthCredentials(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return {
      clientId: authHeader.split(' ')[1],
      clientSecret: req.headers['x-client-secret'],
      type: 'header'
    };
  }

  return {
    clientId: process.env.GHL_CLIENT_ID,
    clientSecret: process.env.GHL_CLIENT_SECRET,
    type: 'environment'
  };
}

// GoHighLevel API Service
class GoHighLevelAPI {
  constructor(accessToken, locationId) {
    this.accessToken = accessToken;
    this.locationId = locationId;
    this.baseURL = 'https://services.leadconnectorhq.com';
  }

  async makeRequest(endpoint, options = {}) {
    const url = \`\${this.baseURL}\${endpoint}\`;
    const headers = {
      'Authorization': \`Bearer \${this.accessToken}\`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const responseText = await response.text();
    
    try {
      const data = response.ok ? JSON.parse(responseText) : { error: responseText };
      return { success: response.ok, status: response.status, data };
    } catch (e) {
      return { success: false, status: response.status, data: { error: responseText } };
    }
  }

  async createProduct(productData) {
    return await this.makeRequest('/products/', {
      method: 'POST',
      body: JSON.stringify({
        name: productData.name,
        description: productData.description,
        locationId: this.locationId,
        ...productData
      })
    });
  }

  async getProducts(limit = 20, offset = 0) {
    return await this.makeRequest(\`/products/?locationId=\${this.locationId}&limit=\${limit}&offset=\${offset}\`);
  }

  async testConnection() {
    return await this.makeRequest(\`/locations/\${this.locationId}\`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'GoHighLevel OAuth Backend',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    features: ['oauth', 'api_proxy', 'product_creation']
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'GoHighLevel API Backend',
    version: '3.0.0',
    endpoints: ['products', 'test-connection', 'installations']
  });
});

// OAuth callback handler
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const credentials = getOAuthCredentials(req);
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(\`Token exchange failed: \${JSON.stringify(tokenData)}\`);
    }

    // Extract location information from token
    const locationId = this.extractLocationFromToken(tokenData);
    
    // Create installation record
    const installationId = \`install_\${Date.now()}\`;
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      locationId: locationId,
      scopes: tokenData.scope || '',
      createdAt: new Date().toISOString(),
      tokenStatus: 'valid',
      flow: 'simplified'
    };

    installations.set(installationId, installation);

    // Simplified success response - no user info retrieval needed
    res.json({
      success: true,
      message: 'OAuth installation completed successfully',
      installationId: installationId,
      locationId: locationId,
      redirectUrl: \`https://listings.engageautomations.com/?installation_id=\${installationId}\`
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'oauth_failed',
      message: error.message,
      details: 'OAuth token exchange failed'
    });
  }
});

// OAuth POST callback (for form submissions)
app.post('/oauth/callback', (req, res) => {
  res.redirect(\`/oauth/callback?\${new URLSearchParams(req.body).toString()}\`);
});

// OAuth status endpoint
app.get('/api/oauth/status', async (req, res) => {
  try {
    const installationId = req.query.installation_id || req.cookies?.installation_id;
    
    if (!installationId) {
      return res.json({ authenticated: false, message: 'No installation found' });
    }

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

  } catch (error) {
    console.error('OAuth status error:', error);
    res.status(500).json({ error: 'status_check_failed', message: error.message });
  }
});

// Get all installations
app.get('/api/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(installation => ({
    id: installation.id,
    locationId: installation.locationId,
    scopes: installation.scopes,
    createdAt: installation.createdAt,
    tokenStatus: installation.tokenStatus,
    flow: installation.flow
  }));

  res.json({
    success: true,
    count: installationList.length,
    installations: installationList
  });
});

// Test GoHighLevel connection
app.get('/api/ghl/test-connection', async (req, res) => {
  try {
    const { installationId } = req.query;
    
    if (!installationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Installation ID required' 
      });
    }

    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Installation not found' 
      });
    }

    const ghlAPI = new GoHighLevelAPI(installation.accessToken, installation.locationId);
    const result = await ghlAPI.testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: 'GoHighLevel connection successful',
        locationId: installation.locationId,
        scopes: installation.scopes,
        locationData: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'GoHighLevel connection failed',
        details: result.data
      });
    }

  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      message: error.message
    });
  }
});

// Create product in GoHighLevel
app.post('/api/ghl/products/create', async (req, res) => {
  try {
    const { name, description, price, installationId } = req.body;
    
    if (!installationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Installation ID required' 
      });
    }

    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Installation not found' 
      });
    }

    const ghlAPI = new GoHighLevelAPI(installation.accessToken, installation.locationId);
    const result = await ghlAPI.createProduct({
      name,
      description,
      price
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Product created successfully in GoHighLevel',
        product: result.data.product,
        productId: result.data.product?.id
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Product creation failed',
        details: result.data
      });
    }

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Product creation failed',
      message: error.message
    });
  }
});

// Get products from GoHighLevel
app.get('/api/ghl/products', async (req, res) => {
  try {
    const { installationId, limit = 20, offset = 0 } = req.query;
    
    if (!installationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Installation ID required' 
      });
    }

    const installation = installations.get(installationId);
    
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Installation not found' 
      });
    }

    const ghlAPI = new GoHighLevelAPI(installation.accessToken, installation.locationId);
    const result = await ghlAPI.getProducts(parseInt(limit), parseInt(offset));

    if (result.success) {
      res.json({
        success: true,
        products: result.data.products || [],
        total: result.data.total || 0
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch products',
        details: result.data
      });
    }

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// Extract location ID from token data
function extractLocationFromToken(tokenData) {
  try {
    if (tokenData.locationId) {
      return tokenData.locationId;
    }
    
    // Try to decode JWT to extract location ID
    if (tokenData.access_token) {
      const payload = tokenData.access_token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      return decoded.authClassId || decoded.locationId || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting location from token:', error);
    return null;
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  const availableEndpoints = [
    'GET /health',
    'GET /api/health',
    'GET /oauth/callback',
    'POST /oauth/callback',
    'GET /api/oauth/status',
    'GET /api/installations',
    'GET /api/ghl/test-connection',
    'POST /api/ghl/products/create',
    'GET /api/ghl/products'
  ];

  res.status(404).json({
    error: 'endpoint_not_found',
    message: 'Endpoint not found',
    available_endpoints: availableEndpoints
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(\`🚀 GoHighLevel OAuth Backend v3.0.0 running on port \${port}\`);
  console.log(\`✅ Health check: http://localhost:\${port}/health\`);
  console.log(\`📡 API endpoints: /api/ghl/*\`);
  console.log(\`🔐 OAuth callback: /oauth/callback\`);
});`;
}

function createPackageJson() {
  return JSON.stringify({
    "name": "railway-ghl-api-backend",
    "version": "3.0.0",
    "description": "GoHighLevel OAuth and API Backend with Working Product Creation",
    "main": "index.js",
    "scripts": {
      "start": "node index.js",
      "dev": "node index.js"
    },
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "node-fetch": "^2.6.7"
    },
    "engines": {
      "node": ">=16.0.0"
    }
  }, null, 2);
}

async function createDeploymentPackage() {
  try {
    log('Creating Railway deployment package with working GoHighLevel API...', colors.blue);
    
    // Create deployment directory
    const deployDir = './railway-ghl-api-working';
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }

    // Write backend code
    const backendCode = createWorkingGHLBackend();
    fs.writeFileSync(path.join(deployDir, 'index.js'), backendCode);
    log('✅ Backend code written', colors.green);

    // Write package.json
    const packageJson = createPackageJson();
    fs.writeFileSync(path.join(deployDir, 'package.json'), packageJson);
    log('✅ Package.json written', colors.green);

    // Create .env template
    const envTemplate = `# GoHighLevel OAuth Configuration
GHL_CLIENT_ID=your_client_id_here
GHL_CLIENT_SECRET=your_client_secret_here
GHL_REDIRECT_URI=https://dir.engageautomations.com/oauth/callback
PORT=3000`;
    
    fs.writeFileSync(path.join(deployDir, '.env.example'), envTemplate);
    log('✅ Environment template written', colors.green);

    // Create README
    const readme = `# GoHighLevel API Backend v3.0.0

Working implementation with real product creation endpoints.

## Features
- OAuth 2.0 integration with GoHighLevel
- Real product creation API
- Connection testing
- Installation management

## Endpoints
- \`POST /api/ghl/products/create\` - Create products
- \`GET /api/ghl/test-connection\` - Test API connection
- \`GET /api/ghl/products\` - List products
- \`GET /api/installations\` - List OAuth installations

## Deployment
1. Upload files to Railway
2. Set environment variables (GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_REDIRECT_URI)
3. Deploy and test endpoints

## Testing
\`\`\`bash
curl -X POST "https://your-domain.railway.app/api/ghl/products/create" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test Product", "description": "Test", "installationId": "install_123"}'
\`\`\`
`;
    
    fs.writeFileSync(path.join(deployDir, 'README.md'), readme);
    log('✅ README written', colors.green);

    log('\n🎉 Deployment package created successfully!', colors.bright);
    log(`📁 Location: ${deployDir}`, colors.cyan);
    log('📋 Files created:', colors.yellow);
    log('  • index.js (Backend with working API)', colors.cyan);
    log('  • package.json (Dependencies)', colors.cyan);
    log('  • .env.example (Environment template)', colors.cyan);
    log('  • README.md (Documentation)', colors.cyan);

    return deployDir;

  } catch (error) {
    log(\`❌ Error creating deployment package: \${error.message}\`, colors.red);
    throw error;
  }
}

async function main() {
  try {
    log('🚀 Deploying Working GoHighLevel API to Railway', colors.bright);
    log('=' * 60, colors.blue);
    
    const deployDir = await createDeploymentPackage();
    
    log('\\n🎯 Next Steps:', colors.bright);
    log('1. Upload the deployment package to Railway', colors.cyan);
    log('2. Set environment variables in Railway dashboard', colors.cyan);
    log('3. Deploy and test the working API endpoints', colors.cyan);
    log('4. Test product creation with real GoHighLevel installation', colors.cyan);
    
    log('\\n✨ The backend now includes:', colors.green);
    log('  • Working product creation endpoint', colors.cyan);
    log('  • Real GoHighLevel API integration', colors.cyan);
    log('  • Connection testing functionality', colors.cyan);
    log('  • Installation management', colors.cyan);
    
  } catch (error) {
    log(\`\\n❌ Deployment failed: \${error.message}\`, colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, createWorkingGHLBackend, createDeploymentPackage };