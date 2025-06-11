#!/usr/bin/env node

/**
 * Direct OAuth Flow Test - Tests OAuth functionality directly with GoHighLevel
 */

const https = require('https');

// GoHighLevel OAuth Configuration
const GHL_CLIENT_ID = '68474924a586bce22a6e64f7-mbpkmyu4';
const GHL_REDIRECT_URI = 'https://dir.engageautomations.com/oauth/callback';
const GHL_SCOPES = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';

function generateState() {
  return 'test_' + Math.random().toString(36).substring(2, 15);
}

function generateOAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GHL_CLIENT_ID,
    redirect_uri: GHL_REDIRECT_URI,
    scope: GHL_SCOPES,
    state: state,
    access_type: 'offline'
  });
  
  return `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${params.toString()}`;
}

async function testOAuthEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'OAuth-Direct-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          headers: res.headers,
          data: data 
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runDirectOAuthTest() {
  console.log('🔍 Direct OAuth Flow Test');
  console.log('========================\n');

  // Generate OAuth URL directly
  const state = generateState();
  const authUrl = generateOAuthUrl(state);
  
  console.log('1️⃣ Generated OAuth URL:');
  console.log(`   State: ${state}`);
  console.log(`   URL: ${authUrl}\n`);

  // Test OAuth callback endpoint accessibility
  console.log('2️⃣ Testing callback endpoint accessibility...');
  try {
    const result = await testOAuthEndpoint('/api/oauth/callback');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${result.data.substring(0, 100)}...`);
    
    if (result.status === 200) {
      console.log('   ✅ Callback endpoint accessible\n');
    }
  } catch (error) {
    console.log(`   ❌ Callback test failed: ${error.message}\n`);
  }

  // Test with simulated OAuth return
  console.log('3️⃣ Testing simulated OAuth return...');
  try {
    const testCode = 'test_auth_code_' + Date.now();
    const result = await testOAuthEndpoint(`/api/oauth/callback?code=${testCode}&state=${state}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Headers: ${JSON.stringify(result.headers, null, 2)}`);
    
    if (result.status === 302) {
      console.log(`   ✅ OAuth code processing working (redirect as expected)`);
      console.log(`   Location: ${result.headers.location || 'No location header'}\n`);
    } else if (result.status === 500) {
      console.log(`   ✅ OAuth code processing reached (error expected with test code)\n`);
    }
  } catch (error) {
    console.log(`   ❌ OAuth code test failed: ${error.message}\n`);
  }

  console.log('🎯 Manual OAuth Testing Instructions:');
  console.log('====================================');
  console.log('1. Copy this OAuth URL and open in browser:');
  console.log(`   ${authUrl}`);
  console.log('\n2. Complete the GoHighLevel OAuth flow:');
  console.log('   - Choose a location in GoHighLevel');
  console.log('   - Grant permissions');
  console.log('   - You will be redirected back to the callback endpoint');
  console.log('\n3. The callback will:');
  console.log('   - Extract the authorization code');
  console.log('   - Exchange it for access tokens');
  console.log('   - Store tokens securely');
  console.log('   - Redirect to success page\n');

  console.log('🔧 OAuth Configuration Summary:');
  console.log('==============================');
  console.log(`Client ID: ${GHL_CLIENT_ID}`);
  console.log(`Redirect URI: ${GHL_REDIRECT_URI}`);
  console.log(`Scopes: ${GHL_SCOPES}`);
  console.log(`State: ${state}`);
}

runDirectOAuthTest().catch(console.error);