const express = require('express');
const { requireOAuth } = require('../middleware/oauth-bridge');
const { createPrice, getPrices } = require('../utils/ghl-client');

const router = express.Router();

// Create price
router.post('/:productId', requireOAuth, async (req, res) => {
  try {
    const price = await createPrice(req.params.productId, req.body, req.accessToken);
    res.json({
      success: true,
      price,
      productId: req.params.productId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Price creation failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Get prices
router.get('/:productId', requireOAuth, async (req, res) => {
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