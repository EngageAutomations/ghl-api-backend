/**
 * Railway Complete OAuth Backend v5.2.0
 * Includes OAuth callback handling + multi-image upload functionality
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['https://listings.engageautomations.com', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for multi-file uploads (up to 10 images, 25MB each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Token storage maps (location-centric)
const byLocationId = new Map();
const byInstallId = new Map();
const installations = new Map();

// Initialize with existing installation data
const initializeTokenStorage = () => {
  const tokenBundle = {
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN,
    expiresAt: new Date('2025-06-18T05:26:13.635Z')
  };
  
  byLocationId.set('WAvk87RmW9rBSDJHeOpH', tokenBundle);
  byInstallId.set('install_1750131573635', tokenBundle);
  
  // Store installation data
  installations.set('install_1750131573635', {
    id: 'install_1750131573635',
    locationId: 'WAvk87RmW9rBSDJHeOpH',
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN,
    expiresAt: new Date('2025-06-18T05:26:13.635Z'),
    createdAt: new Date()
  });
};

initializeTokenStorage();

// Utility function to proxy responses from GoHighLevel
async function proxyResponse(ghlRes, expressRes) {
  const raw = await ghlRes.text();
  expressRes.status(ghlRes.status).type('json').send(raw);
}

// OAuth token exchange function
async function exchangeCodeForToken(code) {
  try {
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
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
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    return await tokenResponse.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}

// Get user info from GoHighLevel
async function getUserInfo(accessToken) {
  try {
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/search', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`User info failed: ${userResponse.status} ${errorText}`);
    }

    const userData = await userResponse.json();
    return userData.users && userData.users[0] ? userData.users[0] : userData;
  } catch (error) {
    console.error('User info error:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tokenBundles: byLocationId.size,
    locationIds: Array.from(byLocationId.keys()),
    installations: installations.size,
    features: ['oauth-callback', 'location-centric', 'multi-image-upload', 'no-jwt-simplified']
  });
});

// OAuth callback endpoint
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK REQUEST ===');
  console.log('Query params:', req.query);
  
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('OAuth error:', error, error_description);
    return res.status(400).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #e74c3c;">OAuth Error</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${error_description || 'Unknown error'}</p>
          <a href="https://listings.engageautomations.com" style="color: #3498db;">Return to Application</a>
        </body>
      </html>
    `);
  }

  if (!code) {
    console.error('No authorization code received');
    return res.status(400).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #e74c3c;">OAuth Error</h1>
          <p>No authorization code received</p>
          <a href="https://listings.engageautomations.com" style="color: #3498db;">Return to Application</a>
        </body>
      </html>
    `);
  }

  try {
    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokenData = await exchangeCodeForToken(code);
    console.log('Token exchange successful:', Object.keys(tokenData));

    // Get user info
    console.log('Getting user info...');
    const userInfo = await getUserInfo(tokenData.access_token);
    console.log('User info retrieved:', userInfo.id || userInfo.email);

    // Create installation ID
    const installationId = `install_${Date.now()}`;
    
    // Store installation data
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      locationId: userInfo.locationId || userInfo.location?.id,
      userId: userInfo.id,
      userEmail: userInfo.email,
      createdAt: new Date()
    };

    installations.set(installationId, installation);
    
    // Update location-centric storage
    if (installation.locationId) {
      byLocationId.set(installation.locationId, {
        accessToken: installation.accessToken,
        refreshToken: installation.refreshToken,
        expiresAt: installation.expiresAt
      });
    }
    
    byInstallId.set(installationId, {
      accessToken: installation.accessToken,
      refreshToken: installation.refreshToken,
      expiresAt: installation.expiresAt
    });

    console.log('Installation created:', installationId);
    console.log('Location ID:', installation.locationId);

    // Success page
    res.send(`
      <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #27ae60; font-size: 24px; margin-bottom: 20px; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: left; }
            .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✅ OAuth Integration Successful!</h1>
            <p>Your GoHighLevel account has been successfully connected to the marketplace application.</p>
            
            <div class="details">
              <h3>Installation Details:</h3>
              <p><strong>Installation ID:</strong> ${installationId}</p>
              <p><strong>Location ID:</strong> ${installation.locationId || 'Not available'}</p>
              <p><strong>User:</strong> ${installation.userEmail || installation.userId}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Features:</strong> Product Creation, Media Upload, API Access</p>
            </div>
            
            <p>You can now:</p>
            <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
              <li>Create and manage products</li>
              <li>Upload images and media files</li>
              <li>Access GoHighLevel APIs</li>
              <li>Use the marketplace features</li>
            </ul>
            
            <div style="margin-top: 30px;">
              <a href="https://listings.engageautomations.com" class="button">Continue to Application</a>
              <a href="https://listings.engageautomations.com/api-management" class="button">Manage APIs</a>
            </div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #e74c3c;">OAuth Processing Error</h1>
          <p>There was an error processing your OAuth request:</p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 4px;"><code>${error.message}</code></p>
          <a href="https://listings.engageautomations.com" style="color: #3498db;">Return to Application</a>
        </body>
      </html>
    `);
  }
});

// OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  const installationId = req.query.installation_id;
  
  if (!installationId) {
    return res.status(400).json({ error: 'Installation ID required' });
  }

  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  res.json({
    status: 'connected',
    installationId: installation.id,
    locationId: installation.locationId,
    userEmail: installation.userEmail,
    expiresAt: installation.expiresAt,
    hasValidToken: installation.expiresAt > new Date()
  });
});

// Location-centric product creation endpoint (NO JWT REQUIRED)
app.post('/api/ghl/locations/:locationId/products', async (req, res) => {
  console.log('=== PRODUCT CREATION REQUEST ===');
  
  const { locationId } = req.params;
  const inst = byLocationId.get(locationId);
  
  if (!inst) {
    return res.status(404).json({ error: 'Unknown locationId' });
  }

  try {
    const product = req.body;
    
    console.log('Creating product for location:', locationId, product);

    const ghlResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${inst.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId: locationId,
        ...product
      })
    });

    return proxyResponse(ghlResponse, res);

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      error: 'Product creation failed',
      message: error.message
    });
  }
});

// Multi-image upload endpoint (NO JWT REQUIRED)
app.post('/api/ghl/locations/:locationId/media', upload.array('file', 10), async (req, res) => {
  console.log('=== MULTI-IMAGE UPLOAD REQUEST ===');
  
  const { locationId } = req.params;
  const inst = byLocationId.get(locationId);
  
  if (!inst) {
    return res.status(404).json({ error: 'Unknown locationId' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files received' });
  }

  const results = [];

  try {
    for (const f of req.files) {
      console.log('Uploading file:', f.originalname, f.mimetype, f.size);
      
      const form = new FormData();
      form.append('file', f.buffer, { 
        filename: f.originalname, 
        contentType: f.mimetype 
      });

      const ghlResponse = await fetch(`https://services.leadconnectorhq.com/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${inst.accessToken}`,
          'Version': '2021-07-28',
          ...form.getHeaders()
        },
        body: form
      });

      if (!ghlResponse.ok) {
        const msg = await ghlResponse.text();
        console.error('Upload failed for file:', f.originalname, ghlResponse.status, msg);
        return res.status(ghlResponse.status).json({ 
          error: 'Upload failed', 
          details: msg,
          file: f.originalname
        });
      }
      
      const result = await ghlResponse.json();
      console.log('Upload successful:', f.originalname, result);
      results.push(result);
    }

    res.json({ success: true, uploaded: results });

  } catch (error) {
    console.error('Multi-image upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Legacy endpoints for backward compatibility
app.post('/api/ghl/media/upload', upload.single('file'), async (req, res) => {
  console.log('=== LEGACY SINGLE IMAGE UPLOAD ===');
  
  const locationId = 'WAvk87RmW9rBSDJHeOpH'; // Default location
  const inst = byLocationId.get(locationId);
  
  if (!inst) {
    return res.status(500).json({ error: 'No installation found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log('Uploading file:', req.file.originalname, req.file.mimetype, req.file.size);
    
    const form = new FormData();
    form.append('file', req.file.buffer, { 
      filename: req.file.originalname, 
      contentType: req.file.mimetype 
    });

    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/medias/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${inst.accessToken}`,
        'Version': '2021-07-28',
        ...form.getHeaders()
      },
      body: form
    });

    if (!ghlResponse.ok) {
      const msg = await ghlResponse.text();
      console.error('Upload failed:', ghlResponse.status, msg);
      return res.status(ghlResponse.status).json({ 
        error: 'Upload failed', 
        details: msg
      });
    }
    
    const result = await ghlResponse.json();
    console.log('Upload successful:', result);

    res.json({
      success: true,
      fileUrl: result.url || result.fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Legacy product creation
app.post('/api/ghl/products', async (req, res) => {
  console.log('=== LEGACY PRODUCT CREATION ===');
  
  const locationId = 'WAvk87RmW9rBSDJHeOpH'; // Default location
  const inst = byLocationId.get(locationId);
  
  if (!inst) {
    return res.status(500).json({ error: 'No installation found' });
  }

  try {
    const product = req.body;
    
    console.log('Creating product:', product);

    const ghlResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${inst.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId: locationId,
        ...product
      })
    });

    return proxyResponse(ghlResponse, res);

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      error: 'Product creation failed',
      message: error.message
    });
  }
});

// Installation endpoints
app.get('/api/installations', (req, res) => {
  try {
    const installationList = Array.from(installations.values()).map(inst => ({
      id: inst.id,
      locationId: inst.locationId,
      userEmail: inst.userEmail,
      hasToken: !!inst.accessToken,
      expiresAt: inst.expiresAt,
      createdAt: inst.createdAt
    }));
    res.json(installationList);
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 25MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Railway GoHighLevel Backend v5.2.0 running on port ${port}`);
  console.log('Architecture: Complete OAuth + Multi-image upload (no JWT)');
  console.log('Features: OAuth callback, Multi-image upload, Product creation, Legacy compatibility');
  console.log('');
  console.log('Endpoints:');
  console.log('- GET  /health - Health check');
  console.log('- GET  /api/oauth/callback - OAuth callback handler');
  console.log('- GET  /api/oauth/status - OAuth status check');
  console.log('- POST /api/ghl/locations/:locationId/media - Multi-image upload');
  console.log('- POST /api/ghl/locations/:locationId/products - Product creation');
  console.log('- POST /api/ghl/media/upload - Legacy single image upload');
  console.log('- POST /api/ghl/products - Legacy product creation');
  console.log('- GET  /api/installations - Installation management');
  console.log('');
  console.log(`Token bundles loaded: ${byLocationId.size}`);
  console.log(`Location IDs: ${Array.from(byLocationId.keys()).join(', ')}`);
  console.log(`Installations: ${installations.size}`);
});