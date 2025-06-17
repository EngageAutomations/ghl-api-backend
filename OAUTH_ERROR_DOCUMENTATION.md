# OAuth Error Documentation & Solutions

## Common OAuth Errors and Solutions

### Error E-102: "This AuthClass is not yet supported!"
**Status Code:** 401  
**Endpoint:** `/users/search` OR `/oauth/userinfo`  
**Root Cause:** Wrong user info endpoint for OAuth token type OR Railway deployment not updated

**Occurrence:** 
- June 17, 2025: `https://dir.engageautomations.com/api/oauth/callback?code=43c1fa6baecc9fc2db48179bcc76f51d812e05bb`
- June 17, 2025: `https://dir.engageautomations.com/api/oauth/callback?code=bb96da6aa333dcd5d94ef4b8bbcb3b69157bcecd`
- June 17, 2025: `https://dir.engageautomations.com/api/oauth/callback?code=4bd0213068fcd21ec138244888939b06d9a826ea`

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
- **Investigation needed:** GoHighLevel may have changed OAuth user info requirements
- **Alternative approaches:** Try different user info endpoints or authentication headers

### Error: "All OAuth user info endpoints failed"
**Status Code:** 500  
**Root Cause:** All attempted user info endpoints (oauth/userinfo, users/me, oauth/me) returning authentication failures  
**Latest Occurrence:** June 17, 2025: `https://dir.engageautomations.com/api/oauth/callback?code=4bd0213068fcd21ec138244888939b06d9a826ea`

**Critical Update - June 17, 2025:** Comprehensive endpoint testing completed with all endpoints failing
- **Test Results:** oauth/userinfo: 404, users/me: 400, oauth/me: 404, users/search: 401, locations/search: 401, locations/: 404, companies: 404
- **Pattern Analysis:** Mix of 400 (Bad Request), 401 (Unauthorized), and 404 (Not Found) errors
- **Root Cause:** Fundamental OAuth app configuration or scope issue in GoHighLevel

**Investigation Results:**
- Token exchange succeeds (access token obtained)
- ALL user info endpoints fail across 10 different approaches
- Error pattern suggests incorrect OAuth app configuration in GoHighLevel marketplace settings
- 404 errors indicate endpoints don't exist for this token type
- 401 errors suggest missing required scopes
- 400 errors indicate malformed requests or unsupported parameters

**Required Actions:**
1. **GoHighLevel App Configuration Review:** Check marketplace app settings for correct scopes and permissions
2. **Scope Verification:** Ensure app includes: `users.readonly`, `locations.readonly`, `oauth.readonly`
3. **API Version Compatibility:** Verify app is configured for correct GoHighLevel API version
4. **Token Type Analysis:** Confirm whether app generates user tokens vs. location tokens vs. agency tokens
5. **Marketplace App Status:** Verify app is approved and properly configured in GoHighLevel marketplace

### Diagnostic Checklist for GoHighLevel App Configuration

**Error Pattern Analysis:**
- **404 errors (oauth/userinfo, oauth/me, locations/, companies):** Endpoints don't exist for this token type
- **401 errors (users/search, locations/search):** Missing required OAuth scopes
- **400 errors (users/me):** Malformed request or unsupported API version

**Immediate Verification Steps:**
1. **Check GoHighLevel App Dashboard:**
   - Navigate to GoHighLevel Developer Portal
   - Verify app status: Published/Approved vs Draft/Pending
   - Review configured OAuth scopes and API permissions
   - Confirm redirect URI matches: `https://dir.engageautomations.com/api/oauth/callback`

2. **Verify Required OAuth Scopes:**
   ```
   Required Scopes for User Info Access:
   - users.readonly (for /users/me and /users/search)
   - locations.readonly (for /locations/* endpoints)
   - oauth.readonly (for /oauth/userinfo)
   - contacts.readonly (minimum scope for basic API access)
   ```

3. **API Version Configuration:**
   - Current API version: 2021-07-28
   - Verify app is configured for correct version in GoHighLevel settings
   - Some endpoints require specific API version headers

4. **Token Analysis:**
   - Check if token is agency-level vs location-level vs user-level
   - Agency tokens may not have access to user-specific endpoints
   - Location tokens may require different endpoint patterns

**Next Steps if All Verification Fails:**
1. Create new test app in GoHighLevel marketplace with minimal scopes
2. Test OAuth flow with fresh app configuration
3. Contact GoHighLevel marketplace support for API access verification
4. Review GoHighLevel API documentation for recent endpoint changes

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