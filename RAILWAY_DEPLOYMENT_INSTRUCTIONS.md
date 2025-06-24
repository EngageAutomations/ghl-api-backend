# Railway Modular Backend Deployment Instructions

## Quick Deployment Steps

The Railway Modular Upgrade is ready for deployment. This fixes the OAuth "authenticated: false" errors by replacing the monolithic structure with proper modular Express routes.

### 1. Upload Files to GitHub Repository

Replace your current Railway repository contents with the files from `railway-deploy-final/`:

```
railway-deploy-final/
├── server.js                 # Entry point (replaces index.js)
├── package.json              # Updated dependencies
├── railway.toml              # Deployment configuration
├── src/
│   ├── app.js                # Main Express application
│   ├── routes/
│   │   ├── oauth.js          # Fixed OAuth token exchange
│   │   ├── media.js          # Location-centric media upload
│   │   ├── products.js       # Location-centric product creation
│   │   └── legacy.js         # Backward compatibility
│   └── utils/
│       ├── install-store.js  # Installation management
│       └── token-refresh.js  # Token refresh utilities
```

### 2. Set Environment Variables in Railway

**CRITICAL:** Add these environment variables in your Railway dashboard:

```
CLIENT_ID=your_gohighlevel_client_id
CLIENT_SECRET=your_gohighlevel_client_secret
```

### 3. Deploy and Verify

1. Push changes to your GitHub repository
2. Railway will automatically deploy the modular backend
3. Check deployment logs for: `🚀 GHL proxy (modular) listening on 0.0.0.0:3000`
4. Verify health endpoint shows: `"version": "1.5.0-modular"`

### 4. Test OAuth Flow

1. Install/reinstall your app from GoHighLevel marketplace
2. OAuth should redirect to: `https://dir.engageautomations.com/api/oauth/callback?code=...`
3. Backend will exchange authorization code for tokens
4. Redirect to: `https://listings.engageautomations.com/?installation_id=install_...`
5. Frontend will capture installation_id and fetch locationId
6. Product creation should work via location-centric endpoints

## Key Fixes

### Before (Monolithic)
- OAuth callback returns "OAuth failed" (500 error)
- Token exchange doesn't work properly
- All installations show `authenticated: false`
- Product creation fails

### After (Modular)  
- OAuth callback properly exchanges authorization code for tokens
- Installations stored with `authenticated: true` and valid `locationId`
- Location-centric API routing works correctly
- AI Robot Assistant Pro creation successful

## Expected Logs

Once deployed with OAuth credentials, you should see:

```
Config check: { CLIENT_ID: '[set]', CLIENT_SECRET: '[set]', REDIRECT: '/api/oauth/callback', PORT: 3000 }
🚀 GHL proxy (modular) listening on 0.0.0.0:3000
📋 Routes registered:
   - OAuth: /api/oauth/callback, /api/oauth/status
   - Media: /api/ghl/locations/:locationId/media
   - Products: /api/ghl/locations/:locationId/products
   - Legacy: /api/ghl/products/create (deprecated)
   - Health: /, /health
✅ Ready for OAuth installation flow
```

## Troubleshooting

If OAuth still fails after deployment:
1. Verify CLIENT_ID and CLIENT_SECRET are correctly set
2. Check GoHighLevel app redirect URI: `https://dir.engageautomations.com/api/oauth/callback`
3. Review Railway deployment logs for OAuth callback errors
4. Test with OAuth status endpoint: `/api/oauth/status?installation_id=...`

This modular upgrade should resolve the authentication issues and enable the complete OAuth workflow for AI Robot Assistant Pro creation.