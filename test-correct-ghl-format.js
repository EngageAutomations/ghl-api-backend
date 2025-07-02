#!/usr/bin/env node

/**
 * Test Correct GoHighLevel Format
 * Tests API backend with the exact format structure you provided
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testCorrectGHLFormat() {
  console.log('🔧 TESTING CORRECT GOHIGHLEVEL FORMAT');
  console.log('Using the exact format structure you provided');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  console.log('✅ OAuth Token Retrieved');

  // Test with correct GoHighLevel format
  console.log('\n1️⃣ Testing Product Creation with Correct Format');
  const productResult = await testProductCreationWithCorrectFormat(accessToken);
  
  if (productResult.success) {
    console.log('\n🎉 PRODUCT CREATION SUCCESSFUL!');
    console.log(`Product ID: ${productResult.productId}`);
    console.log('✅ Correct format working perfectly');
  } else {
    console.log('\n📊 Detailed Error Analysis:');
    console.log('Status Code:', productResult.statusCode);
    
    if (productResult.statusCode === 403) {
      console.log('🔍 Still 403 - GoHighLevel API access restriction confirmed');
      console.log('🔍 Format is correct, but API access blocked');
    } else if (productResult.statusCode === 400) {
      console.log('🔍 400 Bad Request - Format issue identified');
      console.log('🔍 Need to check required fields or data structure');
    } else if (productResult.statusCode === 422) {
      console.log('🔍 422 Validation Error - Field validation failed');
      console.log('🔍 Some fields may have invalid values');
    } else {
      console.log('🔍 Unexpected error code');
    }
    
    if (productResult.error) {
      console.log('Error Details:', productResult.error);
    }
  }
}

async function testProductCreationWithCorrectFormat(accessToken) {
  console.log('Testing with complete GoHighLevel format structure...');
  
  // Use comprehensive format matching your example
  const productData = {
    installation_id: installationId,
    name: 'Correct Format Test Product',
    description: 'Testing with the exact GoHighLevel API format structure',
    type: 'DIGITAL',
    statementDescriptor: 'TEST-PROD',
    availableInStore: true,
    // Include optional structured fields
    seo: {
      title: 'Correct Format Test Product',
      description: 'Testing the correct GoHighLevel API format'
    },
    slug: 'correct-format-test-product',
    isTaxesEnabled: false,
    isLabelEnabled: false
  };

  const endpoint = 'https://api.engageautomations.com/api/products/create';
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Format: Complete GoHighLevel structure with all optional fields`);
  
  const result = await makeAPICall(endpoint, 'POST', productData, {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  
  console.log(`  Status: ${result.statusCode}`);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log(`  ✅ SUCCESS! Correct format working!`);
    
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
      
      if (error.details || error.validation) {
        console.log(`  Details: ${JSON.stringify(error.details || error.validation, null, 2)}`);
      }
      
      return { 
        success: false, 
        error: error,
        statusCode: result.statusCode 
      };
      
    } catch (e) {
      console.log(`  Raw error: ${result.response.substring(0, 500)}`);
      
      return { 
        success: false, 
        error: result.response,
        statusCode: result.statusCode 
      };
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

testCorrectGHLFormat().catch(console.error);