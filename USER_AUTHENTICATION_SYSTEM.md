# User Authentication System - Complete Implementation

## How User Identification Works

### OAuth-Based Authentication (No Traditional Login Required)

**Marketplace Installation = Automatic Login**
1. User installs from GoHighLevel Marketplace
2. OAuth callback creates user session automatically
3. JWT session token stored in secure cookies
4. User immediately authenticated and ready to use app

### User Identification Methods

#### 1. Session Tokens (Primary Method)
```javascript
// After OAuth installation:
const sessionToken = jwt.sign({
  userId: installation.id,
  ghlUserId: userData.id,
  locationId: locationData?.id,
  email: userData.email,
  name: userData.name
}, JWT_SECRET, { expiresIn: '7d' });

// Stored as HTTP-only cookie
res.cookie('session_token', sessionToken, {
  httpOnly: true,
  secure: true,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

#### 2. User Information Access
```javascript
// Frontend can access user info via cookie
const userInfo = JSON.parse(getCookie('user_info'));
// Contains: name, email, locationId, locationName
```

#### 3. API Authentication
```javascript
// All API calls automatically include session token
fetch('/api/auth/me')  // Returns current user info
fetch('/api/ghl/products')  // Uses session for GHL API calls
```

## API Endpoints

### User Authentication
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Clear session and logout

### Session Response Format
```json
{
  "success": true,
  "user": {
    "id": 123,
    "ghlUserId": "user_abc123",
    "name": "John Doe",
    "email": "john@company.com",
    "locationId": "loc_xyz789",
    "locationName": "My Business",
    "scopes": ["products.write", "medias.write", "contacts.read"],
    "isAuthenticated": true,
    "authType": "oauth"
  }
}
```

## Frontend Integration

### Automatic User Detection
The frontend can check authentication status:

```javascript
// Check if user is logged in
const checkAuth = async () => {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (data.success && data.user.isAuthenticated) {
      // User is logged in, show dashboard
      setUser(data.user);
      return true;
    } else {
      // User needs to authenticate
      return false;
    }
  } catch (error) {
    // Authentication failed
    return false;
  }
};
```

### User Display Component
```javascript
function UserProfile({ user }) {
  return (
    <div className="user-profile">
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <p>Location: {user.locationName}</p>
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Authentication Flow Summary

### For Marketplace Users (Your Primary Flow)
1. **Install from Marketplace** → OAuth callback → Session created → Redirect to `/api-management`
2. **Return Visits** → Session cookie validates → Direct access to dashboard
3. **Session Expires** → Automatic redirect to OAuth reconnection

### For API Calls
1. **All API requests** include session token automatically
2. **GHL API calls** use stored OAuth tokens from user's installation
3. **Token refresh** happens automatically when GHL tokens expire

## Security Features

### Session Security
- HTTP-only cookies prevent XSS attacks
- Secure flag for HTTPS-only transmission
- 7-day expiration with automatic refresh
- JWT signatures prevent tampering

### OAuth Token Management
- Access tokens stored securely in database
- Automatic refresh when tokens expire
- Scoped permissions based on user's GHL installation
- Secure token encryption in database

## User Experience

### Seamless Experience
- No login screens required for marketplace users
- Automatic session persistence across visits
- Immediate access to directory and product management
- Professional domain with custom branding

### Error Handling
- Expired sessions redirect to OAuth reconnection
- Failed API calls show clear error messages
- Automatic token refresh prevents interruptions
- Graceful fallbacks for authentication issues

Your marketplace app now provides enterprise-grade authentication with zero friction for users installing from the GoHighLevel Marketplace.