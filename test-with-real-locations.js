#!/usr/bin/env node

/**
 * Test Product Creation with Real Location IDs
 * Using the actual location IDs from the user's GoHighLevel account
 */

import https from 'https';

const installationId = 'install_1751436979939';

// Real location IDs from user's account
const realLocations = [
  { id: 'eYeyzEWiaxcTOPROAo4C', name: 'Darul Uloom Tampa' },
  { id: 'kQDg6qp2x7GXYJ1VCkI8', name: 'Engage Automations' },
  { id: 'WAvk87RmW9rBSDJHeOpH', name: 'MakerExpress 3D' }
];

async function testWithRealLocations() {
  console.log('🎯 TESTING PRODUCT CREATION WITH REAL LOCATION IDS');
  console.log('Using actual location IDs from your GoHighLevel account');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  console.log('\n📍 Your Real Locations:');
  realLocations.forEach((location, index) => {
    console.log(`${index + 1}. ${location.name} (${location.id})`);
  });

  // Test with each real location to find one that works
  for (const location of realLocations) {
    console.log(`\n🧪 Testing with ${location.name} (${location.id})`);
    
    const success = await testProductAPIsForLocation(accessToken, location);
    
    if (success) {
      console.log(`✅ Found working product API with ${location.name}!`);
      return;
    }
  }

  console.log('\n❌ No working product APIs found with any real location');
  console.log('Testing alternative API structures...');
  
  // Try alternative API structures that might work
  await testAlternativeAPIStructures(accessToken, realLocations[0]);
}

async function testProductAPIsForLocation(accessToken, location) {
  console.log(`\n  Testing product APIs for ${location.name}...`);
  
  // Comprehensive list of possible product API endpoints
  const apiEndpoints = [
    // Standard product endpoints
    {
      method: 'GET',
      url: `https://services.leadconnectorhq.com/products/${location.id}`,
      description: 'Products by location ID'
    },
    {
      method: 'GET', 
      url: `https://services.leadconnectorhq.com/locations/${location.id}/products`,
      description: 'Location-specific products'
    },
    // Query parameter approaches
    {
      method: 'GET',
      url: `https://services.leadconnectorhq.com/products?locationId=${location.id}`,
      description: 'Products with location query'
    },
    {
      method: 'GET',
      url: `https://services.leadconnectorhq.com/v1/products?locationId=${location.id}`,
      description: 'V1 Products with location'
    },
    // Company/business level endpoints (since token is Company authClass)
    {
      method: 'GET',
      url: `https://services.leadconnectorhq.com/companies/products`,
      description: 'Company-level products'
    },
    {
      method: 'GET',
      url: `https://services.leadconnectorhq.com/business/products`,
      description: 'Business-level products'
    }
  ];

  for (const endpoint of apiEndpoints) {
    console.log(`    Testing: ${endpoint.description}`);
    
    const result = await makeAPICall(accessToken, endpoint.url, endpoint.method);
    console.log(`    ${endpoint.method} ${endpoint.url}`);
    console.log(`    Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`    ✅ Working endpoint found!`);
      
      // Try to create a product using this endpoint structure
      const createSuccess = await tryProductCreation(accessToken, endpoint.url, location);
      
      if (createSuccess) {
        console.log(`    🎉 PRODUCT CREATION SUCCESSFUL!`);
        return true;
      }
    } else if (result.statusCode === 401) {
      console.log(`    ⚠️ Authentication issue`);
    } else if (result.statusCode === 403) {
      console.log(`    ⚠️ Forbidden - may need different permissions`);
    } else {
      console.log(`    ❌ Failed: ${result.statusCode}`);
      
      // Show error details for debugging
      if (result.response && result.response.length < 200) {
        try {
          const error = JSON.parse(result.response);
          console.log(`    Error: ${error.message || error.error}`);
        } catch (e) {
          console.log(`    Raw: ${result.response}`);
        }
      }
    }
  }
  
  return false;
}

async function tryProductCreation(accessToken, getUrl, location) {
  console.log(`      Attempting product creation...`);
  
  // Convert GET URL to POST URL for creation
  const postUrl = getUrl.replace(/\/products\/.*/, '/products')
                        .replace(/\/products\?.*/, '/products');
  
  const productData = {
    name: `Test Product for ${location.name}`,
    description: 'Testing product creation with real location ID',
    locationId: location.id,
    type: 'DIGITAL'
  };

  const result = await makeAPICall(accessToken, postUrl, 'POST', productData);
  console.log(`      POST ${postUrl}: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    try {
      const product = JSON.parse(result.response);
      console.log(`      Product ID: ${product.id || 'Unknown'}`);
      console.log(`      Product Name: ${product.name || 'Unknown'}`);
      
      console.log('\n      🎉 REAL PRODUCT CREATED IN GOHIGHLEVEL!');
      console.log(`      Working API: ${postUrl}`);
      console.log(`      Location: ${location.name} (${location.id})`);
      
      return true;
    } catch (e) {
      console.log(`      ✅ Product created (parse error)`);
      console.log(`      Response: ${result.response.substring(0, 100)}`);
      return true;
    }
  } else {
    try {
      const error = JSON.parse(result.response);
      console.log(`      Create error: ${error.message || error.error}`);
    } catch (e) {
      console.log(`      Create failed: ${result.response.substring(0, 100)}`);
    }
  }
  
  return false;
}

async function testAlternativeAPIStructures(accessToken, location) {
  console.log('\n🔧 Testing Alternative API Structures');
  
  // Based on current GoHighLevel documentation, try newer API patterns
  const alternativeAPIs = [
    // Newer API structure (2024/2025)
    {
      name: 'New API Structure',
      endpoints: [
        `https://services.leadconnectorhq.com/v2/products`,
        `https://services.leadconnectorhq.com/v2/locations/${location.id}/products`,
        `https://services.leadconnectorhq.com/marketplace/v1/products`
      ]
    },
    // REST-style with different base
    {
      name: 'REST API Pattern',
      endpoints: [
        `https://api.leadconnectorhq.com/products`,
        `https://api.leadconnectorhq.com/v1/products`,
        `https://api.leadconnectorhq.com/locations/${location.id}/products`
      ]
    },
    // Different authentication approach
    {
      name: 'Legacy Compatible',
      endpoints: [
        `https://rest.gohighlevel.com/v2/products`,
        `https://rest.gohighlevel.com/v2/locations/${location.id}/products`
      ]
    }
  ];

  for (const apiGroup of alternativeAPIs) {
    console.log(`\n  Testing ${apiGroup.name}...`);
    
    for (const endpoint of apiGroup.endpoints) {
      console.log(`    ${endpoint}`);
      
      const getResult = await makeAPICall(accessToken, endpoint, 'GET');
      console.log(`    GET: ${getResult.statusCode}`);
      
      if (getResult.statusCode === 200) {
        console.log(`    ✅ Found working alternative API!`);
        
        // Try product creation
        const productData = {
          name: 'Alternative API Test Product',
          description: 'Testing alternative API structure',
          locationId: location.id
        };
        
        const postResult = await makeAPICall(accessToken, endpoint, 'POST', productData);
        console.log(`    POST: ${postResult.statusCode}`);
        
        if (postResult.statusCode === 200 || postResult.statusCode === 201) {
          console.log(`    🎉 PRODUCT CREATION SUCCESSFUL WITH ALTERNATIVE API!`);
          console.log(`    Working endpoint: ${endpoint}`);
          return true;
        }
      }
    }
  }
  
  return false;
}

async function makeAPICall(accessToken, url, method, data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
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

testWithRealLocations().catch(console.error);