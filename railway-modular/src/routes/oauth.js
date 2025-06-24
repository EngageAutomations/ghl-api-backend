const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const { store, ensureFresh } = require('../utils/install-store');

// OAuth configuration - MUST be set as environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';

// OAuth callback endpoint
router.get('/api/oauth/callback', async (req, res) => {
  const { code, state, location_id, user_id } = req.query;
  
  console.log('OAuth callback received:', { 
    code: code ? code.substring(0, 10) + '...' : 'missing',
    state, 
    location_id, 
    user_id 
  });
  
  if (!code) {
    console.error('OAuth callback missing authorization code');
    return res.status(400).send('Missing code');
  }
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('OAuth credentials not configured');
    return res.status(500).send('OAuth not configured');
  }
  
  try {
    // Exchange authorization code for tokens
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    });
    
    console.log('Exchanging code for tokens...');
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    });
    
    const tokenResponseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenResponseText);
      return res.status(500).send(`OAuth failed: ${tokenResponseText}`);
    }
    
    const tokenData = JSON.parse(tokenResponseText);
    console.log('Token exchange successful:', { 
      access_token: tokenData.access_token ? tokenData.access_token.substring(0, 10) + '...' : 'missing',
      expires_in: tokenData.expires_in,
      location_id: tokenData.locationId || location_id,
      user_id: tokenData.userId || user_id
    });
    
    // Store installation with tokens
    const installationId = 'install_' + Date.now();
    const installation = {
      id: installationId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 3600,
      locationId: tokenData.locationId || location_id,
      userId: tokenData.userId || user_id,
      companyId: tokenData.companyId,
      authenticated: true,
      tokenStatus: 'valid',
      created_at: new Date().toISOString()
    };
    
    store.createInstallation(installation);
    console.log('Installation stored successfully:', installationId);
    
    // Redirect to frontend with installation_id
    const redirectUrl = `https://listings.engageautomations.com/?installation_id=${installationId}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.status(500).send(`OAuth failed: ${error.message}`);
  }
});

// OAuth status check
router.get('/api/oauth/status', async (req, res) => {
  const { installation_id } = req.query;
  
  try {
    const installation = store.getInstallationById(installation_id);
    
    if (!installation) {
      return res.json({ 
        authenticated: false, 
        error: 'Installation not found',
        available_installations: store.getAllInstallations().map(i => i.id)
      });
    }
    
    // Check token validity
    const now = Date.now();
    const created = new Date(installation.created_at).getTime();
    const expiresIn = (installation.expires_in || 3600) * 1000;
    const tokenValid = installation.access_token && (now - created < expiresIn);
    
    res.json({
      authenticated: installation.authenticated && tokenValid,
      tokenStatus: tokenValid ? 'valid' : 'expired',
      locationId: installation.locationId,
      userId: installation.userId,
      companyId: installation.companyId,
      expires_at: new Date(created + expiresIn).toISOString()
    });
    
  } catch (error) {
    console.error('OAuth status check error:', error.message);
    res.json({ authenticated: false, error: error.message });
  }
});

module.exports = router;