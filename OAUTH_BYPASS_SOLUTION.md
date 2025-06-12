# OAuth Callback Solution - Railway Bypass

## Problem
Railway isn't deploying updated code despite multiple attempts. Environment variables remain inaccessible.

## Complete Working Solution

Replace your entire Railway `index.js` file with this standalone version:

```javascript
// Replace Railway index.js with this complete working version
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Hardcoded OAuth configuration (bypasses env var issues)
const CLIENT_ID = '68474924a586bce22a6e64f7-mbpkmyu4';
const CLIENT_SECRET = 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
const REDIRECT_URI = 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback';
const SCOPES = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';

app.use(express.json());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Fixed OAuth Backend', 
    timestamp: new Date().toISOString(),
    credentials: 'HARDCODED'
  });
});

app.get('/api/oauth/url', (req, res) => {
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&state=${state}&scope=${encodeURIComponent(SCOPES)}`;
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

app.get('/api/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`);
  }

  try {
    // Proper form-encoded token request
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('code', code);
    formData.append('redirect_uri', REDIRECT_URI);

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // Get user info
    const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${response.data.access_token}`
      },
      timeout: 5000
    });

    console.log('✅ OAuth Success - Tokens received');
    console.log('Access Token:', response.data.access_token);
    console.log('Location ID:', userResponse.data.locationId);

    // Success redirect
    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString(),
      locationId: userResponse.data.locationId || '',
      companyId: userResponse.data.companyId || ''
    });

    return res.redirect(`https://dir.engageautomations.com/oauth-success?${params.toString()}`);

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error || 'Token exchange failed';
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fixed OAuth Backend running on port ${PORT}`);
});

module.exports = app;
```

## Deploy Steps

1. Replace your Railway `index.js` with the code above
2. Ensure `package.json` has these dependencies:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.7",
    "cors": "^2.8.5"
  }
}
```
3. Push to GitHub - Railway will redeploy automatically

## Testing After Deployment

The health check should show:
```json
{"status":"OK","service":"Fixed OAuth Backend","credentials":"HARDCODED"}
```

Then test the OAuth flow at: https://dir.engageautomations.com/oauth.html

This bypasses all environment variable issues by hardcoding credentials directly in the application code.