# OAuth Migration Report: Converting from User Login to GoHighLevel OAuth

## Executive Summary

The current application uses a traditional username/password authentication system with local user storage. To function as a proper GoHighLevel marketplace app, we need to migrate to OAuth 2.0 authentication that integrates with GoHighLevel's authorization system.

## Current Authentication Architecture

### Frontend Components
- **Login Page** (`client/src/pages/login.tsx`): Email/password form
- **AuthContext** (`client/src/context/AuthContext.tsx`): Manages user state in localStorage
- **ProtectedRoute** (`client/src/App.tsx`): Guards routes based on localStorage user data

### Backend Components
- **Auth Routes** (`server/routes.ts`): `/api/auth/login` and `/api/auth/register`
- **User Storage** (`shared/schema.ts`): Local user database with password hashing
- **Session Management**: Currently using localStorage on frontend

### Current Flow
1. User enters email/password
2. Backend validates or auto-creates user account
3. User data stored in localStorage
4. Routes protected by checking localStorage

## Required Changes for GoHighLevel OAuth

### 1. Authentication Flow Changes

**Current Flow:**
```
User → Login Form → Local DB → localStorage → App Access
```

**New OAuth Flow:**
```
User → GHL OAuth → Authorization Code → Access Token → App Access
```

### 2. Frontend Modifications

#### Replace Login Page
- Remove email/password form
- Add "Connect with GoHighLevel" button
- Redirect to GHL OAuth authorization URL
- Handle OAuth callback with authorization code

#### Update AuthContext
- Remove password-based login
- Add OAuth token management
- Store GHL access tokens securely
- Handle token refresh automatically

#### Modify ProtectedRoute
- Check for valid GHL access token instead of localStorage user
- Verify token validity with GHL API
- Redirect to OAuth flow if token invalid/missing

### 3. Backend Modifications

#### OAuth Routes
```javascript
// New routes needed:
GET  /auth/ghl/authorize    // Redirect to GHL OAuth
GET  /auth/ghl/callback     // Handle OAuth callback
POST /auth/ghl/refresh      // Refresh access tokens
POST /auth/ghl/logout       // Revoke tokens
```

#### User Model Updates
```javascript
// Replace password-based fields with:
- ghlUserId: string
- ghlAccessToken: string (encrypted)
- ghlRefreshToken: string (encrypted)
- ghlTokenExpiry: Date
- ghlScopes: string[]
- ghlAccountInfo: JSON
```

#### Session Management
- Implement JWT tokens for app sessions
- Store GHL tokens securely (encrypted in database)
- Add middleware to verify GHL token validity
- Automatic token refresh before expiry

### 4. Database Schema Changes

#### User Table Modifications
```sql
-- Remove:
ALTER TABLE users DROP COLUMN password;

-- Add:
ALTER TABLE users ADD COLUMN ghl_user_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN ghl_access_token TEXT; -- encrypted
ALTER TABLE users ADD COLUMN ghl_refresh_token TEXT; -- encrypted
ALTER TABLE users ADD COLUMN ghl_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN ghl_scopes TEXT[];
ALTER TABLE users ADD COLUMN ghl_account_info JSONB;
```

#### New OAuth Sessions Table
```sql
CREATE TABLE oauth_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE,
  user_id INTEGER REFERENCES users(id),
  ghl_access_token TEXT, -- encrypted
  ghl_refresh_token TEXT, -- encrypted
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Security Considerations

#### Token Storage
- Encrypt all OAuth tokens in database
- Use secure HTTP-only cookies for session management
- Implement proper CSRF protection
- Add rate limiting to OAuth endpoints

#### Scope Management
- Request minimal required scopes from GHL
- Store granted scopes with user record
- Validate scope permissions before API calls
- Handle scope changes gracefully

### 6. GoHighLevel Integration Requirements

#### App Registration
- Register app in GHL marketplace
- Configure OAuth redirect URIs
- Set required scopes and permissions
- Obtain client ID and client secret

#### Required Scopes
```javascript
const REQUIRED_SCOPES = [
  'contacts.readonly',
  'contacts.write', 
  'campaigns.readonly',
  'campaigns.write',
  'locations.readonly'
];
```

#### Webhook Setup
- Configure webhooks for user changes
- Handle account disconnections
- Process scope permission changes
- Update local user data accordingly

### 7. Implementation Priority

#### Phase 1: Core OAuth Setup
1. Register app with GoHighLevel
2. Create OAuth service class
3. Add OAuth routes to backend
4. Update user schema for GHL data

#### Phase 2: Frontend Migration  
1. Replace login page with OAuth flow
2. Update AuthContext for token management
3. Modify ProtectedRoute logic
4. Add token refresh mechanism

#### Phase 3: Data Migration
1. Create migration scripts for existing users
2. Add OAuth session management
3. Implement secure token storage
4. Add proper error handling

#### Phase 4: Testing & Optimization
1. Test complete OAuth flow
2. Verify token refresh works
3. Test error scenarios
4. Performance optimization

### 8. Environment Variables Needed

```env
# GoHighLevel OAuth Configuration
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
GHL_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/ghl/callback
GHL_API_BASE_URL=https://rest.gohighlevel.com/v1

# Session Management
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key

# Database
DATABASE_URL=your_database_url
```

### 9. Files Requiring Updates

#### Frontend Files
- `client/src/pages/login.tsx` - Complete rewrite
- `client/src/context/AuthContext.tsx` - OAuth integration
- `client/src/App.tsx` - Update ProtectedRoute
- `client/src/components/layout/TopNavbar.tsx` - Add disconnect option

#### Backend Files
- `server/routes.ts` - Add OAuth routes
- `server/auth/oauth.ts` - New OAuth service
- `server/middleware/auth.ts` - New auth middleware
- `shared/schema.ts` - Update user schema
- `server/storage.ts` - Update user operations

#### Configuration Files
- Database migration scripts
- Environment variable updates
- OAuth app configuration

### 10. Testing Strategy

#### Unit Tests
- OAuth flow components
- Token refresh mechanism
- Error handling scenarios
- Database operations

#### Integration Tests
- Complete OAuth flow
- GHL API integration
- Token storage/retrieval
- Session management

#### Security Tests
- Token encryption/decryption
- CSRF protection
- Rate limiting
- Input validation

### 11. Rollback Plan

#### Database Backup
- Backup current user data
- Create rollback migration scripts
- Test data integrity

#### Feature Flags
- Implement feature toggles
- Allow gradual migration
- Easy rollback if issues arise

## Conclusion

Migrating to GoHighLevel OAuth requires significant changes across the entire authentication system. The migration touches frontend components, backend routes, database schema, and security implementations. 

**Estimated Timeline:** 2-3 weeks for complete implementation
**Risk Level:** Medium - requires careful handling of user sessions and token security
**Benefits:** Proper GHL marketplace integration, improved security, better user experience

The migration should be done incrementally with thorough testing at each phase to ensure data integrity and system stability.