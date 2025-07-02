#!/usr/bin/env node

/**
 * Test Correct GoHighLevel API Endpoints
 * Using proper API structure and location handling
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testCorrectEndpoints() {
  console.log('🔍 TESTING CORRECT GOHIGHLEVEL API ENDPOINTS');
  console.log('Using proper API structure and authentication');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  const locationId = extractLocationId(accessToken);
  
  console.log(`✅ OAuth Token: Retrieved`);
  console.log(`✅ Location ID: ${locationId}`);

  // Test different API base URLs and structures
  const apiConfigs = [
    {
      name: 'V1 API',
      hostname: 'services.leadconnectorhq.com',
      basePath: '/v1',
      version: '2021-07-28'
    },
    {
      name: 'V2 API', 
      hostname: 'services.leadconnectorhq.com',
      basePath: '/v2',
      version: '2021-07-28'
    },
    {
      name: 'Legacy API',
      hostname: 'rest.gohighlevel.com',
      basePath: '/v1',
      version: '2021-07-28'
    },
    {
      name: 'Direct API',
      hostname: 'api.leadconnectorhq.com',
      basePath: '',
      version: '2021-07-28'
    }
  ];

  // For each API config, test basic endpoints
  for (const config of apiConfigs) {
    console.log(`\n🧪 Testing ${config.name}`);
    console.log(`Base: https://${config.hostname}${config.basePath}`);
    
    // Test 1: Basic connection
    const basicTest = await makeAPICall(accessToken, config, {
      method: 'GET',
      path: '/locations',
      data: null
    });
    
    console.log(`  Basic connection: ${basicTest.statusCode}`);
    
    if (basicTest.statusCode === 200) {
      console.log(`  ✅ ${config.name} is working!`);
      
      // Test product endpoints with this working API
      await testProductEndpoints(accessToken, config, locationId);
      return; // Use the first working API
    } else {
      console.log(`  ❌ ${config.name} failed: ${basicTest.statusCode}`);
    }
  }

  // If no APIs work, test with different authentication formats
  console.log('\n🔧 Testing Different Authentication Formats');
  await testAuthFormats(accessToken, locationId);
}

async function testProductEndpoints(accessToken, config, locationId) {
  console.log(`\n🚀 Testing Product Endpoints with ${config.name}`);
  
  // Test product listing
  console.log('1. Testing Product Listing');
  const listResult = await makeAPICall(accessToken, config, {
    method: 'GET',
    path: '/products',
    data: null
  });
  console.log(`   GET /products: ${listResult.statusCode}`);
  
  if (listResult.statusCode === 200) {
    try {
      const products = JSON.parse(listResult.response);
      console.log(`   ✅ Found ${products.products?.length || products.length || 0} existing products`);
    } catch (e) {
      console.log('   ✅ Product listing working');
    }
  }

  // Test product creation with different formats
  console.log('2. Testing Product Creation');
  
  const productFormats = [
    {
      name: 'Basic Product',
      data: {
        name: 'Test Product',
        description: 'Test Description',
        locationId: locationId
      }
    },
    {
      name: 'Minimal Product',
      data: {
        name: 'Test Product'
      }
    },
    {
      name: 'Full Product',
      data: {
        name: 'Test Product',
        description: 'Test Description',
        type: 'DIGITAL',
        locationId: locationId,
        price: 100,
        currency: 'USD'
      }
    }
  ];

  for (const format of productFormats) {
    console.log(`   Testing ${format.name}...`);
    
    const createResult = await makeAPICall(accessToken, config, {
      method: 'POST',
      path: '/products',
      data: format.data
    });
    
    console.log(`   POST /products (${format.name}): ${createResult.statusCode}`);
    
    if (createResult.statusCode === 200 || createResult.statusCode === 201) {
      console.log(`   ✅ SUCCESS! Product created with ${format.name} format`);
      
      try {
        const product = JSON.parse(createResult.response);
        console.log(`   Product ID: ${product.id}`);
        console.log(`   🎉 REAL PRODUCT CREATED IN GOHIGHLEVEL!`);
        return;
      } catch (e) {
        console.log('   ✅ Product creation successful');
      }
    } else {
      // Show error details
      try {
        const error = JSON.parse(createResult.response);
        console.log(`   Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`   Raw error: ${createResult.response.substring(0, 100)}`);
      }
    }
  }
}

async function testAuthFormats(accessToken, locationId) {
  // Test different authentication header formats
  const authFormats = [
    {
      name: 'Bearer Token',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    },
    {
      name: 'Bearer + Location',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json', 
        'Version': '2021-07-28',
        'X-Location-Id': locationId
      }
    },
    {
      name: 'OAuth Token',
      headers: {
        'Authorization': `OAuth ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    }
  ];

  for (const authFormat of authFormats) {
    console.log(`Testing ${authFormat.name}...`);
    
    const result = await makeRawAPICall('services.leadconnectorhq.com', '/locations', 'GET', null, authFormat.headers);
    console.log(`  ${authFormat.name}: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`  ✅ ${authFormat.name} works!`);
      return authFormat;
    }
  }
  
  return null;
}

// Make API call with specific config
async function makeAPICall(accessToken, config, request) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Version': config.version
  };

  if (request.data) {
    headers['Content-Type'] = 'application/json';
  }

  return makeRawAPICall(
    config.hostname,
    config.basePath + request.path,
    request.method,
    request.data ? JSON.stringify(request.data) : null,
    headers
  );
}

// Raw API call
async function makeRawAPICall(hostname, path, method, data, headers) {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          response: responseData,
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

    if (data) {
      req.write(data);
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

testCorrectEndpoints().catch(console.error);