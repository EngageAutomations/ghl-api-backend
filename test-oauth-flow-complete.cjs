const https = require('https');
const { URL } = require('url');

/**
 * Complete OAuth Flow Test
 * Tests the Railway OAuth callback and Replit integration
 */

// Test configuration
const RAILWAY_DOMAIN = process.argv[2] || 'your-railway-url.up.railway.app';
const REPLIT_DOMAIN = 'dir.engageautomations.com';

console.log('🚀 Testing Complete OAuth Flow');
console.log(`Railway Domain: ${RAILWAY_DOMAIN}`);
console.log(`Replit Domain: ${REPLIT_DOMAIN}`);

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'OAuth-Test-Client/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          redirectLocation: res.headers.location
        });
      });
    });

    req.on('error', reject);
    req.end(options.body);
  });
}

async function testHealthEndpoint() {
  console.log('\n📋 Testing Railway Health Endpoint...');
  try {
    const response = await makeRequest(`https://${RAILWAY_DOMAIN}/health`);
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response: ${response.body}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Railway health check passed');
      return true;
    } else {
      console.log('❌ Railway health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Railway health check error:', error.message);
    return false;
  }
}

async function testOAuthCallback() {
  console.log('\n🔐 Testing OAuth Callback Flow...');
  
  // Simulate GoHighLevel OAuth callback with test parameters
  const testCode = 'test_auth_code_12345';
  const testState = 'test_state_xyz';
  
  try {
    const callbackUrl = `https://${RAILWAY_DOMAIN}/api/oauth/callback?code=${testCode}&state=${testState}`;
    console.log(`Testing callback URL: ${callbackUrl}`);
    
    const response = await makeRequest(callbackUrl, {
      headers: { 'Accept': 'text/html,application/xhtml+xml' }
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Redirect Location: ${response.redirectLocation || 'None'}`);
    
    if (response.statusCode === 302 || response.statusCode === 301) {
      console.log('✅ OAuth callback received redirect');
      
      if (response.redirectLocation && response.redirectLocation.includes(REPLIT_DOMAIN)) {
        console.log('✅ Redirect points to Replit domain');
        return true;
      } else {
        console.log('❌ Redirect does not point to Replit');
        return false;
      }
    } else {
      console.log('❌ OAuth callback did not redirect');
      return false;
    }
  } catch (error) {
    console.log('❌ OAuth callback test error:', error.message);
    return false;
  }
}

async function testReplitEndpoint() {
  console.log('\n🎯 Testing Replit OAuth Endpoint...');
  
  try {
    const testUrl = `https://${REPLIT_DOMAIN}/api/oauth/callback?code=test_code&state=test_state`;
    const response = await makeRequest(testUrl);
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response length: ${response.body.length} chars`);
    
    if (response.statusCode === 200 || response.statusCode === 302) {
      console.log('✅ Replit OAuth endpoint is accessible');
      return true;
    } else {
      console.log('⚠️ Replit OAuth endpoint returned unexpected status');
      return false;
    }
  } catch (error) {
    console.log('❌ Replit endpoint test error:', error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('=' .repeat(60));
  console.log('COMPLETE OAUTH FLOW TEST');
  console.log('=' .repeat(60));
  
  const results = {
    railway_health: await testHealthEndpoint(),
    oauth_callback: await testOAuthCallback(),
    replit_endpoint: await testReplitEndpoint()
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.replace('_', ' ').toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
  
  if (allPassed) {
    console.log('\n✅ Your OAuth flow is ready!');
    console.log('✅ Railway is properly receiving callbacks');
    console.log('✅ Callbacks are being forwarded to Replit');
    console.log('\nYou can now test with a real OAuth authorization.');
  } else {
    console.log('\n❌ Issues detected. Check the failed tests above.');
  }
}

// Run the test
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = { testHealthEndpoint, testOAuthCallback, testReplitEndpoint };