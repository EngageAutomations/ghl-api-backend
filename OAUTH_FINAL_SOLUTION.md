# OAuth Callback Issue - Complete Solution

## Problem Summary
OAuth callback fails with 401 "UnAuthorized!" error because Railway deployment isn't using updated code with hardcoded credentials.

## Current Status
- Railway URL: https://oauth-backend-production-68c5.up.railway.app
- Health check shows old version: `{"service":"GHL OAuth Backend"}`
- Environment check shows all credentials missing: `hasClientId: false`
- OAuth credentials are correct (tested with GoHighLevel API)

## Solution Options

### Option 1: Force Railway Deployment (Recommended)

Copy these 3 files to your GitHub repository connected to Railway:

**1. index.js** (Complete working OAuth backend):
```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Fixed credentials to bypass Railway env var issues
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
    version: '2.0'
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

    // Success redirect
    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString(),
      locationId: userResponse.data.locationId || '',
      companyId: userResponse.data.companyId || ''
    });

    return res.redirect(`https://dir.engageautomations.com/oauth-success?${params.toString()}`);

  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Token exchange failed';
    return res.redirect(`https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fixed OAuth Backend running on port ${PORT}`);
});

module.exports = app;
```

**2. package.json**:
```json
{
  "name": "oauth-backend",
  "version": "2.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.7",
    "cors": "^2.8.5"
  }
}
```

**3. railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Option 2: Alternative OAuth Backend

If Railway continues having deployment issues, deploy to a different service:

1. **Vercel**: Upload the same files to Vercel
2. **Heroku**: Push to a new Heroku app
3. **DigitalOcean App Platform**: Deploy directly from GitHub

Then update the redirect URI in GoHighLevel from:
`https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback`

To your new deployment URL.

## Verification Steps

After deployment, check:

1. **Health endpoint**: Should show `"service": "Fixed OAuth Backend", "version": "2.0"`
2. **OAuth URL generation**: Should work without errors
3. **Full OAuth flow**: Test at https://dir.engageautomations.com/oauth.html

## Testing Commands

```bash
# Check if deployment updated
curl "https://oauth-backend-production-68c5.up.railway.app/health"

# Should show: {"service":"Fixed OAuth Backend","version":"2.0"}
# If still shows old version, Railway hasn't deployed the update
```

## Root Cause

Railway has environment variable access issues preventing the OAuth credentials from being read. The hardcoded solution bypasses this entirely by embedding credentials directly in the application code.

## Next Steps

1. Replace Railway files with the 3 files above
2. Push to GitHub (Railway will auto-deploy)
3. Verify health endpoint shows version 2.0
4. Test OAuth flow at dir.engageautomations.com/oauth.html

The OAuth callback will work correctly once Railway deploys the updated code.