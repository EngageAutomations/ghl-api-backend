const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { byLocation, ensureFresh } = require('../utils/install-store');

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 25 * 1024 * 1024 } 
});

// Location-centric media upload
router.post('/locations/:locationId/media', upload.array('file', 10), async (req, res) => {
  const { locationId } = req.params;
  
  try {
    console.log(`Media upload request for location: ${locationId}`);
    
    const installation = byLocation(locationId);
    if (!installation) {
      console.log('Available locations:', require('../utils/install-store').store.getAllInstallations().map(i => i.locationId));
      return res.status(404).json({ 
        success: false, 
        error: `Unknown locationId ${locationId}`,
        available_locations: require('../utils/install-store').store.getAllInstallations().map(i => i.locationId)
      });
    }
    
    const freshToken = await ensureFresh(installation.id);
    if (!freshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required - token refresh failed' 
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files provided' 
      });
    }
    
    const uploadResults = [];
    
    for (const file of req.files) {
      console.log(`Uploading file: ${file.originalname} (${file.size} bytes)`);
      
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
      
      const uploadResponse = await fetch(`https://services.leadconnectorhq.com/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${freshToken}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log(`Upload successful: ${file.originalname}`);
        
        uploadResults.push({
          originalName: file.originalname,
          fileUrl: result.fileUrl || result.url,
          fileId: result.id,
          size: file.size,
          type: file.mimetype
        });
      } else {
        const errorText = await uploadResponse.text();
        console.error(`Upload failed for ${file.originalname}:`, errorText);
        
        uploadResults.push({
          originalName: file.originalname,
          error: errorText,
          failed: true
        });
      }
    }
    
    res.json({
      success: true,
      uploaded: uploadResults.filter(r => !r.failed),
      failed: uploadResults.filter(r => r.failed),
      count: uploadResults.filter(r => !r.failed).length,
      locationId
    });
    
  } catch (error) {
    console.error('Media upload error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      locationId 
    });
  }
});

module.exports = router;