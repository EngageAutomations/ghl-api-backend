# Railway-Replit Bridge System Documentation

## Overview
The Railway backend does not detect environment variables properly, so we implemented a bridge system where Replit provides OAuth credentials to Railway through API endpoints.

## Bridge Architecture

### How It Works
1. **Railway requests credentials** from Replit bridge endpoints
2. **Replit provides OAuth credentials** via `/api/bridge/oauth-credentials`
3. **Railway uses these credentials** for GoHighLevel OAuth flow
4. **No environment variables** needed on Railway side

### Bridge Endpoints (Hosted on Replit)

#### 1. OAuth Credentials Endpoint
```
GET /api/bridge/oauth-credentials
```
**Purpose**: Provides OAuth credentials to Railway backend
**Response**:
```json
{
  "success": true,
  "credentials": {
    "client_id": "68474924a586bce22a6e64f7-mbpkmyu4",
    "client_secret": "[SECRET]",
    "redirect_uri": "https://dir.engageautomations.com/api/oauth/callback",
    "bridge_source": "replit"
  }
}
```

#### 2. OAuth Processing Endpoint
```
POST /api/bridge/process-oauth
```
**Purpose**: Processes authorization codes and token exchange
**Body**: `{ code, location_id, user_id }`

#### 3. Installation Status Endpoint
```
GET /api/bridge/installation/:id
```
**Purpose**: Returns installation status for Railway

### Railway Backend Integration
Railway backend calls Replit bridge endpoints instead of using environment variables:

```javascript
// Instead of: process.env.GHL_CLIENT_ID
// Railway does: fetch('https://replit-app.com/api/bridge/oauth-credentials')
```

## Key Benefits
- **No environment variable issues** on Railway
- **Hardcoded solution** requiring no manual configuration
- **Self-contained OAuth processing** without agent intervention
- **Complete control** over credential provisioning

## Current Issue
The OAuth callback endpoint `/api/oauth/callback` exists in Railway backend code but returns "Cannot GET" error, suggesting the deployed Railway backend doesn't match the codebase.

## Solution Required
Update Railway backend via GitHub to use the bridge system and ensure OAuth callback endpoint is properly deployed.