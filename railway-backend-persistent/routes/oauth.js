const express = require('express');
const axios = require('axios');
const { storage } = require('../config/database');

const router = express.Router();

// OAuth token exchange with persistent storage
async function exchangeCode(code, redirectUri) {
  try {
    console.log('Token exchange starting with code:', code.substring(0, 10) + '...');
    
    // Use explicit form encoding (the fix that works)
    const params = new URLSearchParams();
    params.append('client_id', process.env.GHL_CLIENT_ID);
    params.append('client_secret', process.env.GHL_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    
    const { data } = await axios.post('https://services.leadconnectorhq.com/oauth/token', params, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('Token exchange successful');
    return data;
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    throw error;
  }
}

// OAuth callback with database persistence
router.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'code required' });
  }
  
  try {
    const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
    const tokenData = await exchangeCode(code, redirectUri);
    
    // Save to persistent database
    const installation = await storage.saveInstallation({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      locationId: tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenData.scope || '',
      tokenStatus: 'valid'
    });
    
    console.log('Installation saved to database:', installation.id || installation.ghlUserId);
    
    res.json({
      success: true,
      installationId: installation.id || installation.ghlUserId,
      message: 'OAuth installation successful and persisted'
    });
  } catch (error) {
    res.status(500).json({
      error: 'OAuth callback failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// Get installations from database
router.get('/installations', async (req, res) => {
  try {
    const installations = await storage.getInstallations();
    res.json({
      total: installations.length,
      authenticated: installations.filter(i => i.ghlAccessToken || i.accessToken).length,
      installations: installations.map(i => ({
        id: i.id || i.ghlUserId,
        locationId: i.ghlLocationId || i.locationId,
        active: i.isActive !== false,
        created: i.installationDate || i.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;