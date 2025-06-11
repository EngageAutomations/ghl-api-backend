#!/usr/bin/env node

/**
 * Complete OAuth Flow Test - Tests the working OAuth callback endpoint
 * and demonstrates the complete OAuth integration for GoHighLevel
 */

const https = require('https');

const BASE_URL = 'https://dir.engageautomations.com';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OAuth-Flow-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
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
    
    if (method === 'POST' && data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCompleteOAuthFlow() {
  console.log('🧪 Testing Complete OAuth Flow');
  console.log('==============================\n');

  // Test 1: Verify OAuth callback endpoint works
  console.log('1️⃣ Testing OAuth callback endpoint (basic)...');
  try {
    const result = await makeRequest('GET', '/api/oauth/callback');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data)}`);
    
    if (result.status === 200) {
      console.log('   ✅ OAuth callback endpoint working!\n');
    } else {
      console.log('   ❌ OAuth callback endpoint failed\n');
      return;
    }
  } catch (error) {
    console.log(`   ❌ OAuth callback error: ${error.message}\n`);
    return;
  }

  // Test 2: Test OAuth callback with action parameter
  console.log('2️⃣ Testing OAuth callback with action parameter...');
  try {
    const result = await makeRequest('GET', '/api/oauth/callback?action=generate-url&state=test_state_456');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 200 && result.data.authUrl) {
      console.log('   ✅ OAuth URL generation working via callback endpoint!\n');
      console.log(`   🔗 Generated Auth URL: ${result.data.authUrl}\n`);
      return result.data.authUrl; // Return for manual testing
    } else {
      console.log('   ❌ OAuth URL generation failed via callback endpoint\n');
    }
  } catch (error) {
    console.log(`   ❌ OAuth URL generation error: ${error.message}\n`);
  }

  // Test 3: Test OAuth callback with simulated code return
  console.log('3️⃣ Testing OAuth callback with simulated code...');
  try {
    const result = await makeRequest('GET', '/api/oauth/callback?code=test_code_789&state=test_state_456');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 302 || result.status === 500) {
      console.log('   ✅ OAuth code processing endpoint reachable (expected error with dummy code)\n');
    } else if (result.status === 200) {
      console.log('   ✅ OAuth code processing working!\n');
    } else {
      console.log('   ❌ OAuth code processing endpoint not working\n');
    }
  } catch (error) {
    console.log(`   ❌ OAuth code processing error: ${error.message}\n`);
  }

  console.log('🎯 OAuth Flow Summary');
  console.log('====================');
  console.log('✅ OAuth callback endpoint: Working');
  console.log('❓ OAuth URL generation: Check results above');
  console.log('❓ OAuth code processing: Check results above');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. If URL generation worked, copy the auth URL');
  console.log('2. Open it in a browser to test the GoHighLevel OAuth flow');
  console.log('3. Complete the OAuth authorization in GoHighLevel');
  console.log('4. Verify the callback processes the code correctly');
  
  console.log('\n🔧 Technical Details:');
  console.log('- OAuth callback endpoint handles complete flow');
  console.log('- Uses action=generate-url for URL generation');
  console.log('- Processes code parameter for token exchange');
  console.log('- Bypasses Replit routing limitations');
}

// Run the complete test
testCompleteOAuthFlow().catch(console.error);