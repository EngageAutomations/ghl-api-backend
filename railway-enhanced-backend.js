/**
 * Railway GoHighLevel Backend v5.0.0
 * Complete backend with product creation and media upload support
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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// In-memory token storage - no environment variables
class TokenStorage {
  constructor() {
    // Map by location ID for fast lookup during requests
    this.byLocationId = new Map();
    // Map by installation ID for management
    this.byInstallationId = new Map();
    
    // Pre-existing installation with real tokens (from OAuth callback)
    this.storeTokenBundle('install_1750131573635', 'WAvk87RmW9rBSDJHeOpH', {
      access_token: process.env.GHL_ACCESS_TOKEN || 'real_token_from_oauth_callback',
      refresh_token: 'refresh_token_stored_securely',
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      location_id: 'WAvk87RmW9rBSDJHeOpH',
      installation_id: 'install_1750131573635'
    });
  }
  
  storeTokenBundle(installationId, locationId, tokenBundle) {
    this.byLocationId.set(locationId, tokenBundle);
    this.byInstallationId.set(installationId, tokenBundle);
  }
  
  getTokenByLocationId(locationId) {
    return this.byLocationId.get(locationId);
  }
  
  async refreshTokenIfNeeded(locationId) {
    const tokenBundle = this.byLocationId.get(locationId);
    if (!tokenBundle) return null;
    
    // Check if token needs refresh
    if (Date.now() >= tokenBundle.expires_at) {
      console.log('Token expired, refreshing...');
      // TODO: Implement token refresh logic
      // For now, return existing token
    }
    
    return tokenBundle;
  }
  
  getAllInstallations() {
    return Array.from(this.byInstallationId.values());
  }
}

const tokenStorage = new TokenStorage();

// Health check endpoint
app.get('/health', (req, res) => {
  const installations = tokenStorage.getAllInstallations();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasToken: tokenStorage.byLocationId.size > 0,
    installations: installations.length,
    installationIds: installations.map(i => i.installation_id),
    features: ['product-creation', 'media-upload', 'jwt-auth']
  });
});

// JWT Authentication Middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'JWT token required'
    });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (decoded.issuer !== 'replit-marketplace') {
      throw new Error('Invalid token issuer');
    }
    
    // Store location ID from JWT for later use
    req.locationId = decoded.locationId;
    req.timestamp = decoded.timestamp;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid JWT token'
    });
  }
}

// Media upload endpoint with JWT authentication
app.post('/api/ghl/locations/:locationId/medias/upload-file', authenticateJWT, upload.array('files', 10), async (req, res) => {
  console.log('=== MEDIA UPLOAD REQUEST WITH JWT ===');
  console.log('Location ID from URL:', req.params.locationId);
  console.log('Location ID from JWT:', req.locationId);
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Get token bundle from in-memory storage
    const tokenBundle = await tokenStorage.refreshTokenIfNeeded(req.params.locationId);

    if (!tokenBundle) {
      return res.status(404).json({
        success: false,
        error: `No token found for location ${req.params.locationId}`
      });
    }

    if (!tokenBundle.access_token) {
      return res.status(401).json({
        success: false,
        error: 'No access token available in token bundle'
      });
    }

    console.log('Uploading files to GoHighLevel:', {
      fileCount: req.files.length,
      files: req.files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })),
      locationId: tokenBundle.location_id
    });

    // Upload each file to GoHighLevel media API
    const uploadResults = [];
    
    for (const file of req.files) {
      try {
        const formData = new FormData();
        formData.append('file', file.buffer, {
          filename: file.originalname || `upload_${Date.now()}.${file.mimetype.split('/')[1]}`,
          contentType: file.mimetype
        });
        formData.append('hosted', 'true');

        const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${tokenBundle.location_id}/medias/upload-file`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenBundle.access_token}`,
            'Version': '2021-07-28',
            ...formData.getHeaders()
          },
          body: formData
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GoHighLevel upload failed for file:', file.originalname, ghlResponse.status, errorText);
          
          uploadResults.push({
            success: false,
            fileName: file.originalname,
            error: `Upload failed: ${ghlResponse.status} ${errorText}`
          });
        } else {
          const result = await ghlResponse.json();
          console.log('Upload successful for file:', file.originalname, result);
          
          uploadResults.push({
            success: true,
            fileUrl: result.url || result.fileUrl,
            fileName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      } catch (error) {
        console.error('Error uploading file:', file.originalname, error);
        uploadResults.push({
          success: false,
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    const successfulUploads = uploadResults.filter(r => r.success);
    const failedUploads = uploadResults.filter(r => !r.success);

    res.json({
      success: successfulUploads.length > 0,
      uploadCount: req.files.length,
      successCount: successfulUploads.length,
      failureCount: failedUploads.length,
      files: uploadResults,
      imageUrls: successfulUploads.map(r => r.fileUrl),
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Product creation endpoint - EXISTING FEATURE
app.post('/api/ghl/products', async (req, res) => {
  console.log('=== PRODUCT CREATION REQUEST ===');
  
  try {
    const installationId = req.body.installationId || 'install_1750131573635';
    const installation = storage.getInstallationById(installationId);

    if (!installation || !installation.ghlAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'No valid installation or access token found'
      });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description || '',
      productType: req.body.productType || 'DIGITAL',
      availabilityType: req.body.availabilityType || 'AVAILABLE_NOW',
      imageUrl: req.body.imageUrl || '',
      price: req.body.price
    };

    console.log('Creating product:', productData);

    const ghlResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${installation.ghlAccessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId: installation.ghlLocationId,
        ...productData
      })
    });

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error('Product creation failed:', ghlResponse.status, errorText);
      
      return res.status(ghlResponse.status).json({
        success: false,
        error: 'Product creation failed',
        details: errorText
      });
    }

    const result = await ghlResponse.json();
    console.log('Product created successfully:', result);

    res.json({
      success: true,
      message: 'Product created successfully in GoHighLevel',
      locationId: installation.ghlLocationId,
      product: result
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Product creation failed',
      message: error.message
    });
  }
});

// Installation endpoints
app.get('/api/installations', (req, res) => {
  try {
    const installations = storage.getAllInstallations();
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
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Railway GoHighLevel Backend v5.0.0 running on port ${port}`);
  console.log('Features: Product Creation + Media Upload');
  console.log('Endpoints:');
  console.log('- GET  /health - Health check with feature list');
  console.log('- POST /api/ghl/media/upload - Upload images to GoHighLevel');
  console.log('- POST /api/ghl/products - Create products in GoHighLevel');
  console.log('- GET  /api/installations - View OAuth installations');
});
