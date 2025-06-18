# Railway OAuth Backend for GoHighLevel Integration

This is a standalone Express.js backend designed to handle GoHighLevel OAuth callbacks that don't work on Replit's production deployment.

## Setup Instructions

### 1. Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub Repo"
3. Upload this `railway-backend` folder to a GitHub repository
4. Connect Railway to your GitHub repo

### 2. Environment Variables

Set these in Railway's environment variables:

```
GHL_CLIENT_ID=68474924a586bce22a6e64f7-mbpkmyu4
GHL_CLIENT_SECRET=b5a7a120-7df7-4d23-8796-4863cbd08f94
GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback
NODE_ENV=production
```

### 3. Update GoHighLevel Settings

In your GoHighLevel developer portal:
- Set redirect URI to: `https://dir.engageautomations.com/api/oauth/callback`
- This will be proxied to your Railway backend

### 4. Configure Proxy in Replit

Update your `vite.config.ts` in the main Replit project:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'https://your-railway-app-name.up.railway.app'
    }
  }
});
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/oauth/callback` - OAuth callback handler
- `GET /api/oauth/url` - Generate OAuth URL
- `GET /api/oauth/validate` - Validate stored token

## Testing

After deployment, test the OAuth flow:
1. Install your app from GoHighLevel marketplace
2. Check Railway logs for successful token exchange
3. Verify redirect to success page

## Architecture

- **Frontend**: Remains on Replit (Vite/React)
- **OAuth Backend**: Railway (Express.js)
- **Domain**: `dir.engageautomations.com` with proxy routing
- **Benefits**: OAuth callbacks work properly on Railway while keeping main app on Replit