# Railway OAuth Backend Deployment

This package contains the complete OAuth backend that handles GoHighLevel authentication.

## Files to Deploy

1. **index.js** - Main server file with OAuth endpoints
2. **package.json** - Dependencies and configuration

## Railway Deployment Steps

### 1. Upload Files
- Copy `index.js` and `package.json` to your Railway project
- Or connect Railway to a GitHub repository containing these files

### 2. Set Environment Variables
In your Railway dashboard, add these variables:

```
GHL_CLIENT_ID=68474924a586bce22a6e64f7-mbpkmyu4
GHL_CLIENT_SECRET=[Your GoHighLevel Client Secret]
GHL_REDIRECT_URI=https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback
```

**Important**: You must provide your GoHighLevel Client Secret from your marketplace app settings.

### 3. Deploy
Railway will automatically deploy when you push the files.

## Testing After Deployment

### Health Check
```
curl https://oauth-backend-production-68c5.up.railway.app/health
```
Should return:
```json
{"status":"OK","service":"GHL OAuth Backend","timestamp":"..."}
```

### OAuth URL Generation
```
curl https://oauth-backend-production-68c5.up.railway.app/api/oauth/url
```
Should return:
```json
{
  "success": true,
  "authUrl": "https://marketplace.leadconnectorhq.com/oauth/chooselocation?...",
  "state": "oauth_...",
  "timestamp": 1234567890
}
```

## Architecture

The backend handles the complete OAuth flow:

1. **GET /api/oauth/url** - Generates OAuth authorization URLs
2. **GET /api/oauth/callback** - Processes GoHighLevel callbacks and exchanges codes for tokens
3. **GET /health** - Health check endpoint

## Frontend Integration

Your Replit frontend at `https://dir.engageautomations.com/oauth.html` will:
1. Call `/api/oauth/url` to get authorization URL
2. Redirect user to GoHighLevel
3. User returns to `/api/oauth/callback` 
4. Backend exchanges code for tokens
5. User redirected to success page

## Token Storage

The backend logs received tokens to the console. You'll need to add database integration to store:
- Access tokens
- Refresh tokens  
- User location/company IDs
- Token expiration times

Look for `=== TOKEN STORAGE NEEDED ===` in the console logs to see the actual tokens received during OAuth flow.