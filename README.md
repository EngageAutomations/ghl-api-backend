# Enhanced OAuth Callback Server

Enhanced OAuth callback server with automatic installation capture for GoHighLevel marketplace apps.

## Features
- ✅ Captures installation_id from OAuth token response
- ✅ Creates installation records immediately
- ✅ Links installations with OAuth tokens
- ✅ Comprehensive debugging and logging
- ✅ Real-time dashboard monitoring
- ✅ Solves "double authorization" issue

## Deployment
This server is configured for automatic deployment on Railway.

## Endpoints
- `/debug` - Debug dashboard
- `/api/oauth/callback` - OAuth callback handler
- `/api/oauth/url` - OAuth URL generator
- `/health` - Health check endpoint

## Environment Variables
- `GHL_CLIENT_ID` - GoHighLevel client ID
- `GHL_CLIENT_SECRET` - GoHighLevel client secret
- `GHL_REDIRECT_URI` - OAuth redirect URI
- `DATABASE_PATH` - SQLite database path
- `ALLOWED_ORIGINS` - CORS allowed origins

## Database
Uses SQLite database with tables:
- `oauth_installations_enhanced` - Installation records
- `oauth_tokens` - OAuth tokens
- `activity_log` - Activity logging

## Usage
1. Deploy to Railway
2. Configure environment variables
3. Update GoHighLevel app settings with callback URL
4. Test OAuth flow through marketplace installation

---
**Ready for marketplace installations with automatic data capture!**