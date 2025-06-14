# OAuth Redirect URL Configuration Report

## Executive Summary
Your OAuth installations are not being captured because the redirect URLs in GoHighLevel Marketplace and Railway are pointing to different domains than your active Replit instance.

## Current Configuration Status

### Replit Instance (Active Development)
- **Domain:** `https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev`
- **OAuth Callback Endpoint:** `/api/oauth/callback`
- **Database:** PostgreSQL ready to capture installation data
- **Status:** Ready to receive OAuth callbacks

### Railway Backend
- **Domain:** `https://dir.engageautomations.com`
- **Current Status:** Not accessible/responding
- **Installation Data:** May contain previous installations but not accessible

## Required Redirect URL Configuration

### 1. GoHighLevel Marketplace Settings
**Current Configuration:** `https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback`

**Required Configuration:**
```
https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev/api/oauth/callback
```

### 2. Railway Configuration
**Option A (Recommended):** Disable Railway OAuth handling
**Option B:** Configure Railway to forward to Replit:
```
Redirect Target: https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev/api/oauth/callback
```

## Implementation Steps

### Step 1: Update GoHighLevel Marketplace
1. Log into GoHighLevel Developer Portal
2. Navigate to your app configuration
3. Update "Redirect URI" field to:
   ```
   https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev/api/oauth/callback
   ```
4. Save configuration

### Step 2: Railway Configuration
1. Disable OAuth callback handling on Railway, OR
2. Configure Railway to forward installations to Replit instance

### Step 3: Test Installation
1. Perform fresh app installation from GoHighLevel Marketplace
2. Verify OAuth callback hits Replit instance
3. Confirm installation data captured in PostgreSQL database

## Expected Results After Configuration

### Before Fix
- Installations go to Railway (inaccessible)
- No installation data in Replit database
- Cannot test with real account credentials

### After Fix
- Installations captured on Replit instance
- Real access tokens stored in PostgreSQL
- Authentic user and location data available
- Directory logo upload API testable with real credentials

## Verification Commands

After updating redirect URLs, verify with:
```bash
# Check database for new installations
SELECT * FROM oauth_installations ORDER BY installation_date DESC LIMIT 1;

# Test OAuth callback endpoint
curl https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev/api/oauth/callback
```

## Critical Notes

1. **Domain Dependency:** The Replit domain may change if the instance restarts
2. **Database Ready:** PostgreSQL schema is configured to capture OAuth installation data
3. **Callback Endpoint:** Complete OAuth callback handler is implemented and waiting
4. **API Testing:** Once installation data is captured, all GoHighLevel APIs can be tested with real credentials

## Next Actions Required

1. Update GoHighLevel Marketplace redirect URL
2. Configure or disable Railway OAuth handling
3. Perform fresh installation to capture real account data
4. Verify installation data appears in Replit database