# Railway OAuth Backend - Complete Deployment Guide

## Current Status
✅ Client Secret Provided: `b5a7a120-7df7-4d23-8796-4863cbd08f94`
✅ Updated Backend Code Ready
✅ Railway Deployment Running (needs environment variable)

## Immediate Action Required

### 1. Set Environment Variable in Railway
Go to your Railway dashboard → oauth-backend project → Variables tab:

```
GHL_CLIENT_SECRET=b5a7a120-7df7-4d23-8796-4863cbd08f94
```

### 2. Deploy Updated Code (Optional)
Your current Railway deployment is already running the correct code. However, I've added a debug endpoint to verify environment variables.

## Testing After Environment Variable Set

### Environment Check
```bash
curl https://oauth-backend-production-68c5.up.railway.app/api/env-check
```

Expected Response:
```json
{
  "hasClientId": true,
  "hasClientSecret": true,
  "hasRedirectUri": true,
  "clientIdValue": "68474924a586bce22a6e64f7-mbpkmyu4",
  "redirectUriValue": "DEFAULT_USED",
  "nodeEnv": "production"
}
```

### Full OAuth Flow Test
1. **Generate OAuth URL:**
```bash
curl https://oauth-backend-production-68c5.up.railway.app/api/oauth/url
```

2. **Test Frontend Integration:**
Visit: `https://dir.engageautomations.com/oauth.html`

## Expected OAuth Flow
1. User clicks "Connect GoHighLevel Account"
2. Frontend calls Railway `/api/oauth/url`
3. User redirected to GoHighLevel authorization
4. GoHighLevel redirects to Railway `/api/oauth/callback?code=...`
5. Railway exchanges code for tokens using client secret
6. Railway redirects to success page with user data

## Debugging Commands

### Check Current Railway Status
```bash
# Health check
curl https://oauth-backend-production-68c5.up.railway.app/health

# Environment variables (after setting GHL_CLIENT_SECRET)
curl https://oauth-backend-production-68c5.up.railway.app/api/env-check

# OAuth URL generation
curl https://oauth-backend-production-68c5.up.railway.app/api/oauth/url
```

### Test Callback with Mock Data
```bash
# This should show 422 error BEFORE setting client secret
# Should work properly AFTER setting client secret
curl -I "https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback?code=test_code&state=test_state"
```

## Root Cause Analysis
- ❌ Railway environment missing `GHL_CLIENT_SECRET`
- ✅ OAuth URL generation working
- ✅ Callback endpoint responding
- ✅ Frontend integration ready
- ✅ All other credentials configured

## Next Steps
1. Set the environment variable in Railway dashboard
2. Test the environment check endpoint
3. Test complete OAuth flow through frontend
4. Verify tokens are received and logged in Railway console

The OAuth callback failure will be resolved once the client secret is set in Railway's environment variables.