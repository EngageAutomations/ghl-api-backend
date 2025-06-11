# One-Click Railway Deployment

## Instant Deploy Button

Click this button to deploy the OAuth backend to Railway instantly:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YNvkjl?referralCode=alphasec)

## What This Does

This one-click deployment will:
- Create a new Railway project with all OAuth backend files
- Set up all required environment variables automatically
- Deploy and start the OAuth backend service
- Provide you with a live URL for the OAuth callback endpoint

## Post-Deployment Steps

1. **Get Your URL**: After deployment, Railway will provide a URL like:
   ```
   https://oauth-backend-production-xxxx.up.railway.app
   ```

2. **Test the Deployment**: Visit your URL + `/health`:
   ```
   https://your-railway-url.up.railway.app/health
   ```
   Should return: `{"status":"OK","service":"GHL OAuth Backend"}`

3. **Update Domain Proxy** (if needed): If using a custom domain, ensure it proxies `/api/oauth/*` requests to your Railway backend.

## Environment Variables (Pre-configured)

The deployment includes these environment variables:
- `GHL_CLIENT_ID`: 68474924a586bce22a6e64f7-mbpkmyu4
- `GHL_CLIENT_SECRET`: b5a7a120-7df7-4d23-8796-4863cbd08f94
- `GHL_REDIRECT_URI`: https://dir.engageautomations.com/api/oauth/callback
- `NODE_ENV`: production

## API Endpoints Available

Once deployed, your Railway backend provides:
- `GET /health` - Health check
- `GET /api/oauth/callback` - OAuth callback handler (fixes Replit issue)
- `GET /api/oauth/url` - Generate OAuth authorization URL
- `GET /api/oauth/validate` - Validate stored tokens

## Testing the OAuth Flow

1. Visit: `https://your-railway-url.up.railway.app/api/oauth/url`
2. Use the returned URL to authorize with GoHighLevel
3. GoHighLevel will redirect to your callback endpoint
4. OAuth tokens will be securely stored and returned

This solves the Replit OAuth callback issue by handling token exchange on Railway where routing works properly.