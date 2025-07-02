#!/usr/bin/env node

/**
 * Test Correct API Approach for Company AuthClass
 * Uses location-specific API calls that work with Company authClass
 */

import https from 'https';

const installationId = 'install_1751436979939';

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

// Test API connectivity with different base URLs
async function testAPIConnectivity(accessToken, locationId) {
  console.log('\n🔍 Testing API Connectivity');
  console.log('Trying different base URLs and endpoints...');
  
  const testConfigs = [
    {
      name: 'Standard API',
      hostname: 'services.leadconnectorhq.com',
      path: `/locations/${locationId}`,
      method: 'GET'
    },
    {
      name: 'Legacy API', 
      hostname: 'rest.gohighlevel.com',
      path: '/v1/locations',
      method: 'GET'
    },
    {
      name: 'Direct API',
      hostname: 'api.gohighlevel.com', 
      path: `/v1/locations/${locationId}`,
      method: 'GET'
    }
  ];
  
  for (const config of testConfigs) {
    console.log(`\nTesting ${config.name}...`);
    const result = await testEndpoint(accessToken, config);
    
    if (result.success) {
      console.log(`✅ ${config.name} working!`);
      console.log(`   Status: ${result.statusCode}`);
      return { working: true, config: config };
    } else {
      console.log(`❌ ${config.name} failed: ${result.error}`);
    }
  }
  
  return { working: false };
}

// Test specific endpoint
async function testEndpoint(accessToken, config) {
  return new Promise((resolve) => {
    const options = {
      hostname: config.hostname,
      port: 443,
      path: config.path,
      method: config.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            data: data
          });
        } else {
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `Status ${res.statusCode}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

// Try product creation with working API base
async function createProductWithWorkingAPI(accessToken, locationId, workingConfig) {
  console.log('\n🚀 Creating Product with Working API');
  console.log(`Using: ${workingConfig.config.hostname}`);
  
  const productData = {
    name: 'Premium Car Detailing Service',
    description: 'Professional car detailing service',
    type: 'DIGITAL'
  };
  
  // Try product creation endpoints with the working base
  const productEndpoints = [
    `/products?locationId=${locationId}`,
    `/v1/products?locationId=${locationId}`,
    `/locations/${locationId}/products`,
    `/v1/locations/${locationId}/products`
  ];
  
  for (const endpoint of productEndpoints) {
    console.log(`\nTrying: https://${workingConfig.config.hostname}${endpoint}`);
    
    const result = await createProductAtEndpoint(
      accessToken, 
      workingConfig.config.hostname, 
      endpoint, 
      productData
    );
    
    if (result.success) {
      console.log(`✅ Product created at ${endpoint}!`);
      console.log(`Product ID: ${result.productId}`);
      return result;
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }
  
  return { success: false, error: 'All product endpoints failed' };
}

// Create product at specific endpoint
async function createProductAtEndpoint(accessToken, hostname, path, productData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({
              success: true,
              productId: response.id,
              product: response,
              endpoint: path
            });
          } else {
            resolve({
              success: false,
              error: response.message || `Status ${res.statusCode}`,
              statusCode: res.statusCode
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`,
            rawResponse: data.substring(0, 100)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Main test function
async function testCorrectAPIApproach() {
  console.log('🎯 TESTING CORRECT API APPROACH FOR COMPANY AUTHCLASS');
  console.log('Finding working API endpoints for your OAuth type');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  const locationId = extractLocationId(accessToken);
  
  console.log(`Location ID: ${locationId}`);
  console.log(`Auth Class: Company (from previous analysis)`);

  // Test API connectivity
  const connectivityResult = await testAPIConnectivity(accessToken, locationId);
  
  if (!connectivityResult.working) {
    console.log('\n❌ No working API endpoints found');
    console.log('This indicates the OAuth installation may need different configuration');
    return;
  }

  // Try product creation with working API
  const productResult = await createProductWithWorkingAPI(
    accessToken, 
    locationId, 
    connectivityResult
  );

  // Results
  console.log('\n🎯 CORRECT API APPROACH RESULTS');
  console.log('='.repeat(60));
  
  console.log(`✅ API Connectivity: ${connectivityResult.working ? 'WORKING' : 'FAILED'}`);
  if (connectivityResult.working) {
    console.log(`   Working API: ${connectivityResult.config.hostname}`);
  }
  
  console.log(`${productResult.success ? '✅' : '❌'} Product Creation: ${productResult.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (productResult.success) {
    console.log(`   Product ID: ${productResult.productId}`);
    console.log(`   Working Endpoint: ${productResult.endpoint}`);
    
    console.log('\n🚀 SUCCESS! REAL PRODUCT CREATED IN GOHIGHLEVEL!');
    console.log('Your workflow can now create actual products!');
    
  } else {
    console.log(`   Error: ${productResult.error}`);
    
    console.log('\n⚠️ PRODUCT CREATION STILL BLOCKED');
    console.log('OAuth installation needs reconfiguration for API access');
  }
}

testCorrectAPIApproach().catch(console.error);