const axios = require('axios');

const OAUTH_BACKEND_URL = process.env.OAUTH_BACKEND_URL || 'https://dir.engageautomations.com';

console.log('OAuth Bridge initialized with backend:', OAUTH_BACKEND_URL);

async function requireOAuth(req, res, next) {
  try {
    // Get active installation from OAuth backend
    const response = await axios.get(`${OAUTH_BACKEND_URL}/installations`, {
      timeout: 10000
    });
    
    const installations = response.data.installations || [];
    const activeInstallation = installations.find(i => i.tokenStatus === 'valid');
    
    if (!activeInstallation) {
      return res.status(401).json({
        error: 'No active OAuth installation',
        message: 'Please complete OAuth installation first',
        oauth_url: 'https://marketplace.gohighlevel.com/oauth/choose-account?response_type=code&redirect_uri=https://dir.engageautomations.com/api/oauth/callback&client_id=67671c52e4b0b29a36063fb6'
      });
    }
    
    // For now, use the installation data directly since OAuth backend manages tokens
    // The OAuth backend automatically refreshes tokens in the background
    req.accessToken = 'managed_by_oauth_backend';
    req.locationId = activeInstallation.locationId;
    req.installationId = activeInstallation.id;
    req.oauthBackend = OAUTH_BACKEND_URL;
    
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