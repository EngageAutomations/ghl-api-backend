/**
 * Railway GoHighLevel API Backend with Media Upload Support
 * Fixed version with proper file upload handling
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Basic middleware
app.use(cors());
app.use(express.json());

// In-memory storage for OAuth installations
const installations = new Map();

// Initialize with current installations
installations.set('install_1750131573635', {
  id: 'install_1750131573635',
  accessToken: process.env.GHL_ACCESS_TOKEN || null,
  locationId: 'WAvk87RmW9rBSDJHeOpH',
  scopes: 'products/prices.write products/prices.readonly products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write products/collection.write users.readonly',
  tokenStatus: process.env.GHL_ACCESS_TOKEN ? 'valid' : 'missing',
  createdAt: new Date().toISOString()
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend with Media Upload',
    version: '1.3.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    activeInstallations: installations.size,
    features: ['OAuth', 'Product Management', 'Media Upload']
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasToken: !!process.env.GHL_ACCESS_TOKEN,
    installations: installations.size,
    installationIds: Array.from(installations.keys()),
    mediaUploadEnabled: true
  });
});

// Media Upload Endpoint - The missing piece!
app.post('/api/ghl/media/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Media upload request received');
    
    const installationId = req.query.installationId;
    if (!installationId) {
      return res.status(400).json({ error: 'Installation ID required' });
    }

    const installation = installations.get(installationId);
    if (!installation || !installation.accessToken) {
      return res.status(401).json({ error: 'Invalid installation or missing access token' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📄 File details:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Create FormData for GoHighLevel API
    const formData = new FormData();
    const fs = require('fs');
    formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);

    // Upload to GoHighLevel Media API
    const response = await axios.post(
      `https://services.leadconnectorhq.com/medias/upload-file?locationId=${installation.locationId}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    console.log('✅ GoHighLevel upload successful:', response.data);

    res.json({
      success: true,
      fileUrl: response.data.url || response.data.fileUrl,
      fileId: response.data.id,
      fileName: response.data.name || req.file.originalname,
      data: response.data
    });

  } catch (error) {
    console.error('❌ Media upload error:', error.response?.data || error.message);
    
    // Clean up temp file on error
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Media upload failed',
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

// OAuth status
app.get('/api/oauth/status', (req, res) => {
  const installationId = req.query.installation_id;
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  res.json({
    status: 'authenticated',
    installation: {
      id: installation.id,
      locationId: installation.locationId,
      scopes: installation.scopes,
      tokenStatus: installation.tokenStatus,
      hasAccessToken: !!installation.accessToken
    }
  });
});

// Product creation endpoint
app.post('/api/ghl/products', async (req, res) => {
  const installationId = req.query.installationId;
  const installation = installations.get(installationId);
  
  if (!installation || !installation.accessToken) {
    return res.status(401).json({ error: 'Invalid installation or missing access token' });
  }

  try {
    const response = await axios.post(
      `https://services.leadconnectorhq.com/products?locationId=${installation.locationId}`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      product: response.data,
      locationId: installation.locationId
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create product',
      details: error.response?.data || error.message
    });
  }
});

// OAuth callback handler
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('Processing OAuth callback with code:', code);
    
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
    
    installations.set(installationId, {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      locationId: tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenData.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    const welcomeUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&welcome=true`;
    res.redirect(welcomeUrl);

  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth failed', message: error.message });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 GoHighLevel API Backend with Media Upload running on port ${port}`);
  console.log(`📁 Media upload endpoint: /api/ghl/media/upload`);
  console.log(`🔑 Has access token: ${!!process.env.GHL_ACCESS_TOKEN}`);
  console.log(`📊 Active installations: ${installations.size}`);
});