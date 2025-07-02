#!/usr/bin/env node

/**
 * Test Correct API Backend Endpoints
 * Test the separate API backend at api.engageautomations.com
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testCorrectAPIBackend() {
  console.log('🎯 TESTING CORRECT API BACKEND ENDPOINTS');
  console.log('API Backend: https://api.engageautomations.com');
  console.log('OAuth Backend: https://dir.engageautomations.com');
  console.log('='.repeat(60));

  // Get OAuth token from OAuth backend
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token from OAuth backend');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved from OAuth Backend');

  // Test correct API backend endpoints
  console.log('\n1️⃣ Testing API Backend Status');
  await testAPIBackendStatus();
  
  console.log('\n2️⃣ Testing Product Creation on API Backend');
  await testAPIBackendProducts(accessToken);
  
  console.log('\n3️⃣ Testing Media Upload on API Backend');
  await testAPIBackendMedia(accessToken);
}

async function testAPIBackendStatus() {
  console.log('Testing API backend status...');
  
  const statusEndpoints = [
    'https://api.engageautomations.com/',
    'https://api.engageautomations.com/health',
    'https://api.engageautomations.com/status'
  ];

  for (const endpoint of statusEndpoints) {
    console.log(`  Checking: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'GET', null, {});
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      try {
        const data = JSON.parse(result.response);
        console.log(`  Response: ${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        console.log(`  Raw response: ${result.response.substring(0, 200)}`);
      }
    } else {
      console.log(`  Error: ${result.response.substring(0, 100)}`);
    }
  }
}

async function testAPIBackendProducts(accessToken) {
  console.log('Testing API backend product endpoints...');
  
  const productData = {
    name: 'API Backend Test Product',
    description: 'Testing product creation via separate API backend',
    type: 'DIGITAL',
    price: 299.99,
    currency: 'USD'
  };

  // Test correct API backend product endpoints
  const productEndpoints = [
    'https://api.engageautomations.com/products',
    'https://api.engageautomations.com/api/products', 
    'https://api.engageautomations.com/v1/products'
  ];

  for (const endpoint of productEndpoints) {
    console.log(`  Testing: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'POST', productData, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log(`  ✅ SUCCESS! API backend product endpoint working`);
      
      try {
        const response = JSON.parse(result.response);
        console.log(`  Product ID: ${response.product?.id || response.id || 'Unknown'}`);
        console.log(`  Working endpoint: ${endpoint}`);
        return { success: true, endpoint: endpoint, response: response };
      } catch (e) {
        console.log(`  ✅ Product created (parse error)`);
        return { success: true, endpoint: endpoint };
      }
    } else {
      try {
        const error = JSON.parse(result.response);
        console.log(`  Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`  Raw error: ${result.response.substring(0, 200)}`);
      }
    }
  }
  
  return { success: false };
}

async function testAPIBackendMedia(accessToken) {
  console.log('Testing API backend media endpoints...');
  
  const mediaEndpoints = [
    'https://api.engageautomations.com/media',
    'https://api.engageautomations.com/api/media',
    'https://api.engageautomations.com/v1/media'
  ];

  for (const endpoint of mediaEndpoints) {
    console.log(`  Testing: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'GET', null, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`  ✅ Media endpoint working!`);
      
      try {
        const response = JSON.parse(result.response);
        console.log(`  Response keys: ${Object.keys(response).join(', ')}`);
      } catch (e) {
        console.log(`  Raw response: ${result.response.substring(0, 200)}`);
      }
    } else {
      try {
        const error = JSON.parse(result.response);
        console.log(`  Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`  Raw: ${result.response.substring(0, 100)}`);
      }
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

// Get OAuth token from OAuth backend
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

testCorrectAPIBackend().catch(console.error);