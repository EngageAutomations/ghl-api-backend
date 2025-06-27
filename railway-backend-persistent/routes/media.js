const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { uploadMedia, getMedia } = require('../utils/ghl-client');

const router = express.Router();

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Upload media to GoHighLevel
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('Uploading media for location:', req.locationId);
    
    const media = await uploadMedia(req.file, req.locationId, req.accessToken);
    
    res.json({ 
      success: true, 
      media,
      locationId: req.locationId
    });
  } catch (error) {
    console.error('Media upload failed:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Media upload failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// List media files
router.get('/', requireAuth, async (req, res) => {
  try {
    const media = await getMedia(req.locationId, req.accessToken);
    res.json({ 
      success: true, 
      media,
      locationId: req.locationId
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch media',
      message: error.message 
    });
  }
});

module.exports = router;