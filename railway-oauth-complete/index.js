/**
 * Production OAuth Backend - Railway Deployment
 * Optimized for Railway with proper API routing
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enhanced CORS for OAuth and embedded access
const corsOptions = {
  origin: [
    'https://app.gohighlevel.com',
    'https://dir.engageautomations.com',
    'https://listings.engageautomations.com',
    /\.replit\.app$/,
    /\.railway\.app$/,
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Version'
  ]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('🔧 Configuring OAuth routes...');

// In-memory storage for OAuth installations
const installations = new Map();
let installationCounter = 1;

// OAuth Auth Endpoint - Frontend compatibility
app.get('/api/oauth/auth', async (req, res) => {
  console.log('OAuth Auth endpoint hit:', req.query);
  
  const installationId = req.query.installation_id;
  
  if (!installationId) {
    return res.status(400).json({
      success: false,
      error: 'missing_installation_id',
      message: 'Installation ID is required'
    });
  }
  
  // Check if installation exists
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'installation_not_found',
      message: 'Installation not found',
      installation_id: installationId
    });
  }
  
  // Return installation data
  res.json({
    success: true,
    user: {
      id: installation.userId,
      name: installation.userInfo.name,
      email: installation.userInfo.email,
      locationId: installation.locationId,
      locationName: installation.locationName
    },
    installation: {
      id: installationId,
      scopes: installation.scopes,
      created_at: installation.createdAt
    }
  });
});

// OAuth Status Endpoint - CRITICAL for production
app.get('/api/oauth/status', async (req, res) => {
  console.log('OAuth Status endpoint hit:', req.query);
  
  const installationId = req.query.installation_id;
  
  if (!installationId) {
    return res.status(400).json({
      success: false,
      error: 'missing_installation_id',
      message: 'Installation ID is required'
    });
  }
  
  // Check if installation exists
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'installation_not_found',
      message: 'Installation not found',
      installation_id: installationId
    });
  }
  
  // Return installation data
  res.json({
    success: true,
    user: {
      id: installation.userId,
      name: installation.userInfo.name,
      email: installation.userInfo.email,
      locationId: installation.locationId,
      locationName: installation.locationName
    },
    installation: {
      id: installationId,
      scopes: installation.scopes,
      created_at: installation.createdAt
    }
  });
});

// OAuth Callback Handler
app.get('/oauth/callback', async (req, res) => {
  console.log('OAuth callback received:', req.query);
  
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({
      error: 'Authorization code missing'
    });
  }
  
  try {
    // Simulate token exchange (replace with real implementation)
    const installationId = `install_${installationCounter++}`;
    
    // Store installation data
    installations.set(installationId, {
      installationId,
      userId: `user_${Date.now()}`,
      locationId: 'WAVk87RmW9rBSDJHeOpH',
      locationName: 'Test Location',
      userInfo: {
        name: 'Test User',
        email: 'test@example.com'
      },
      scopes: 'users.read products/prices.write',
      createdAt: new Date().toISOString()
    });
    
    console.log(`Installation created: ${installationId}`);
    
    // Redirect to success page with installation ID
    const redirectUrl = `https://dir.engageautomations.com/?installation_id=${installationId}&oauth_success=true`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'OAuth callback failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'oauth-backend',
    version: '1.0.0'
  });
});

// Installation management endpoints
app.get('/api/installations', (req, res) => {
  const installationList = Array.from(installations.values());
  res.json({
    installations: installationList,
    count: installationList.length
  });
});

app.get('/api/installations/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  
  if (!installation) {
    return res.status(404).json({
      error: 'Installation not found'
    });
  }
  
  res.json(installation);
});

// API route protection - return JSON for all API requests
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Root handler for OAuth app
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend',
    status: 'running',
    endpoints: [
      '/oauth/callback',
      '/api/oauth/status',
      '/api/health',
      '/api/installations'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 OAuth Backend Running');
  console.log('='.repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Host: 0.0.0.0`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('OAuth endpoints active:');
  console.log('  - GET /oauth/callback');
  console.log('  - GET /api/oauth/status');
  console.log('  - GET /api/health');
  console.log('='.repeat(50));
});

module.exports = app;
