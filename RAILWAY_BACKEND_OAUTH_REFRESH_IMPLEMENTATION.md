# Railway Backend OAuth Token Refresh Implementation Report

## Executive Summary

This report outlines the required implementation of OAuth token refresh functionality for the GoHighLevel marketplace application's Railway backend. The current system captures OAuth tokens during installation but lacks automatic refresh capabilities, causing API failures when tokens expire.

## Current System Status

### Working Components
- OAuth installation flow with authorization code capture
- Access token and refresh token storage during initial OAuth
- GoHighLevel product creation API endpoint (`/api/ghl/products`)
- Installation management and debugging endpoints
- CORS configuration for custom domain access

### Critical Gap
- **Missing automatic token refresh mechanism** - tokens expire after 24 hours, breaking API functionality

## Required Implementation

### 1. OAuth Token Refresh Endpoint

**Endpoint:** `POST /api/oauth/refresh`

**Purpose:** Refresh expired access tokens using stored refresh tokens

**Request Body:**
```json
{
  "installationId": "install_1750191250983"  // Optional - defaults to most recent
}
```

**Implementation Details:**
```javascript
app.post('/api/oauth/refresh', async (req, res) => {
  try {
    const { installationId } = req.body;
    
    // Find installation (by ID or use most recent)
    const installations = storage.getAllInstallations();
    let installation = installations.find(i => i.id === installationId) || installations[0];
    
    if (!installation || !installation.ghlRefreshToken) {
      return res.status(400).json({
        success: false,
        error: 'No refresh token available'
      });
    }
    
    // Refresh token with GoHighLevel
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: installation.ghlRefreshToken,
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Update stored tokens
    installation.ghlAccessToken = access_token;
    installation.ghlRefreshToken = refresh_token || installation.ghlRefreshToken;
    installation.ghlTokenExpiresAt = new Date(Date.now() + (expires_in * 1000));
    installation.updatedAt = new Date();
    
    res.json({
      success: true,
      access_token,
      expires_at: installation.ghlTokenExpiresAt
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.response?.data || error.message
    });
  }
});
```

### 2. Enhanced Product Creation with Auto-Refresh

**Modifications to:** `POST /api/ghl/products`

**Enhancement:** Automatic token refresh before product creation attempts

**Logic Flow:**
1. Check if current access token is expired or near expiry
2. If expired, automatically call refresh endpoint
3. Retry product creation with fresh token
4. Handle refresh failures gracefully

**Implementation Addition:**
```javascript
// Add to existing /api/ghl/products endpoint
async function ensureValidToken(installation) {
  const now = new Date();
  const expiryTime = new Date(installation.ghlTokenExpiresAt);
  const timeUntilExpiry = expiryTime - now;
  
  // Refresh if token expires within 5 minutes
  if (timeUntilExpiry < (5 * 60 * 1000)) {
    console.log('Token near expiry, refreshing...');
    
    const refreshResponse = await axios.post('/api/oauth/refresh', {
      installationId: installation.id
    });
    
    if (refreshResponse.data.success) {
      installation.ghlAccessToken = refreshResponse.data.access_token;
      return refreshResponse.data.access_token;
    }
  }
  
  return installation.ghlAccessToken;
}
```

## Technical Requirements

### Environment Variables Needed
```bash
GHL_CLIENT_ID=your_gohighlevel_client_id
GHL_CLIENT_SECRET=your_gohighlevel_client_secret
```

### Dependencies
- `axios` - for HTTP requests to GoHighLevel API
- `express` - existing web framework
- Current OAuth installation storage system

### Error Handling Requirements

**Token Refresh Failures:**
- Invalid refresh token (user needs to re-authenticate)
- Network connectivity issues
- GoHighLevel API rate limiting
- Client credentials errors

**Response Codes:**
- `200` - Successful token refresh
- `400` - Missing or invalid refresh token
- `401` - Client credentials invalid
- `429` - Rate limit exceeded
- `500` - Internal server error

## Integration Points

### Frontend Integration
The local Replit application will call the refresh endpoint automatically:

```javascript
// Local server calls Railway backend for fresh tokens
const refreshResponse = await fetch('https://dir.engageautomations.com/api/oauth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ installationId: 'install_1750191250983' })
});
```

### Current Installation Data
- **Installation ID:** `install_1750191250983`
- **Location ID:** `WAvk87RmW9rBSDJHeOpH`
- **Scopes:** Products, Media, Locations, Contacts (read/write)
- **Domain:** `https://dir.engageautomations.com`

## Deployment Considerations

### Health Check Updates
Ensure existing `/health` endpoint remains functional for Railway monitoring.

### CORS Configuration
Maintain current CORS settings for custom domain access:
```javascript
app.use(cors({
  origin: [
    'https://listings.engageautomations.com',
    'https://dir.engageautomations.com',
    /\.replit\.app$/
  ],
  credentials: true
}));
```

### Logging Enhancement
Add structured logging for token refresh operations:
```javascript
console.log('=== TOKEN REFRESH REQUEST ===');
console.log('Installation ID:', installationId);
console.log('Token refreshed successfully');
console.log('New expiry:', tokenExpiresAt);
```

## Testing Requirements

### Test Scenarios
1. **Successful token refresh** - verify new access token works for API calls
2. **Expired refresh token** - handle graceful failure and re-authentication prompt
3. **Invalid installation ID** - proper error response
4. **Network failure** - retry logic and timeout handling
5. **Product creation flow** - end-to-end test with auto-refresh

### Test Endpoints
```bash
# Test token refresh
curl -X POST https://dir.engageautomations.com/api/oauth/refresh \
  -H "Content-Type: application/json" \
  -d '{"installationId": "install_1750191250983"}'

# Test product creation (should auto-refresh if needed)
curl -X POST https://dir.engageautomations.com/api/ghl/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "locationId": "WAvk87RmW9rBSDJHeOpH",
    "productType": "DIGITAL"
  }'
```

## Success Metrics

### Functional Requirements
- Token refresh endpoint responds within 2 seconds
- 99% success rate for valid refresh token requests
- Automatic product creation without manual token intervention
- Zero downtime during token refresh operations

### Business Impact
- Eliminates "authentication required" errors for users
- Seamless GoHighLevel product creation from directory interface
- Reduced support tickets related to expired tokens
- Professional user experience matching enterprise expectations

## Implementation Priority

**Phase 1 (Critical):** Implement `/api/oauth/refresh` endpoint
**Phase 2 (High):** Integrate auto-refresh into product creation flow
**Phase 3 (Medium):** Add proactive token refresh monitoring

## Code Delivery

The complete implementation code is available in:
- `railway-backend-complete-with-products.js` (updated with refresh endpoint)
- `railway-deploy/` folder (deployment-ready files)

This implementation will enable seamless GoHighLevel product creation without user authentication interruptions, providing a professional marketplace experience.