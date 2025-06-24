const express = require('express');
const router = express.Router();

// Legacy endpoints for backward compatibility
router.post('/products/create', async (req, res) => {
  const { installation_id, locationId, ...productData } = req.body;
  
  try {
    console.log('Legacy product creation endpoint called');
    
    // For now, return deprecation notice
    res.status(404).json({ 
      success: false, 
      error: 'Legacy endpoint deprecated',
      message: 'Use location-centric endpoint: POST /api/ghl/locations/{locationId}/products'
    });
    
  } catch (error) {
    console.error('Legacy product creation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;