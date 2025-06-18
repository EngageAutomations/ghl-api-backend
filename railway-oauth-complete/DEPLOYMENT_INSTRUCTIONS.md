# Railway Deployment Instructions

## Quick Deploy

1. **Upload to Railway:**
   ```bash
   # Navigate to the railway-oauth-complete directory
   cd railway-oauth-complete
   
   # Initialize Railway project (if not already done)
   railway login
   railway init
   
   # Deploy
   railway up
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set GHL_CLIENT_ID=your_client_id
   railway variables set GHL_CLIENT_SECRET=your_client_secret
   railway variables set GHL_REDIRECT_URI=https://your-railway-domain.railway.app/oauth/callback
   railway variables set GHL_SCOPES="users.read products/prices.write products/prices.readonly"
   ```

3. **Verify Deployment:**
   ```bash
   # Test health endpoint
   curl https://your-railway-domain.railway.app/api/health
   
   # Test OAuth status (should return 400 with JSON)
   curl -H "Accept: application/json" "https://your-railway-domain.railway.app/api/oauth/status?installation_id=test"
   ```

## Production Verification

After deployment, verify these endpoints return JSON:

- ✅ `/api/health` - Returns service status
- ✅ `/api/oauth/status` - Returns installation data or proper error
- ✅ `/oauth/callback` - Handles OAuth callbacks from GoHighLevel
- ✅ `/api/installations` - Lists active installations

## Environment Variables Required

- `GHL_CLIENT_ID` - Your GoHighLevel app client ID
- `GHL_CLIENT_SECRET` - Your GoHighLevel app client secret  
- `GHL_REDIRECT_URI` - Must match Railway domain
- `GHL_SCOPES` - Include "users.read" for user info retrieval

## Monitoring

Railway will automatically:
- Monitor `/api/health` endpoint
- Restart on failures
- Provide logs and metrics
- Handle SSL/TLS certificates

Ready for production OAuth flows!
