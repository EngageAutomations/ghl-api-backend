#!/usr/bin/env node

/**
 * Get Real Location ID from GoHighLevel Account
 * Extract the actual location ID from the user's account, not from JWT payload
 */

import https from 'https';

const installationId = 'install_1751436979939';

async function getRealLocationId() {
  console.log('🔍 GETTING REAL LOCATION ID FROM GOHIGHLEVEL ACCOUNT');
  console.log('Fetching actual location data from user account');
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  const accessToken = tokenData.accessToken;
  
  console.log('✅ OAuth Token Retrieved');
  
  // Decode token to see what data we have
  console.log('\n📋 ANALYZING JWT TOKEN DATA');
  const tokenPayload = decodeJWTPayload(accessToken);
  
  console.log('Token Payload Fields:');
  Object.keys(tokenPayload).forEach(key => {
    console.log(`• ${key}: ${tokenPayload[key]}`);
  });
  
  console.log('\n🔍 TESTING LOCATION ENDPOINTS TO FIND REAL LOCATION ID');
  
  // Test different ways to get location information
  const locationEndpoints = [
    'https://services.leadconnectorhq.com/locations/',
    'https://rest.gohighlevel.com/v1/locations/',
    'https://api.gohighlevel.com/v1/locations/',
    'https://services.leadconnectorhq.com/v1/locations/',
  ];

  for (const baseUrl of locationEndpoints) {
    console.log(`\nTesting: ${baseUrl}`);
    
    const result = await makeAPICall(accessToken, baseUrl, 'GET');
    console.log(`Status: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log('✅ Found working locations endpoint!');
      
      try {
        const data = JSON.parse(result.response);
        console.log('\n📍 REAL LOCATION DATA:');
        
        if (data.locations && Array.isArray(data.locations)) {
          console.log(`Found ${data.locations.length} locations:`);
          data.locations.forEach((location, index) => {
            console.log(`${index + 1}. ID: ${location.id}`);
            console.log(`   Name: ${location.name}`);
            console.log(`   Type: ${location.type || 'N/A'}`);
            console.log(`   Status: ${location.status || 'N/A'}`);
          });
          
          // Use first location for testing
          if (data.locations.length > 0) {
            const realLocationId = data.locations[0].id;
            console.log(`\n🎯 USING REAL LOCATION ID: ${realLocationId}`);
            
            // Now test product creation with real location ID
            await testProductCreationWithRealLocation(accessToken, realLocationId);
            return;
          }
        } else if (data.id) {
          // Single location response
          console.log(`Real Location ID: ${data.id}`);
          console.log(`Name: ${data.name}`);
          
          await testProductCreationWithRealLocation(accessToken, data.id);
          return;
        } else {
          console.log('Location data structure:', JSON.stringify(data, null, 2));
        }
        
      } catch (error) {
        console.log('❌ Failed to parse location data');
        console.log('Raw response:', result.response.substring(0, 300));
      }
    } else {
      console.log(`❌ Failed: ${result.statusCode}`);
      if (result.response) {
        console.log(`Error: ${result.response.substring(0, 100)}`);
      }
    }
  }
  
  console.log('\n⚠️ Could not retrieve real location ID from any endpoint');
  console.log('Need to check OAuth installation permissions or API access');
}

async function testProductCreationWithRealLocation(accessToken, realLocationId) {
  console.log('\n🚀 TESTING PRODUCT CREATION WITH REAL LOCATION ID');
  console.log(`Using location: ${realLocationId}`);
  
  // Test product endpoints with real location ID
  const productEndpoints = [
    `https://services.leadconnectorhq.com/products?locationId=${realLocationId}`,
    `https://services.leadconnectorhq.com/v1/products?locationId=${realLocationId}`,
    `https://rest.gohighlevel.com/v1/products?locationId=${realLocationId}`,
    `https://api.gohighlevel.com/v1/products?locationId=${realLocationId}`,
    `https://services.leadconnectorhq.com/locations/${realLocationId}/products`,
    `https://rest.gohighlevel.com/v1/locations/${realLocationId}/products`,
  ];

  const productData = {
    name: 'Real Location Test Product',
    description: 'Testing with actual location ID from account',
    locationId: realLocationId
  };

  for (const endpoint of productEndpoints) {
    console.log(`\nTesting: ${endpoint}`);
    
    // First try GET to see if endpoint exists
    const getResult = await makeAPICall(accessToken, endpoint, 'GET');
    console.log(`GET ${endpoint}: ${getResult.statusCode}`);
    
    if (getResult.statusCode === 200) {
      console.log('✅ Product listing endpoint works!');
      
      // Try to parse and show existing products
      try {
        const products = JSON.parse(getResult.response);
        console.log(`Found ${products.products?.length || products.length || 0} existing products`);
      } catch (e) {
        console.log('Product data received');
      }
    }
    
    // Try POST to create product
    const postResult = await makeAPICall(accessToken, endpoint, 'POST', productData);
    console.log(`POST ${endpoint}: ${postResult.statusCode}`);
    
    if (postResult.statusCode === 200 || postResult.statusCode === 201) {
      console.log('🎉 SUCCESS! REAL PRODUCT CREATED IN GOHIGHLEVEL!');
      
      try {
        const product = JSON.parse(postResult.response);
        console.log(`Product ID: ${product.id}`);
        console.log(`Product Name: ${product.name}`);
        console.log(`Working Endpoint: ${endpoint}`);
        
        console.log('\n✅ YOUR WORKFLOW CAN NOW CREATE REAL PRODUCTS!');
        console.log(`Use location ID: ${realLocationId}`);
        console.log(`Use endpoint: ${endpoint}`);
        return;
        
      } catch (e) {
        console.log('Product created but could not parse response');
        console.log('Response:', postResult.response);
      }
    } else {
      // Show error details
      try {
        const error = JSON.parse(postResult.response);
        console.log(`Error: ${error.message || error.error}`);
      } catch (e) {
        console.log(`Raw error: ${postResult.response.substring(0, 100)}`);
      }
    }
  }
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

// Decode JWT payload
function decodeJWTPayload(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch (error) {
    return {};
  }
}

getRealLocationId().catch(console.error);