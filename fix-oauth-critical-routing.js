/**
 * Fix OAuth Critical Routing Issues
 * Addresses API route ordering and scope configuration for production deployment
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testRouteOrdering() {
  log('\n🔧 Testing Route Ordering Priority', colors.cyan);
  
  // Test current Railway backend endpoints
  const testEndpoints = [
    'https://dir.engageautomations.com/api/oauth/auth',
    'https://dir.engageautomations.com/api/oauth/status',
    'https://dir.engageautomations.com/api/health'
  ];
  
  const results = {};
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Accept': 'application/json' }
      });
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      results[endpoint] = {
        status: response.status,
        isJson,
        exists: response.status !== 404
      };
      
      log(`${endpoint}: ${response.status} - ${isJson ? 'JSON' : 'HTML'}`, 
          response.status === 404 ? colors.red : colors.green);
      
    } catch (error) {
      results[endpoint] = { error: error.message };
      log(`${endpoint}: Error - ${error.message}`, colors.red);
    }
  }
  
  return results;
}

async function updateEnvironmentConfig() {
  log('\n⚙️ Generating Environment Configuration', colors.cyan);
  
  const envConfig = `# Railway Environment Variables - OAuth Fix
# Copy these exact values to Railway environment settings

GHL_CLIENT_ID=your_gohighlevel_client_id
GHL_CLIENT_SECRET=your_gohighlevel_client_secret
GHL_REDIRECT_URI=https://dir.engageautomations.com/api/oauth/callback
GHL_SCOPES="users.read products/prices.write products/prices.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write"

# CRITICAL: Ensure users.read scope is present for user info retrieval
# CRITICAL: Redirect URI must match Railway domain exactly

# OAuth Configuration Verification
NODE_ENV=production
PORT=3000

# Debug flags (optional)
DEBUG_OAUTH=true
OAUTH_VERBOSE_LOGGING=true
`;

  fs.writeFileSync('railway-oauth-env.txt', envConfig);
  log('✅ Environment configuration saved to railway-oauth-env.txt', colors.green);
}

async function validateGoHighLevelEndpoint() {
  log('\n🔍 Validating GoHighLevel API Endpoint', colors.cyan);
  
  // Test the correct GoHighLevel user info endpoint
  const testScript = `#!/bin/bash
# GoHighLevel API Endpoint Validation
# Test script for verifying correct API endpoint and headers

echo "Testing GoHighLevel API Endpoint Configuration..."

# Test endpoint with sample request (will fail with 401 but should return JSON)
curl -v \\
  -H "Authorization: Bearer test_token" \\
  -H "Version: 2021-07-28" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  "https://services.leadconnectorhq.com/v1/users/me"

echo ""
echo "Expected behavior:"
echo "- Should return 401 Unauthorized (expected without valid token)"
echo "- Should return JSON response (not HTML)"
echo "- Content-Type should be application/json"
echo ""
echo "If you see HTML instead of JSON, the endpoint configuration is incorrect."
`;

  fs.writeFileSync('test-ghl-endpoint.sh', testScript);
  fs.chmodSync('test-ghl-endpoint.sh', '755');
  log('✅ GoHighLevel endpoint test script created: test-ghl-endpoint.sh', colors.green);
}

async function createTestScript() {
  log('\n🧪 Creating Comprehensive Test Script', colors.cyan);
  
  const testScript = `#!/bin/bash
# OAuth Comprehensive Test Suite
# Tests all critical OAuth functionality

echo "🧪 OAuth Critical Routing Test Suite"
echo "===================================="

BASE_URL="https://dir.engageautomations.com"

# Test 1: Check missing /api/oauth/auth endpoint
echo "1. Testing /api/oauth/auth endpoint..."
AUTH_RESPONSE=\$(curl -s -o /dev/null -w "%{http_code}" "\$BASE_URL/api/oauth/auth?installation_id=test")
if [ "\$AUTH_RESPONSE" = "404" ]; then
  echo "❌ /api/oauth/auth endpoint missing (expected)"
  echo "   This is causing the frontend retry failures"
else
  echo "✅ /api/oauth/auth endpoint available: \$AUTH_RESPONSE"
fi

# Test 2: Check /api/oauth/status endpoint
echo "2. Testing /api/oauth/status endpoint..."
STATUS_RESPONSE=\$(curl -s "\$BASE_URL/api/oauth/status?installation_id=test")
if echo "\$STATUS_RESPONSE" | jq . >/dev/null 2>&1; then
  echo "✅ /api/oauth/status returns valid JSON"
else
  echo "❌ /api/oauth/status returns invalid JSON or HTML"
fi

# Test 3: Test OAuth callback endpoint
echo "3. Testing OAuth callback endpoint..."
CALLBACK_RESPONSE=\$(curl -s -o /dev/null -w "%{http_code}" "\$BASE_URL/oauth/callback?code=test")
echo "   OAuth callback status: \$CALLBACK_RESPONSE"

# Test 4: Health check
echo "4. Testing health endpoint..."
HEALTH=\$(curl -s "\$BASE_URL/api/health")
if echo "\$HEALTH" | jq .status 2>/dev/null | grep -q "healthy"; then
  echo "✅ Health check working"
else
  echo "❌ Health check failed"
fi

echo ""
echo "🔍 DIAGNOSIS:"
echo "============"
if [ "\$AUTH_RESPONSE" = "404" ]; then
  echo "PRIMARY ISSUE: Frontend retry calls /api/oauth/auth but Railway backend only has /api/oauth/status"
  echo "SOLUTION: Either add /api/oauth/auth endpoint or update frontend to use /api/oauth/status"
fi

echo ""
echo "📋 REQUIRED ACTIONS:"
echo "==================="
echo "1. Deploy updated Railway backend with /api/oauth/auth endpoint"
echo "2. Verify GoHighLevel app scopes include 'users.read'"
echo "3. Test complete OAuth flow with real GoHighLevel account"
echo "4. Update frontend error handling if needed"
`;

  fs.writeFileSync('oauth-critical-test.sh', testScript);
  fs.chmodSync('oauth-critical-test.sh', '755');
  log('✅ Critical test script created: oauth-critical-test.sh', colors.green);
}

async function generateDeploymentChecklist() {
  log('\n📋 Generating Deployment Checklist', colors.cyan);
  
  const checklist = `# OAuth Critical Fix Deployment Checklist

## Immediate Actions Required

### 1. Railway Backend Update
- [ ] Deploy updated \`railway-oauth-complete/\` directory
- [ ] Verify \`/api/oauth/auth\` endpoint is included
- [ ] Test endpoint availability: \`curl https://dir.engageautomations.com/api/oauth/auth\`

### 2. Environment Variables Verification
- [ ] \`GHL_CLIENT_ID\` - Set in Railway
- [ ] \`GHL_CLIENT_SECRET\` - Set in Railway  
- [ ] \`GHL_REDIRECT_URI\` - Set to \`https://dir.engageautomations.com/api/oauth/callback\`
- [ ] \`GHL_SCOPES\` - Must include \`users.read\` for user info retrieval

### 3. GoHighLevel App Configuration
- [ ] Add \`users.read\` to OAuth scopes in GoHighLevel developer console
- [ ] Update redirect URI to match Railway domain
- [ ] Verify app is active and properly configured

### 4. Testing Verification
- [ ] Run \`./oauth-critical-test.sh\` to verify endpoints
- [ ] Test OAuth flow with real GoHighLevel account
- [ ] Verify "Try Again" button works on error page
- [ ] Confirm user info retrieval succeeds

## Root Cause Analysis

### Primary Issue: Missing Endpoint
Frontend error page retry mechanism calls \`/api/oauth/auth\` but Railway backend only provides \`/api/oauth/status\`.

### Secondary Issue: OAuth Configuration
"user_info_failed" error suggests:
- Missing \`users.read\` scope
- Incorrect API endpoint configuration
- Token refresh mechanism problems

## Success Criteria

- [ ] No more 404 errors on retry attempts
- [ ] "user_info_failed" errors resolved
- [ ] Complete OAuth flow works end-to-end
- [ ] User info displays correctly after authentication

## Emergency Rollback Plan

If deployment fails:
1. Revert to previous Railway deployment
2. Update frontend to use \`/api/oauth/status\` instead of \`/api/oauth/auth\`
3. Implement proper OAuth initiation flow

The fix addresses both the missing endpoint issue and the underlying OAuth configuration problems.
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  log('✅ Deployment checklist created: DEPLOYMENT_CHECKLIST.md', colors.green);
}

async function main() {
  try {
    log('🚀 OAuth Critical Routing Fix', colors.bright);
    log('Analyzing and fixing OAuth endpoint and configuration issues...', colors.cyan);
    
    const routeResults = await testRouteOrdering();
    await updateEnvironmentConfig();
    await validateGoHighLevelEndpoint();
    await createTestScript();
    await generateDeploymentChecklist();
    
    log('\n📊 ANALYSIS SUMMARY', colors.cyan);
    log('===================', colors.cyan);
    
    const authEndpointMissing = routeResults['https://dir.engageautomations.com/api/oauth/auth']?.status === 404;
    
    if (authEndpointMissing) {
      log('❌ CRITICAL: /api/oauth/auth endpoint missing from Railway deployment', colors.red);
      log('   This causes frontend retry failures with 404 errors', colors.red);
    }
    
    log('\n🔧 FIXES GENERATED:', colors.green);
    log('- railway-oauth-env.txt: Environment variables with correct scopes');
    log('- test-ghl-endpoint.sh: GoHighLevel API endpoint validation');
    log('- oauth-critical-test.sh: Comprehensive endpoint testing');
    log('- DEPLOYMENT_CHECKLIST.md: Step-by-step fix implementation');
    
    log('\n🎯 NEXT STEPS:', colors.yellow);
    log('1. Deploy updated railway-oauth-complete/ directory to Railway');
    log('2. Set environment variables from railway-oauth-env.txt');
    log('3. Run oauth-critical-test.sh to verify fixes');
    log('4. Test complete OAuth flow with real GoHighLevel account');
    
    log('\n✅ OAuth critical routing analysis complete!', colors.green);
    
  } catch (error) {
    log('❌ Critical routing fix failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();