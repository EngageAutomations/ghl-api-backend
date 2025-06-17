# OAuth Error Documentation & Solutions

## Common OAuth Errors and Solutions

### Error E-102: "This AuthClass is not yet supported!"
**Status Code:** 401  
**Endpoint:** `/users/search` OR `/oauth/userinfo`  
**Root Cause:** Wrong user info endpoint for OAuth token type OR Railway deployment not updated

**Occurrence:** 
- June 17, 2025: `https://dir.engageautomations.com/api/oauth/callback?code=43c1fa6baecc9fc2db48179bcc76f51d812e05bb`
- June 17, 2025: `https://dir.engageautomations.com/api/oauth/callback?code=bb96da6aa333dcd5d94ef4b8bbcb3b69157bcecd`

**Solutions:**
1. **Endpoint Fix:** Use `/oauth/userinfo` instead of `/users/search` for OAuth tokens
2. **Deployment Issue:** Verify Railway is running the updated backend (v5.2.1)

```javascript
// WRONG - causes E-102 error
const userResponse = await fetch('https://services.leadconnectorhq.com/users/search', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// CORRECT - works with OAuth tokens
const userResponse = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

**Troubleshooting Steps:**
1. Check Railway health endpoint: `curl https://dir.engageautomations.com/health`
2. Verify version shows `5.2.1` and fixes include `E-102-error-fixed`
3. If still showing old version, redeploy the fixed backend files
4. Confirm environment variables are set: `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_REDIRECT_URI`

**Status Update - June 17, 2025:**
- Railway backend v5.2.1 deployed with `/oauth/userinfo` endpoint fix
- E-102 error persists despite correct endpoint usage
- **NEW ISSUE:** Railway deployment failed with "service unavailable" error
- **Investigation needed:** GoHighLevel may have changed OAuth user info requirements
- **Alternative approaches:** Try different user info endpoints or authentication headers

### Error: Railway Service Unavailable
**Status Code:** 503  
**Root Cause:** Complex backend deployment causing Railway service failures  
**Solution:** Deploy simplified backend with minimal dependencies and basic OAuth flow

**Deployment Constraints:**
- Railway has limited resource allocation for complex backends
- Multiple dependencies (multer, form-data, node-fetch) may cause deployment failures
- Simplified backends with core Express functionality deploy more reliably
- Focus on essential OAuth callback and basic API proxy functionality first

### Error: "Cannot GET /api/oauth/callback"
**Root Cause:** Missing OAuth callback endpoint in Railway backend  
**Solution:** Add proper OAuth callback handler in backend

### Error: Token Exchange Failed (400/401)
**Common Causes:**
1. Wrong `redirect_uri` - must match exactly what's configured in GoHighLevel app
2. Invalid `client_id` or `client_secret`
3. Expired authorization code (codes expire quickly)
4. Wrong content-type (must be `application/x-www-form-urlencoded`)

### Error: "Invalid Grant" during token exchange
**Root Cause:** Authorization code already used or expired  
**Solution:** Ensure codes are used immediately and only once

## Environment Variables Required

```bash
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret  
GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback
GHL_ACCESS_TOKEN=existing_token_for_legacy_support
```

## OAuth Flow Constraints

1. **Redirect URI Must Match Exactly**
   - GoHighLevel app config: `https://dir.engageautomations.com/api/oauth/callback`
   - Backend endpoint: `GET /api/oauth/callback`
   - Token exchange `redirect_uri` parameter: exact same URL

2. **User Info Endpoint Selection**
   - OAuth tokens: Use `/oauth/userinfo`
   - API tokens: Use `/users/search` or `/users/me`
   - Never mix endpoint types with wrong token types

3. **Content-Type Requirements**
   - Token exchange: `application/x-www-form-urlencoded`
   - API calls: `application/json`
   - User info: `application/json`

## Error Prevention Checklist

- [ ] OAuth callback endpoint exists and handles GET requests
- [ ] Environment variables are set correctly in Railway
- [ ] User info endpoint matches token type (`/oauth/userinfo` for OAuth)
- [ ] Redirect URI matches exactly between app config and code
- [ ] Token exchange uses correct content-type
- [ ] Authorization codes are used immediately (they expire quickly)
- [ ] Error handling covers all OAuth failure scenarios

## Testing OAuth Flow

1. **Test callback endpoint:** `curl https://dir.engageautomations.com/api/oauth/callback`
2. **Check environment variables:** Review Railway deployment logs
3. **Verify redirect URI:** Must match GoHighLevel app configuration exactly
4. **Test with fresh auth code:** Don't reuse authorization codes

## Future Error Documentation

When new OAuth errors occur:
1. Document the exact error message and status code
2. Identify the root cause (endpoint, headers, parameters)
3. Provide the corrected code solution
4. Add prevention steps to the checklist
5. Update this documentation immediately

This prevents repeating the same debugging cycle for OAuth integration issues.