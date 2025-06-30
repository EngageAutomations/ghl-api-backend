# Railway Deployment Troubleshooting Checklist

## Current Issue
Railway "perpetual enjoyment" project returning 404 "Application not found" despite environment variable being set.

## Verified Working Components
- GitHub repository: EngageAutomations/ghl-api-backend (code is correct)
- package.json: Fixed JSON format error (builds successfully now)
- OAuth backend: https://dir.engageautomations.com (fully operational)

## Railway Configuration Checklist

### 1. Repository Connection
**Check in Railway Dashboard:**
- [ ] "perpetual enjoyment" project exists
- [ ] Settings → Source shows: EngageAutomations/ghl-api-backend
- [ ] Branch set to: main
- [ ] Root directory: / (not subfolder)

### 2. Environment Variables
**Variables Tab Should Show:**
- [ ] OAUTH_BACKEND_URL = https://dir.engageautomations.com
- [ ] PORT = (auto-detected, should not be manually set)

### 3. Build Configuration
**Settings Tab Should Show:**
- [ ] Build Command: (auto-detected from package.json)
- [ ] Start Command: npm start
- [ ] Install Command: npm install

### 4. Deployment Status
**Deployments Tab:**
- [ ] Latest deployment shows "Success" status
- [ ] Build logs show successful npm install
- [ ] Runtime logs show "Starting API backend..." message
- [ ] No error messages in deployment logs

### 5. Service Configuration
**General Tab:**
- [ ] Service name properly configured
- [ ] Region: us-east4 (or preferred region)
- [ ] Auto-deploy enabled for main branch

## Common Issues and Solutions

### Issue: 404 "Application not found"
**Possible Causes:**
1. Express app not binding to correct host/port
2. Environment variables not being loaded
3. Start command not executing properly
4. App crashing during startup

**Solutions:**
1. Check deployment logs for startup errors
2. Verify app listens on 0.0.0.0:PORT (not localhost)
3. Ensure environment variables are saved and deployed
4. Manual redeploy to refresh configuration

### Issue: Repository Not Connected
**Check:**
- Settings → Source shows correct repository
- GitHub integration is authorized
- Repository exists and is accessible

### Issue: Environment Variables Not Applied
**Steps:**
1. Add/update variables in Variables tab
2. Click Deploy button to trigger redeploy
3. Check logs for environment variable loading
4. Verify case-sensitive variable names

## Testing Endpoints

Once deployment is working, test these URLs:
```bash
# Health check
curl https://api.engageautomations.com/

# Environment check
curl https://api.engageautomations.com/debug/env

# OAuth bridge test
curl https://api.engageautomations.com/debug/test-oauth
```

## Expected Success Response
```json
{
  "service": "GoHighLevel API Backend",
  "version": "1.0.0",
  "status": "operational",
  "apis": ["products", "media", "pricing", "contacts", "workflows"],
  "oauth_backend": "https://dir.engageautomations.com"
}
```

## Custom Domain Configuration

If using api.engageautomations.com:
1. Domains tab → Add custom domain
2. Point DNS to Railway's provided CNAME
3. Wait for SSL certificate provisioning
4. Test HTTPS connectivity

## Escalation Steps

If Railway continues to return 404:
1. Delete and recreate Railway service
2. Reconnect to GitHub repository
3. Reconfigure environment variables
4. Test with Railway's auto-generated URL first
5. Add custom domain after basic functionality works

## Success Criteria

✅ Railway deployment returns 200 status
✅ Environment variables loaded correctly
✅ OAuth backend connection successful
✅ API endpoints available (protected by OAuth)
✅ Custom domain working with SSL