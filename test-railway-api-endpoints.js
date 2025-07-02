#!/usr/bin/env node

/**
 * Test Railway Backend API Endpoints
 * Use the Railway backend that was successfully creating products
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testRailwayAPIEndpoints() {
  console.log('🧪 TESTING RAILWAY BACKEND API ENDPOINTS');
  console.log('Using Railway backend that was successfully creating products');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  // Test Railway backend API endpoints that were working
  console.log('\n1️⃣ Testing Railway Product Creation Endpoint');
  const railwayResult = await testRailwayProductCreation(accessToken);
  
  if (railwayResult.success) {
    console.log('✅ Railway backend product creation working!');
    return;
  }

  console.log('\n2️⃣ Testing Direct GoHighLevel via Railway Proxy');
  await testRailwayProxy(accessToken);
  
  console.log('\n3️⃣ Testing Railway Backend Status');
  await testRailwayBackendStatus();
}

async function testRailwayProductCreation(accessToken) {
  console.log('Testing Railway backend product creation...');
  
  const productData = {
    name: 'Railway Test Product',
    description: 'Testing product creation via Railway backend',
    type: 'DIGITAL',
    price: 199.99,
    currency: 'USD'
  };

  // Test Railway backend endpoints that were working
  const railwayEndpoints = [
    'https://dir.engageautomations.com/api/products/create',
    'https://dir.engageautomations.com/api/ghl/products',
    'https://dir.engageautomations.com/api/products'
  ];

  for (const endpoint of railwayEndpoints) {
    console.log(`  Testing: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'POST', productData, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log(`  ✅ SUCCESS! Railway endpoint working`);
      
      try {
        const response = JSON.parse(result.response);
        console.log(`  Product ID: ${response.id || response.productId || 'Unknown'}`);
        console.log(`  Working endpoint: ${endpoint}`);
        return { success: true, endpoint: endpoint, response: response };
      } catch (e) {
        console.log(`  ✅ Product created (parse error)`);
        return { success: true, endpoint: endpoint };
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
  
  return { success: false };
}

async function testRailwayProxy(accessToken) {
  console.log('Testing Railway proxy to GoHighLevel...');
  
  // Railway backend may be proxying GoHighLevel API calls
  const proxyEndpoints = [
    'https://dir.engageautomations.com/api/ghl/products/create',
    'https://dir.engageautomations.com/api/workflow/complete-product',
    'https://dir.engageautomations.com/proxy/ghl/products'
  ];

  const productData = {
    name: 'Proxy Test Product',
    description: 'Testing via Railway proxy to GoHighLevel',
    type: 'DIGITAL'
  };

  for (const endpoint of proxyEndpoints) {
    console.log(`  Testing proxy: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'POST', productData, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log(`  ✅ Proxy endpoint working!`);
      
      try {
        const response = JSON.parse(result.response);
        console.log(`  Response: ${JSON.stringify(response, null, 2)}`);
        return;
      } catch (e) {
        console.log(`  Raw response: ${result.response.substring(0, 200)}`);
      }
    } else {
      try {
        const error = JSON.parse(result.response);
        console.log(`  Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`  Raw: ${result.response.substring(0, 100)}`);
      }
    }
  }
}

async function testRailwayBackendStatus() {
  console.log('Testing Railway backend status...');
  
  const statusEndpoints = [
    'https://dir.engageautomations.com/installations',
    'https://dir.engageautomations.com/status',
    'https://dir.engageautomations.com/health',
    'https://dir.engageautomations.com/'
  ];

  for (const endpoint of statusEndpoints) {
    console.log(`  Checking: ${endpoint}`);
    
    const result = await makeAPICall(endpoint, 'GET', null, {});
    console.log(`  Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      try {
        const data = JSON.parse(result.response);
        console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
        
        if (data.installations) {
          console.log(`  Installations: ${data.installations.length || 0}`);
        }
        if (data.count) {
          console.log(`  Installation count: ${data.count}`);
        }
      } catch (e) {
        console.log(`  Raw response: ${result.response.substring(0, 100)}`);
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

testRailwayAPIEndpoints().catch(console.error);