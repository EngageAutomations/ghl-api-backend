#!/usr/bin/env node

/**
 * Test Working API Endpoints
 * Test the exact endpoints shown in API backend status
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testWorkingAPIEndpoints() {
  console.log('🎯 TESTING WORKING API BACKEND ENDPOINTS');
  console.log('Using exact endpoints from API backend status');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  // Test exact endpoints from API backend status
  console.log('\n1️⃣ Testing Product Creation: POST /api/products/create');
  const productResult = await testProductCreation(accessToken);
  
  if (productResult.success) {
    console.log('🎉 PRODUCT CREATION WORKING!');
    console.log(`Product ID: ${productResult.productId}`);
    
    console.log('\n2️⃣ Testing Image Upload: POST /api/images/upload');
    await testImageUpload(accessToken);
    
    console.log('\n3️⃣ Testing Image List: GET /api/images/list');
    await testImageList(accessToken);
  } else {
    console.log('❌ Product creation failed, checking other endpoints');
    
    console.log('\n2️⃣ Testing Image List: GET /api/images/list');
    await testImageList(accessToken);
  }
}

async function testProductCreation(accessToken) {
  console.log('Testing product creation on correct endpoint...');
  
  const productData = {
    name: 'Working API Test Product',
    description: 'Testing the working API backend product creation endpoint',
    type: 'DIGITAL',
    price: 399.99,
    currency: 'USD'
  };

  const endpoint = 'https://api.engageautomations.com/api/products/create';
  console.log(`  Endpoint: ${endpoint}`);
  
  const result = await makeAPICall(endpoint, 'POST', productData, {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log(`  ✅ SUCCESS! Product creation working!`);
    
    try {
      const response = JSON.parse(result.response);
      console.log(`  Response: ${JSON.stringify(response, null, 2)}`);
      
      return { 
        success: true, 
        productId: response.product?.id || response.id,
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
    } catch (e) {
      console.log(`  Raw error: ${result.response.substring(0, 300)}`);
    }
    
    return { success: false, error: result.response };
  }
}

async function testImageUpload(accessToken) {
  console.log('Testing image upload endpoint...');
  
  // Note: This would need actual multipart/form-data for file upload
  // For now, just test if endpoint exists
  const endpoint = 'https://api.engageautomations.com/api/images/upload';
  console.log(`  Endpoint: ${endpoint}`);
  
  const result = await makeAPICall(endpoint, 'POST', {}, {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 400) {
    console.log(`  ✅ Endpoint exists (expected 400 without file)`);
  } else if (result.statusCode === 200 || result.statusCode === 201) {
    console.log(`  ✅ Upload endpoint working!`);
    
    try {
      const response = JSON.parse(result.response);
      console.log(`  Response: ${JSON.stringify(response, null, 2)}`);
    } catch (e) {
      console.log(`  Raw response: ${result.response.substring(0, 200)}`);
    }
  } else {
    console.log(`  Status indicates endpoint may not be working`);
    console.log(`  Response: ${result.response.substring(0, 200)}`);
  }
}

async function testImageList(accessToken) {
  console.log('Testing image list endpoint...');
  
  const endpoint = 'https://api.engageautomations.com/api/images/list';
  console.log(`  Endpoint: ${endpoint}`);
  
  const result = await makeAPICall(endpoint, 'GET', null, {
    'Authorization': `Bearer ${accessToken}`
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200) {
    console.log(`  ✅ Image list endpoint working!`);
    
    try {
      const response = JSON.parse(result.response);
      console.log(`  Response keys: ${Object.keys(response).join(', ')}`);
      
      if (response.medias || response.images) {
        const count = (response.medias || response.images || []).length;
        console.log(`  Found ${count} media files`);
      }
    } catch (e) {
      console.log(`  Raw response: ${result.response.substring(0, 200)}`);
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

testWorkingAPIEndpoints().catch(console.error);