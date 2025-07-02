#!/usr/bin/env node

/**
 * Test API with Installation ID
 * The API backend requires installation_id in requests
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testAPIWithInstallationId() {
  console.log('🎯 TESTING API WITH INSTALLATION ID');
  console.log('API requires installation_id in request body');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');
  console.log(`Installation ID: ${installationId}`);

  // Test product creation with installation_id
  console.log('\n1️⃣ Testing Product Creation with Installation ID');
  const productResult = await testProductCreationWithId(accessToken);
  
  if (productResult.success) {
    console.log('\n🎉 PRODUCT CREATION WORKING!');
    console.log(`Product ID: ${productResult.productId}`);
    
    console.log('\n2️⃣ Testing Image List with Installation ID');
    await testImageListWithId(accessToken);
  } else {
    console.log('\n❌ Product creation still failing, checking error details');
    
    console.log('\n2️⃣ Testing Image List with Installation ID');
    await testImageListWithId(accessToken);
  }
}

async function testProductCreationWithId(accessToken) {
  console.log('Testing product creation with installation_id...');
  
  const productData = {
    installation_id: installationId,
    name: 'Complete API Test Product',
    description: 'Testing product creation with proper installation_id format',
    type: 'DIGITAL',
    price: 499.99,
    currency: 'USD'
  };

  const endpoint = 'https://api.engageautomations.com/api/products/create';
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Installation ID: ${installationId}`);
  
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
      
      // Check for specific error types
      if (error.message && error.message.includes('Forbidden')) {
        console.log(`  🔍 GoHighLevel API returned 403 - same issue as direct API`);
      }
      
      if (error.message && error.message.includes('oauth')) {
        console.log(`  🔍 OAuth issue detected in API backend`);
      }
      
    } catch (e) {
      console.log(`  Raw error: ${result.response.substring(0, 500)}`);
    }
    
    return { success: false, error: result.response };
  }
}

async function testImageListWithId(accessToken) {
  console.log('Testing image list with installation_id...');
  
  // Try both query param and body approaches
  const approaches = [
    {
      name: 'Query Parameter',
      endpoint: `https://api.engageautomations.com/api/images/list?installation_id=${installationId}`,
      method: 'GET',
      data: null
    },
    {
      name: 'Request Body',
      endpoint: 'https://api.engageautomations.com/api/images/list',
      method: 'POST',
      data: { installation_id: installationId }
    }
  ];

  for (const approach of approaches) {
    console.log(`  Testing ${approach.name} approach:`);
    console.log(`  Endpoint: ${approach.endpoint}`);
    
    const result = await makeAPICall(approach.endpoint, approach.method, approach.data, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`  ✅ Image list working with ${approach.name}!`);
      
      try {
        const response = JSON.parse(result.response);
        console.log(`  Response keys: ${Object.keys(response).join(', ')}`);
        
        if (response.medias || response.images) {
          const count = (response.medias || response.images || []).length;
          console.log(`  Found ${count} media files`);
          
          // Show first few media files
          const media = response.medias || response.images || [];
          if (media.length > 0) {
            console.log(`  Sample media: ${media.slice(0, 2).map(m => m.name || m.url).join(', ')}`);
          }
        }
        
        return;
      } catch (e) {
        console.log(`  Parse error: ${e.message}`);
        console.log(`  Raw response: ${result.response.substring(0, 200)}`);
      }
    } else {
      try {
        const error = JSON.parse(result.response);
        console.log(`  Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`  Raw error: ${result.response.substring(0, 100)}`);
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

testAPIWithInstallationId().catch(console.error);