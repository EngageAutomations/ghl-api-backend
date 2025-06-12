// Standalone OAuth Backend - Direct Deployment Version
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Fixed OAuth credentials
const OAUTH_CONFIG = {
  clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
  clientSecret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
  scopes: 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write'
};

console.log('=== OAUTH BACKEND STARTING ===');
console.log('Client ID:', OAUTH_CONFIG.clientId);
console.log('Client Secret:', OAUTH_CONFIG.clientSecret ? '[SET]' : 'MISSING');
console.log('Redirect URI:', OAUTH_CONFIG.redirectUri);

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Standalone OAuth Backend', 
    timestamp: new Date().toISOString(),
    config: {
      hasClientId: !!OAUTH_CONFIG.clientId,
      hasClientSecret: !!OAUTH_CONFIG.clientSecret,
      redirectUri: OAUTH_CONFIG.redirectUri
    }
  });
});

// OAuth URL generation
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirectUri)}&client_id=${OAUTH_CONFIG.clientId}&state=${state}&scope=${encodeURIComponent(OAUTH_CONFIG.scopes)}`;
  
  console.log('Generated OAuth URL:', authUrl);
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

// OAuth callback handler
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

    // Prepare form data for token exchange
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', OAUTH_CONFIG.clientId);
    formData.append('client_secret', OAUTH_CONFIG.clientSecret);
    formData.append('code', code);
    formData.append('redirect_uri', OAUTH_CONFIG.redirectUri);

    console.log('Token request data:', {
      grant_type: 'authorization_code',
      client_id: OAUTH_CONFIG.clientId,
      client_secret: '[HIDDEN]',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri
    });

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
    console.log('Expires in:', response.data.expires_in);
    console.log('Scope:', response.data.scope);

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
      console.log('User info retrieved:', {
        locationId: userInfo.locationId,
        companyId: userInfo.companyId
      });
    } catch (userError) {
      console.warn('Failed to get user info:', userError.message);
    }

    // TODO: Store tokens in database
    console.log('=== TOKENS TO STORE ===');
    console.log('Access Token:', response.data.access_token);
    console.log('Refresh Token:', response.data.refresh_token);
    console.log('Expires In:', response.data.expires_in);
    console.log('Location ID:', userInfo?.locationId);
    console.log('Company ID:', userInfo?.companyId);

    // Redirect to success page
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
      console.error('Data:', error.response.data);
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Token exchange failed';
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.response?.status || 'Unknown')}`;
    
    return res.redirect(errorUrl);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('=== SERVER STARTED ===');
  console.log(`Port: ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
  console.log(`OAuth URL: http://0.0.0.0:${PORT}/api/oauth/url`);
  console.log(`OAuth Callback: http://0.0.0.0:${PORT}/api/oauth/callback`);
  console.log('======================');
});

module.exports = app;