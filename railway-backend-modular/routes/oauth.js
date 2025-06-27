const express = require('express');
const { exchangeCode, storeInstall, getInstallations } = require('../utils/oauth-manager');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// OAuth callback endpoint
router.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'code required' });
  }
  
  try {
    const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
    const tokenData = await exchangeCode(code, redirectUri);
    const installation = storeInstall(tokenData);
    
    res.json({
      success: true,
      installationId: installation.id,
      message: 'OAuth installation successful'
    });
  } catch (error) {
    res.status(500).json({
      error: 'OAuth callback failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Get installations
router.get('/installations', (req, res) => {
  const installations = getInstallations();
  res.json({
    total: installations.length,
    authenticated: installations.filter(i => i.tokenStatus === 'valid').length,
    installations
  });
});

module.exports = router;