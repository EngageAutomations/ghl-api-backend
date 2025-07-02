#!/usr/bin/env node

/**
 * Direct GoHighLevel API Test
 * Raw API calls to see exact error responses and debug the real issue
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testDirectGHLAPI() {
  console.log('🔍 DIRECT GOHIGHLEVEL API TEST');
  console.log('Getting exact error responses to debug the real issue');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  const locationId = extractLocationId(accessToken);
  
  console.log(`✅ OAuth Token: Retrieved (${accessToken.length} chars)`);
  console.log(`✅ Location ID: ${locationId}`);

  // Test 1: Simple GET request to verify API access
  console.log('\n1️⃣ Testing Basic API Access');
  console.log('GET /locations/{locationId}');
  
  const basicResult = await makeAPICall(accessToken, {
    method: 'GET',
    path: `/locations/${locationId}`,
    data: null
  });
  
  console.log(`Status: ${basicResult.statusCode}`);
  console.log(`Response: ${basicResult.response.substring(0, 200)}...`);

  // Test 2: Product listing to see if we can read existing products
  console.log('\n2️⃣ Testing Product Listing');
  console.log('GET /products');
  
  const listResult = await makeAPICall(accessToken, {
    method: 'GET', 
    path: '/products',
    data: null
  });
  
  console.log(`Status: ${listResult.statusCode}`);
  console.log(`Response: ${listResult.response.substring(0, 200)}...`);

  // Test 3: Media listing to verify media API access
  console.log('\n3️⃣ Testing Media Listing');
  console.log('GET /medias');
  
  const mediaResult = await makeAPICall(accessToken, {
    method: 'GET',
    path: '/medias',
    data: null
  });
  
  console.log(`Status: ${mediaResult.statusCode}`);
  console.log(`Response: ${mediaResult.response.substring(0, 200)}...`);

  // Test 4: Simple product creation with minimal data
  console.log('\n4️⃣ Testing Simple Product Creation');
  console.log('POST /products (minimal data)');
  
  const simpleProduct = {
    name: 'Test Product',
    description: 'Test Description'
  };
  
  const createResult = await makeAPICall(accessToken, {
    method: 'POST',
    path: '/products',
    data: simpleProduct
  });
  
  console.log(`Status: ${createResult.statusCode}`);
  console.log(`Response: ${createResult.response.substring(0, 300)}...`);

  // Test 5: Check if we need location parameter
  console.log('\n5️⃣ Testing Product Creation with Location');
  console.log(`POST /products?locationId=${locationId}`);
  
  const productWithLocation = {
    name: 'Test Product with Location',
    description: 'Test Description',
    locationId: locationId
  };
  
  const locationResult = await makeAPICall(accessToken, {
    method: 'POST',
    path: `/products?locationId=${locationId}`,
    data: productWithLocation
  });
  
  console.log(`Status: ${locationResult.statusCode}`);
  console.log(`Response: ${locationResult.response.substring(0, 300)}...`);

  // Analysis
  console.log('\n📊 API RESPONSE ANALYSIS');
  console.log('='.repeat(60));
  
  const results = [
    { name: 'Basic Access', status: basicResult.statusCode, working: basicResult.statusCode === 200 },
    { name: 'Product List', status: listResult.statusCode, working: listResult.statusCode === 200 },
    { name: 'Media List', status: mediaResult.statusCode, working: mediaResult.statusCode === 200 },
    { name: 'Simple Create', status: createResult.statusCode, working: [200, 201].includes(createResult.statusCode) },
    { name: 'Create with Location', status: locationResult.statusCode, working: [200, 201].includes(locationResult.statusCode) }
  ];
  
  results.forEach(result => {
    console.log(`${result.working ? '✅' : '❌'} ${result.name}: ${result.status}`);
  });

  const workingAPIs = results.filter(r => r.working).length;
  console.log(`\n${workingAPIs}/${results.length} API endpoints working`);

  if (workingAPIs === 0) {
    console.log('\n🚨 CORE ISSUE IDENTIFIED');
    console.log('No API endpoints are accessible despite valid OAuth token and scopes');
    console.log('This suggests:');
    console.log('• API base URL may be incorrect');
    console.log('• Authentication format may need adjustment');
    console.log('• GoHighLevel API may require additional headers');
    console.log('• API version or endpoint structure may have changed');
  } else {
    console.log('\n✅ Some APIs working - can debug specific failing endpoints');
  }

  // Check exact error messages for clues
  console.log('\n🔍 ERROR MESSAGE ANALYSIS');
  if (createResult.statusCode !== 200 && createResult.statusCode !== 201) {
    console.log('Product creation error details:');
    try {
      const errorData = JSON.parse(createResult.response);
      console.log('Error:', errorData.message || errorData.error);
      console.log('Details:', errorData.details || 'No additional details');
    } catch (e) {
      console.log('Raw response:', createResult.response);
    }
  }
}

// Make API call to GoHighLevel
async function makeAPICall(accessToken, config) {
  return new Promise((resolve) => {
    const postData = config.data ? JSON.stringify(config.data) : null;
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: config.path,
      method: config.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          response: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        response: `Request error: ${error.message}`,
        headers: {}
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

// Extract location ID
function extractLocationId(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.authClassId;
  } catch (error) {
    return null;
  }
}

testDirectGHLAPI().catch(console.error);