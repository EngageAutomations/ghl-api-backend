# GitHub Repository Updates for Railway Deployment

## What Changed in Your Railway Backend

Your Railway backend now includes complete database functionality to store OAuth access tokens:

### New Database Features Added:
- Complete PostgreSQL schema for OAuth installations
- Storage functions for access tokens, refresh tokens, user data
- Debug endpoints to verify token capture
- Full OAuth installation tracking

### Files Updated:
1. **package.json** - Added database dependencies (@neondatabase/serverless, drizzle-orm)
2. **index.js** - Complete database integration with OAuth token storage
3. **New endpoints** - Debug APIs to verify installations and token capture

## Required Actions for GitHub/Railway Integration

### Step 1: Commit Changes to GitHub
Your Railway deployment reads from your connected GitHub repository. Push these changes:

```bash
cd railway-backend
git add .
git commit -m "Add complete database integration for OAuth token storage"
git push origin main
```

### Step 2: Railway Environment Variables
Ensure these are set in your Railway project:
- `GHL_CLIENT_ID` (your GoHighLevel app client ID)
- `GHL_CLIENT_SECRET` (your GoHighLevel app client secret)  
- `GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback`
- `DATABASE_URL` (Railway provides this automatically with PostgreSQL)

### Step 3: Database Setup
Railway will automatically provision a PostgreSQL database. Your app will create the oauth_installations table on first run.

### Step 4: Domain Configuration
In Railway dashboard:
- Settings > Domains > Add custom domain: `dir.engageautomations.com`
- Update DNS records as instructed

### Step 5: Update GoHighLevel
Change your app's redirect URI from:
```
https://dir.engageautomations.com/
```
To:
```
https://dir.engageautomations.com/api/oauth/callback
```

## Verification Endpoints

Once deployed, verify OAuth token capture:
- Health: `https://dir.engageautomations.com/health`
- OAuth URL: `https://dir.engageautomations.com/api/oauth/url`
- Installations: `https://dir.engageautomations.com/api/debug/installations`

## Result

After these updates:
- All GoHighLevel marketplace installations will capture access tokens
- User data, location data, and tokens stored permanently in PostgreSQL
- Complete OAuth installation tracking for marketplace functionality
- Real marketplace features enabled with persistent token storage