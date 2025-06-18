import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Upload image URL to GoHighLevel Media API
router.post('/upload-url-to-ghl', async (req, res) => {
  try {
    const { imageUrl, fileName, installationId } = req.body;

    if (!imageUrl || !fileName || !installationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: imageUrl, fileName, installationId'
      });
    }

    console.log('Uploading image URL to GoHighLevel:', {
      imageUrl,
      fileName,
      installationId
    });

    // Call Railway backend to upload the image URL to GoHighLevel
    const railwayResponse = await fetch('https://dir.engageautomations.com/api/ghl/media/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        installationId,
        imageUrl,
        fileName
      })
    });

    const result = await railwayResponse.json();

    if (railwayResponse.ok && result.success) {
      console.log('Successfully uploaded to GoHighLevel:', result.mediaUrl);
      
      res.json({
        success: true,
        mediaUrl: result.mediaUrl,
        mediaId: result.mediaId,
        fileName: result.fileName
      });
    } else {
      console.error('Railway backend upload failed:', result);
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to upload to GoHighLevel',
        details: result.details
      });
    }

  } catch (error) {
    console.error('GHL media upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image to GoHighLevel',
      details: error.message
    });
  }
});

export default router;