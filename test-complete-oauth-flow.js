#!/usr/bin/env node

/**
 * Complete OAuth Flow Test for GoHighLevel Integration
 * Tests all OAuth endpoints and identifies routing issues
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://dir.engageautomations.com';
const TEST_STATE = `test_${Date.now()}`;

async function testEndpoint(method, path, data = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  
  try {
    console.log(`\n🔍 Testing ${method} ${path}`);
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${contentType}`);
    
    if (typeof responseData === 'string' && responseData.length > 200) {
      console.log(`   Response: ${responseData.substring(0, 200)}...`);
    } else {
      console.log(`   Response:`, responseData);
    }
    
    return {
      status: response.status,
      data: responseData,
      contentType,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function runCompleteOAuthTest() {
  console.log('🚀 Starting Complete OAuth Flow Test');
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log(`🔑 Test State: ${TEST_STATE}`);
  
  const results = {};
  
  // Test 1: Basic server connectivity
  console.log('\n=== 1. Basic Server Connectivity ===');
  results.connectivity = await testEndpoint('GET', '/');
  
  // Test 2: Test route (should work)
  console.log('\n=== 2. Test Route (GET) ===');
  results.testRoute = await testEndpoint('GET', '/test');
  
  // Test 3: OAuth callback (should work)
  console.log('\n=== 3. OAuth Callback (GET) ===');
  results.oauthCallback = await testEndpoint('GET', '/api/oauth/callback?test=1');
  
  // Test 4: OAuth URL generation (the problematic POST route)
  console.log('\n=== 4. OAuth URL Generation (POST) ===');
  results.oauthUrl = await testEndpoint('POST', '/api/oauth/url', {
    state: TEST_STATE,
    scopes: ['contacts.readonly']
  });
  
  // Test 5: OAuth token exchange (another POST route)
  console.log('\n=== 5. OAuth Token Exchange (POST) ===');
  results.oauthExchange = await testEndpoint('POST', '/api/oauth/exchange', {
    code: 'test_code',
    state: TEST_STATE
  });
  
  // Test 6: Alternative OAuth endpoint paths
  console.log('\n=== 6. Alternative OAuth Paths ===');
  results.oauthStart = await testEndpoint('GET', '/oauth/start');
  results.oauthCallback2 = await testEndpoint('GET', '/oauth/callback');
  
  // Test 7: Non-existent API endpoint
  console.log('\n=== 7. Non-existent API Endpoint ===');
  results.nonExistent = await testEndpoint('GET', '/api/nonexistent');
  
  // Summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('✅ = Working, ❌ = Failed, ⚠️ = Unexpected');
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.status || 'ERROR';
    console.log(`${icon} ${test}: ${status}`);
    
    if (!result.success && result.data?.error) {
      console.log(`   └─ ${result.data.error}`);
    }
  });
  
  // Analysis
  console.log('\n=== ROUTING ANALYSIS ===');
  
  const getWorking = results.testRoute?.success && results.oauthCallback?.success;
  const postFailing = !results.oauthUrl?.success && !results.oauthExchange?.success;
  
  if (getWorking && postFailing) {
    console.log('🔍 DIAGNOSIS: GET routes work, POST routes are intercepted');
    console.log('   This indicates a middleware ordering issue where:');
    console.log('   - OAuth routes are registered but POST middleware is missing');
    console.log('   - Static file handler is catching POST requests before OAuth handlers');
    console.log('   - Body parsing middleware may not be applied to OAuth routes');
  } else if (!getWorking && !postFailing) {
    console.log('🔍 DIAGNOSIS: No OAuth routes are working');
    console.log('   OAuth routes may not be registered at all');
  } else if (getWorking && !postFailing) {
    console.log('🔍 DIAGNOSIS: All OAuth routes are working correctly');
  }
  
  // Check if responses indicate static file serving
  const isStaticResponse = (result) => {
    return result.contentType?.includes('text/html') && 
           (typeof result.data === 'string' && result.data.includes('<!DOCTYPE html>'));
  };
  
  if (isStaticResponse(results.oauthUrl)) {
    console.log('⚠️  POST routes are being served as HTML (static file fallback)');
  }
  
  if (results.oauthUrl?.data?.error?.includes('API endpoint not found')) {
    console.log('⚠️  POST routes hitting catch-all error handler');
  }
  
  console.log('\n🏁 OAuth Flow Test Complete');
  
  return results;
}

// Run the test
runCompleteOAuthTest().catch(console.error);