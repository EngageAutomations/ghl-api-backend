# Static File Routing Issue Analysis Report

## Problem Summary
API endpoints returning 404 errors due to static file middleware intercepting requests before they reach Express route handlers.

## Root Cause Analysis

### Current Middleware Order (Problematic)
1. Request interceptor middleware 
2. Root route handler (`/`)
3. Static file middleware with API bypass attempt
4. SPA fallback middleware
5. **API routes registered AFTER static serving**

### The Core Issue
- Static file middleware executes before API routes are registered
- Even with API path detection, the middleware chain doesn't properly hand off to API handlers
- Express routing order is critical - first match wins

## Technical Details

### Current Problematic Code
```javascript
// Static file serving (OAuth routes are already registered above)
app.use((req, res, next) => {
  // Skip static serving for API routes to ensure they reach the handlers
  if (req.path.startsWith('/api/')) {
    console.log(`API route ${req.path} bypassing static serving`);
    return next();
  }
  return express.static(distPath)(req, res, next);
});
```

### The Problem
1. API routes are registered in `registerRoutes()` which happens AFTER this middleware
2. When `next()` is called for `/api/*` paths, there are no API handlers registered yet
3. Request falls through to SPA fallback or 404

## Solution Implementation

### Fixed Middleware Order
1. **API routes registered FIRST** (via `registerRoutes()`)
2. Request interceptor middleware
3. Root route handler
4. Static file middleware (simplified)
5. SPA fallback

### Implementation Strategy
- Move `registerRoutes()` call to very beginning of middleware stack
- Remove complex API path detection from static middleware
- Let Express natural routing handle the precedence

## Impact on OAuth Data Capture

### Current State
- OAuth callback endpoints return 404
- Session data extraction fails
- User account information not captured during app installation

### After Fix
- `/api/oauth/session-data` endpoint will be accessible
- Token exchange and user data retrieval will function
- Account information will be stored in database during installation

## Test Verification Plan

1. **API Route Access Test**
   ```bash
   curl "https://dir.engageautomations.com/api/oauth/session-data?success=true&timestamp=1749738603465"
   ```
   Expected: JSON response with installation confirmation

2. **OAuth Data Capture Test**
   - Install app with OAuth code parameter
   - Verify user data extraction and storage
   - Confirm token exchange functionality

3. **Static File Serving Test**
   - Verify CSS/JS files still load correctly
   - Confirm SPA routing works for non-API paths

## Priority Level: Critical
This issue blocks core OAuth functionality and user account data capture, preventing the app from functioning as intended.