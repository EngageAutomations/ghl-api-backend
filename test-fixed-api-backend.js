#!/usr/bin/env node

/**
 * Test Fixed API Backend - Direct GoHighLevel Calls
 * Now the API backend should make direct calls to GoHighLevel instead of proxying through OAuth backend
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testFixedAPIBackend() {
  console.log('🔧 TESTING FIXED API BACKEND');
  console.log('API backend now makes direct GoHighLevel calls');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  // Test fixed product creation endpoint
  console.log('\n1️⃣ Testing Fixed Product Creation with Direct GoHighLevel Calls');
  const productResult = await testFixedProductCreation(accessToken);
  
  if (productResult.success) {
    console.log('\n🎉 PRODUCT CREATION WORKING!');
    console.log(`Product ID: ${productResult.productId}`);
    console.log('✅ Fixed: API backend now calls GoHighLevel directly');
  } else {
    console.log('\n⚠️  Product creation still failing');
    console.log('Checking error details...');
    
    if (productResult.error && productResult.error.includes('403')) {
      console.log('🔍 Still getting 403 from GoHighLevel - confirms API access restriction');
    } else {
      console.log('🔍 Different error - may be implementation issue');
    }
  }
}

async function testFixedProductCreation(accessToken) {
  console.log('Testing fixed product creation...');
  
  const productData = {
    installation_id: installationId,
    name: 'Fixed API Backend Test Product',
    description: 'Testing the fixed API backend that makes direct GoHighLevel calls',
    type: 'DIGITAL'
  };

  const endpoint = 'https://api.engageautomations.com/api/products/create';
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Fixed: API backend now calls GoHighLevel directly (not OAuth backend)`);
  
  const result = await makeAPICall(endpoint, 'POST', productData, {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log(`  ✅ SUCCESS! Fixed API backend working!`);
    
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
      
      // Analysis of error types
      if (error.message && error.message.includes('Forbidden')) {
        console.log(`  🔍 Analysis: GoHighLevel API restriction confirmed`);
        console.log(`  🔍 Same 403 error as direct API calls - not implementation issue`);
      }
      
      if (error.message && error.message.includes('Failed to get valid access token')) {
        console.log(`  🔍 Analysis: OAuth backend communication issue`);
      }
      
      if (error.message && error.message.includes('No location ID available')) {
        console.log(`  🔍 Analysis: Location ID extraction issue`);
      }
      
    } catch (e) {
      console.log(`  Raw error: ${result.response.substring(0, 500)}`);
      
      // Check for HTML error (500 error)
      if (result.response.includes('<!DOCTYPE html>')) {
        console.log(`  🔍 Analysis: API backend internal error (500)`);
        console.log(`  🔍 May be deployment issue or code error`);
      }
    }
    
    return { 
      success: false, 
      error: result.response,
      statusCode: result.statusCode 
    };
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
      options.headers['Content-Type'] = 'application/json';
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

// Get OAuth token
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

testFixedAPIBackend().catch(console.error);