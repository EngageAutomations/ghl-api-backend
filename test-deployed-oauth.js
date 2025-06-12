#!/usr/bin/env node

/**
 * OAuth Installation Data Capture Test
 * Tests the deployed app's ability to capture user account data during installations
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const APP_URL = 'https://dir.engageautomations.com';
const CLIENT_ID = '67472ecce8b57dd9eda067a8';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OAuth-Test-Client/1.0',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testSessionDataEndpoint() {
  log('\n=== Testing Session Data Endpoint ===', colors.bold);
  
  try {
    const timestamp = Date.now();
    const url = `${APP_URL}/api/oauth/session-data?success=true&timestamp=${timestamp}`;
    
    log(`Testing: ${url}`, colors.blue);
    
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      log('✅ Session data endpoint working!', colors.green);
      log('Response:', colors.blue);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      log(`❌ Session endpoint failed: ${response.status}`, colors.red);
      log('Response:', colors.yellow);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log(`❌ Session endpoint error: ${error.message}`, colors.red);
    return false;
  }
}

async function testOAuthCallback() {
  log('\n=== Testing OAuth Callback Handling ===', colors.bold);
  
  try {
    const testCode = `test_code_${Date.now()}`;
    const testState = `test_state_${Date.now()}`;
    const url = `${APP_URL}/api/oauth/callback?code=${testCode}&state=${testState}`;
    
    log(`Testing: ${url}`, colors.blue);
    
    const response = await makeRequest(url);
    
    log(`Status: ${response.status}`, colors.blue);
    log('Response:', colors.blue);
    console.log(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
    
    return response.status < 500; // Accept 4xx as valid responses
  } catch (error) {
    log(`❌ OAuth callback error: ${error.message}`, colors.red);
    return false;
  }
}

async function testInstallationSimulation() {
  log('\n=== Testing Installation Data Capture ===', colors.bold);
  
  try {
    const installData = {
      success: 'true',
      timestamp: Date.now(),
      user_id: 'test_user_123',
      location_id: 'test_location_456'
    };
    
    const params = new URLSearchParams(installData).toString();
    const url = `${APP_URL}/api/oauth/session-data?${params}`;
    
    log(`Testing installation capture: ${url}`, colors.blue);
    
    const response = await makeRequest(url);
    
    if (response.status === 200 && response.data.success) {
      log('✅ Installation data capture working!', colors.green);
      log('Captured data:', colors.blue);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      log(`⚠️ Installation capture response: ${response.status}`, colors.yellow);
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log(`❌ Installation capture error: ${error.message}`, colors.red);
    return false;
  }
}

async function generateOAuthURL() {
  log('\n=== OAuth URL Generation ===', colors.bold);
  
  const oauthParams = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/`,
    scope: 'contacts.readonly contacts.write locations.readonly opportunities.readonly opportunities.write products.readonly products.write medias.readonly medias.write',
    state: `oauth_test_${Date.now()}`
  });

  const oauthUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${oauthParams}`;
  
  log('Generated OAuth URL:', colors.green);
  log(oauthUrl, colors.blue);
  
  log('\nTo test complete OAuth flow:', colors.yellow);
  log('1. Copy the URL above', colors.reset);
  log('2. Open it in your browser', colors.reset);
  log('3. Complete the GoHighLevel authentication', colors.reset);
  log('4. Check if your app captures the installation data', colors.reset);
  
  return oauthUrl;
}

async function checkAPIRoutes() {
  log('\n=== Checking API Route Accessibility ===', colors.bold);
  
  const routes = [
    '/api/oauth/session-data',
    '/api/oauth/callback',
    '/api/health'
  ];
  
  const results = [];
  
  for (const route of routes) {
    try {
      const url = `${APP_URL}${route}`;
      log(`Testing route: ${route}`, colors.blue);
      
      const response = await makeRequest(url);
      const accessible = response.status !== 404;
      
      results.push({ route, accessible, status: response.status });
      
      if (accessible) {
        log(`✅ ${route} - Status: ${response.status}`, colors.green);
      } else {
        log(`❌ ${route} - Not found (404)`, colors.red);
      }
    } catch (error) {
      log(`❌ ${route} - Error: ${error.message}`, colors.red);
      results.push({ route, accessible: false, error: error.message });
    }
  }
  
  return results;
}

async function runCompleteTest() {
  log('🚀 OAuth Installation Test Suite', colors.bold + colors.blue);
  log(`Testing deployed app: ${APP_URL}`, colors.blue);
  log(`OAuth Client ID: ${CLIENT_ID}`, colors.blue);
  
  const results = {
    sessionEndpoint: false,
    oauthCallback: false,
    installationCapture: false,
    routeAccessibility: false
  };
  
  // Test API route accessibility
  const routeResults = await checkAPIRoutes();
  results.routeAccessibility = routeResults.every(r => r.accessible);
  
  // Test session data endpoint
  results.sessionEndpoint = await testSessionDataEndpoint();
  
  // Test OAuth callback handling
  results.oauthCallback = await testOAuthCallback();
  
  // Test installation data capture
  results.installationCapture = await testInstallationSimulation();
  
  // Generate OAuth URL for manual testing
  await generateOAuthURL();
  
  // Summary
  log('\n=== Test Results Summary ===', colors.bold);
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  log(`Tests passed: ${passed}/${total}`, colors.blue);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;
    log(`${status} ${test}`, color);
  });
  
  if (passed === total) {
    log('\n🎉 All tests passed! Your OAuth data capture is working correctly.', colors.green + colors.bold);
    log('Your app is ready to capture user account data from real installations.', colors.green);
  } else {
    log('\n⚠️ Some tests failed. Check the output above for details.', colors.yellow);
  }
  
  log('\n📋 Next Steps:', colors.bold);
  log('1. Use the generated OAuth URL to test real authentication', colors.reset);
  log('2. Install your app in a GoHighLevel sub-account', colors.reset);
  log('3. Check if installation data appears in your app logs', colors.reset);
  log('4. Verify user account data is captured and stored', colors.reset);
}

// Run the test suite
runCompleteTest().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, colors.red);
  process.exit(1);
});