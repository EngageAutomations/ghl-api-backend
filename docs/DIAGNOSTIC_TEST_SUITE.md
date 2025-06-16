# Complete OAuth & API Diagnostic Test Suite

## Infrastructure Tests

### 1. Basic Connectivity
```bash
curl -s "https://dir.engageautomations.com/health"
```
**Tests**: Railway deployment accessibility, response time, service status

### 2. API Health Endpoint
```bash
curl -s "https://dir.engageautomations.com/api/health"
```
**Tests**: Backend version verification, deployed fixes, service configuration

### 3. CORS Configuration
```bash
curl -s -X OPTIONS "https://dir.engageautomations.com/health" -H "Origin: https://listings.engageautomations.com"
```
**Tests**: Cross-origin resource sharing, embedded access compatibility

### 4. SSL/TLS Certificate
```bash
curl -I "https://dir.engageautomations.com/health"
```
**Tests**: HTTPS security, certificate validity, Railway edge configuration

## Environment Variable Tests

### 5. Environment Variable Detection
```bash
curl -s "https://dir.engageautomations.com/oauth/callback?code=env_test"
```
**Tests**: OAuth credential accessibility, environment variable loading

### 6. Startup Log Analysis (Railway Logs)
**Check Railway logs for:**
```
=== Environment Variables Check ===
GHL_CLIENT_ID: SET/NOT SET
GHL_CLIENT_SECRET: SET/NOT SET
GHL_REDIRECT_URI: SET/NOT SET
```

## OAuth Endpoint Tests

### 7. OAuth Auth Endpoint
```bash
curl -s "https://dir.engageautomations.com/api/oauth/auth?installation_id=test"
```
**Tests**: Frontend compatibility, error handling, installation validation

### 8. OAuth Status Endpoint
```bash
curl -s "https://dir.engageautomations.com/api/oauth/status?installation_id=test"
```
**Tests**: Status checking functionality, token validation, user info retrieval

### 9. OAuth Callback Handler
```bash
curl -s "https://dir.engageautomations.com/oauth/callback?code=test_code"
```
**Tests**: Authorization code processing, token exchange, redirect handling

### 10. OAuth Callback with Real Code
```bash
curl -s "https://dir.engageautomations.com/oauth/callback?code=1731fbd15b08681b9cc1b7a5fd321539d9b2c392"
```
**Tests**: Real OAuth flow, actual token exchange, GoHighLevel API integration

## API Integration Tests

### 11. Installation Management
```bash
curl -s "https://dir.engageautomations.com/api/installations"
```
**Tests**: Installation storage, data persistence, installation listing

### 12. GoHighLevel API Proxy
```bash
curl -s "https://dir.engageautomations.com/api/ghl/test"
```
**Tests**: API proxy configuration, routing setup, future API integration

### 13. GoHighLevel User API Test (with valid token)
```bash
curl -s "https://services.leadconnectorhq.com/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Version: 2021-07-28"
```
**Tests**: GoHighLevel API endpoint functionality, token validity

## Frontend Integration Tests

### 14. Frontend OAuth Integration
```bash
curl -s "https://listings.engageautomations.com/api/oauth/auth" \
  -H "Origin: https://listings.engageautomations.com"
```
**Tests**: Frontend-backend communication, authentication flow

### 15. CORS Frontend Compatibility
```bash
curl -s -X POST "https://dir.engageautomations.com/api/oauth/auth" \
  -H "Content-Type: application/json" \
  -H "Origin: https://listings.engageautomations.com" \
  -d '{"installation_id":"test"}'
```
**Tests**: POST request handling, JSON processing, CORS compliance

## Security & Authentication Tests

### 16. Token Validation Test
```bash
curl -s "https://dir.engageautomations.com/api/oauth/status?installation_id=valid_id" \
  -H "Authorization: Bearer test_token"
```
**Tests**: Token-based authentication, security middleware

### 17. Rate Limiting Test
```bash
for i in {1..10}; do
  curl -s "https://dir.engageautomations.com/health" &
done
wait
```
**Tests**: Rate limiting, DDoS protection, concurrent request handling

## Error Handling Tests

### 18. Missing Parameter Handling
```bash
curl -s "https://dir.engageautomations.com/api/oauth/auth"
```
**Tests**: Parameter validation, error messages, graceful failure

### 19. Invalid Installation ID
```bash
curl -s "https://dir.engageautomations.com/api/oauth/auth?installation_id=invalid"
```
**Tests**: Data validation, not found handling, error responses

### 20. Malformed Request Test
```bash
curl -s "https://dir.engageautomations.com/oauth/callback?code="
```
**Tests**: Input validation, edge case handling, security

## Performance Tests

### 21. Response Time Measurement
```bash
time curl -s "https://dir.engageautomations.com/health"
```
**Tests**: API response speed, Railway edge performance

### 22. Concurrent Request Test
```bash
ab -n 50 -c 5 "https://dir.engageautomations.com/health"
```
**Tests**: Concurrent user handling, server stability

## GoHighLevel API Compatibility Tests

### 23. Token Exchange Test
```bash
curl -X POST "https://services.leadconnectorhq.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=TEST&client_secret=TEST&code=test&redirect_uri=https://dir.engageautomations.com/oauth/callback"
```
**Tests**: GoHighLevel OAuth endpoint compatibility

