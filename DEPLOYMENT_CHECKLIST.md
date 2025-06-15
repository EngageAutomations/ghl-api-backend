# OAuth Fix Deployment Checklist

## Pre-Deployment Verification
- [ ] OAuth scopes include users.read
- [ ] API routes return JSON (not HTML)
- [ ] GoHighLevel endpoint uses /v1/users/me
- [ ] Token refresh logic implemented
- [ ] Error handling returns structured JSON

## GoHighLevel App Configuration
- [ ] Update app scopes to include users.read
- [ ] Verify redirect URIs for production domains
- [ ] Test marketplace installation flow
- [ ] Confirm scope permissions in developer console

## Environment Variables (Railway/Production)
```
GHL_SCOPES=users.read products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write
GHL_CLIENT_ID=[your_client_id]
GHL_CLIENT_SECRET=[your_client_secret]
GHL_REDIRECT_URI=[production_callback_url]
```

## Testing Commands
```bash
# Test OAuth status endpoint
curl -H "Accept: application/json" "https://your-domain.com/api/oauth/status?installation_id=test"

# Test health check
curl "https://your-domain.com/api/health"

# Test direct GoHighLevel API (with real token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Version: 2021-07-28" \
     "https://services.leadconnectorhq.com/v1/users/me"
```

## Post-Deployment Verification
- [ ] OAuth flow completes successfully
- [ ] User info retrieval works
- [ ] Token refresh triggers automatically
- [ ] Error messages are user-friendly
- [ ] Multi-user isolation working
- [ ] Logging captures OAuth events

## Rollback Plan
If deployment fails:
1. Revert server routing changes
2. Restore previous OAuth scope configuration
3. Monitor error rates and user reports
4. Apply fixes and redeploy
