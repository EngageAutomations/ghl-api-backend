# Railway and Marketplace Redirect URL Configuration

## Current Setup (Correct)

### GoHighLevel Marketplace Settings
**Redirect URL:** `https://dir.engageautomations.com/api/oauth/callback`
**Status:** KEEP THIS - Railway is your production OAuth handler

### Railway Backend Configuration
**Domain:** `https://dir.engageautomations.com`
**Function:** Production OAuth callback handler
**Status:** ACTIVE and capturing installations successfully

## Installation Status Verification

Railway backend currently has:
- **2 active OAuth installations**
- **Installation IDs:** 1, 2
- **User IDs:** user_1749916467875, user_1749917439420
- **Status:** Both installations have valid tokens (hasToken: true)
- **Installation Dates:** June 14, 2025

## The Real Issue

Railway is correctly capturing your OAuth installations, but the backend doesn't expose complete installation details (access tokens, location IDs) through API endpoints for development access.

## Required Railway Backend Update

Add this endpoint to Railway backend (`railway-backend/index.js`):

```javascript
// Add this endpoint to expose installation details
app.get('/api/installations/:id/details', (req, res) => {
  const installation = storage.getAllInstallations().find(inst => inst.id == req.params.id);
  if (installation) {
    res.json({
      success: true,
      installation: {
        id: installation.id,
        ghlUserId: installation.ghlUserId,
        ghlLocationId: installation.ghlLocationId,
        ghlAccessToken: installation.ghlAccessToken,
        ghlRefreshToken: installation.ghlRefreshToken,
        installationDate: installation.installationDate,
        isActive: installation.isActive
      }
    });
  } else {
    res.status(404).json({ success: false, error: 'Installation not found' });
  }
});
```

## Solution Summary

**Keep Railway as production OAuth handler**
- GoHighLevel Marketplace → Railway OAuth callback (current setup is correct)
- Railway captures real installation data successfully
- Railway needs API endpoint to share installation details with development instances

**Access Pattern for Development**
1. Railway captures OAuth installations from marketplace
2. Railway exposes installation details via API endpoint
3. Development instances retrieve real credentials from Railway
4. API testing uses authentic account data

## Next Steps

1. Update Railway backend to expose installation details endpoint
2. Retrieve real access tokens and location IDs from Railway
3. Test directory logo upload API with authentic credentials
4. Continue development with real account data

The redirect URL configuration is correct - Railway should remain the production OAuth handler.