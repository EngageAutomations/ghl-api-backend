#!/usr/bin/env node

/**
 * Debug Token Insertion - Check if actual OAuth token is being used
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function debugTokenInsertion() {
  console.log('🔍 DEBUGGING TOKEN INSERTION');
  console.log('Checking if actual OAuth token is being placed in Authorization header');
  console.log('='.repeat(70));

  // Step 1: Get OAuth token directly
  console.log('\n1️⃣ Getting OAuth Token Directly');
  const tokenData = await getOAuthTokenDirect();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  console.log('✅ Direct OAuth Token Retrieved');
  console.log('Token starts with:', tokenData.accessToken.substring(0, 20) + '...');
  console.log('Token length:', tokenData.accessToken.length);

  // Step 2: Test with manual token insertion
  console.log('\n2️⃣ Testing with Manual Token Insertion');
  const manualResult = await testWithManualToken(tokenData.accessToken);
  
  // Step 3: Test through API backend to see what token it uses
  console.log('\n3️⃣ Testing through API Backend');
  const backendResult = await testThroughAPIBackend(tokenData.accessToken);
  
  // Compare results
  console.log('\n📊 COMPARISON ANALYSIS:');
  console.log('Manual token insertion result:', manualResult.statusCode);
  console.log('API backend result:', backendResult.statusCode);
  
  if (manualResult.statusCode === backendResult.statusCode) {
    console.log('✅ Both return same status - token insertion working correctly');
  } else {
    console.log('⚠️  Different status codes - possible token insertion issue');
  }
}

async function testWithManualToken(accessToken) {
  console.log('Testing direct GoHighLevel call with manual token insertion...');
  
  const productData = {
    name: 'Manual Token Test Product',
    locationId: 'SGtYHkPbOl2WJV08GOpg',
    description: 'Testing with manual OAuth token insertion',
    productType: 'DIGITAL',
    availableInStore: true
  };

  console.log('Token being used:', accessToken.substring(0, 20) + '...');
  
  const result = await makeDirectGHLCall(productData, accessToken);
  
  console.log('  Status:', result.statusCode);
  if (result.statusCode !== 200 && result.statusCode !== 201) {
    try {
      const error = JSON.parse(result.response);
      console.log('  Error:', error.message || error.error);
    } catch (e) {
      console.log('  Raw error:', result.response.substring(0, 200));
    }
  }
  
  return result;
}

async function testThroughAPIBackend(expectedToken) {
  console.log('Testing through API backend to see what token it uses...');
  
  const productData = {
    installation_id: installationId,
    name: 'API Backend Token Test',
    description: 'Testing what token the API backend actually uses',
    type: 'DIGITAL'
  };

  const result = await makeAPICall('https://api.engageautomations.com/api/products/create', 'POST', productData, {
    'Authorization': `Bearer ${expectedToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log('  Status:', result.statusCode);
  if (result.statusCode !== 200 && result.statusCode !== 201) {
    try {
      const error = JSON.parse(result.response);
      console.log('  Error:', error.message || error.error);
    } catch (e) {
      console.log('  Raw error:', result.response.substring(0, 200));
    }
  }
  
  return result;
}

async function makeDirectGHLCall(productData, accessToken) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/products/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('  Making direct call to GoHighLevel...');
    console.log('  Authorization header:', `Bearer ${accessToken.substring(0, 20)}...`);

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

    req.write(postData);
    req.end();
  });
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

async function getOAuthTokenDirect() {
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

debugTokenInsertion().catch(console.error);