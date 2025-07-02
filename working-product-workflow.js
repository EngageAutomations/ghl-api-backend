#!/usr/bin/env node

/**
 * Working Product Workflow with Media and Pricing
 * Uses Railway OAuth tokens with proper GoHighLevel API format
 */

import https from 'https';

const installationId = 'install_1751436979939';

// Get OAuth token
async function getOAuthToken() {
  console.log('Getting OAuth token from Railway backend...');
  
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
          if (response.success && response.accessToken) {
            console.log('OAuth token retrieved successfully');
            resolve({
              accessToken: response.accessToken,
              installation: response.installation
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

// Extract location ID from token
function extractLocationId(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.authClassId;
  } catch (error) {
    return null;
  }
}

// Test working endpoints to find the correct API format
async function findWorkingEndpoints(accessToken) {
  console.log('\nTesting endpoints to find working API format...');
  
  // Test basic API connectivity
  const testEndpoints = [
    'https://services.leadconnectorhq.com/locations/',
    'https://rest.gohighlevel.com/v1/locations/',
    'https://api.gohighlevel.com/v1/locations/'
  ];

  for (const baseUrl of testEndpoints) {
    console.log(`Testing: ${baseUrl}`);
    
    const result = await testEndpoint(baseUrl, accessToken);
    if (result.success) {
      console.log(`✅ Working endpoint found: ${baseUrl}`);
      return { baseUrl, working: true };
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  }
  
  return { working: false };
}

// Helper to test an endpoint
async function testEndpoint(url, accessToken) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
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
          resolve({ success: true, data });
        } else {
          resolve({ 
            success: false, 
            error: `Status ${res.statusCode}`,
            statusCode: res.statusCode 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// Create minimal test product using different approaches
async function createTestProduct(accessToken, locationId) {
  console.log('\nAttempting product creation using multiple approaches...');
  
  const productData = {
    name: 'Test Car Detailing Service',
    description: 'Test product for workflow validation'
  };
  
  // Approach 1: Minimal product data
  console.log('\n1. Trying minimal product creation...');
  let result = await tryProductCreation(accessToken, locationId, {
    name: productData.name,
    description: productData.description
  });
  
  if (result.success) return result;
  
  // Approach 2: With location in body
  console.log('\n2. Trying with locationId in body...');
  result = await tryProductCreation(accessToken, locationId, {
    ...productData,
    locationId: locationId
  });
  
  if (result.success) return result;
  
  // Approach 3: Different data format
  console.log('\n3. Trying different data format...');
  result = await tryProductCreation(accessToken, locationId, {
    ...productData,
    type: 'DIGITAL',
    productType: 'DIGITAL'
  });
  
  return result;
}

// Try creating product with specific data
async function tryProductCreation(accessToken, locationId, productData) {
  const endpoints = [
    `/locations/${locationId}/products`,
    '/products',
    '/products/',
    '/v1/products'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`  Testing endpoint: ${endpoint}`);
    
    const result = await makeProductRequest(accessToken, endpoint, productData);
    
    if (result.success) {
      console.log(`  ✅ Success with ${endpoint}`);
      return result;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }
  
  return { success: false, error: 'All endpoints failed' };
}

// Make product creation request
async function makeProductRequest(accessToken, endpoint, productData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: endpoint,
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
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve({
              success: true,
              productId: response.id,
              product: response,
              endpoint: endpoint
            });
          } else {
            resolve({
              success: false,
              error: response.message || `Status ${res.statusCode}`,
              statusCode: res.statusCode,
              response: response
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: `Parse error: ${parseError.message}`,
            rawResponse: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.write(postData);
    req.end();
  });
}

// Test media upload with your exact format
async function testMediaUpload(accessToken) {
  console.log('\nTesting media upload with your exact method...');
  
  // Create minimal test image
  const imageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xC2, 0x00, 0x5E, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  return new Promise((resolve) => {
    const boundary = '----formdata-' + Date.now();
    
    const formParts = [];
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="file"; filename="test.png"');
    formParts.push('Content-Type: image/png');
    formParts.push('');
    
    const formDataStr = formParts.join('\r\n') + '\r\n';
    const formDataEnd = `\r\n--${boundary}--\r\n`;
    
    const formData = Buffer.concat([
      Buffer.from(formDataStr),
      imageBuffer,
      Buffer.from(formDataEnd)
    ]);

    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/medias/upload-file',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Length': formData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Media upload status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Media upload successful!');
            resolve({
              success: true,
              mediaUrl: response.url || response.fileUrl,
              response: response
            });
          } else {
            console.log('⚠️ Media upload failed:', response.message || response.error);
            resolve({
              success: false,
              error: response.message || response.error,
              response: response
            });
          }
        } catch (error) {
          console.log('❌ Media response parse error');
          resolve({
            success: false,
            error: 'Parse error',
            rawResponse: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(formData);
    req.end();
  });
}

// Main workflow
async function runWorkingWorkflow() {
  console.log('WORKING PRODUCT WORKFLOW TEST');
  console.log('Finding functional GoHighLevel API endpoints');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const { accessToken } = tokenData;
  const locationId = extractLocationId(accessToken);
  
  console.log(`Token length: ${accessToken.length}`);
  console.log(`Location ID: ${locationId}`);

  // Find working API endpoints
  const endpointTest = await findWorkingEndpoints(accessToken);
  
  // Test media upload
  const mediaResult = await testMediaUpload(accessToken);
  
  // Test product creation
  const productResult = await createTestProduct(accessToken, locationId);
  
  // Results summary
  console.log('\nWORKFLOW RESULTS');
  console.log('='.repeat(60));
  console.log('✅ OAuth token: Working');
  console.log(`${endpointTest.working ? '✅' : '❌'} API connectivity: ${endpointTest.working ? 'Found working endpoints' : 'No working endpoints found'}`);
  console.log(`${mediaResult.success ? '✅' : '❌'} Media upload: ${mediaResult.success ? 'SUCCESS' : mediaResult.error}`);
  console.log(`${productResult.success ? '✅' : '❌'} Product creation: ${productResult.success ? 'SUCCESS' : productResult.error}`);
  
  if (productResult.success) {
    console.log(`   Product ID: ${productResult.productId}`);
    console.log(`   Working endpoint: ${productResult.endpoint}`);
  }
  
  // Next steps
  console.log('\nNEXT STEPS');
  console.log('='.repeat(60));
  
  if (productResult.success) {
    console.log('✅ Product creation working - ready to add pricing');
    console.log('✅ Dynamic workflow system can now use working endpoints');
  } else {
    console.log('⚠️ Need to investigate GoHighLevel API access permissions');
    console.log('⚠️ OAuth scopes may need adjustment for product creation');
  }
  
  if (mediaResult.success) {
    console.log('✅ Media upload working - can add images to products');
  } else {
    console.log('⚠️ Media upload needs permission adjustment');
  }
}

runWorkingWorkflow().catch(console.error);