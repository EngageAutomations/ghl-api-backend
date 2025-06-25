# Railway OAuth Backend - Working Version
**Date Captured**: June 25, 2025  
**Version**: 5.1.1-fixed  
**Status**: Fully Operational  
**URL**: https://dir.engageautomations.com/

## Overview
This directory contains the complete working version of the Railway OAuth backend that successfully handles GoHighLevel OAuth installations and token management.

## Files
- `index.js` - Main OAuth backend with token management and API endpoints
- `server.js` - Railway entry point (loads index.js)  
- `package.json` - Dependencies and deployment configuration
- `railway.toml` - Railway deployment settings

## Key Features
- OAuth callback handling at `/api/oauth/callback`
- Token storage and automatic refresh
- Installation tracking at `/installations` endpoint
- Product API proxy endpoints
- Media upload capabilities
- Enhanced logging for debugging

## OAuth Flow
1. User initiates OAuth from GoHighLevel marketplace
2. Callback receives authorization code 
3. Backend exchanges code for access/refresh tokens
4. Installation stored in memory with automatic refresh scheduling
5. Tokens available for API calls via installation ID

## Environment Variables Required
- `GHL_CLIENT_ID` - GoHighLevel OAuth client ID
- `GHL_CLIENT_SECRET` - GoHighLevel OAuth client secret  
- `GHL_REDIRECT_URI` - OAuth callback URL
- `PORT` - Server port (default: 3000)

## API Endpoints
- `GET /` - Backend status and installation count
- `GET /health` - Health check
- `GET /installations` - List all OAuth installations
- `GET /api/oauth/callback` - OAuth callback handler
- `GET /api/oauth/status` - Check installation status
- `POST /api/ghl/*` - GoHighLevel API proxy endpoints

## Deployment
This version is deployed on Railway with automatic GitHub integration. Any changes to the main branch trigger redeployment.

## Token Management
- Tokens stored in-memory Map for production simplicity
- Automatic refresh 5 minutes before expiration
- Token validation before each API call
- Error handling for invalid/expired tokens

## Success Metrics
- OAuth installations: Properly tracked and stored
- Token refresh: Automatic with scheduled timers  
- API proxy: Full GoHighLevel API access
- Installation count: Visible via `/installations` endpoint
- Logging: Enhanced debugging information

This version resolves all previous OAuth installation tracking issues and provides a stable foundation for GoHighLevel marketplace integration.