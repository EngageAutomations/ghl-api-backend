#!/usr/bin/env node

/**
 * Test Yesterday's Differences
 * Testing the differences between yesterday's working version and today's implementation
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testYesterdayDifferences() {
  console.log('🔍 TESTING YESTERDAY\'S DIFFERENCES');
  console.log('Comparing yesterday\'s working approach vs today\'s implementation');
  console.log('='.repeat(70));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  console.log('✅ OAuth Token Retrieved');
  console.log('Installation ID:', installationId);

  // Test 1: Different endpoint variations (yesterday's approach)
  console.log('\n1️⃣ Testing Endpoint Variations (Yesterday\'s Method)');
  await testEndpointVariations(tokenData.accessToken);

  // Test 2: Single backend approach (yesterday's architecture) 
  console.log('\n2️⃣ Testing Single Backend Approach');
  await testSingleBackendApproach(tokenData.accessToken);

  // Test 3: Different product data format
  console.log('\n3️⃣ Testing Yesterday\'s Product Data Format');
  await testYesterdayProductFormat(tokenData.accessToken);
}

async function testEndpointVariations(accessToken) {
  console.log('Testing different endpoint formats that worked yesterday...');
  
  const locationId = 'SGtYHkPbOl2WJV08GOpg';
  const productData = {
    name: 'Yesterday Format Test Product',
    description: 'Testing endpoint variations from yesterday',
    type: 'DIGITAL',
    locationId: locationId
  };

  // Test endpoints that were used yesterday
  const endpoints = [
    '/products',      // Without trailing slash
    '/products/',     // With trailing slash (current)
    `/locations/${locationId}/products`,  // Location-specific
    '/v1/products'    // Versioned endpoint
  ];

  for (const endpoint of endpoints) {
    console.log(`\n  Testing endpoint: ${endpoint}`);
    
    const result = await makeDirectGHLCall(productData, accessToken, endpoint);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log(`  ✅ SUCCESS with ${endpoint}!`);
      return { success: true, endpoint };
    } else {
      console.log(`  ❌ ${result.statusCode} with ${endpoint}`);
      
      if (result.statusCode === 401) {
        console.log(`  🔍 401 - Missing Version header with ${endpoint}`);
      } else if (result.statusCode === 403) {
        console.log(`  🔍 403 - Access denied with ${endpoint}`);
      } else if (result.statusCode === 404) {
        console.log(`  🔍 404 - Endpoint not found: ${endpoint}`);
      }
    }
  }
  
  console.log('  ⚠️  All endpoint variations failed');
}

async function testSingleBackendApproach(accessToken) {
  console.log('Testing single Railway backend approach (yesterday\'s architecture)...');
  
  // Test the working Railway backend directly
  const railwayEndpoint = 'https://dir.engageautomations.com/api/products/create';
  
  const productData = {
    installation_id: installationId,
    name: 'Single Backend Test Product',
    description: 'Testing yesterday\'s single backend architecture',
    type: 'DIGITAL'
  };

  console.log(`  Endpoint: ${railwayEndpoint}`);
  console.log('  Architecture: Single Railway backend (yesterday\'s working method)');
  
  const result = await makeAPICall(railwayEndpoint, 'POST', productData, {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log('  ✅ Single backend approach working!');
    console.log('  🔍 This confirms yesterday\'s architecture was different');
  } else {
    try {
      const error = JSON.parse(result.response);
      console.log('  Error:', error.message || error.error);
      
      if (result.statusCode === 404) {
        console.log('  🔍 404 - Single backend doesn\'t have this endpoint anymore');
      }
    } catch (e) {
      console.log('  Raw error:', result.response.substring(0, 200));
    }
  }
}

async function testYesterdayProductFormat(accessToken) {
  console.log('Testing yesterday\'s simplified product data format...');
  
  // Yesterday's successful format (simpler structure)
  const yesterdayFormat = {
    name: 'Premium Car Detailing Service',
    description: 'Professional exterior and interior car detailing.',
    type: 'DIGITAL',
    locationId: 'SGtYHkPbOl2WJV08GOpg'
  };

  console.log('  Format: Yesterday\'s simple structure');
  console.log('  Fields: name, description, type, locationId (minimal)');
  
  const result = await makeDirectGHLCall(yesterdayFormat, accessToken, '/products/');
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log('  ✅ Yesterday\'s format working!');
  } else if (result.statusCode === 403) {
    console.log('  🔍 403 - Same access restriction with yesterday\'s format');
  } else {
    console.log('  🔍 Different error with yesterday\'s format');
  }
}

async function makeDirectGHLCall(productData, accessToken, endpoint) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

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

testYesterdayDifferences().catch(console.error);