const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { uploadMedia, getMedia } = require('../utils/ghl-client');

const router = express.Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Upload media
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const media = await uploadMedia(req.file, req.locationId, req.accessToken);
    res.json({ success: true, media });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List media
router.get('/', requireAuth, async (req, res) => {
  try {
    const media = await getMedia(req.locationId, req.accessToken);
    res.json({ success: true, media });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;