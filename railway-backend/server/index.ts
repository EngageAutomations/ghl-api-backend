// server/index.ts - Railway Backend for OAuth Handling
import express from 'express';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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

// OAuth URL generation endpoint
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback';
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

// OAuth callback endpoint - Main handler for GoHighLevel OAuth
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== RAILWAY OAUTH CALLBACK ===');
  console.log('Query params:', req.query);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

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
    console.log('State:', state);

    const tokenRequestData = {
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: String(code),
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback',
    };

    console.log('Token request params:', {
      grant_type: tokenRequestData.grant_type,
      client_id: tokenRequestData.client_id ? 'present' : 'missing',
      client_secret: tokenRequestData.client_secret ? 'present' : 'missing',
      redirect_uri: tokenRequestData.redirect_uri
    });

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      new URLSearchParams(tokenRequestData).toString(),
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
    console.log('Token data received:', {
      access_token: response.data.access_token ? 'present' : 'missing',
      refresh_token: response.data.refresh_token ? 'present' : 'missing',
      token_type: response.data.token_type,
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
    // Example: await storeUserTokens({
    //   access_token: response.data.access_token,
    //   refresh_token: response.data.refresh_token,
    //   locationId: userInfo?.locationId,
    //   companyId: userInfo?.companyId,
    //   expires_in: response.data.expires_in
    // });

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
    
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Response headers:', error.response?.headers);
    }
    
    console.error('Error stack:', error.stack);

    const errorMsg = encodeURIComponent('Token exchange failed: ' + (error.message || 'Unknown error'));
    const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&details=${errorMsg}`;
    console.log('Redirecting to error page:', redirectUrl);
    
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

// Token validation endpoint
app.get('/api/oauth/validate', (req, res) => {
  const token = req.cookies.oauth_token;
  
  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token found' });
  }

  // Here you would typically validate the token with GoHighLevel
  // For now, just check if it exists
  res.json({ 
    valid: true, 
    hasToken: true,
    tokenPreview: token.substring(0, 10) + '...'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`✅ Railway OAuth Backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OAuth Client ID configured: ${process.env.GHL_CLIENT_ID ? 'Yes' : 'No'}`);
  console.log(`OAuth Client Secret configured: ${process.env.GHL_CLIENT_SECRET ? 'Yes' : 'No'}`);
  console.log(`Redirect URI: ${process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback'}`);
});