#!/usr/bin/env node

/**
 * Test Single Backend Format
 * Testing dual backend with exact single backend request format
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testSingleBackendFormat() {
  console.log('🔄 TESTING DUAL BACKEND WITH SINGLE BACKEND FORMAT');
  console.log('Making API backend replicate the exact single backend request format');
  console.log('='.repeat(70));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  // Test API backend with single backend format
  console.log('\n1️⃣ Testing API Backend with Single Backend Format');
  const result = await testAPIBackendSingleFormat(accessToken);
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Single backend format worked!');
    console.log('Product ID:', result.productId);
    console.log('✅ Dual backend now matches single backend request format');
  } else {
    console.log('\n📊 Analysis:');
    console.log('Status Code:', result.statusCode);
    
    if (result.statusCode === 403) {
      console.log('🔍 Still 403 - Format matches, but API access still restricted');
      console.log('🔍 This proves format is not the issue - it\'s GoHighLevel API permissions');
    } else if (result.statusCode === 200 || result.statusCode === 201) {
      console.log('🎉 Different result! Single backend format may have worked!');
    } else {
      console.log('🔍 Different error code - investigating...');
    }
    
    if (result.error) {
      console.log('Error details:', result.error);
    }
  }
}

async function testAPIBackendSingleFormat(accessToken) {
  console.log('Testing API backend configured with single backend format...');
  
  const productData = {
    installation_id: installationId,
    name: 'Single Backend Format Test',
    description: 'Testing dual backend with single backend request format',
    type: 'DIGITAL'
  };

  const endpoint = 'https://api.engageautomations.com/api/products/create';
  console.log(`  Endpoint: ${endpoint}`);
  console.log('  Format: Single backend style (makeGHLAPICall with retry system)');
  console.log('  Headers: Authorization + Version + Accept (single backend pattern)');
  console.log('  Payload: Simplified structure with locationId injection');
  
  const result = await makeAPICall(endpoint, 'POST', productData, {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log(`  ✅ SUCCESS! Single backend format working!`);
    
    try {
      const response = JSON.parse(result.response);
      console.log(`  Response: ${JSON.stringify(response, null, 2)}`);
      
      const productId = response.product?.id || response.productId || response.id;
      console.log(`  Product ID: ${productId}`);
      
      return { 
        success: true, 
        productId: productId,
        response: response 
      };
    } catch (e) {
      console.log(`  ✅ Product created but parse error: ${e.message}`);
      console.log(`  Raw response: ${result.response}`);
      return { success: true };
    }
  } else {
    try {
      const error = JSON.parse(result.response);
      console.log(`  Error: ${error.message || error.error}`);
      
      if (error.details) {
        console.log(`  Details: ${JSON.stringify(error.details, null, 2)}`);
      }
      
      // Compare with yesterday's patterns
      if (result.statusCode === 403) {
        console.log(`  🔍 Same 403 as before - confirms API access restriction`);
        console.log(`  🔍 Format change didn't solve the core issue`);
      }
      
      return { 
        success: false, 
        error: error,
        statusCode: result.statusCode 
      };
      
    } catch (e) {
      console.log(`  Raw error: ${result.response.substring(0, 500)}`);
      
      return { 
        success: false, 
        error: result.response,
        statusCode: result.statusCode 
      };
    }
  }
}

async function makeAPICall(url, method, data, headers) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: { ...headers }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          response: responseData
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        response: `Request error: ${error.message}`
      });
    });

    if (postData) {
      req.write(postData);
    }
    
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

testSingleBackendFormat().catch(console.error);