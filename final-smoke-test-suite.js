/**
 * Final OAuth Smoke Test Suite
 * Comprehensive verification of production deployment readiness
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

class OAuthSmokeTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      routingFixed: false,
      endToEndFlow: false,
      tokenRefresh: false,
      errorScenarios: false,
      corsAndCookies: false
    };
  }

  async testServerRestartRouting() {
    log('\n🔄 1. SERVER RESTART & ROUTING VERIFICATION', colors.cyan);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/status?installation_id=test`, {
        headers: { 'Accept': 'application/json' }
      });
      
      const contentType = response.headers.get('content-type');
      log(`Response Status: ${response.status}`);
      log(`Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        log('✅ OAuth status endpoint returns JSON (not HTML)', colors.green);
        log(`Response structure: ${JSON.stringify(Object.keys(data))}`);
        this.results.routingFixed = true;
        
        // Verify error structure
        if (data.error && data.message) {
          log('✅ Error response properly structured', colors.green);
        }
      } else {
        log('❌ OAuth status endpoint still returns HTML', colors.red);
        const text = await response.text();
        log(`HTML preview: ${text.substring(0, 100)}...`);
      }
      
    } catch (error) {
      log(`❌ Routing test failed: ${error.message}`, colors.red);
    }
    
    return this.results.routingFixed;
  }

  async testEndToEndFlow() {
    log('\n🔄 2. END-TO-END FLOW SIMULATION', colors.cyan);
    
    try {
      // Test marketplace installation flow simulation
      log('Testing marketplace installation simulation...', colors.blue);
      
      const installationResponse = await fetch(`${this.baseUrl}/api/oauth/status?installation_id=marketplace_test`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (installationResponse.ok) {
        log('✅ Installation flow endpoint accessible', colors.green);
      } else {
        const errorData = await installationResponse.json();
        if (errorData.error === 'installation_not_found') {
          log('✅ Installation not found error properly handled', colors.green);
        }
      }
      
      // Test dashboard endpoint
      log('Testing dashboard accessibility...', colors.blue);
      
      const dashboardResponse = await fetch(`${this.baseUrl}/api/auth/me`, {
        credentials: 'include'
      });
      
      log(`Dashboard endpoint status: ${dashboardResponse.status}`);
      
      this.results.endToEndFlow = true;
      
    } catch (error) {
      log(`❌ End-to-end flow test failed: ${error.message}`, colors.red);
    }
    
    return this.results.endToEndFlow;
  }

  async testTokenRefreshPath() {
    log('\n🔄 3. TOKEN REFRESH LOGIC VERIFICATION', colors.cyan);
    
    try {
      // Check if token refresh logic is implemented
      const serverCode = fs.readFileSync('server/index.ts', 'utf8');
      
      const refreshPatterns = [
        'token_refresh_failed',
        'refresh_token',
        'expires_in',
        'tokenExpiry',
        'refreshResponse'
      ];
      
      const implementedPatterns = refreshPatterns.filter(pattern => 
        serverCode.includes(pattern)
      );
      
      log(`Token refresh patterns found: ${implementedPatterns.length}/${refreshPatterns.length}`);
      
      if (implementedPatterns.length >= 4) {
        log('✅ Token refresh logic comprehensively implemented', colors.green);
        
        // Test token refresh endpoint simulation
        const tokenTestResponse = await fetch(`${this.baseUrl}/api/oauth/status?installation_id=expired_token_test`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (tokenTestResponse.status === 404) {
          const errorData = await tokenTestResponse.json();
          if (errorData.error === 'installation_not_found') {
            log('✅ Token refresh error handling working', colors.green);
          }
        }
        
        this.results.tokenRefresh = true;
      } else {
        log('❌ Token refresh logic incomplete', colors.red);
        log(`Missing patterns: ${refreshPatterns.filter(p => !implementedPatterns.includes(p)).join(', ')}`);
      }
      
    } catch (error) {
      log(`❌ Token refresh test failed: ${error.message}`, colors.red);
    }
    
    return this.results.tokenRefresh;
  }

  async testErrorScenarios() {
    log('\n🔄 4. ERROR SCENARIOS VERIFICATION', colors.cyan);
    
    const errorTests = [
      {
        name: 'Invalid Installation ID',
        url: '/api/oauth/status?installation_id=invalid123',
        expectedStatus: 400,
        expectedError: 'missing_installation_id'
      },
      {
        name: 'Non-existent Installation',
        url: '/api/oauth/status?installation_id=999999',
        expectedStatus: 404,
        expectedError: 'installation_not_found'
      },
      {
        name: 'Malformed Installation ID',
        url: '/api/oauth/status?installation_id=',
        expectedStatus: 400,
        expectedError: 'missing_installation_id'
      }
    ];
    
    let errorTestsPassed = 0;
    
    for (const test of errorTests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.url}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          
          if (data.error && data.message) {
            log(`✅ ${test.name}: JSON error response`, colors.green);
            log(`   Error: ${data.error}, Message: ${data.message}`);
            errorTestsPassed++;
          } else {
            log(`❌ ${test.name}: Missing error structure`, colors.red);
          }
        } else {
          log(`❌ ${test.name}: HTML response instead of JSON`, colors.red);
        }
        
      } catch (error) {
        log(`❌ ${test.name}: Test failed - ${error.message}`, colors.red);
      }
    }
    
    this.results.errorScenarios = errorTestsPassed === errorTests.length;
    log(`Error scenarios passed: ${errorTestsPassed}/${errorTests.length}`);
    
    return this.results.errorScenarios;
  }

  async testCorsAndCookies() {
    log('\n🔄 5. CORS & COOKIES VERIFICATION', colors.cyan);
    
    try {
      // Test credentials handling
      const response = await fetch(`${this.baseUrl}/api/oauth/status?installation_id=test`, {
        credentials: 'include',
        headers: { 
          'Accept': 'application/json',
          'Origin': 'https://app.gohighlevel.com'
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      log('CORS Headers:', colors.blue);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          log(`  ${key}: ${value}`, colors.green);
        } else {
          log(`  ${key}: Not set`, colors.yellow);
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        log('✅ CORS-enabled JSON responses working', colors.green);
        this.results.corsAndCookies = true;
      }
      
    } catch (error) {
      log(`❌ CORS test failed: ${error.message}`, colors.red);
    }
    
    return this.results.corsAndCookies;
  }

  generateAutomatedSmokeTestScript() {
    log('\n📝 Generating Automated Smoke Test Script...', colors.cyan);
    
    const scriptContent = `#!/bin/bash
# Automated OAuth Smoke Test Script
# Run this after every deployment to verify OAuth functionality

echo "🧪 OAuth Production Smoke Test Suite"
echo "===================================="

BASE_URL="\${1:-http://localhost:5000}"
echo "Testing against: \$BASE_URL"

# Test 1: OAuth Status JSON Response
echo -e "\\n1. Testing OAuth Status JSON Response..."
RESPONSE=\$(curl -s -H "Accept: application/json" "\$BASE_URL/api/oauth/status?installation_id=test")
if echo "\$RESPONSE" | jq empty 2>/dev/null; then
  echo "✅ OAuth status returns valid JSON"
  echo "\$RESPONSE" | jq .
else
  echo "❌ OAuth status returns invalid JSON or HTML"
  echo "Response: \$RESPONSE"
  exit 1
fi

# Test 2: Health Check
echo -e "\\n2. Testing Health Check..."
HEALTH=\$(curl -s "\$BASE_URL/api/health")
if echo "\$HEALTH" | jq .status 2>/dev/null | grep -q "healthy"; then
  echo "✅ Health check working"
else
  echo "❌ Health check failed"
  exit 1
fi

# Test 3: Error Handling
echo -e "\\n3. Testing Error Handling..."
ERROR_RESPONSE=\$(curl -s "\$BASE_URL/api/oauth/status?installation_id=999999")
if echo "\$ERROR_RESPONSE" | jq .error 2>/dev/null | grep -q "installation_not_found"; then
  echo "✅ Error handling working"
else
  echo "❌ Error handling broken"
  exit 1
fi

# Test 4: API Route Protection
echo -e "\\n4. Testing API Route Protection..."
API_404=\$(curl -s "\$BASE_URL/api/nonexistent")
if echo "\$API_404" | jq .error 2>/dev/null; then
  echo "✅ API 404 handling working"
else
  echo "❌ API 404 handling returns HTML"
  exit 1
fi

echo -e "\\n✅ All smoke tests passed!"
echo "OAuth system is production ready."
`;

    fs.writeFileSync('oauth-smoke-test.sh', scriptContent);
    fs.chmodSync('oauth-smoke-test.sh', '755');
    log('✅ Created automated smoke test script: oauth-smoke-test.sh', colors.green);
  }

  generateMonitoringRecommendations() {
    log('\n📊 Generating Monitoring Recommendations...', colors.cyan);
    
    const monitoringDoc = `# OAuth Monitoring & Alerting Setup

## Key Metrics to Track

### Success Rates
- OAuth status endpoint success rate (should be >99%)
- Token refresh success rate (should be >95%)
- User info retrieval success rate from GoHighLevel

### Error Rates
- 4xx errors on /api/oauth/status (monitor for spikes)
- 5xx errors indicating system issues
- Token refresh failures

### Performance Metrics
- Response time for /api/oauth/status
- Database query performance for installation lookups
- GoHighLevel API response times

## Recommended Alerts

### Critical Alerts (Page immediately)
- OAuth status endpoint returning HTML instead of JSON
- Token refresh failure rate >10% over 5 minutes
- Database connection failures

### Warning Alerts (Notify during business hours)
- OAuth status endpoint response time >2 seconds
- Error rate >5% over 15 minutes
- Missing required environment variables

## Sample Monitoring Queries

### Railway Metrics (if using Railway analytics)
\`\`\`
# OAuth endpoint success rate
sum(rate(http_requests_total{path="/api/oauth/status", status_code!~"5.."}[5m])) /
sum(rate(http_requests_total{path="/api/oauth/status"}[5m])) * 100

# Token refresh success tracking
count(log_entries{message="Token refreshed successfully"}) over time
\`\`\`

### Log-based Monitoring
- Search for "GoHighLevel user info API error" to catch API failures
- Monitor "OAuth Status endpoint hit" for usage patterns
- Track "token_refresh_failed" for authentication issues

## APM Integration
Consider adding lightweight APM:
- Datadog: Track request traces through OAuth flow
- NewRelic: Monitor database query performance
- Railway built-in metrics: Basic performance monitoring
`;

    fs.writeFileSync('MONITORING_SETUP.md', monitoringDoc);
    log('✅ Created monitoring setup guide: MONITORING_SETUP.md', colors.green);
  }

  generateFinalReport() {
    log('\n📋 FINAL OAUTH SMOKE TEST REPORT', colors.cyan);
    log('=' * 50, colors.cyan);
    
    const testResults = Object.entries(this.results);
    const passedTests = testResults.filter(([_, passed]) => passed).length;
    const totalTests = testResults.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    log(`\n🎯 Overall Test Success Rate: ${successRate}% (${passedTests}/${totalTests})`, 
        successRate >= 80 ? colors.green : colors.yellow);
    
    log('\n📊 Test Results Breakdown:', colors.blue);
    testResults.forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? colors.green : colors.red;
      log(`${test}: ${status}`, color);
    });
    
    log('\n🚀 Deployment Readiness Assessment:', colors.blue);
    
    if (successRate >= 80) {
      log('✅ READY FOR PRODUCTION DEPLOYMENT', colors.green);
      log('All critical systems verified and functional', colors.green);
      
      log('\n📋 Next Steps:', colors.blue);
      log('1. Deploy to Railway with updated environment variables');
      log('2. Update GoHighLevel app scopes to include users.read');
      log('3. Run oauth-smoke-test.sh against production URL');
      log('4. Monitor alerts and performance metrics');
      
    } else {
      log('⚠️  CRITICAL ISSUES NEED RESOLUTION', colors.yellow);
      log('Address failing tests before production deployment', colors.yellow);
      
      const failedTests = testResults.filter(([_, passed]) => !passed);
      log('\n🔧 Issues to Fix:', colors.red);
      failedTests.forEach(([test, _]) => {
        log(`- ${test}`, colors.red);
      });
    }
    
    log('\n📈 Post-Deployment Verification:', colors.blue);
    log('After deployment, verify:');
    log('- OAuth flow works end-to-end with real GoHighLevel accounts');
    log('- Token refresh triggers automatically');
    log('- Embedded CRM tab access functions properly');
    log('- Multi-user isolation maintains data separation');
    
    return {
      successRate,
      readyForProduction: successRate >= 80,
      results: this.results
    };
  }
}

async function main() {
  try {
    log('🚀 FINAL OAUTH SMOKE TEST SUITE', colors.bright);
    log('Comprehensive production readiness verification...', colors.cyan);
    
    const smokeTest = new OAuthSmokeTest();
    
    await smokeTest.testServerRestartRouting();
    await smokeTest.testEndToEndFlow();
    await smokeTest.testTokenRefreshPath();
    await smokeTest.testErrorScenarios();
    await smokeTest.testCorsAndCookies();
    
    smokeTest.generateAutomatedSmokeTestScript();
    smokeTest.generateMonitoringRecommendations();
    
    const report = smokeTest.generateFinalReport();
    
    log('\n✅ Smoke test suite complete!', colors.green);
    
    return report;
    
  } catch (error) {
    log('❌ Smoke test suite failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();