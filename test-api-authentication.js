#!/usr/bin/env node

/**
 * Test Different API Authentication Methods
 * The 403 errors suggest authentication format issues, not missing endpoints
 */

import https from 'https';

const installationId = 'install_1751436979939';
const testLocationId = 'eYeyzEWiaxcTOPROAo4C'; // Darul Uloom Tampa

async function testAPIAuthentication() {
  console.log('🔑 TESTING DIFFERENT API AUTHENTICATION METHODS');
  console.log('403 errors suggest auth format issues, not missing endpoints');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');
  console.log(`Using test location: ${testLocationId} (Darul Uloom Tampa)`);

  // Test different authentication formats
  const authFormats = [
    {
      name: 'Standard Bearer',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    },
    {
      name: 'Bearer + Content-Type',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    },
    {
      name: 'Bearer + Location Header',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'X-Location-Id': testLocationId
      }
    },
    {
      name: 'OAuth Format',
      headers: {
        'Authorization': `OAuth ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    },
    {
      name: 'API Key Format',
      headers: {
        'X-API-Key': accessToken,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    },
    {
      name: 'New API Version',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2024-01-01'
      }
    },
    {
      name: 'No Version Header',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    },
    {
      name: 'Marketplace App Headers',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'User-Agent': 'GoHighLevel-Marketplace-App',
        'X-App-Type': 'marketplace'
      }
    }
  ];

  // Test endpoint that returned 403 (meaning it exists but auth failed)
  const testEndpoint = `https://services.leadconnectorhq.com/products/${testLocationId}`;

  console.log('\n🧪 Testing Authentication Formats');
  console.log(`Endpoint: ${testEndpoint}`);

  for (const authFormat of authFormats) {
    console.log(`\nTesting: ${authFormat.name}`);
    
    const result = await makeAPICall(testEndpoint, 'GET', null, authFormat.headers);
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log(`  ✅ SUCCESS! ${authFormat.name} works!`);
      console.log(`  Response: ${result.response.substring(0, 200)}`);
      
      // Try product creation with working auth
      await testProductCreationWithAuth(authFormat.headers, testLocationId);
      return;
      
    } else if (result.statusCode === 401) {
      console.log(`  ⚠️ Still unauthorized`);
    } else if (result.statusCode === 403) {
      console.log(`  ⚠️ Still forbidden`);
    } else if (result.statusCode === 404) {
      console.log(`  ❌ Endpoint changed to 404`);
    } else {
      console.log(`  ❌ Unexpected status: ${result.statusCode}`);
    }
    
    // Show any error details
    if (result.response && result.response.length < 300) {
      try {
        const error = JSON.parse(result.response);
        console.log(`  Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`  Raw: ${result.response.substring(0, 100)}`);
      }
    }
  }

  console.log('\n❌ No working authentication format found');
  console.log('Testing if products API requires different base URL...');
  
  // Test if product API has moved to different domain entirely
  await testAlternativeProductAPIs(accessToken, testLocationId);
}

async function testProductCreationWithAuth(workingHeaders, locationId) {
  console.log('\n🚀 Testing Product Creation with Working Auth');
  
  const productData = {
    name: 'Auth Test Product',
    description: 'Testing product creation with working authentication',
    locationId: locationId,
    type: 'DIGITAL'
  };

  // Try different product creation endpoints
  const createEndpoints = [
    `https://services.leadconnectorhq.com/products`,
    `https://services.leadconnectorhq.com/v1/products`,
    `https://services.leadconnectorhq.com/locations/${locationId}/products`
  ];

  for (const endpoint of createEndpoints) {
    console.log(`  Testing: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'POST', productData, workingHeaders);
    console.log(`  POST: ${result.statusCode}`);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log(`  🎉 PRODUCT CREATED SUCCESSFULLY!`);
      
      try {
        const product = JSON.parse(result.response);
        console.log(`  Product ID: ${product.id}`);
        console.log(`  Working endpoint: ${endpoint}`);
        return true;
      } catch (e) {
        console.log(`  Product created (parse error)`);
        return true;
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
  
  return false;
}

async function testAlternativeProductAPIs(accessToken, locationId) {
  console.log('\n🔄 Testing Alternative Product API Domains');
  
  // GoHighLevel may have moved products to different API domains
  const alternativeDomains = [
    {
      name: 'Products Subdomain',
      baseUrl: 'https://products.leadconnectorhq.com',
      paths: ['/', '/v1', '/api']
    },
    {
      name: 'Commerce API',
      baseUrl: 'https://commerce.leadconnectorhq.com',
      paths: ['/products', '/v1/products']
    },
    {
      name: 'Store API',
      baseUrl: 'https://store.leadconnectorhq.com',
      paths: ['/products', '/api/products']
    },
    {
      name: 'Marketplace API',
      baseUrl: 'https://marketplace.leadconnectorhq.com',
      paths: ['/products', '/api/products']
    },
    {
      name: 'E-commerce API',
      baseUrl: 'https://ecommerce.leadconnectorhq.com',
      paths: ['/products', '/v1/products']
    }
  ];

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Version': '2021-07-28'
  };

  for (const domain of alternativeDomains) {
    console.log(`\n  Testing ${domain.name}: ${domain.baseUrl}`);
    
    for (const path of domain.paths) {
      const testUrl = `${domain.baseUrl}${path}`;
      console.log(`    ${testUrl}`);
      
      const result = await makeAPICall(testUrl, 'GET', null, headers);
      console.log(`    Status: ${result.statusCode}`);
      
      if (result.statusCode === 200) {
        console.log(`    ✅ Found working products API!`);
        console.log(`    URL: ${testUrl}`);
        
        // Try creating product with this API
        const productData = {
          name: 'Alternative API Test Product',
          description: 'Testing with alternative product API',
          locationId: locationId
        };
        
        const createResult = await makeAPICall(testUrl, 'POST', productData, headers);
        console.log(`    POST: ${createResult.statusCode}`);
        
        if (createResult.statusCode === 200 || createResult.statusCode === 201) {
          console.log(`    🎉 PRODUCT CREATED WITH ALTERNATIVE API!`);
          console.log(`    Working URL: ${testUrl}`);
          return;
        }
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        console.log(`    ⚠️ API exists but auth failed`);
      }
    }
  }
  
  console.log('\n❌ No alternative product APIs found');
  console.log('\nConclusion: GoHighLevel may have disabled products API for marketplace apps');
  console.log('or requires additional setup/approval for product management access');
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

testAPIAuthentication().catch(console.error);