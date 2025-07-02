#!/usr/bin/env node

/**
 * Test with Let Keyword and Exact Header Order
 * Using let instead of const and matching your exact header sequence
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testWithLetKeyword() {
  console.log('🔧 TESTING WITH LET KEYWORD');
  console.log('Using let instead of const and exact header order');
  console.log('='.repeat(50));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  console.log('✅ OAuth Token Retrieved');

  // Test with let keyword and exact header order
  await testWithExactFormat(tokenData.accessToken);
}

async function testWithExactFormat(accessToken) {
  console.log('\n📋 Testing with LET keyword and exact header order...');
  
  let data = JSON.stringify({
    "name": "Let Keyword Test Product",
    "locationId": "SGtYHkPbOl2WJV08GOpg",
    "description": "Testing with let keyword instead of const",
    "productType": "DIGITAL",
    "availableInStore": true,
    "seo": {
      "title": "Let Test Product",
      "description": "Testing let vs const"
    }
  });

  // Using LET and exact header order from your example
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://services.leadconnectorhq.com/products/',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json', 
      'Version': '2021-07-28', 
      'Authorization': `Bearer ${accessToken}`
    },
    data : data
  };

  console.log('📤 Configuration using LET:');
  console.log('  Variable: let config = {...}');
  console.log('  Variable: let data = JSON.stringify({...})');
  console.log('  Headers order matches your example exactly');
  
  return new Promise((resolve) => {
    const urlObj = new URL(config.url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: config.method,
      headers: config.headers
    };

    // Add content length
    options.headers['Content-Length'] = Buffer.byteLength(config.data);

    console.log('\n🔄 Making request with LET configuration...');

    const req = https.request(options, (res) => {
      let responseData = '';
      
      console.log('\n📥 RESPONSE:');
      console.log('Status:', res.statusCode);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('🎉 SUCCESS! Let keyword worked!');
          } else if (res.statusCode === 403) {
            console.log('🚫 Still 403 - Same result as const');
          } else {
            console.log(`📊 Status ${res.statusCode} - Different from const behavior`);
          }
          
        } catch (e) {
          console.log('Raw response:', responseData);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve();
    });

    req.write(config.data);
    req.end();
  });
}

async function getOAuthToken() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ installation_id: installationId });
    
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/api/token-access',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: response.success,
            accessToken: response.accessToken
          });
        } catch (error) {
          resolve({ success: false });
        }
      });
    });

    req.on('error', () => resolve({ success: false }));
    req.write(postData);
    req.end();
  });
}

testWithLetKeyword().catch(console.error);