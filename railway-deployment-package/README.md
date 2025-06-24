# Railway Deployment - OAuth Backend

## Setup Instructions

1. Upload all files from this directory to Railway
2. Deploy immediately - no environment variables required
3. OAuth credentials are built-in and configured

## Files
- `index.js` - Main OAuth backend with embedded credentials
- `package.json` - Dependencies
- `railway.json` - Railway configuration

## OAuth Flow
GoHighLevel → dir.engageautomations.com/api/oauth/callback → Token Exchange → Installation Storage

## Fix Applied
- OAuth credentials embedded directly in the backend
- No external dependencies or bridge connections required
- Resolves "OAuth not configured" error