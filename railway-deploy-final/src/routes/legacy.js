const express = require('express');
const router = express.Router();

router.post('/products/create', async (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Legacy endpoint deprecated',
    message: 'Use location-centric endpoint: POST /api/ghl/locations/{locationId}/products'
  });
});

module.exports = router;