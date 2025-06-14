# OAuth Redirect URL Configuration Report

## Executive Summary
Railway is your production OAuth handler and should remain active. The issue is accessing your installation data that was captured on Railway to use for API testing on this Replit development instance.

## Current Architecture

### Railway (Production OAuth Handler)
- **Domain:** `https://dir.engageautomations.com`
- **Purpose:** Production OAuth callback handler
- **Function:** Captures real installation data from marketplace
- **Status:** Should remain active as production endpoint

### Replit (Development Instance)
- **Domain:** `https://62a303e9-3e97-4c9f-a7b4-c0026049fd6d-00-30skmv0mqe63e.janeway.replit.dev`
- **Purpose:** Development and testing environment
- **Function:** API testing and feature development
- **Status:** Needs access to real installation data

## Correct Configuration

### 1. GoHighLevel Marketplace Settings
**Should remain configured as:**
```
https://dir.engageautomations.com/api/oauth/callback
```

### 2. Railway Configuration
**Should remain active and configured to:**
- Capture OAuth installations from marketplace
- Store installation data in Railway database
- Provide API endpoint to share installation data

## The Real Issue
Your installation data was captured successfully on Railway, but we need to access it from this Replit development instance.

## Solution Options

### Option 1: Railway API Endpoint (Recommended)
Railway should provide an API endpoint to retrieve installation data:
```
GET https://dir.engageautomations.com/api/installations
```

### Option 2: Shared Database
Configure both Railway and Replit to use the same PostgreSQL database.

### Option 3: Data Sync
Railway periodically syncs installation data to Replit database.

## Required Configuration

### 1. GoHighLevel Marketplace Settings
**Current (Correct):**
```
https://dir.engageautomations.com/api/oauth/callback
```
**Status:** Keep this configuration - Railway handles production OAuth

### 2. Railway Backend
**Should provide:**
- OAuth callback endpoint (active)
- Installation data API endpoint
- Database storage for installation data

### 3. Replit Development Instance
**Should have:**
- API endpoint to fetch data from Railway
- Local database for development testing
- Ability to use Railway installation data for API testing

## Implementation Steps

### Step 1: Railway API Access
Add endpoint to Railway backend:
```javascript
app.get('/api/installations', (req, res) => {
  res.json(storage.getAllInstallations());
});
```

### Step 2: Replit Data Retrieval
Create function to fetch installation data from Railway:
```javascript
async function fetchInstallationFromRailway() {
  const response = await fetch('https://dir.engageautomations.com/api/installations');
  return response.json();
}
```
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