const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createProduct, getProducts } = require('../utils/ghl-client');

const router = express.Router();

// Create product
router.post('/create', requireAuth, async (req, res) => {
  try {
    const product = await createProduct(req.body, req.accessToken);
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List products
router.get('/', requireAuth, async (req, res) => {
  try {
    const products = await getProducts(req.locationId, req.accessToken);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;