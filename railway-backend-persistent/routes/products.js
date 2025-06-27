const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createProduct, getProducts } = require('../utils/ghl-client');

const router = express.Router();

// Create product
router.post('/create', requireAuth, async (req, res) => {
  try {
    console.log('Creating product for location:', req.locationId);
    
    const productData = {
      ...req.body,
      locationId: req.locationId
    };
    
    const product = await createProduct(productData, req.accessToken);
    
    res.json({ 
      success: true, 
      product,
      installationId: req.installationId
    });
  } catch (error) {
    console.error('Product creation failed:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Product creation failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// List products
router.get('/', requireAuth, async (req, res) => {
  try {
    const products = await getProducts(req.locationId, req.accessToken);
    res.json({ 
      success: true, 
      products,
      locationId: req.locationId
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message 
    });
  }
});

module.exports = router;