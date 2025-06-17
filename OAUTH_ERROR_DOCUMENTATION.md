# OAuth Error Documentation & Solutions

## Common OAuth Errors and Solutions

### Error E-102: "This AuthClass is not yet supported!"
**Status Code:** 401  
**Endpoint:** `/users/search`  
**Root Cause:** Wrong user info endpoint for OAuth token type  

**Solution:** Use `/oauth/userinfo` instead of `/users/search` for OAuth tokens

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