# Railway Migration Guide - OAuth Fix Implementation

This guide implements the hybrid architecture solution to fix OAuth callback failures on Replit by deploying the OAuth backend to Railway while keeping the frontend on Replit.

## Problem Solved

Replit's production deployment serves static files before backend routes, breaking OAuth callbacks that require server-side token exchange. This migration moves only the OAuth handling to Railway where it functions properly.

## Architecture Overview

| Component | Platform | Status |
|-----------|----------|---------|
| Frontend (React/Vite) | Replit | ✅ Unchanged |
| OAuth Backend | Railway | ✅ New deployment |
| Domain | dir.engageautomations.com | ✅ Proxied routing |
| Database | Replit PostgreSQL | ✅ Unchanged |

## Deployment Steps

### Step 1: Deploy Railway Backend

1. Create a new GitHub repository with the `railway-backend` folder contents
2. Go to [Railway.app](https://railway.app) and click "New Project"
3. Select "Deploy from GitHub Repo" and connect your repository
4. Railway will automatically detect the Node.js project and deploy

### Step 2: Configure Environment Variables

In Railway dashboard, go to Variables and add:

```
GHL_CLIENT_ID=68474924a586bce22a6e64f7-mbpkmyu4
GHL_CLIENT_SECRET=b5a7a120-7df7-4d23-8796-4863cbd08f94
GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback
NODE_ENV=production
```

### Step 3: Update Replit Configuration

Add Railway backend URL as environment variable in Replit:

```
RAILWAY_BACKEND_URL=https://your-railway-app-name.up.railway.app
```

### Step 4: Test Deployment

1. Visit your Railway app URL + `/health` to verify deployment
2. Test OAuth callback: `https://your-railway-app.up.railway.app/api/oauth/callback`
3. Should return: "Railway OAuth backend is working!"

## OAuth Flow After Migration

1. User clicks "Connect with GoHighLevel" on Replit frontend
2. Redirected to GoHighLevel marketplace authorization
3. User authorizes the app and selects location
4. GoHighLevel redirects to: `https://dir.engageautomations.com/api/oauth/callback?code=...`
5. Replit proxies `/api/oauth/*` requests to Railway backend
6. Railway backend handles token exchange with GoHighLevel
7. Railway stores tokens in secure cookies
8. Railway redirects back to Replit frontend with success status

## Verification Steps

After deployment, test the complete flow:

1. **Backend Health Check**
   ```bash
   curl https://your-railway-app.up.railway.app/health
   ```
   Should return: `{"status":"OK","service":"GHL OAuth Backend"}`

2. **OAuth URL Generation**
   ```bash
   curl https://your-railway-app.up.railway.app/api/oauth/url
   ```
   Should return OAuth authorization URL

3. **Complete OAuth Flow**
   - Use the generated OAuth URL
   - Install app in GoHighLevel
   - Verify successful redirect and token storage

## Benefits

- ✅ OAuth callbacks work properly on Railway
- ✅ Frontend remains on Replit (no migration needed)
- ✅ Custom domain preserved with proxy routing
- ✅ Minimal infrastructure changes
- ✅ PostgreSQL database connection maintained
- ✅ Development workflow unchanged

## File Structure

```
railway-backend/
├── server/
│   └── index.ts          # Express OAuth backend
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # Deployment instructions
```

## API Endpoints

Railway backend provides:

- `GET /health` - Health check
- `GET /api/oauth/callback` - OAuth callback handler (main fix)
- `GET /api/oauth/url` - Generate OAuth authorization URL
- `GET /api/oauth/validate` - Validate stored tokens

## Next Steps

1. Deploy the Railway backend using the provided files
2. Configure environment variables in Railway
3. Test the OAuth flow end-to-end
4. Monitor Railway logs for successful token exchanges
5. Update GoHighLevel marketplace settings if needed

This solution resolves the Replit OAuth limitation while maintaining all existing functionality and minimal disruption to the current setup.