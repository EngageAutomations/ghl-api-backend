# GoHighLevel Marketplace App Configuration Solution

## Root Cause Analysis

**Issue:** Media upload endpoints return 401 "This authClass type is not allowed to access this scope"

**Root Cause:** The GoHighLevel marketplace app is configured to generate Company-level tokens (`authClass: "Company"`) instead of Location-level tokens (`authClass: "Location"`). GoHighLevel's IAM system blocks Company-level tokens from accessing media endpoints, regardless of having the correct scopes.

## Technical Evidence

### Current Token Analysis
```json
{
  "authClass": "Company",
  "authClassId": "SGtYHkPbOl2WJV08GOpg",
  "oauthMeta": {
    "scopes": [
      "medias.write",
      "medias.readonly",
      "products.write",
      "products.readonly"
    ]
  }
}
```

### Expected Token Structure for Media Access
```json
{
  "authClass": "Location", 
  "authClassId": "WAvk87RmW9rBSDJHeOpH",
  "locationId": "WAvk87RmW9rBSDJHeOpH",
  "oauthMeta": {
    "scopes": [
      "medias.write",
      "medias.readonly"
    ]
  }
}
```

## Required Marketplace App Configuration Changes

### 1. App Distribution Type
**Current Setting:** Company/Agency-level distribution
**Required Setting:** Sub-Account/Location-level distribution

### 2. OAuth Scopes Configuration
Ensure the following scopes are properly configured:
- `medias.write` - Write access to media management
- `medias.readonly` - Read access to media files
- `products.write` - Product creation capabilities
- `products.readonly` - Product listing access

### 3. OAuth Flow Configuration
The app should be configured to request location-specific authorization:
```
https://marketplace.gohighlevel.com/oauth/chooselocation?
response_type=code&
redirect_uri=https://dir.engageautomations.com/api/oauth/callback&
client_id=68474924a586bce22a6e64f7&
scope=medias.write medias.readonly products.write products.readonly
```

## Implementation Steps

### Step 1: Access Marketplace Developer Dashboard
1. Login to https://marketplace.gohighlevel.com/
2. Navigate to "My Apps" 
3. Select the app with Client ID: `68474924a586bce22a6e64f7`

### Step 2: Update App Configuration
1. **Distribution Type:** Change from "Agency" to "Sub-Account" distribution
2. **Scopes:** Verify `medias.write` and `medias.readonly` are enabled
3. **OAuth Settings:** Ensure redirect URI points to location-level callback
4. **App Type:** Confirm app is configured for location-level installations

### Step 3: Test Configuration
1. Perform fresh OAuth installation
2. Verify JWT token shows `authClass: "Location"`
3. Test media upload with location-level token
4. Confirm all endpoints work with new token structure

## Current System Status

### ✅ Working Components
- **Product Creation:** 201 success with proper field structure
- **Pricing Creation:** 201 success with embedded pricing approach
- **OAuth Backend:** Fully operational with automatic token refresh
- **API Infrastructure:** Complete dual-backend architecture ready

### ❌ Blocked Component
- **Media Upload:** 401 IAM error due to Company-level token restriction

### 🔧 Required Action
- **Marketplace App Reconfiguration:** Update app to generate Location-level tokens

## Expected Results After Configuration Update

Once the marketplace app is properly configured:

1. **OAuth Installation:** Will generate `authClass: "Location"` tokens
2. **Media Upload:** Will return 200/201 success responses
3. **Complete Workflow:** All features (products + pricing + media) operational
4. **No Code Changes:** Existing backend code will work with new token structure

## Alternative Workaround (If App Cannot Be Reconfigured)

If the marketplace app configuration cannot be changed:

1. **Use Agency Token to Location Token Exchange:**
   - Use the "Get Location Access Token from Agency Token" endpoint
   - Exchange Company-level token for temporary Location-level token
   - Use location-specific token for media uploads

2. **API Endpoint:**
   ```
   POST https://services.leadconnectorhq.com/oauth/locationtoken
   Authorization: Bearer {company_token}
   Content-Type: application/json
   
   {
     "locationId": "WAvk87RmW9rBSDJHeOpH"
   }
   ```

## Conclusion

The technical implementation is complete and functional. The media upload issue is a configuration-level restriction that requires marketplace app settings to be updated for location-level token generation. Once resolved, the entire GoHighLevel integration workflow will be fully operational.

**Next Steps:**
1. Access GoHighLevel marketplace developer dashboard
2. Update app configuration for location-level distribution
3. Perform fresh OAuth installation to test location-level tokens
4. Verify complete workflow functionality

**Timeline:** 15-30 minutes for configuration update + fresh installation test