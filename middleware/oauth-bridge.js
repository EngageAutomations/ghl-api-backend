const axios = require('axios');

const OAUTH_BACKEND_URL = process.env.OAUTH_BACKEND_URL || 'https://dir.engageautomations.com';

async function requireOAuth(req, res, next) {
  try {
    // Get active installation from OAuth backend
    const response = await axios.get(`${OAUTH_BACKEND_URL}/installations`, {
      timeout: 10000
    });
    
    const installations = response.data.installations || [];
    const activeInstallation = installations.find(i => i.active);
    
    if (!activeInstallation) {
      return res.status(401).json({
        error: 'No active OAuth installation',
        message: 'Please complete OAuth installation first',
        oauth_url: 'https://marketplace.gohighlevel.com/oauth/choose-account?response_type=code&redirect_uri=https://dir.engageautomations.com/api/oauth/callback&client_id=67671c52e4b0b29a36063fb6'
      });
    }
    
    // Get fresh token from OAuth backend
    const tokenResponse = await axios.get(`${OAUTH_BACKEND_URL}/api/oauth/token/${activeInstallation.id}`, {
      timeout: 10000
    });
    
    req.accessToken = tokenResponse.data.accessToken;
    req.locationId = tokenResponse.data.locationId;
    req.installationId = activeInstallation.id;
    
    next();
  } catch (error) {
    console.error('OAuth bridge error:', error.message);
    res.status(500).json({
      error: 'OAuth authentication failed',
      message: 'Unable to connect to OAuth backend',
      oauth_backend: OAUTH_BACKEND_URL
    });
  }
}

module.exports = { requireOAuth };