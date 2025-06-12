#!/usr/bin/env node

/**
 * Complete OAuth End-to-End Test
 * Tests the entire OAuth flow with Railway backend
 */

const axios = require('axios');

const RAILWAY_BASE_URL = 'https://oauth-backend-production-68c5.up.railway.app';
const REPLIT_BASE_URL = 'https://dir.engageautomations.com';

async function testEndpoint(url, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true // Accept all status codes
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    if (response.status === 200) {
      if (response.headers['content-type']?.includes('application/json')) {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('Response preview:', response.data.toString().substring(0, 200) + '...');
      }
      return { success: true, data: response.data };
    } else {
      console.log(`❌ Failed with status ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testOAuthFlow() {
  console.log('🎯 OAuth End-to-End Flow Test');
  console.log('=====================================');
  
  // Test 1: Railway Health Check
  const healthResult = await testEndpoint(
    `${RAILWAY_BASE_URL}/health`,
    'Railway Backend Health Check'
  );
  
  if (!healthResult.success) {
    console.log('\n❌ Railway backend is not responding. Cannot proceed with OAuth tests.');
    return;
  }
  
  // Test 2: OAuth URL Generation
  const oauthUrlResult = await testEndpoint(
    `${RAILWAY_BASE_URL}/api/oauth/url`,
    'OAuth URL Generation'
  );
  
  if (!oauthUrlResult.success) {
    console.log('\n❌ OAuth URL generation failed. Backend may be running old code.');
    return;
  }
  
  // Test 3: Replit OAuth Interface
  const replatOAuthResult = await testEndpoint(
    `${REPLIT_BASE_URL}/oauth.html`,
    'Replit OAuth Interface'
  );
  
  // Test 4: Replit Success Page
  const successPageResult = await testEndpoint(
    `${REPLIT_BASE_URL}/oauth-success`,
    'OAuth Success Page'
  );
  
  // Test 5: Replit Error Page
  const errorPageResult = await testEndpoint(
    `${REPLIT_BASE_URL}/oauth-error`,
    'OAuth Error Page'
  );
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Railway Health: ${healthResult.success ? '✅' : '❌'}`);
  console.log(`OAuth URL Gen: ${oauthUrlResult.success ? '✅' : '❌'}`);
  console.log(`Replit OAuth: ${replatOAuthResult.success ? '✅' : '❌'}`);
  console.log(`Success Page: ${successPageResult.success ? '✅' : '❌'}`);
  console.log(`Error Page: ${errorPageResult.success ? '✅' : '❌'}`);
  
  // Generate OAuth URL for manual testing
  if (oauthUrlResult.success && oauthUrlResult.data.authUrl) {
    console.log('\n🔗 Manual OAuth Test URL:');
    console.log(oauthUrlResult.data.authUrl);
    console.log('\n📝 Manual Test Instructions:');
    console.log('1. Open the OAuth URL above in a browser');
    console.log('2. Complete the GoHighLevel authorization');
    console.log('3. Verify you land on the success page');
    console.log('4. Check browser network tab for token exchange');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!oauthUrlResult.success) {
    console.log('- Redeploy Railway backend with updated code');
    console.log('- Ensure environment variables are set correctly');
  }
  
  if (!replatOAuthResult.success) {
    console.log('- Clear Replit production cache');
    console.log('- Verify OAuth interface files are accessible');
  }
  
  if (healthResult.success && oauthUrlResult.success) {
    console.log('- OAuth backend is ready for live testing');
    console.log('- Frontend integration can proceed');
  }
}

async function testTokenExchange() {
  console.log('\n🔐 Token Exchange Test (Simulated)');
  console.log('=====================================');
  
  // Simulate OAuth callback with test parameters
  const callbackUrl = `${RAILWAY_BASE_URL}/api/oauth/callback?code=test_code&state=test_state`;
  
  const callbackResult = await testEndpoint(callbackUrl, 'OAuth Callback (Test Code)');
  
  if (callbackResult.success) {
    console.log('✅ Callback endpoint is responding');
  } else {
    console.log('❌ Callback endpoint failed');
    console.log('This indicates the token exchange logic may have issues');
  }
}

async function main() {
  try {
    await testOAuthFlow();
    await testTokenExchange();
    
    console.log('\n🎯 Test Complete');
    console.log('================');
    console.log('OAuth infrastructure assessment finished.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}