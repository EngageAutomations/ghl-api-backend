/**
 * Railway GoHighLevel Backend with Media Upload Support
 * Complete backend for handling both product creation and media uploads
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
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Simple in-memory storage for OAuth installations
class InstallationStorage {
  constructor() {
    this.installations = [
      {
        id: 'install_1750131573635',
        ghlAccessToken: process.env.GHL_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ghlLocationId: 'WAvk87RmW9rBSDJHeOpH',
        ghlLocationName: 'EngageAutomations',
        ghlUserEmail: 'user@engageautomations.com',
        isActive: true,
        createdAt: new Date('2025-06-17T05:26:13.635Z')
      }
    ];
  }

  getAllInstallations() {
    return this.installations;
  }

  getInstallationById(id) {
    return this.installations.find(install => install.id === id);
  }

  createInstallation(installationData) {
    const installation = {
      id: `install_${Date.now()}`,
      ...installationData,
      isActive: true,
      createdAt: new Date()
    };
    this.installations.unshift(installation);
    return installation;
  }
}

const storage = new InstallationStorage();

// Health check endpoint
app.get('/health', (req, res) => {
  const installations = storage.getAllInstallations();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasToken: !!process.env.GHL_ACCESS_TOKEN,
    installations: installations.length,
    installationIds: installations.map(i => i.id)
  });
});

// Get installation data
app.get('/api/installations', (req, res) => {
  try {
    const installations = storage.getAllInstallations();
    res.json(installations);
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

// Media upload endpoint
app.post('/api/ghl/media/upload', upload.single('file'), async (req, res) => {
  console.log('=== RAILWAY MEDIA UPLOAD ===');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const installationId = req.query.installationId || req.body.installationId || 'install_1750131573635';
    const installation = storage.getInstallationById(installationId);

    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found'
      });
    }

    if (!installation.ghlAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token available'
      });
    }

    console.log('Uploading to GoHighLevel:', {
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      locationId: installation.ghlLocationId
    });

    // Upload to GoHighLevel media API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || `upload_${Date.now()}.${req.file.mimetype.split('/')[1]}`,
      contentType: req.file.mimetype
    });
    formData.append('hosted', 'true');

    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${installation.ghlLocationId}/medias/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${installation.ghlAccessToken}`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error('GoHighLevel upload failed:', ghlResponse.status, errorText);
      
      return res.status(ghlResponse.status).json({
        success: false,
        error: 'GoHighLevel upload failed',
        details: errorText,
        status: ghlResponse.status
      });
    }

    const result = await ghlResponse.json();
    console.log('GoHighLevel upload successful:', result);

    res.json({
      success: true,
      fileUrl: result.url || result.fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      ghlResponse: result
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

// Product creation endpoint (existing)
app.post('/api/ghl/products', async (req, res) => {
  console.log('=== RAILWAY PRODUCT CREATION ===');
  
  try {
    const installationId = req.body.installationId || 'install_1750131573635';
    const installation = storage.getInstallationById(installationId);

    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found'
      });
    }

    if (!installation.ghlAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token available'
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
  console.log(`Railway GoHighLevel Backend running on port ${port}`);
  console.log('Endpoints available:');
  console.log('- GET  /health - Health check');
  console.log('- POST /api/ghl/media/upload - Upload images to GoHighLevel');
  console.log('- POST /api/ghl/products - Create products in GoHighLevel');
  console.log('- GET  /api/installations - View OAuth installations');
});