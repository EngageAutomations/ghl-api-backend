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

## GitHub Repository Integration

**Repository**: `https://github.com/EngageAutomations/oauth-backend`
**Access Method**: Private access token (GITHUB_TOKEN)
**Update Process**: Direct repository file modification via GitHub API

### How Railway Backend Updates Work
1. **Identify target file** (typically `index.js` in repository root)
2. **Get current file SHA** from GitHub API
3. **Create updated backend code** using bridge system instead of environment variables
4. **Push changes via GitHub API** using private access token
5. **Railway auto-deploys** from GitHub repository changes

### GitHub API Commands Used
```bash
# Get current file SHA
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js"

# Update file with new content
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js" \
  -d '{"message": "Update OAuth to use bridge system", "content": "BASE64_CONTENT", "sha": "CURRENT_SHA"}'
```

### Railway Backend Requirements
- Must call `/api/bridge/oauth-credentials` instead of using environment variables
- OAuth callback endpoint must handle authorization codes properly
- Installation storage must work with bridge-provided credentials

## Key Benefits
- **No environment variable issues** on Railway
- **Hardcoded solution** requiring no manual configuration
- **Self-contained OAuth processing** without agent intervention
- **Complete control** over credential provisioning
- **Direct GitHub updates** via API for immediate deployment

## Current Issue Resolution
The OAuth callback endpoint exists in Railway backend code but returns "Cannot GET" error because deployed backend still uses environment variables instead of bridge system.

## Solution Required
Update Railway backend via GitHub to use the bridge system and ensure OAuth callback endpoint is properly deployed.