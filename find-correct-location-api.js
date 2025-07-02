#!/usr/bin/env node

/**
 * Find Correct Location API for GoHighLevel
 * Use the proper API structure to get real location ID from user's account
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function findCorrectLocationAPI() {
  console.log('🔍 FINDING CORRECT LOCATION API FOR GOHIGHLEVEL');
  console.log('Using proper API structure to get real location data');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  // The error message "Switch to the new API token" suggests we need different headers
  // Let's try the current GoHighLevel API with proper headers
  
  console.log('\n🧪 TESTING CORRECT API HEADERS AND ENDPOINTS');
  
  // Test different header combinations based on GoHighLevel's current API
  const headerConfigs = [
    {
      name: 'Standard Bearer Token',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    },
    {
      name: 'New API Format',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Marketplace Token',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'X-API-Version': '2021-07-28',
        'User-Agent': 'GoHighLevel-Marketplace-App'
      }
    }
  ];

  // Try different API endpoints with each header config
  const apiEndpoints = [
    {
      name: 'Current Services API',
      hostname: 'services.leadconnectorhq.com',
      paths: ['/locations', '/v1/locations', '/locations/search']
    },
    {
      name: 'Legacy REST API (Updated)',
      hostname: 'rest.gohighlevel.com',
      paths: ['/v1/locations', '/v2/locations', '/locations']
    },
    {
      name: 'Main API',
      hostname: 'api.gohighlevel.com',
      paths: ['/v1/locations', '/v2/locations', '/locations']
    }
  ];

  for (const endpoint of apiEndpoints) {
    console.log(`\n🔍 Testing ${endpoint.name}`);
    
    for (const config of headerConfigs) {
      console.log(`  Using ${config.name}...`);
      
      for (const path of endpoint.paths) {
        const result = await makeAPICall(endpoint.hostname, path, 'GET', null, config.headers);
        console.log(`    ${path}: ${result.statusCode}`);
        
        if (result.statusCode === 200) {
          console.log(`    ✅ FOUND WORKING ENDPOINT!`);
          console.log(`    ${endpoint.hostname}${path}`);
          
          // Parse and show location data
          try {
            const data = JSON.parse(result.response);
            console.log('\n📍 REAL LOCATION DATA FROM YOUR ACCOUNT:');
            
            if (data.locations && Array.isArray(data.locations)) {
              console.log(`Found ${data.locations.length} locations in your account:`);
              data.locations.forEach((location, index) => {
                console.log(`\n${index + 1}. Location ID: ${location.id}`);
                console.log(`   Name: ${location.name || 'Unnamed'}`);
                console.log(`   Address: ${location.address || 'No address'}`);
                console.log(`   Phone: ${location.phone || 'No phone'}`);
                console.log(`   Status: ${location.isActive ? 'Active' : 'Inactive'}`);
              });
              
              // Test product creation with first real location
              if (data.locations.length > 0) {
                const realLocationId = data.locations[0].id;
                console.log(`\n🎯 TESTING PRODUCT CREATION WITH REAL LOCATION: ${realLocationId}`);
                await testProductCreationWithWorkingAPI(accessToken, realLocationId, endpoint.hostname, config.headers);
              }
            } else if (data.id) {
              console.log(`Single Location ID: ${data.id}`);
              console.log(`Name: ${data.name || 'Unnamed'}`);
              await testProductCreationWithWorkingAPI(accessToken, data.id, endpoint.hostname, config.headers);
            } else {
              console.log('Response structure:', Object.keys(data));
              console.log('First 200 chars:', JSON.stringify(data).substring(0, 200));
            }
            
            return; // Stop once we find working endpoint
            
          } catch (error) {
            console.log('    ✅ API responded but parsing failed');
            console.log(`    Raw response: ${result.response.substring(0, 200)}`);
          }
        } else if (result.statusCode === 401) {
          console.log(`    ⚠️ Authentication issue - may need different token format`);
        } else if (result.statusCode === 403) {
          console.log(`    ⚠️ Forbidden - may need different permissions`);
        }
      }
    }
  }
  
  console.log('\n❌ No working location endpoints found with current OAuth token');
  console.log('\nThis suggests either:');
  console.log('• GoHighLevel API has changed authentication requirements');
  console.log('• OAuth installation needs different scopes for location access');
  console.log('• API endpoints have moved to different base URLs');
}

async function testProductCreationWithWorkingAPI(accessToken, locationId, hostname, headers) {
  console.log('\n🚀 TESTING PRODUCT CREATION WITH WORKING API');
  console.log(`Location ID: ${locationId}`);
  console.log(`API Host: ${hostname}`);
  
  const productData = {
    name: 'Real API Test Product',
    description: 'Testing with correct location ID and API format',
    locationId: locationId
  };

  // Test product endpoints with the working API format
  const productPaths = [
    '/products',
    '/v1/products', 
    '/v2/products',
    `/locations/${locationId}/products`
  ];

  for (const path of productPaths) {
    console.log(`\nTesting product endpoint: ${path}`);
    
    // Try GET first
    const getResult = await makeAPICall(hostname, path, 'GET', null, headers);
    console.log(`  GET ${path}: ${getResult.statusCode}`);
    
    if (getResult.statusCode === 200) {
      console.log('  ✅ Product listing works!');
      
      try {
        const products = JSON.parse(getResult.response);
        const productCount = products.products?.length || products.length || 0;
        console.log(`  Found ${productCount} existing products`);
      } catch (e) {
        console.log('  Product data retrieved');
      }
    }
    
    // Try POST to create product
    const postResult = await makeAPICall(hostname, path, 'POST', productData, headers);
    console.log(`  POST ${path}: ${postResult.statusCode}`);
    
    if (postResult.statusCode === 200 || postResult.statusCode === 201) {
      console.log('  🎉 SUCCESS! REAL PRODUCT CREATED IN GOHIGHLEVEL!');
      
      try {
        const product = JSON.parse(postResult.response);
        console.log(`  Product ID: ${product.id || 'Unknown'}`);
        console.log(`  Product Name: ${product.name || 'Unknown'}`);
        
        console.log('\n✅ YOUR WORKFLOW IS NOW READY!');
        console.log(`Working API: https://${hostname}${path}`);
        console.log(`Real Location ID: ${locationId}`);
        console.log('Headers:', JSON.stringify(headers, null, 2));
        
        return true;
        
      } catch (e) {
        console.log('  ✅ Product created successfully');
        console.log(`  Response: ${postResult.response.substring(0, 200)}`);
        return true;
      }
    } else {
      try {
        const error = JSON.parse(postResult.response);
        console.log(`  Error: ${error.message || error.error || 'Unknown error'}`);
      } catch (e) {
        console.log(`  Raw error: ${postResult.response.substring(0, 100)}`);
      }
    }
  }
  
  return false;
}

async function makeAPICall(hostname, path, method, data, headers) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
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

findCorrectLocationAPI().catch(console.error);