
# Railway Hybrid OAuth Deployment Instructions v2.2.0

## Deployment Steps

1. **Replace Railway Files:**
   - Copy railway-hybrid-package.json to package.json
   - Copy railway-hybrid-index.js to index.js

2. **Deploy to Railway:**
   - Push changes to Railway service
   - Railway will automatically rebuild and deploy

3. **Verify Deployment:**
   - Check health endpoint: GET https://dir.engageautomations.com/health
   - Verify version shows 2.2.0
   - Confirm hybrid mode is active

## Test Commands

### Test Per-Request Credentials:
```bash
curl -X POST "https://dir.engageautomations.com/oauth/callback" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "YOUR_AUTH_CODE",
    "oauth_credentials": {
      "client_id": "YOUR_CLIENT_ID",
      "client_secret": "YOUR_CLIENT_SECRET",
      "redirect_uri": "https://dir.engageautomations.com/oauth/callback"
    }
  }'
```

### Test Environment Variables:
```bash
curl "https://dir.engageautomations.com/oauth/callback?code=YOUR_AUTH_CODE"
```

## Features Added

- ✅ POST /oauth/callback endpoint for per-request credentials
- ✅ Hybrid credential detection (request body → environment variables)
- ✅ Backward compatibility with existing GET endpoint
- ✅ Enhanced logging and error handling
- ✅ Railway environment variable compatibility

## Troubleshooting

If environment variables aren't working:
1. Use POST endpoint with credentials in request body
2. Check Railway logs for "Environment Variables Check" output
3. Verify OAuth credentials are correctly formatted
