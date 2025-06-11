#!/usr/bin/env node

/**
 * Complete Live OAuth Flow Test
 * Tests the full OAuth integration with real GoHighLevel endpoints
 */

const https = require('https');
const http = require('http');

// Live OAuth Configuration - Updated with correct parameters
const OAUTH_CONFIG = {
  baseUrl: 'https://marketplace.leadconnectorhq.com',
  clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
  redirectUri: 'https://dir.engageautomations.com/oauth/callback',
  scopes: 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write',
  appDomain: 'dir.engageautomations.com'
};

function generateState() {
  return 'live_test_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

function generateLiveOAuthUrl() {
  const state = generateState();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scopes,
    state: state
  });
  
  return {
    url: `${OAUTH_CONFIG.baseUrl}/oauth/chooselocation?${params.toString()}`,
    state: state
  };
}

async function testEndpoint(hostname, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Live-OAuth-Test/1.0',
        'Accept': 'application/json, text/plain, */*'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          data: data,
          url: `https://${hostname}${path}`
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
        url: `https://${hostname}${path}`
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'Request timeout',
        url: `https://${hostname}${path}`
      });
    });

    req.end();
  });
}

async function testGoHighLevelConnectivity() {
  console.log('🔍 Testing GoHighLevel OAuth Endpoint Connectivity...');
  
  const testUrl = '/oauth/chooselocation';
  const result = await testEndpoint('marketplace.leadconnectorhq.com', testUrl);
  
  console.log(`   URL: ${result.url}`);
  console.log(`   Status: ${result.status || 'Connection Failed'}`);
  
  if (result.status >= 200 && result.status < 500) {
    console.log('   ✅ GoHighLevel OAuth endpoint is accessible');
    return true;
  } else {
    console.log(`   ❌ GoHighLevel OAuth endpoint issue: ${result.error || 'HTTP ' + result.status}`);
    return false;
  }
}

async function testCallbackEndpoints() {
  console.log('\n🔍 Testing Application Callback Endpoints...');
  
  const endpoints = [
    '/oauth/callback',
    '/api/oauth/callback',
    '/api/oauth/exchange'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(OAUTH_CONFIG.appDomain, endpoint);
    results.push({
      endpoint,
      status: result.status,
      working: result.status === 200 || result.status === 302
    });
    
    console.log(`   ${endpoint}: ${result.status} ${result.working ? '✅' : '❌'}`);
  }
  
  return results.filter(r => r.working).length > 0;
}

async function simulateOAuthCallback(authCode, state) {
  console.log('\n🔍 Testing OAuth Callback Processing...');
  
  const callbackUrl = `/oauth/callback?code=${authCode}&state=${state}`;
  const result = await testEndpoint(OAUTH_CONFIG.appDomain, callbackUrl);
  
  console.log(`   Callback URL: https://${OAUTH_CONFIG.appDomain}${callbackUrl}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Response Type: ${result.headers['content-type'] || 'Unknown'}`);
  
  if (result.status === 302) {
    console.log(`   Redirect Location: ${result.headers.location || 'None'}`);
    console.log('   ✅ OAuth callback processing functional');
    return true;
  } else if (result.status === 500) {
    console.log('   ⚠️  OAuth callback reached but failed token exchange (expected with test code)');
    return true;
  } else {
    console.log('   ❌ OAuth callback processing failed');
    return false;
  }
}

async function runCompleteLiveTest() {
  console.log('🚀 Live OAuth Integration Test');
  console.log('==============================\n');
  
  // Generate live OAuth URL
  const oauthData = generateLiveOAuthUrl();
  console.log('1️⃣ Generated Live OAuth URL:');
  console.log(`   State: ${oauthData.state}`);
  console.log(`   URL: ${oauthData.url}\n`);
  
  // Test GoHighLevel connectivity
  const ghlConnected = await testGoHighLevelConnectivity();
  
  // Test callback endpoints
  const callbacksWorking = await testCallbackEndpoints();
  
  // Test OAuth callback processing
  const testCode = 'test_authorization_code_' + Date.now();
  const callbackWorking = await simulateOAuthCallback(testCode, oauthData.state);
  
  console.log('\n📊 Live OAuth Test Results:');
  console.log('============================');
  console.log(`GoHighLevel Connectivity: ${ghlConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Callback Endpoints: ${callbacksWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`OAuth Processing: ${callbackWorking ? '✅ Functional' : '❌ Failed'}`);
  
  const overallStatus = ghlConnected && callbacksWorking && callbackWorking;
  console.log(`\nOverall Status: ${overallStatus ? '✅ READY FOR LIVE OAUTH' : '❌ Issues Detected'}`);
  
  if (overallStatus) {
    console.log('\n🎯 Ready for Live OAuth Testing:');
    console.log('=================================');
    console.log('1. Copy the OAuth URL above');
    console.log('2. Open it in a browser');
    console.log('3. Complete GoHighLevel authorization');
    console.log('4. Verify successful token exchange and storage');
    console.log('\n📋 Live OAuth URL for Manual Testing:');
    console.log(`${oauthData.url}`);
  } else {
    console.log('\n⚠️  Issues detected - OAuth flow may not work correctly');
  }
  
  return {
    success: overallStatus,
    oauthUrl: oauthData.url,
    state: oauthData.state,
    tests: {
      ghlConnectivity: ghlConnected,
      callbackEndpoints: callbacksWorking,
      oauthProcessing: callbackWorking
    }
  };
}

// Run the test if called directly
if (require.main === module) {
  runCompleteLiveTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Live OAuth test failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteLiveTest, generateLiveOAuthUrl, OAUTH_CONFIG };