### 24. User Info Endpoint Test
```bash
curl -s "https://services.leadconnectorhq.com/users/me" \
  -H "Authorization: Bearer test_token" \
  -H "Version: 2021-07-28"
```
**Tests**: GoHighLevel user API endpoint functionality

### 25. Location API Test
```bash
curl -s "https://services.leadconnectorhq.com/locations/test_location" \
  -H "Authorization: Bearer test_token" \
  -H "Version: 2021-07-28"
```
**Tests**: GoHighLevel location API integration

## Production Readiness Tests

### 26. Health Check Monitoring
```bash
curl -s "https://dir.engageautomations.com/health" | jq '.status'
```
**Tests**: Monitoring endpoint functionality, JSON response format

### 27. Version Tracking
```bash
curl -s "https://dir.engageautomations.com/api/health" | jq '.version'
```
**Tests**: Version deployment verification, change tracking

### 28. Error Logging Test
```bash
curl -s "https://dir.engageautomations.com/api/oauth/auth?installation_id=log_test"
```
**Tests**: Error logging, debugging information, log format

## Data Persistence Tests

### 29. Installation Storage Test
**Create installation through OAuth flow, then verify:**
```bash
curl -s "https://dir.engageautomations.com/api/installations"
```
**Tests**: Data persistence, installation tracking

### 30. Session Management Test
```bash
curl -s "https://dir.engageautomations.com/api/oauth/status?installation_id=existing_id"
```
**Tests**: Session persistence, token management

## Browser Compatibility Tests

### 31. User-Agent Compatibility
```bash
curl -s "https://dir.engageautomations.com/health" \
  -H "User-Agent: Mozilla/5.0 (compatible; GoHighLevel/1.0)"
```
**Tests**: Browser compatibility, user agent handling

### 32. Referrer Policy Test
```bash
curl -s "https://dir.engageautomations.com/oauth/callback?code=test" \
  -H "Referer: https://app.gohighlevel.com"
```
**Tests**: Referrer validation, security policies

## Integration Flow Tests

### 33. Complete OAuth Flow Simulation
1. Initiate OAuth: `curl "https://dir.engageautomations.com/oauth/callback?code=test"`
2. Check installation: `curl "https://dir.engageautomations.com/api/installations"`
3. Verify auth: `curl "https://dir.engageautomations.com/api/oauth/status?installation_id=ID"`

### 34. Frontend Integration Flow
1. Frontend auth request
2. OAuth callback processing
3. Installation verification
4. User info retrieval

## Custom Domain Tests

### 35. Domain Routing Test
```bash
curl -s "https://listings.engageautomations.com" -I
```
**Tests**: Custom domain functionality, DNS configuration

### 36. Cross-Domain Communication
```bash
curl -s "https://dir.engageautomations.com/health" \
  -H "Origin: https://listings.engageautomations.com"
```
**Tests**: Dual-domain architecture, CORS between domains

## Automated Test Scripts

### 37. Comprehensive Diagnostic Script
```bash
node comprehensive-oauth-diagnostic.js
```
**Tests**: All infrastructure, OAuth, and API functionality in one run

### 38. OAuth Critical Test
```bash
bash oauth-critical-test.sh
```
**Tests**: Core OAuth functionality, environment variables, token exchange

### 39. Production Verification
```bash
node oauth-production-verification.js
```
**Tests**: Production readiness, deployment verification, monitoring setup

## Test Categories Summary

### Priority 1 - Critical Tests
- Environment Variable Detection (#5)
- OAuth Callback with Real Code (#10)
- Token Exchange Test (#23)
- Health Check Monitoring (#26)

### Priority 2 - Core Functionality
- OAuth Auth Endpoint (#7)
- OAuth Status Endpoint (#8)
- Installation Management (#11)
- GoHighLevel User API Test (#13)

### Priority 3 - Integration & Performance
- Frontend OAuth Integration (#14)
- CORS Configuration (#3)
- Response Time Measurement (#21)
- Complete OAuth Flow Simulation (#33)

### Priority 4 - Security & Monitoring
- Token Validation Test (#16)
- Error Handling Tests (#18-20)
- Production Readiness Tests (#26-28)

## Automated Execution

Run all tests with:
```bash
node comprehensive-oauth-diagnostic.js
```

This provides a complete diagnostic report covering all aspects of your OAuth system, API integration, and production readiness.

## Test Results Interpretation

### Common Issues and Solutions

**Environment Variable Problems:**
- Look for "token_exchange_failed" in test results
- Check Railway Variables section for missing OAuth credentials
- Verify GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_REDIRECT_URI are set

**OAuth Flow Issues:**
- "user_info_failed" indicates token exchange worked but user endpoint failed
- Check GoHighLevel API changes or token scopes
- Verify /users/me endpoint accessibility

**Infrastructure Problems:**
- 500 errors indicate server issues
- 404 errors on known endpoints suggest deployment problems
- CORS errors indicate cross-domain configuration issues

### Success Indicators
- All health checks return 200 status
- OAuth callbacks redirect to success pages
- Installation management shows proper data persistence
- Environment variables show "SET" status in logs