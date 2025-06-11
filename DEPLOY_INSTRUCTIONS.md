# Quick Railway Deployment Guide

Since the automated CLI deployment requires interactive authentication, here's the manual deployment process:

## Option 1: GitHub Repository Deploy (Recommended)

### Step 1: Create GitHub Repository
1. Go to GitHub and create a new repository called `oauth-backend`
2. Make it public or private (your choice)

### Step 2: Upload Files
Upload these files from the `railway-backend` folder to your GitHub repository:
- `server/index.ts`
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `README.md`
- `railway.json` (in temp-railway-repo folder)

### Step 3: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" 
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select the `oauth-backend` repository
5. Railway will automatically detect it's a Node.js project and deploy

### Step 4: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:
```
GHL_CLIENT_ID=68474924a586bce22a6e64f7-mbpkmyu4
GHL_CLIENT_SECRET=b5a7a120-7df7-4d23-8796-4863cbd08f94
GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback
NODE_ENV=production
```

### Step 5: Get Deployment URL
Once deployed, Railway will provide you with a URL like:
`https://oauth-backend-production-xxxx.up.railway.app`

### Step 6: Test Deployment
Visit: `https://your-railway-url.up.railway.app/health`
Should return: `{"status":"OK","service":"GHL OAuth Backend"}`

## Option 2: Direct File Upload

I can create a deployment package you can upload directly to Railway.

## Option 3: One-Click Deploy Button

I can create a Railway template with a deploy button for instant deployment.

Which option would you prefer to use?