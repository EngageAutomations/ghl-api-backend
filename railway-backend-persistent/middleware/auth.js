const { storage } = require('../config/database');

async function requireAuth(req, res, next) {
  try {
    // Get active token from database
    const installation = await storage.getActiveToken();
    
    if (!installation) {
      return res.status(401).json({ 
        error: 'No active OAuth installation found',
        message: 'Please complete OAuth installation first'
      });
    }
    
    req.accessToken = installation.ghlAccessToken || installation.accessToken;
    req.locationId = installation.ghlLocationId || installation.locationId;
    req.installationId = installation.id || installation.ghlUserId;
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed', message: error.message });
  }
}

module.exports = { requireAuth };