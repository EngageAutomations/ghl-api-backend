# Production Database Solution

## The Core Issue

**Development Environment (Replit)**
- Full Express backend with PostgreSQL database
- OAuth installations are captured and stored permanently
- Access tokens, refresh tokens, user data saved in `oauth_installations` table

**Production Environment (dir.engageautomations.com)**
- Static HTML website with no backend server
- OAuth installations redirect here but data is immediately lost
- No database storage capability

**Railway Backend**
- Express server with OAuth token exchange working
- Database integration added but not yet deployed

## The Solution

### Step 1: Point Domain to Railway Backend
Instead of pointing `dir.engageautomations.com` to the static site, point it to your Railway backend which now has complete database functionality.

**In Railway Dashboard:**
1. Go to Settings > Domains
2. Add custom domain: `dir.engageautomations.com`
3. Update your DNS records as instructed

### Step 2: Update GoHighLevel Redirect URI
Change your app's OAuth redirect URI in GoHighLevel Developer Portal:
```
FROM: https://dir.engageautomations.com/
TO: https://dir.engageautomations.com/api/oauth/callback
```

### Step 3: Deploy Updated Railway Backend
Your Railway backend now includes:
- Complete database schema for OAuth installations
- Token storage functionality
- User data and location data capture
- Debug endpoints for verification

### Step 4: Set Environment Variables in Railway
Ensure these are configured in Railway:
- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback`
- `DATABASE_URL` (Railway provides this automatically)

## What This Achieves

**Before (Current State):**
- OAuth installations → Static site → Data lost
- Development database stays empty
- No access token storage

**After (Solution):**
- OAuth installations → Railway backend → Database storage
- Access tokens captured and stored permanently
- User data, location data, refresh tokens all saved
- Real marketplace functionality enabled

## Verification

Once deployed, you can verify OAuth token capture:
- Check installations: `https://dir.engageautomations.com/api/debug/installations`
- Test OAuth flow: `https://dir.engageautomations.com/api/oauth/url`
- Verify database storage after real installations

This solves the fundamental architecture mismatch between your sophisticated development environment and the static production deployment.