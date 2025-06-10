# Users Table Detailed Report

**Date:** June 9, 2025  
**Database:** PostgreSQL  
**Schema Status:** OAuth fields defined, migration pending

## Table Overview

The users table serves as the central authentication and user management entity for the GoHighLevel Directory Extension. It supports both traditional local authentication and OAuth-based authentication from GoHighLevel marketplace installations.

## Current Schema Definition

### Core User Fields

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `username` | TEXT | NOT NULL, UNIQUE | User login identifier |
| `password` | TEXT | NULLABLE | Local auth password (optional for OAuth users) |
| `display_name` | TEXT | NULLABLE | User's display name |
| `email` | TEXT | NULLABLE | User's email address |

### GoHighLevel OAuth Fields

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `ghl_user_id` | TEXT | UNIQUE | GoHighLevel user identifier |
| `ghl_access_token` | TEXT | NULLABLE | OAuth access token (encrypted) |
| `ghl_refresh_token` | TEXT | NULLABLE | OAuth refresh token (encrypted) |
| `ghl_token_expiry` | TIMESTAMP | NULLABLE | Token expiration timestamp |
| `ghl_scopes` | TEXT | NULLABLE | Space-separated OAuth scopes |
| `ghl_location_id` | TEXT | NULLABLE | Connected GHL location ID |
| `ghl_location_name` | TEXT | NULLABLE | Connected GHL location name |

### System Fields

| Field | Type | Constraints | Default | Purpose |
|-------|------|-------------|---------|---------|
| `auth_type` | TEXT | NOT NULL | 'local' | Authentication method ('local' or 'oauth') |
| `is_active` | BOOLEAN | NOT NULL | true | Account active status |
| `created_at` | TIMESTAMP | NOT NULL | NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | NOW() | Last modification timestamp |

## Current Database State

### Existing Records
- **Total Users:** 3
- **Authentication Type:** All local accounts
- **OAuth Users:** 0 (OAuth fields not yet migrated)

### Sample Data
```sql
id | username                          | email                             | auth_type
1  | dewitt_daugherty@ourtimesupport.com | dewitt_daugherty@ourtimesupport.com | local
2  | harrison46@ourtimesupport.com     | harrison46@ourtimesupport.com     | local  
3  | clara_espino@ourtimesupport.com   | clara_espino@ourtimesupport.com   | local
```

## OAuth Integration Support

### User Creation Flow

**OAuth User Registration:**
```typescript
// OAuth user creation (server/storage.ts)
async createOAuthUser(userData: {
  email: string;
  name: string;
  ghlUserId: string;
  ghlLocationId: string;
  ghlLocationName: string;
  ghlScopes: string;
})
```

**Token Management:**
```typescript
// OAuth token storage (server/storage.ts)
async updateUserOAuthTokens(userId: number, tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
})
```

### Schema Validation

**OAuth User Schema:**
```typescript
export const insertOAuthUserSchema = createInsertSchema(users).pick({
  username: true,
  displayName: true,
  email: true,
  ghlUserId: true,
  ghlLocationId: true,
  ghlLocationName: true,
  ghlScopes: true,
  authType: true,
});
```

**Traditional User Schema:**
```typescript
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});
```

## Migration Status

### Pending Database Migration

The OAuth fields are defined in the schema but not yet applied to the database. Migration is pending with the following changes:

**Required Migrations:**
```sql
-- Add OAuth fields to existing users table
ALTER TABLE users ADD COLUMN ghl_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN ghl_access_token TEXT;
ALTER TABLE users ADD COLUMN ghl_refresh_token TEXT;
ALTER TABLE users ADD COLUMN ghl_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN ghl_scopes TEXT;
ALTER TABLE users ADD COLUMN ghl_location_id TEXT;
ALTER TABLE users ADD COLUMN ghl_location_name TEXT;
ALTER TABLE users ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Make password optional for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### Migration Strategy

**Safe Migration Approach:**
1. Add new columns with NULL defaults
2. Set existing users' auth_type to 'local'
3. Backfill created_at/updated_at for existing records
4. Apply unique constraint on ghl_user_id

## Related Tables

### OAuth Sessions Table

**Purpose:** Secure token storage separate from users table

```sql
CREATE TABLE oauth_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ghl_access_token TEXT NOT NULL, -- Encrypted
  ghl_refresh_token TEXT NOT NULL, -- Encrypted
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

### Token Encryption
- OAuth tokens stored with encryption
- Environment-based encryption keys
- Separate session management for sensitive data

### Data Privacy
- PII fields properly protected
- Unique constraints prevent duplicate accounts
- Soft delete capability through is_active field

### Access Control
- User isolation by user_id foreign keys
- OAuth scope validation
- Session-based authentication

## Usage Patterns

### Authentication Types

**Local Authentication:**
- Username/password validation
- Traditional session management
- Backward compatibility maintained

**OAuth Authentication:**
- GoHighLevel marketplace installation
- Automatic account creation
- Token-based API access

### API Integration

**User Lookup Methods:**
```typescript
// By username (local auth)
getUserByUsername(username: string)

// By GoHighLevel ID (OAuth)
getUserByGhlId(ghlUserId: string)

// By email (both auth types)
getUserByEmail(email: string)
```

## Recommendations

### Immediate Actions
1. **Complete Migration:** Apply OAuth schema changes to database
2. **Data Validation:** Ensure existing users maintain functionality
3. **Testing:** Verify both auth types work correctly

### Future Enhancements
1. **Token Refresh:** Automated token renewal system
2. **Multi-Location:** Support for multiple GHL locations per user
3. **Analytics:** User behavior and OAuth flow tracking
4. **Audit Trail:** Enhanced logging for security compliance

## Conclusion

The users table is architected to support both traditional and OAuth authentication methods. The schema provides comprehensive support for GoHighLevel marketplace integration while maintaining backward compatibility with existing local accounts. Migration completion will enable full OAuth functionality for marketplace app installations.

---

**Schema Status:** Defined, Migration Pending  
**OAuth Support:** Implemented, Not Deployed  
**Data Integrity:** Preserved for Existing Users