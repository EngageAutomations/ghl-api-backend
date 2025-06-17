/**
 * Railway GoHighLevel Backend v5.1.0
 * JWT-gated proxy backend with location-centric routes and multi-image upload
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;
const SECRET = process.env.INTERNAL_JWT_SECRET || 'fallback-dev-secret-change-in-production';

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

// Rate limiting for DoS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

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
const byLocationId = new Map();  // locationId -> { accessToken, refreshToken, expiresAt }
const byInstallId = new Map();   // installationId -> { accessToken, refreshToken, expiresAt }

// Initialize with existing installation data
const initializeTokenStorage = () => {
  const tokenBundle = {
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN,
    expiresAt: new Date('2025-06-18T05:26:13.635Z') // Update as needed
  };
  
  byLocationId.set('WAvk87RmW9rBSDJHeOpH', tokenBundle);
  byInstallId.set('install_1750131573635', tokenBundle);
};

initializeTokenStorage();

// JWT Authentication middleware
function requireSignedJwt(req, res, next) {
  try {
    const tok = (req.headers.authorization || '').split(' ')[1];
    jwt.verify(tok, SECRET);
    next();
  } catch (_) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Utility function to proxy responses from GoHighLevel
async function proxyResponse(ghlRes, expressRes) {
  const raw = await ghlRes.text();
  expressRes.status(ghlRes.status).type('json').send(raw);
}

// Apply rate limiting and JWT gatekeeper after CORS
app.use(limiter);
app.use('/api/ghl', requireSignedJwt);

// Health check endpoint (no JWT required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tokenBundles: byLocationId.size,
    locationIds: Array.from(byLocationId.keys()),
    features: ['jwt-gated-proxy', 'location-centric', 'multi-image-upload']
  });
});

// Location-centric product creation endpoint
app.post('/api/ghl/locations/:locationId/products', async (req, res) => {
  console.log('=== PRODUCT CREATION REQUEST ===');
  
  const { locationId } = req.params;
  const inst = byLocationId.get(locationId);
  
  if (!inst) {
    return res.status(404).json({ error: 'Unknown locationId' });
  }

  try {
    const product = req.body; // Body must match GHL spec
    
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

// Multi-image upload endpoint
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

// Token management endpoints
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
  console.log(`Railway GoHighLevel Backend v5.1.0 running on port ${port}`);
  console.log('Architecture: JWT-gated proxy with location-centric routes');
  console.log('Features: Multi-image upload, Product creation, Rate limiting');
  console.log('');
  console.log('Endpoints:');
  console.log('- GET  /health - Health check (no JWT required)');
  console.log('- POST /api/ghl/locations/:locationId/media - Multi-image upload (JWT required)');
  console.log('- POST /api/ghl/locations/:locationId/products - Product creation (JWT required)');
  console.log('- GET  /api/installations - Token management (no JWT required)');
  console.log('');
  console.log(`Token bundles loaded: ${byLocationId.size}`);
  console.log(`Location IDs: ${Array.from(byLocationId.keys()).join(', ')}`);
});
