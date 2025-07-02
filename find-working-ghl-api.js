#!/usr/bin/env node

/**
 * Find Working GoHighLevel API Endpoints
 * Test current API structure and find correct base URLs
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function findWorkingGHLAPI() {
  console.log('🔍 FINDING WORKING GOHIGHLEVEL API ENDPOINTS');
  console.log('Testing current API structure and documentation');
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

  // Test comprehensive list of possible GoHighLevel API endpoints
  const apiEndpoints = [
    // Current documented endpoints
    { name: 'Current API v1', url: 'https://services.leadconnectorhq.com/v1' },
    { name: 'Current API v2', url: 'https://services.leadconnectorhq.com/v2' },
    { name: 'Current API root', url: 'https://services.leadconnectorhq.com' },
    
    // Legacy endpoints  
    { name: 'Legacy REST API', url: 'https://rest.gohighlevel.com/v1' },
    { name: 'Legacy API v2', url: 'https://rest.gohighlevel.com/v2' },
    { name: 'Legacy API root', url: 'https://rest.gohighlevel.com' },
    
    // Alternative domains
    { name: 'API Domain', url: 'https://api.gohighlevel.com' },
    { name: 'API v1', url: 'https://api.gohighlevel.com/v1' },
    { name: 'API v2', url: 'https://api.gohighlevel.com/v2' },
    
    // New potential endpoints
    { name: 'Services API', url: 'https://api.leadconnectorhq.com' },
    { name: 'Services v1', url: 'https://api.leadconnectorhq.com/v1' },
    { name: 'Services v2', url: 'https://api.leadconnectorhq.com/v2' },
    
    // Company-specific endpoints (since we have Company authClass)
    { name: 'Company API', url: 'https://company-api.leadconnectorhq.com' },
    { name: 'Business API', url: 'https://business.leadconnectorhq.com' },
  ];

  console.log('\n🧪 Testing API Base URLs');
  console.log('Looking for working endpoints...');

  for (const endpoint of apiEndpoints) {
    console.log(`\nTesting: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    // Parse URL for testing
    const url = new URL(endpoint.url);
    
    // Test basic connectivity
    const result = await testBasicConnectivity(accessToken, url.hostname, url.pathname);
    
    if (result.success) {
      console.log(`✅ ${endpoint.name} is accessible!`);
      console.log(`   Status: ${result.statusCode}`);
      
      // Test product endpoints with this working base
      const productResult = await testProductsOnWorkingAPI(accessToken, url.hostname, url.pathname, locationId);
      
      if (productResult.success) {
        console.log(`🎉 FOUND WORKING PRODUCT API!`);
        console.log(`   Base URL: ${endpoint.url}`);
        console.log(`   Product endpoint: ${productResult.endpoint}`);
        console.log(`   Product ID: ${productResult.productId}`);
        return;
      }
    } else {
      console.log(`❌ ${endpoint.name} failed: ${result.statusCode} - ${result.error}`);
    }
  }

  console.log('\n🔍 Trying Alternative Approaches');
  
  // If no standard endpoints work, try location-specific approaches
  await tryLocationSpecificEndpoints(accessToken, locationId);
  
  // Try marketplace-specific endpoints
  await tryMarketplaceEndpoints(accessToken, locationId);
}

async function testBasicConnectivity(accessToken, hostname, basePath) {
  // Test multiple basic endpoints to verify API access
  const testPaths = [
    basePath || '',
    (basePath || '') + '/locations',
    (basePath || '') + '/ping',
    (basePath || '') + '/health',
    (basePath || '') + '/status'
  ];

  for (const path of testPaths) {
    const result = await makeAPIRequest(accessToken, hostname, path, 'GET', null);
    
    if (result.statusCode === 200 || result.statusCode === 401) {
      // 200 = working, 401 = auth issue but endpoint exists
      return {
        success: true,
        statusCode: result.statusCode,
        path: path
      };
    }
  }

  return {
    success: false,
    statusCode: 404,
    error: 'No accessible endpoints'
  };
}

async function testProductsOnWorkingAPI(accessToken, hostname, basePath, locationId) {
  console.log('   Testing product endpoints...');
  
  const productPaths = [
    `${basePath}/products`,
    `${basePath}/locations/${locationId}/products`,
    `${basePath}/companies/products`,
    `${basePath}/marketplace/products`
  ];

  for (const path of productPaths) {
    console.log(`     Trying: ${path}`);
    
    // First test GET to see if endpoint exists
    const getResult = await makeAPIRequest(accessToken, hostname, path, 'GET', null);
    console.log(`     GET ${path}: ${getResult.statusCode}`);
    
    if (getResult.statusCode === 200) {
      // Try creating a product
      const productData = {
        name: 'Test Product from API Discovery',
        description: 'Testing product creation'
      };
      
      const createResult = await makeAPIRequest(accessToken, hostname, path, 'POST', productData);
      console.log(`     POST ${path}: ${createResult.statusCode}`);
      
      if (createResult.statusCode === 200 || createResult.statusCode === 201) {
        try {
          const product = JSON.parse(createResult.response);
          return {
            success: true,
            endpoint: path,
            productId: product.id,
            product: product
          };
        } catch (e) {
          return {
            success: true,
            endpoint: path,
            productId: 'unknown',
            response: createResult.response
          };
        }
      }
    }
  }

  return { success: false };
}

async function tryLocationSpecificEndpoints(accessToken, locationId) {
  console.log('\n🏢 Testing Location-Specific Endpoints');
  
  const locationApis = [
    `https://${locationId}.leadconnectorhq.com`,
    `https://loc-${locationId}.gohighlevel.com`,
    `https://location.leadconnectorhq.com/${locationId}`
  ];

  for (const apiUrl of locationApis) {
    console.log(`Testing: ${apiUrl}`);
    
    const url = new URL(apiUrl);
    const result = await makeAPIRequest(accessToken, url.hostname, url.pathname + '/products', 'GET', null);
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`✅ Found location-specific API: ${apiUrl}`);
      return;
    }
  }
}

async function tryMarketplaceEndpoints(accessToken, locationId) {
  console.log('\n🏪 Testing Marketplace-Specific Endpoints');
  
  // Since this is a marketplace app, try marketplace-specific endpoints
  const marketplaceApis = [
    'https://marketplace-api.leadconnectorhq.com',
    'https://apps.leadconnectorhq.com',
    'https://integrations.leadconnectorhq.com'
  ];

  for (const apiUrl of marketplaceApis) {
    console.log(`Testing: ${apiUrl}`);
    
    const url = new URL(apiUrl);
    const result = await makeAPIRequest(accessToken, url.hostname, '/products', 'GET', null);
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 || result.statusCode === 401) {
      console.log(`✅ Found marketplace API: ${apiUrl}`);
      return;
    }
  }
}

async function makeAPIRequest(accessToken, hostname, path, method, data) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'User-Agent': 'GoHighLevel-Marketplace-App/1.0'
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

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        response: 'Timeout',
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

findWorkingGHLAPI().catch(console.error);