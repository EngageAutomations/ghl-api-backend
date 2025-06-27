const express = require('express');
const multer = require('multer');
const { requireOAuth } = require('../middleware/oauth-bridge');
const { uploadMedia, getMedia } = require('../utils/ghl-client');

const router = express.Router();

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Upload media
router.post('/upload', requireOAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const media = await uploadMedia(req.file, req.locationId, req.accessToken);
    
    res.json({
      success: true,
      media,
      locationId: req.locationId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Media upload failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// List media
router.get('/', requireOAuth, async (req, res) => {
  try {
    const media = await getMedia(req.locationId, req.accessToken);
    res.json({
      success: true,
      media,
      count: media.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch media',
      message: error.message
    });
  }
});

module.exports = router;