const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createPrice, getPrices } = require('../utils/ghl-client');

const router = express.Router();

// Create price for product
router.post('/:productId/prices', requireAuth, async (req, res) => {
  try {
    console.log('Creating price for product:', req.params.productId);
    
    const price = await createPrice(req.params.productId, req.body, req.accessToken);
    
    res.json({ 
      success: true, 
      price,
      productId: req.params.productId
    });
  } catch (error) {
    console.error('Price creation failed:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Price creation failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Get prices for product
router.get('/:productId/prices', requireAuth, async (req, res) => {
  try {
    const prices = await getPrices(req.params.productId, req.accessToken);
    res.json({ 
      success: true, 
      prices,
      productId: req.params.productId
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch prices',
      message: error.message 
    });
  }
});

module.exports = router;