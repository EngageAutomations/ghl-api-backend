# OAuth Redirect URL Configuration

## Current Issue
OAuth installations are being captured on Railway backend instead of this Replit instance because the redirect URL in GoHighLevel Marketplace still points to the old domain.

## Required Configuration Changes

### 1. GoHighLevel Marketplace Settings
**Current Redirect URL:** `https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback` 
**Required Redirect URL:** `https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev/api/oauth/callback`

### 2. Steps to Fix
1. Log into GoHighLevel Marketplace Developer Portal
2. Navigate to your app configuration
3. Update the "Redirect URI" field to the Replit domain
4. Save the configuration
5. Test a fresh installation

### 3. Verification
After updating the redirect URL:
- New installations will hit the Replit instance
- The OAuth callback endpoint will capture real account data
- Installation data will be stored in the PostgreSQL database
- You'll have access to real access tokens for API testing

### 4. Current Environment
- **Replit Domain:** `https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev`
- **OAuth Callback Endpoint:** `/api/oauth/callback`
- **Client ID:** `68474924a586bce22a6e64f7-mbpkmyu4`
- **Database:** Ready to capture installation data

### 5. What Happens After Update
1. User installs app from marketplace
2. GoHighLevel redirects to Replit instance
3. OAuth callback captures tokens and user data
4. Real account information stored in database
5. Directory logo upload API can be tested with authentic credentials

## Next Steps
Update the redirect URL in GoHighLevel Marketplace settings, then perform a fresh installation to capture your real account data.