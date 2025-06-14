# Embedded CRM Tab Access Solution

## Problem Solved
When your app runs as a tab within GoHighLevel CRM, users may lose session access due to:
- Cleared cookies or browser cache
- Different devices accessing the same GHL account
- Browser security policies for embedded iframes
- Extended periods of inactivity

## Complete Solution Implemented

### Session Recovery System
Automatic detection and recovery for embedded CRM tab access using multiple identification methods:

#### URL Parameters for Recovery
```
https://listings.engageautomations.com/?ghl_user_id=USER_ID&ghl_location_id=LOCATION_ID&embedded=true
```

#### Recovery Priority Order
1. **GoHighLevel User ID** (most reliable)
2. **Location ID** (fallback method)
3. **Installation ID** (development/testing)

### API Endpoints Added

#### Session Recovery
```
GET /api/auth/recover?ghl_user_id=USER_ID&ghl_location_id=LOCATION_ID&embedded=true
```
- Finds existing OAuth installation by user/location
- Creates new session automatically
- Sets iframe-compatible cookies with `sameSite: 'none'`
- Redirects to dashboard with recovered session

#### Embedded Session Check
```
GET /api/auth/check-embedded
```
- Validates current session status
- Returns recovery parameters if session invalid
- Provides authentication status for frontend

### Enhanced Cookie Configuration

#### Iframe-Compatible Settings
```javascript
res.cookie('session_token', token, {
  httpOnly: true,
  secure: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: 'none' // Required for iframe embedding
});
```

### Root Route Enhancement
Updated main route to handle embedded CRM tab scenarios:

```javascript
// Embedded CRM tab access detection
if ((ghl_user_id || ghl_location_id) && !code) {
  // Automatic session recovery
  return recoverSession(req, res);
}
```

## User Experience Flow

### First Time Access (Installation)
1. User installs app from GoHighLevel Marketplace
2. OAuth callback creates session and stores installation
3. User redirected to directory management interface

### Subsequent CRM Tab Clicks
1. User clicks app tab in GoHighLevel CRM
2. GHL passes user/location parameters in URL
3. App detects embedded access and recovers session automatically
4. User immediately accesses directory management interface

### Different Device Access
1. User opens GHL CRM on different device
2. Clicks app tab with same user/location parameters
3. App finds existing installation in database
4. Creates new session for the device
5. User accesses full functionality without re-installation

## Technical Implementation

### Database Lookup Strategy
```javascript
// Priority 1: User ID lookup
const installation = await storage.getOAuthInstallation(ghl_user_id);

// Priority 2: Location ID fallback
const installations = await storage.getAllOAuthInstallations();
const locationInstallation = installations.find(
  inst => inst.ghlLocationId === ghl_location_id && inst.isActive
);
```

### Session Creation
```javascript
const sessionToken = jwt.sign({
  userId: installation.id,
  ghlUserId: installation.ghlUserId,
  locationId: installation.ghlLocationId,
  recovered: true,
  timestamp: Date.now()
}, JWT_SECRET, { expiresIn: '7d' });
```

### Error Handling
- Invalid/expired installations return clear error messages
- Failed recovery prompts for app reinstallation
- Graceful fallbacks for missing parameters

## Security Considerations

### Session Security
- JWT tokens with 7-day expiration
- HTTP-only cookies prevent XSS attacks
- Secure flag for HTTPS-only transmission
- Database validation for active installations

### OAuth Token Management
- Existing OAuth tokens remain valid
- No re-authentication required for legitimate users
- Automatic token refresh when GHL tokens expire

## Browser Compatibility

### Iframe Support
- `sameSite: 'none'` for cross-origin iframe embedding
- Secure cookie requirements for modern browsers
- Fallback mechanisms for restrictive browser policies

### Cross-Device Support
- Session recovery works across any device
- No device-specific token storage
- Universal access through GHL user identification

## Monitoring and Debugging

### Recovery Logging
```javascript
console.log('Session recovery requested:', {
  ghlUserId: ghl_user_id,
  ghlLocationId: ghl_location_id,
  isEmbedded: embedded === 'true'
});
```

### Success Indicators
- Successful recovery creates session with `recovered: true` flag
- Failed recovery logs specific error conditions
- Frontend receives clear success/failure responses

Your GoHighLevel marketplace app now provides seamless access regardless of cookies, devices, or browser restrictions while maintaining enterprise-grade security.