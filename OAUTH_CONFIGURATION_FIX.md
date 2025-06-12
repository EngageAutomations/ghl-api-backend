# OAuth Configuration Fix Required

## Problem Identified
Your OAuth backend is configured with incorrect parameters:

**Current (Wrong) Configuration:**
- Redirect URI: `https://oauth-backend-production-66f8.up.railway.app/api/oauth/callback`
- Scopes: `locations.readonly locations.write contacts.readonly contacts.write...` (extensive list)

**Required Configuration:**
- Redirect URI: `https://dir.engageautomations.com/oauth/callback`
- Scopes: `products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write`

## Solution Applied
I've updated the backend code in `railway-deployment-package/index.js` with the correct configuration:

```javascript
const REDIRECT_URI = process.env.GHL_REDIRECT_URI || process.env.REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback';
const SCOPES = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';
```

## Next Steps Required

### Option 1: Manual Railway Deployment
1. Navigate to your Railway project dashboard: `oauth-backend-production-66f8`
2. Upload the updated `index.js` file from `railway-deployment-package/index.js`
3. Trigger a new deployment

### Option 2: Alternative Solution
Create a completely new OAuth backend deployment with the correct configuration.

## Testing the Fix
Once deployed, test the OAuth URL generation:
```bash
curl https://oauth-backend-production-66f8.up.railway.app/api/oauth/url
```

The response should contain:
- `redirect_uri=https%3A%2F%2Fdir.engageautomations.com%2Foauth%2Fcallback`
- `scope=products%2Fprices.write+products%2Fprices.readonly...`

## Expected OAuth Links After Fix
**Standard:** `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https%3A%2F%2Fdir.engageautomations.com%2Foauth%2Fcallback&client_id=68474924a586bce22a6e64f7-mbpkmyu4&scope=products%2Fprices.write+products%2Fprices.readonly...`

**Whitelabel:** `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=https%3A%2F%2Fdir.engageautomations.com%2Foauth%2Fcallback&client_id=68474924a586bce22a6e64f7-mbpkmyu4&scope=products%2Fprices.write+products%2Fprices.readonly...`