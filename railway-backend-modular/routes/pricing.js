const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createPrice, getPrices } = require('../utils/ghl-client');

const router = express.Router();

// Create price for product
router.post('/:productId/prices', requireAuth, async (req, res) => {
  try {
    const price = await createPrice(req.params.productId, req.body, req.accessToken);
    res.json({ success: true, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prices for product
router.get('/:productId/prices', requireAuth, async (req, res) => {
  try {
    const prices = await getPrices(req.params.productId, req.accessToken);
    res.json({ success: true, prices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;