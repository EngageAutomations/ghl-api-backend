const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORRECTED OAuth configuration
const CLIENT_ID = process.env.GHL_CLIENT_ID || process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://dir.engageautomations.com/oauth/callback';
const SCOPES = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';

console.log('=== CORRECTED OAUTH BACKEND STARTING ===');
console.log('Client ID:', CLIENT_ID ? '[SET]' : '[MISSING]');
console.log('Client Secret:', CLIENT_SECRET ? '[SET]' : '[MISSING]');
console.log('Redirect URI:', REDIRECT_URI);
console.log('Scopes:', SCOPES);

// Validate required environment variables
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES');
  console.error('Required: GHL_CLIENT_ID and GHL_CLIENT_SECRET');
  process.exit(1);
}

app.use(express.json());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Corrected OAuth Backend', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    redirectUri: REDIRECT_URI,
    scopes: SCOPES,
    version: '4.0-CORRECTED'
  });
});

// OAuth URL generation with CORRECT redirect URI
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING CORRECTED OAUTH URL ===');
  
  if (!CLIENT_ID) {
    return res.status(500).json({ 
      success: false, 
      error: 'Client ID not configured' 
    });
  }
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&state=${state}&scope=${encodeURIComponent(SCOPES)}`;
  
  console.log('Correct OAuth URL generated:', authUrl);
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('Scopes:', SCOPES);
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    redirectUri: REDIRECT_URI,
    scopes: SCOPES,
    timestamp: Date.now()
  });
});

// OAuth callback handler - PROXY to dir.engageautomations.com
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK RECEIVED ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;

  if (error) {
    console.error('OAuth error from GoHighLevel:', error);
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('Missing authorization code');
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`);
  }

  try {
    console.log('=== EXCHANGING CODE FOR TOKEN ===');
    console.log('Authorization code:', code);

    // Create properly formatted form data
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('code', code);
    formData.append('redirect_uri', REDIRECT_URI);

    console.log('Token request with CORRECT redirect URI:', REDIRECT_URI);

    // Exchange code for tokens
    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ TOKEN EXCHANGE SUCCESSFUL');
    console.log('Access token received:', response.data.access_token ? '[YES]' : '[NO]');
    console.log('Refresh token received:', response.data.refresh_token ? '[YES]' : '[NO]');

    // Get user info
    let userInfo = null;
    try {
      const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        },
        timeout: 5000
      });
      userInfo = userResponse.data;
      console.log('User info retrieved successfully');
    } catch (userError) {
      console.warn('Failed to get user info:', userError.message);
    }

    // Success response
    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString(),
      backend: 'corrected-v4'
    });
    
    if (userInfo?.locationId) params.append('locationId', userInfo.locationId);
    if (userInfo?.companyId) params.append('companyId', userInfo.companyId);
    if (state) params.append('state', String(state));

    const successUrl = `https://dir.engageautomations.com/oauth-success?${params.toString()}`;
    console.log('✅ REDIRECTING TO SUCCESS:', successUrl);
    
    return res.redirect(successUrl);

  } catch (error) {
    console.error('=== TOKEN EXCHANGE FAILED ===');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Token exchange failed';
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.response?.status || 'Unknown')}&backend=corrected-v4`;
    
    return res.redirect(errorUrl);
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Corrected OAuth Backend Test',
    redirectUri: REDIRECT_URI,
    scopes: SCOPES,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('=== CORRECTED OAUTH BACKEND STARTED ===');
  console.log(`Port: ${PORT}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log(`Scopes: ${SCOPES}`);
  console.log('==========================================');
});

module.exports = app;