# OAuth Solution - Fresh Start

## Problem
Replit's production environment doesn't handle OAuth callbacks properly due to static file serving taking precedence over Express routes.

## Solution
Create a simple Railway proxy that forwards OAuth callbacks to your existing Replit backend.

## Step 1: Create New GitHub Repository

1. Go to GitHub.com
2. Create new repository: `oauth-proxy`
3. Set to Public
4. Don't add README, .gitignore, or license

## Step 2: Add Two Files

### File 1: package.json
```json
{
  "name": "oauth-proxy",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

### File 2: index.js
```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'OAuth Proxy' });
});

app.get('/api/oauth/callback', (req, res) => {
  console.log('OAuth callback received:', req.query);
  
  const queryParams = new URLSearchParams(req.query).toString();
  const replitUrl = `https://dir.engageautomations.com/api/oauth/callback?${queryParams}`;
  
  console.log('Redirecting to:', replitUrl);
  res.redirect(replitUrl);
});

app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});
```

## Step 3: Deploy to Railway

1. Go to Railway.app
2. New Project → Deploy from GitHub
3. Connect GitHub account
4. Select `oauth-proxy` repository
5. Railway auto-deploys (no environment variables needed)

## Step 4: Test and Update

1. Test health: `https://your-railway-url.up.railway.app/health`
2. Update GoHighLevel redirect URI to: `https://your-railway-url.up.railway.app/api/oauth/callback`

## How It Works

1. GoHighLevel sends OAuth callback to Railway
2. Railway immediately forwards to your Replit backend
3. Your existing Replit OAuth logic handles everything else

Simple, clean, no complex configuration needed.