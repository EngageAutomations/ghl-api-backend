# GitHub + Railway Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon → "New repository"
3. Repository name: `oauth-backend`
4. Set to **Public** (easier for Railway deployment)
5. Click "Create repository"

## Step 2: Upload Files to GitHub

You need to upload these files from the `railway-deploy` folder:

### File 1: package.json
```json
{
  "name": "ghl-oauth-backend",
  "version": "1.0.0",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "node server/index.js"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### File 2: server/index.js
Copy the entire content from `railway-deploy/server/index.js`

### Repository Structure
Your GitHub repo should look like:
```
oauth-backend/
├── package.json
└── server/
    └── index.js
```

## Step 3: Connect GitHub to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select your `oauth-backend` repository
6. Railway will automatically detect it's a Node.js project

## Step 4: Set Environment Variables

In Railway project dashboard:
1. Go to Variables tab
2. Add these variables:

```
GHL_CLIENT_ID=68474924a586bce22a6e64f7-mbpkmyu4
GHL_CLIENT_SECRET=b5a7a120-7df7-4d23-8796-4863cbd08f94
GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback
NODE_ENV=production
```

## Step 5: Deploy and Test

1. Railway automatically builds and deploys
2. Wait 2-3 minutes for deployment to complete
3. Get your Railway URL from the dashboard
4. Test: Visit `https://your-railway-url.up.railway.app/health`
5. Should return: `{"status":"OK","service":"GHL OAuth Backend"}`

## Step 6: Update GoHighLevel Settings

In your GoHighLevel marketplace app:
- Change redirect URI to: `https://your-railway-url.up.railway.app/api/oauth/callback`

## Benefits

- Automatic deployments when you push to GitHub
- Easy updates by pushing new commits
- Built-in CI/CD pipeline
- Version control for your OAuth backend

The OAuth callbacks will now work properly through Railway while your frontend continues running on Replit.