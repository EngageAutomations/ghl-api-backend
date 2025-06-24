# Railway Bridge OAuth Backend v1.6.3

## Overview
Railway backend with Replit bridge integration that solves OAuth credential detection issues. The system can get credentials from Replit bridge endpoints or use fallback embedded credentials.

## Bridge System Features
- **Primary**: Calls Replit bridge for OAuth credentials during initialization
- **Fallback**: Uses embedded credentials if bridge connection fails
- **Self-contained**: Includes own bridge endpoints for reverse integration
- **Universal API**: Supports 50+ GoHighLevel operations

## Bridge Configuration
```javascript
const BRIDGE_CONFIG = {
  replicUrl: 'https://your-replit-domain.replit.app',
  fallbackCredentials: {
    clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
    clientSecret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
    redirectUri: 'https://dir.engageautomations.com/api/oauth/callback'
  }
};
```

## Bridge Endpoints
- `GET /api/bridge/oauth-credentials` - Provides OAuth credentials
- `POST /api/bridge/process-oauth` - Processes authorization codes
- `GET /api/installations/:id` - Returns installation status

## OAuth Flow
1. **Initialization**: Calls Replit bridge for credentials or uses fallback
2. **OAuth Callback**: Processes authorization codes with bridge integration
3. **Token Management**: Stores tokens locally with bridge metadata
4. **API Routing**: Handles universal GoHighLevel API requests

## Deployment
```bash
# Railway deployment
git push origin main

# Manual deployment
npm install
npm start
```

## Environment Requirements
- Node.js 16+
- Express server
- CORS enabled for Replit and listings domains

## Bridge Integration Benefits
- Eliminates Railway environment variable detection issues
- Provides dual-mode operation (bridge + fallback)
- Enables self-hosting capabilities
- Maintains OAuth functionality regardless of bridge status

## Version History
- v1.6.3: Bridge integration with Replit endpoints
- v1.6.2: Embedded OAuth credentials
- v1.5.0: Modular backend architecture