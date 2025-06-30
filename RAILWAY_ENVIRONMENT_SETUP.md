# Railway Environment Variable Setup Guide

## Current Status
- **Build Issue**: Fixed - package.json JSON format corrected
- **Deployment Status**: Railway deployment exists but Express app not starting
- **Root Cause**: Missing OAUTH_BACKEND_URL environment variable

## Required Fix

### In Railway Dashboard:
1. Go to https://railway.app/dashboard
2. Open "perpetual enjoyment" project
3. Click **Variables** tab
4. Add environment variable:
   ```
   Name: OAUTH_BACKEND_URL
   Value: https://dir.engageautomations.com
   ```
5. Click **Deploy** to trigger redeploy

## Verification Steps

After setting the environment variable, the API should respond with:

```json
{
  "service": "GoHighLevel API Backend",
  "version": "1.0.0", 
  "status": "operational",
  "apis": ["products", "media", "pricing", "contacts", "workflows"],
  "oauth_backend": "https://dir.engageautomations.com"
}
```

## Debug Endpoints Available

Once working, these endpoints will be available:
- `GET /debug/env` - Shows environment variables
- `GET /debug/test-oauth` - Tests OAuth backend connection
- `GET /api/products` - Tests API endpoints (requires OAuth)

## Expected Behavior

**Before environment variable**: 404 "Application not found"
**After environment variable**: 200 with service information

## OAuth Installation Persistence

Remember: OAuth installations are stored in the OAuth backend database at `dir.engageautomations.com` and will persist through all API deployments. No need to reinstall the GoHighLevel app when redeploying the API backend.

## Domain Configuration

The `api.engageautomations.com` domain is currently showing SSL certificate issues. After the environment variable fix, you may need to reconfigure the custom domain in Railway to point to the "perpetual enjoyment" project deployment.