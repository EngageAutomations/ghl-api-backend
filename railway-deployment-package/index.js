const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Hardcoded OAuth credentials to bypass Railway env var issues
const CLIENT_ID = '68474924a586bce22a6e64f7-mbpkmyu4';
const CLIENT_SECRET = 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
const REDIRECT_URI = 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback';
const SCOPES = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';

console.log('=== FIXED OAUTH BACKEND STARTING ===');
console.log('Client ID:', CLIENT_ID);
console.log('Client Secret: [HARDCODED]');
console.log('Redirect URI:', REDIRECT_URI);

app.use(express.json());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Health check with clear status
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Fixed OAuth Backend', 
    timestamp: new Date().toISOString(),
    credentials: 'HARDCODED',
    version: '2.0'
  });
});

// Environment check endpoint
app.get('/api/env-check', (req, res) => {
  res.json({
    hasClientId: true,
    hasClientSecret: true,
    hasRedirectUri: true,
    clientIdValue: CLIENT_ID,
    redirectUriValue: REDIRECT_URI,
    nodeEnv: process.env.NODE_ENV || 'production',
    version: 'FIXED_HARDCODED'
  });
});

// OAuth URL generation
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&state=${state}&scope=${encodeURIComponent(SCOPES)}`;
  
  console.log('Generated OAuth URL with hardcoded credentials');
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

// OAuth callback handler - THE FIX
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
    console.log('=== EXCHANGING CODE FOR TOKEN (HARDCODED CREDS) ===');
    console.log('Authorization code:', code);

    // Create properly formatted form data
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('code', code);
    formData.append('redirect_uri', REDIRECT_URI);

    console.log('Token request using hardcoded credentials');

    // Exchange code for tokens with proper headers
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

    // Success response with proper parameters
    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString()
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
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.response?.status || 'Unknown')}`;
    
    return res.redirect(errorUrl);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('=== FIXED OAUTH BACKEND STARTED ===');
  console.log(`Port: ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
  console.log(`OAuth URL: http://0.0.0.0:${PORT}/api/oauth/url`);
  console.log(`OAuth Callback: http://0.0.0.0:${PORT}/api/oauth/callback`);
  console.log('Using hardcoded credentials to bypass env var issues');
  console.log('==========================================');
});

module.exports = app;