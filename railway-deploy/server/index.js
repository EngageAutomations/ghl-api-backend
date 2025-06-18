// server/index.js - Railway Backend for OAuth Handling
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

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

// OAuth callback endpoint - Main handler for GoHighLevel OAuth
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== RAILWAY OAUTH CALLBACK ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;

  // Handle OAuth error from GoHighLevel
  if (error) {
    console.error('OAuth error from GoHighLevel:', error);
    const errorMsg = encodeURIComponent(`OAuth error: ${error}`);
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${errorMsg}`);
  }

  // Handle test endpoint
  if (!code && !error) {
    console.log('Test endpoint accessed');
    return res.status(200).send('Railway OAuth backend is working!');
  }

  // Handle OAuth token exchange
  if (!code) {
    return res.status(400).redirect('https://dir.engageautomations.com/oauth-error?error=missing_code');
  }

  try {
    console.log('=== STARTING TOKEN EXCHANGE ===');
    console.log('Code (first 20 chars):', String(code).substring(0, 20));

    const tokenRequestData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: String(code),
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback',
    });

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      tokenRequestData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 10000
      }
    );

    console.log('=== TOKEN RESPONSE SUCCESS ===');
    console.log('Status:', response.status);

    // Store tokens in secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      domain: '.engageautomations.com'
    };

    res.cookie('oauth_token', response.data.access_token, cookieOptions);
    if (response.data.refresh_token) {
      res.cookie('oauth_refresh_token', response.data.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    // Redirect to success page
    const successUrl = `https://dir.engageautomations.com/?success=oauth-complete&timestamp=${Date.now()}`;
    console.log('✅ Redirecting to success page:', successUrl);
    
    return res.redirect(successUrl);

  } catch (error) {
    console.error('=== TOKEN EXCHANGE FAILED ===');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    const errorMsg = encodeURIComponent('Token exchange failed: ' + error.message);
    const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&details=${errorMsg}`;
    
    return res.redirect(redirectUrl);
  }
});

// OAuth URL generation endpoint
app.get('/api/oauth/url', (req, res) => {
  const { state } = req.query;
  
  const clientId = process.env.GHL_CLIENT_ID;
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
  const scopes = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';
  
  if (!clientId) {
    return res.status(500).json({ error: 'OAuth client ID not configured' });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
  });

  if (state) {
    params.append('state', String(state));
  }

  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${params.toString()}`;
  
  res.json({ 
    success: true, 
    authUrl,
    clientId: clientId.substring(0, 10) + '...',
    redirectUri,
    scopes
  });
});

app.listen(PORT, () => {
  console.log(`✅ Railway OAuth Backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OAuth Client ID configured: ${process.env.GHL_CLIENT_ID ? 'Yes' : 'No'}`);
});
