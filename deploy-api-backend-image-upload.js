/**
 * Deploy Image Upload to API Backend (Railway)
 * Adds image upload functionality to the separate API backend
 */

import { Octokit } from '@octokit/rest';

async function deployAPIBackendImageUpload() {
  console.log('=== Deploying Image Upload to API Backend ===');
  
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN environment variable not found');
      return;
    }
    
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    const owner = 'EngageAutomations';
    const repo = 'ghl-api-backend';
    const branch = 'main';
    
    console.log('1. Fetching current API backend content...');
    
    // Get current API backend files
    const { data: files } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ''
    });
    
    console.log('✅ API backend repository found');
    console.log('   Files:', files.map(f => f.name).join(', '));
    
    // Get current index.js or server.js
    let mainFile = 'index.js';
    let currentFileData;
    
    try {
      currentFileData = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'index.js'
      });
    } catch (error) {
      try {
        mainFile = 'server.js';
        currentFileData = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: 'server.js'
        });
      } catch (error2) {
        console.log('No existing main file found, creating new index.js');
      }
    }
    
    console.log('2. Creating enhanced API backend with image upload...');
    
    // Enhanced API backend with image upload functionality
    const enhancedAPIBackend = `/**
 * GoHighLevel API Backend with Image Upload
 * Handles all GoHighLevel API operations including media upload
 */

const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// OAuth Backend URL
const OAUTH_BACKEND_URL = process.env.OAUTH_BACKEND_URL || 'https://dir.engageautomations.com';

// Get OAuth token from OAuth backend
async function getOAuthToken(installation_id) {
  try {
    const response = await axios.post(\`\${OAUTH_BACKEND_URL}/api/token-access\`, {
      installation_id: installation_id
    });
    
    if (response.data.success) {
      return {
        accessToken: response.data.accessToken,
        installation: response.data.installation
      };
    } else {
      throw new Error(response.data.error || 'Token access failed');
    }
  } catch (error) {
    console.error('OAuth token access error:', error.response?.data || error.message);
    throw error;
  }
}

// Image Upload API
app.post('/api/images/upload', upload.single('file'), async (req, res) => {
  console.log('=== Image Upload Request ===');
  
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Get OAuth token from OAuth backend
    const { accessToken, installation } = await getOAuthToken(installation_id);
    console.log(\`Using installation \${installation_id} with location \${installation.locationId}\`);
    
    // Create form data for GoHighLevel API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    console.log('🚀 Uploading to GoHighLevel media library...');
    
    // Upload to GoHighLevel using correct endpoint
    const uploadResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Image uploaded to GoHighLevel successfully!');
    
    res.json({
      success: true,
      media: uploadResponse.data,
      installation: {
        id: installation_id,
        locationId: installation.locationId,
        tokenStatus: installation.tokenStatus
      },
      message: 'Image uploaded to GoHighLevel media library successfully'
    });
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'GoHighLevel API error',
        details: error.response.data,
        ghl_status: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Image upload failed'
      });
    }
  }
});

// List Media Files API
app.get('/api/images/list', async (req, res) => {
  try {
    const { installation_id, limit = 20, offset = 0 } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    // Get OAuth token from OAuth backend
    const { accessToken, installation } = await getOAuthToken(installation_id);
    
    // Get media files from GoHighLevel
    const mediaResponse = await axios.get('https://services.leadconnectorhq.com/medias/', {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Version': '2021-07-28'
      },
      params: { limit, offset }
    });
    
    res.json({
      success: true,
      media: mediaResponse.data.medias || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: mediaResponse.data.total || 0
      },
      installation: {
        id: installation_id,
        locationId: installation.locationId,
        tokenStatus: installation.tokenStatus
      }
    });
    
  } catch (error) {
    console.error('Media list error:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'GoHighLevel API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list media files'
      });
    }
  }
});

// Product Creation API
app.post('/api/products/create', async (req, res) => {
  try {
    const { installation_id, ...productData } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    // Get OAuth token from OAuth backend
    const { accessToken, installation } = await getOAuthToken(installation_id);
    
    // Create product in GoHighLevel
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', {
      locationId: installation.locationId,
      ...productData
    }, {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      product: productResponse.data,
      installation: {
        id: installation_id,
        locationId: installation.locationId
      }
    });
    
  } catch (error) {
    console.error('Product creation error:', error);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'GoHighLevel API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Product creation failed'
      });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GoHighLevel API Backend',
    features: ['image-upload', 'media-listing', 'product-creation'],
    oauth_backend: OAUTH_BACKEND_URL,
    timestamp: Date.now()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend',
    version: '1.0.0-image-upload',
    endpoints: [
      'POST /api/images/upload',
      'GET /api/images/list', 
      'POST /api/products/create',
      'GET /health'
    ],
    oauth_backend: OAUTH_BACKEND_URL,
    status: 'operational'
  });
});

app.listen(port, () => {
  console.log(\`GoHighLevel API Backend running on port \${port}\`);
  console.log('Features: Image Upload, Media Listing, Product Creation');
  console.log('OAuth Backend:', OAUTH_BACKEND_URL);
});`;

    console.log('3. Updating package.json with required dependencies...');
    
    // Enhanced package.json for API backend
    const packageJson = {
      "name": "ghl-api-backend",
      "version": "1.0.0",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "multer": "^1.4.5-lts.1",
        "form-data": "^4.0.0",
        "axios": "^1.6.0",
        "cors": "^2.8.5"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    // Update or create package.json
    let packageSha;
    try {
      const { data: currentPackage } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'package.json'
      });
      packageSha = currentPackage.sha;
    } catch (error) {
      console.log('Creating new package.json');
    }
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'package.json',
      message: 'Add dependencies for image upload functionality',
      content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
      sha: packageSha,
      branch
    });
    
    console.log('4. Deploying enhanced API backend...');
    
    // Deploy the main file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: mainFile,
      message: 'Deploy image upload functionality to API backend',
      content: Buffer.from(enhancedAPIBackend).toString('base64'),
      sha: currentFileData?.sha,
      branch
    });
    
    console.log('✅ API Backend with image upload deployed successfully!');
    console.log('');
    console.log('🚀 Deployment Summary:');
    console.log('   Repository: https://github.com/EngageAutomations/ghl-api-backend');
    console.log('   Features: Image Upload, Media Listing, Product Creation');
    console.log('   Endpoints:');
    console.log('   - POST /api/images/upload');
    console.log('   - GET /api/images/list');
    console.log('   - POST /api/products/create');
    console.log('   - GET /health');
    console.log('');
    console.log('⏱️ Railway deployment will begin automatically...');
    console.log('🔗 API Backend URL: https://api.engageautomations.com/');
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

deployAPIBackendImageUpload();