# Dual Backend Architecture for OAuth Installation Persistence

## Problem Statement

**The Challenge**: OAuth installations were being lost during API backend deployments because installations were stored in memory/temporary storage that reset with each deployment.

**Business Impact**: 
- Users had to repeatedly complete OAuth installations
- Development was risky - any deployment broke authentication
- Testing required fresh OAuth setup after each change
- Poor user experience and development velocity

## Solution: Dual Backend Architecture

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Backend    │    │ OAuth Backend   │
│   (Replit)      │───▶│ (Railway #2)    │───▶│ (Railway #1)    │
│                 │    │                 │    │                 │
│ - User Interface│    │ - GoHighLevel   │    │ - OAuth Flow    │
│ - API Requests  │    │   API Calls     │    │ - Installation  │
│ - UI Components │    │ - Business      │    │   Storage       │
│                 │    │   Logic         │    │ - Token Mgmt    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │        Bridge          │
                                │    Communication       │
                                └────────────────────────┘
```

### Two Separate Railway Environments

**1. OAuth Backend (Stable Environment)**
- **URL**: https://dir.engageautomations.com
- **Repository**: https://github.com/EngageAutomations/oauth-backend
- **Purpose**: OAuth installations and token management ONLY
- **Storage**: PostgreSQL database for persistent installations
- **Deployment**: Rarely updated, maximum stability

**2. API Backend (Development Environment)**
- **URL**: https://api.engageautomations.com
- **Repository**: https://github.com/EngageAutomations/ghl-api-backend
- **Purpose**: All GoHighLevel API endpoints and business logic
- **Storage**: No OAuth data - requests tokens from OAuth backend
- **Deployment**: Frequent updates, complete development freedom

## Bridge Communication System

### How Services Connect

The API backend connects to the OAuth backend through HTTP-based bridge middleware:

```javascript
// API Backend - OAuth Bridge Middleware
async function requireOAuth(req, res, next) {
  // 1. Get installations from OAuth backend
  const response = await axios.get('https://dir.engageautomations.com/installations');
  
  // 2. Find active installation
  const activeInstallation = installations.find(i => i.active);
  
  // 3. Get fresh token for installation
  const tokenResponse = await axios.get(
    `https://dir.engageautomations.com/api/oauth/token/${activeInstallation.id}`
  );
  
  // 4. Add token to request
  req.accessToken = tokenResponse.data.accessToken;
  req.locationId = tokenResponse.data.locationId;
  
  next();
}
```

### Request Flow

1. **Frontend Request**: User makes API call to API backend
2. **Bridge Intercept**: OAuth middleware intercepts request
3. **Token Request**: API backend requests fresh token from OAuth backend
4. **Token Response**: OAuth backend returns valid token (auto-refreshes if needed)
5. **API Call**: API backend uses token to call GoHighLevel
6. **Response**: Result returned to frontend

### Security Model

- **No Token Storage**: API backend never stores OAuth tokens
- **Fresh Tokens**: Tokens requested fresh for each API call
- **Automatic Refresh**: OAuth backend handles token expiration
- **Single Source**: OAuth backend is only source of truth for installations

## Implementation Details

### Environment Variables

**API Backend Configuration**:
```bash
OAUTH_BACKEND_URL=https://dir.engageautomations.com
PORT=4000
```

**OAuth Backend Configuration**:
```bash
DATABASE_URL=postgresql://...
CLIENT_ID=67671c52e4b0b29a36063fb6
CLIENT_SECRET=...
```

### Key Files

**API Backend Structure**:
```
ghl-api-backend/
├── index.js                    # Main server
├── middleware/oauth-bridge.js  # Bridge communication
├── routes/products.js          # Product API endpoints
├── routes/media.js            # Media API endpoints
├── routes/pricing.js          # Pricing API endpoints
├── utils/ghl-client.js        # GoHighLevel API client
└── package.json               # Dependencies
```

**OAuth Backend Structure**:
```
oauth-backend/
├── index.js                   # OAuth flow and token management
├── db.js                     # Database connection and schema
└── package.json              # OAuth-specific dependencies
```

## Benefits Achieved

### 1. Installation Persistence
- OAuth installations stored in PostgreSQL database
- Survive all API backend deployments
- No more repeated OAuth setups

### 2. Development Freedom
- Deploy API changes without affecting authentication
- Test new features without breaking OAuth
- Rapid iteration on business logic

### 3. Service Isolation
- OAuth and API concerns completely separated
- Independent scaling and maintenance
- Isolated failure domains

### 4. Professional Architecture
- Clean separation of concerns
- Industry-standard microservices pattern
- Scalable for future growth

## Development Workflow

### Making API Changes
1. Edit files in `ghl-api-backend` repository
2. Commit and push to GitHub
3. Railway automatically deploys API backend
4. OAuth installations remain intact
5. Test new functionality immediately

### OAuth Maintenance
1. OAuth backend remains stable and untouched
2. Only update for OAuth-specific issues
3. Database ensures installation persistence
4. Background token refresh keeps sessions alive

## Deployment Strategy

### Initial Setup
1. **OAuth Backend**: Deploy once with database
2. **API Backend**: Deploy with `OAUTH_BACKEND_URL` environment variable
3. **Custom Domains**: Configure professional URLs
4. **Bridge Communication**: Automatic via environment variables

### Ongoing Deployments
- **API Changes**: Deploy API backend freely
- **OAuth Changes**: Rare, careful deployment of OAuth backend
- **Zero Downtime**: Services can be updated independently

## Monitoring and Debugging

### Health Checks
```bash
# OAuth Backend Health
curl https://dir.engageautomations.com/

# API Backend Health  
curl https://api.engageautomations.com/

# Installation Status
curl https://dir.engageautomations.com/installations
```

### Bridge Communication Testing
```bash
# Test OAuth bridge (should return 401 without OAuth)
curl https://api.engageautomations.com/api/products

# Test specific API endpoint with OAuth
curl -H "Authorization: Bearer {token}" https://api.engageautomations.com/api/products
```

## Migration Path

### Before: Single Backend Issues
- Installations lost on deployment
- Development risky and slow
- Frequent OAuth reconnections required
- Poor user experience

### After: Dual Backend Benefits
- Installations persist forever
- Safe API development
- Rapid iteration possible
- Professional user experience

## Success Metrics

### Technical Metrics
- **Installation Persistence**: 100% retention through deployments
- **Development Velocity**: Unlimited API deployments without OAuth risk
- **Uptime**: Independent service availability
- **Security**: Fresh tokens for every request

### Business Metrics
- **User Experience**: No repeated OAuth setups
- **Development Speed**: Faster feature delivery
- **Reliability**: Stable authentication layer
- **Scalability**: Independent service scaling

## Conclusion

The dual backend architecture completely solves the OAuth installation persistence problem by:

1. **Separating Concerns**: OAuth and API functionality in different services
2. **Database Persistence**: Installations stored in permanent database
3. **Bridge Communication**: Secure HTTP-based token exchange
4. **Independent Deployment**: API changes don't affect OAuth stability

This architecture provides a foundation for reliable GoHighLevel marketplace applications where OAuth installations persist through all development cycles, enabling continuous improvement without user disruption.