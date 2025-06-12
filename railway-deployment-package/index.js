// Complete OAuth Backend for Railway Deployment
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Log environment variables on startup for debugging
console.log('=== RAILWAY ENVIRONMENT DEBUG ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GHL_CLIENT_ID:', process.env.GHL_CLIENT_ID ? '[SET]' : 'MISSING');
console.log('GHL_CLIENT_SECRET:', process.env.GHL_CLIENT_SECRET ? '[SET]' : 'MISSING');
console.log('GHL_REDIRECT_URI:', process.env.GHL_REDIRECT_URI ? '[SET]' : 'MISSING');
console.log('Total env vars:', Object.keys(process.env).length);
console.log('GHL-related env vars:', Object.keys(process.env).filter(k => k.includes('GHL')));
console.log('================================');

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'GHL OAuth Backend', timestamp: new Date().toISOString() });
});

// Environment check endpoint (for debugging)
app.get('/api/env-check', (req, res) => {
  // Log all environment variables that start with GHL
  const allEnvVars = Object.keys(process.env).filter(key => key.includes('GHL') || key.includes('CLIENT'));
  
  res.json({
    hasClientId: !!process.env.GHL_CLIENT_ID,
    hasClientSecret: !!process.env.GHL_CLIENT_SECRET,
    hasRedirectUri: !!process.env.GHL_REDIRECT_URI,
    clientIdValue: process.env.GHL_CLIENT_ID || 'DEFAULT_USED',
    redirectUriValue: process.env.GHL_REDIRECT_URI || 'DEFAULT_USED',
    nodeEnv: process.env.NODE_ENV || 'not_set',
    allGhlEnvVars: allEnvVars,
    rawClientSecret: process.env.GHL_CLIENT_SECRET ? '[EXISTS]' : 'MISSING',
    envKeys: Object.keys(process.env).length
  });
});

// OAuth URL generation endpoint
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const clientId = '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback';
  const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';
  
  // Generate state for security
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Build OAuth URL
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  console.log('Generated OAuth URL:', authUrl);
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

// OAuth callback endpoint - Complete token exchange handler
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== RAILWAY OAUTH CALLBACK ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error from GoHighLevel:', error);
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`;
    return res.redirect(errorUrl);
  }

  // Validate authorization code
  if (!code) {
    console.error('Missing authorization code');
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`;
    return res.redirect(errorUrl);
  }

  try {
    console.log('=== EXCHANGING CODE FOR TOKEN ===');
    console.log('Authorization code:', code);

    // Exchange authorization code for access token
    const tokenRequest = {
      grant_type: 'authorization_code',
      client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
      client_secret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
      code: code,
      redirect_uri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback'
    };

    console.log('Token request payload:', {
      grant_type: tokenRequest.grant_type,
      client_id: tokenRequest.client_id,
      client_secret: tokenRequest.client_secret ? '[HIDDEN]' : 'MISSING',
      code: tokenRequest.code,
      redirect_uri: tokenRequest.redirect_uri
    });

    // Convert to URL-encoded format for GoHighLevel API
    const formData = new URLSearchParams();
    formData.append('grant_type', tokenRequest.grant_type);
    formData.append('client_id', tokenRequest.client_id);
    formData.append('client_secret', tokenRequest.client_secret);
    formData.append('code', tokenRequest.code);
    formData.append('redirect_uri', tokenRequest.redirect_uri);

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('Token exchange successful:', {
      access_token: response.data.access_token ? '[RECEIVED]' : 'MISSING',
      refresh_token: response.data.refresh_token ? '[RECEIVED]' : 'MISSING',
      expires_in: response.data.expires_in,
      scope: response.data.scope
    });

    // Get user info to extract locationId and companyId
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

    // TODO: Store tokens in database here
    console.log('=== TOKEN STORAGE NEEDED ===');
    console.log('Store these tokens in your database:');
    console.log('- Access Token:', response.data.access_token);
    console.log('- Refresh Token:', response.data.refresh_token);
    console.log('- Expires In:', response.data.expires_in);
    console.log('- Location ID:', userInfo?.locationId);
    console.log('- Company ID:', userInfo?.companyId);

    // Redirect to success page with minimal, non-sensitive data
    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString()
    });
    
    if (userInfo?.locationId) {
      params.append('locationId', userInfo.locationId);
    }
    if (userInfo?.companyId) {
      params.append('companyId', userInfo.companyId);
    }
    if (state) {
      params.append('state', String(state));
    }

    const successUrl = `https://dir.engageautomations.com/oauth-success?${params.toString()}`;
    console.log('✅ OAuth complete! Redirecting to success page:', successUrl);
    
    return res.redirect(successUrl);

  } catch (error) {
    console.error('=== TOKEN EXCHANGE FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Token exchange failed';
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.response?.status || 'Unknown')}`;
    
    return res.redirect(errorUrl);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ OAuth Backend Server Running`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`OAuth URL: http://0.0.0.0:${PORT}/api/oauth/url`);
  console.log(`OAuth Callback: http://0.0.0.0:${PORT}/api/oauth/callback`);
});

module.exports = app;