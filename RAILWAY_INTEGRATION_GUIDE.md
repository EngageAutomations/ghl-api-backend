# Railway Integration Guide - Bridge System

## Overview
This guide documents the hardcoded Railway-Replit bridge system for OAuth credential management. No manual configuration required for installations.

## Bridge Endpoints You Control

### 1. OAuth Credentials Endpoint
```
GET /api/bridge/oauth-credentials
```
**Purpose**: Provides OAuth credentials to Railway backend during initialization.

**Response**:
```json
{
  "success": true,
  "credentials": {
    "client_id": "68474924a586bce22a6e64f7-mbpkmyu4", 
    "client_secret": "[from environment]",
    "redirect_uri": "https://dir.engageautomations.com/api/oauth/callback"
  }
}
```

### 2. OAuth Processing Endpoint  
```
POST /api/bridge/process-oauth
```
**Purpose**: Processes OAuth authorization codes from GoHighLevel.

**Request Body**:
```json
{
  "code": "authorization_code_from_ghl",
  "location_id": "location_id", 
  "user_id": "user_id"
}
```

**Response**:
```json
{
  "success": true,
  "installation": {
    "id": "install_timestamp",
    "access_token": "ghl_access_token",
    "location_id": "location_id"
  },
  "redirect_url": "https://listings.engageautomations.com/?installation_id=..."
}
```

### 3. Installation Status Endpoint
```
GET /api/bridge/installation/:id
```
**Purpose**: Returns installation status for Railway queries.

## Making Changes to Endpoints

### File Location
```
server/bridge-endpoints.ts
```

### Update Process
1. **Delete existing file**: `rm server/bridge-endpoints.ts`
2. **Create updated file**: Use file creation with new implementation
3. **Test endpoint**: Call bridge health check `/api/bridge/health`

### Key Implementation Points
- OAuth credentials hardcoded in `RailwayBridge.getOAuthCredentials()`
- Token exchange handled in `RailwayBridge.exchangeOAuthToken()`
- Installation data creation in `RailwayBridge.processOAuthCode()`

## Railway Backend Integration

### What Railway Does
1. Calls `/api/bridge/oauth-credentials` on startup
2. Uses received credentials for OAuth initialization
3. Forwards OAuth callbacks to `/api/bridge/process-oauth`
4. Receives processed installation data

### What You Control
- All bridge endpoint implementations
- OAuth credential provisioning
- Authorization code processing
- Installation data structure

## GitHub Update Process

### Repository Connection
Changes to bridge endpoints automatically reflect in GitHub when using delete + create method.

### File Update Workflow
1. Identify endpoint file to modify
2. Delete current implementation
3. Create updated implementation with changes
4. Bridge system automatically uses new endpoints

## Benefits
- ✓ No Railway environment variable dependencies
- ✓ Complete control over OAuth processing
- ✓ Hardcoded solution requiring no manual setup
- ✓ Self-contained system for daily operations
- ✓ Direct GitHub integration for updates

## Health Check
Test bridge system status:
```
GET /api/bridge/health
```
Returns active endpoints and system status.