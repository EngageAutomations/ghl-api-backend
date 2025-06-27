const express = require('express');
const { requireOAuth } = require('../middleware/oauth-bridge');
const { createProduct, getProducts, updateProduct, deleteProduct } = require('../utils/ghl-client');

const router = express.Router();

// Create product
router.post('/', requireOAuth, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      locationId: req.locationId
    };
    
    const product = await createProduct(productData, req.accessToken);
    
    res.json({
      success: true,
      product,
      api_version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Product creation failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// List products
router.get('/', requireOAuth, async (req, res) => {
  try {
    const products = await getProducts(req.locationId, req.accessToken);
    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// Update product
router.put('/:productId', requireOAuth, async (req, res) => {
  try {
    const product = await updateProduct(req.params.productId, req.body, req.accessToken);
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      error: 'Product update failed',
      message: error.message
    });
  }
});

// Delete product
router.delete('/:productId', requireOAuth, async (req, res) => {
  try {
    await deleteProduct(req.params.productId, req.accessToken);
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Product deletion failed',
      message: error.message
    });
  }
});

module.exports = router;