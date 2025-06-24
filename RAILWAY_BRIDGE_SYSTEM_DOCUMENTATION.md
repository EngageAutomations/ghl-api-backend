# Railway-Replit Bridge System Documentation

## System Overview
Railway cannot detect environment variables set in its dashboard. Instead, we implement a bridge system where Railway requests OAuth credentials from Replit endpoints during initialization and OAuth processing.

## Architecture
- **Railway Backend**: Requests credentials from Replit bridge endpoints
- **Replit Bridge**: Provides secure credential endpoints for Railway
- **Hardcoded Implementation**: No manual configuration required for installations

## Bridge Endpoints (Replit Side)

### 1. Credential Request Endpoint
```
GET /api/bridge/oauth-credentials
```
Returns OAuth credentials for Railway backend initialization.

### 2. Authorization Code Processing Endpoint  
```
POST /api/bridge/process-oauth
Body: { code, location_id, user_id }
```
Processes OAuth authorization codes and returns access tokens.

## Railway Integration Points

### 1. Backend Initialization
Railway backend calls Replit bridge during startup to get OAuth credentials.

### 2. OAuth Callback Processing
Railway forwards OAuth callbacks to Replit bridge for token exchange.

## Implementation Benefits
- ✓ Bypasses Railway environment variable detection issues
- ✓ Hardcoded solution requiring no manual setup
- ✓ Secure credential handling through API endpoints
- ✓ Self-contained system for day-to-day operations
- ✓ No agent intervention required for installations

## Update Process
Changes to bridge endpoints can be made through delete + create file method:
1. Identify endpoint file to update
2. Delete existing file: `rm filename`  
3. Create updated file with new implementation
4. Test endpoint functionality

## Documentation Maintenance
This documentation replaces all previous Railway environment variable approaches. The bridge system is the authoritative method for Railway-Replit OAuth integration.