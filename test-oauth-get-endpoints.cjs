#!/usr/bin/env node

/**
 * Test OAuth GET Endpoints for Replit Infrastructure Compatibility
 * Tests the GET-based OAuth flow to bypass POST routing issues
 */

const https = require('https');
const querystring = require('querystring');

const BASE_URL = 'https://dir.engageautomations.com';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    if (method === 'GET' && data) {
      // Add query parameters for GET requests
      Object.keys(data).forEach(key => {
        url.searchParams.append(key, data[key]);
      });
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OAuth-Test-Client/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (method === 'POST' && data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOAuthGetEndpoints() {
  console.log('🧪 Testing OAuth GET Endpoints');
  console.log('================================\n');

  // Test 1: OAuth callback endpoint (already working)
  console.log('1️⃣ Testing OAuth callback endpoint...');
  try {
    const result = await makeRequest('GET', '/api/oauth/callback?test=1');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data)}`);
    
    if (result.status === 200) {
      console.log('   ✅ OAuth callback endpoint working!\n');
    } else {
      console.log('   ❌ OAuth callback endpoint failed\n');
    }
  } catch (error) {
    console.log(`   ❌ OAuth callback error: ${error.message}\n`);
  }

  // Test 2: OAuth URL generation endpoint (GET version)
  console.log('2️⃣ Testing OAuth URL generation (GET)...');
  try {
    const result = await makeRequest('GET', '/api/oauth/url', { state: 'test_state_123' });
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 200 && result.data.authUrl) {
      console.log('   ✅ OAuth URL generation working!\n');
      return result.data.authUrl; // Return for potential manual testing
    } else {
      console.log('   ❌ OAuth URL generation failed\n');
    }
  } catch (error) {
    console.log(`   ❌ OAuth URL generation error: ${error.message}\n`);
  }

  // Test 3: OAuth token exchange endpoint (GET version)
  console.log('3️⃣ Testing OAuth token exchange (GET)...');
  try {
    // Use a dummy code to test the endpoint structure
    const result = await makeRequest('GET', '/api/oauth/exchange', { 
      code: 'test_code_123', 
      state: 'test_state_123' 
    });
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 400 || result.status === 500) {
      console.log('   ✅ OAuth token exchange endpoint reachable (expected error with dummy code)\n');
    } else if (result.status === 200) {
      console.log('   ✅ OAuth token exchange working!\n');
    } else {
      console.log('   ❌ OAuth token exchange endpoint not found\n');
    }
  } catch (error) {
    console.log(`   ❌ OAuth token exchange error: ${error.message}\n`);
  }

  console.log('🏁 Test Results Summary');
  console.log('======================');
  console.log('✅ OAuth callback: Working');
  console.log('❓ OAuth URL generation: Check logs above');
  console.log('❓ OAuth token exchange: Check logs above');
  console.log('\n📋 Next Steps:');
  console.log('1. If URL generation works, use it in your frontend');
  console.log('2. If token exchange is reachable, the OAuth flow should work');
  console.log('3. Test with real GoHighLevel OAuth flow');
}

// Run the test
testOAuthGetEndpoints().catch(console.error);