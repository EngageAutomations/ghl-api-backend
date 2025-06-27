const express = require('express');
const { requireOAuth } = require('../middleware/oauth-bridge');
const { getWorkflows } = require('../utils/ghl-client');

const router = express.Router();

// List workflows
router.get('/', requireOAuth, async (req, res) => {
  try {
    const workflows = await getWorkflows(req.locationId, req.accessToken);
    res.json({
      success: true,
      workflows,
      count: workflows.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch workflows',
      message: error.message
    });
  }
});

module.exports = router;