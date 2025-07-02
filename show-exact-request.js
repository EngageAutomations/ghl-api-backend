#!/usr/bin/env node

/**
 * Show Exact Request to GoHighLevel
 * Captures and displays the complete HTTP request being sent
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function showExactRequest() {
  console.log('📤 SHOWING EXACT REQUEST TO GOHIGHLEVEL');
  console.log('='.repeat(50));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  console.log('✅ OAuth Token Retrieved');
  console.log('Token: ' + tokenData.accessToken.substring(0, 50) + '...');

  // Make request with detailed logging
  await makeRequestWithLogging(tokenData.accessToken);
}

async function makeRequestWithLogging(accessToken) {
  const productData = {
    name: 'Exact Request Test Product',
    locationId: 'SGtYHkPbOl2WJV08GOpg',
    description: 'Testing exact request format',
    productType: 'DIGITAL',
    availableInStore: true,
    seo: {
      title: 'Test Product',
      description: 'SEO description'
    }
  };

  const postData = JSON.stringify(productData);

  console.log('\n📋 EXACT REQUEST DETAILS:');
  console.log('─'.repeat(40));
  
  console.log('🌐 URL:');
  console.log('POST https://services.leadconnectorhq.com/products/');
  
  console.log('\n📑 HEADERS:');
  console.log('Content-Type: application/json');
  console.log('Accept: application/json');
  console.log('Authorization: Bearer ' + accessToken);
  console.log('Version: 2021-07-28');
  console.log('Content-Length: ' + Buffer.byteLength(postData));
  
  console.log('\n📦 BODY:');
  console.log(JSON.stringify(productData, null, 2));
  
  console.log('\n🔄 SENDING REQUEST...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/products/',
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
      
      console.log('\n📥 RESPONSE FROM GOHIGHLEVEL:');
      console.log('─'.repeat(40));
      console.log('Status Code:', res.statusCode);
      console.log('Status Message:', res.statusMessage);
      
      console.log('\nResponse Headers:');
      Object.entries(res.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('\nResponse Body:');
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log(JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
          console.log(responseData);
        }
        
        console.log('\n📊 SUMMARY:');
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SUCCESS - Product created!');
        } else if (res.statusCode === 401) {
          console.log('🔐 401 Unauthorized - Token or auth issue');
        } else if (res.statusCode === 403) {
          console.log('🚫 403 Forbidden - API access restricted');
        } else if (res.statusCode === 400) {
          console.log('⚠️  400 Bad Request - Format issue');
        } else {
          console.log(`❓ ${res.statusCode} - Unexpected response`);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ REQUEST ERROR:');
      console.log(error.message);
      resolve();
    });

    console.log('\n📡 Raw HTTP Request:');
    console.log(`POST /products/ HTTP/1.1`);
    console.log(`Host: services.leadconnectorhq.com`);
    console.log(`Content-Type: application/json`);
    console.log(`Accept: application/json`);
    console.log(`Authorization: Bearer ${accessToken.substring(0, 30)}...`);
    console.log(`Version: 2021-07-28`);
    console.log(`Content-Length: ${Buffer.byteLength(postData)}`);
    console.log(`Connection: close`);
    console.log('');
    console.log(postData);

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

showExactRequest().catch(console.error);