/**
 * Railway Deployment Fix - Simple Backend Without JWT for Immediate Deployment
 * This removes JWT requirements while keeping the location-centric architecture
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

// Initialize with existing installation data
const initializeTokenStorage = () => {
  const tokenBundle = {
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN,
    expiresAt: new Date('2025-06-18T05:26:13.635Z')
  };
  
  byLocationId.set('WAvk87RmW9rBSDJHeOpH', tokenBundle);
  byInstallId.set('install_1750131573635', tokenBundle);
};

initializeTokenStorage();

// Utility function to proxy responses from GoHighLevel
async function proxyResponse(ghlRes, expressRes) {
  const raw = await ghlRes.text();
  expressRes.status(ghlRes.status).type('json').send(raw);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tokenBundles: byLocationId.size,
    locationIds: Array.from(byLocationId.keys()),
    features: ['location-centric', 'multi-image-upload', 'no-jwt-simplified']
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
    const installations = Array.from(byInstallId.entries()).map(([id, token]) => ({
      id,
      hasToken: !!token.accessToken,
      expiresAt: token.expiresAt
    }));
    res.json(installations);
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
  console.log(`Railway GoHighLevel Backend v5.1.1 running on port ${port}`);
  console.log('Architecture: Simplified (no JWT) with location-centric routes');
  console.log('Features: Multi-image upload, Product creation, Legacy compatibility');
  console.log('');
  console.log('Endpoints:');
  console.log('- GET  /health - Health check');
  console.log('- POST /api/ghl/locations/:locationId/media - Multi-image upload');
  console.log('- POST /api/ghl/locations/:locationId/products - Product creation');
  console.log('- POST /api/ghl/media/upload - Legacy single image upload');
  console.log('- POST /api/ghl/products - Legacy product creation');
  console.log('- GET  /api/installations - Token management');
  console.log('');
  console.log(`Token bundles loaded: ${byLocationId.size}`);
  console.log(`Location IDs: ${Array.from(byLocationId.keys()).join(', ')}`);
});