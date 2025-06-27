const express = require('express');
const cors = require('cors');

// Import API route modules
const productRoutes = require('./routes/products');
const mediaRoutes = require('./routes/media');
const pricingRoutes = require('./routes/pricing');
const contactsRoutes = require('./routes/contacts');
const workflowsRoutes = require('./routes/workflows');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend',
    version: '1.0.0',
    status: 'operational',
    apis: ['products', 'media', 'pricing', 'contacts', 'workflows'],
    oauth_backend: 'https://dir.engageautomations.com',
    description: 'API-only backend - OAuth handled separately'
  });
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/workflows', workflowsRoutes);


// Debug endpoint - add this to index.js before app.listen()
app.get('/debug/env', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      OAUTH_BACKEND_URL: process.env.OAUTH_BACKEND_URL || 'not set'
    },
    railway: {
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not set',
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'not set',
      RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID || 'not set'
    },
    process: {
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd()
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('OAUTH') || key.includes('RAILWAY') || key.includes('PORT')
    )
  });
});

app.get('/debug/test-oauth', async (req, res) => {
  try {
    const oauthUrl = process.env.OAUTH_BACKEND_URL || 'https://dir.engageautomations.com';
    console.log('Testing OAuth backend connection to:', oauthUrl);
    
    const axios = require('axios');
    const response = await axios.get(`${oauthUrl}/installations`, { timeout: 10000 });
    
    res.json({
      success: true,
      oauthBackendUrl: oauthUrl,
      oauthResponse: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      oauthBackendUrl: process.env.OAUTH_BACKEND_URL || 'not set',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API backend running on port ${port}`);
  console.log(`Custom domain: https://api.engageautomations.com`);
  console.log(`OAuth backend: https://dir.engageautomations.com`);
  console.log('Separate Railway architecture operational');
});