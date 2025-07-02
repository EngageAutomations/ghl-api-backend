#!/usr/bin/env node

/**
 * Test with Version Header - The missing piece!
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function testWithVersionHeader() {
  console.log('🔧 TESTING WITH VERSION HEADER');
  console.log('Adding the missing Version header that GoHighLevel requires');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  console.log('✅ OAuth Token Retrieved');
  console.log('Token length:', tokenData.accessToken.length);

  // Test with Version header
  console.log('\n1️⃣ Testing with Version Header');
  const result = await testDirectCallWithVersionHeader(tokenData.accessToken);
  
  if (result.statusCode === 200 || result.statusCode === 201) {
    console.log('\n🎉 SUCCESS! Version header was the missing piece!');
  } else {
    console.log('\nStatus:', result.statusCode);
    console.log('Still investigating...');
  }
}

async function testDirectCallWithVersionHeader(accessToken) {
  console.log('Making direct GoHighLevel call with Version header...');
  
  const productData = {
    name: 'Version Header Test Product',
    locationId: 'SGtYHkPbOl2WJV08GOpg',
    description: 'Testing with the required Version header',
    productType: 'DIGITAL',
    availableInStore: true
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/products/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',  // THE MISSING HEADER!
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('  Headers being sent:');
    console.log('    Authorization: Bearer ' + accessToken.substring(0, 20) + '...');
    console.log('    Version: 2021-07-28');
    console.log('    Content-Type: application/json');
    console.log('    Accept: application/json');

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        console.log('  Status:', res.statusCode);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('  ✅ SUCCESS! Product created!');
          try {
            const response = JSON.parse(responseData);
            console.log('  Product ID:', response.id || response.productId);
            console.log('  Response:', JSON.stringify(response, null, 2));
          } catch (e) {
            console.log('  Raw response:', responseData);
          }
        } else {
          try {
            const error = JSON.parse(responseData);
            console.log('  Error:', error.message || error.error);
            if (error.details) {
              console.log('  Details:', JSON.stringify(error.details, null, 2));
            }
          } catch (e) {
            console.log('  Raw error:', responseData.substring(0, 300));
          }
        }
        
        resolve({
          statusCode: res.statusCode,
          response: responseData
        });
      });
    });

    req.on('error', (error) => {
      console.log('  Request error:', error.message);
      resolve({
        statusCode: 0,
        response: `Request error: ${error.message}`
      });
    });

    req.write(postData);
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

testWithVersionHeader().catch(console.error);