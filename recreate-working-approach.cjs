/**
 * Recreate Working Approach from Historical Success
 * Use the exact method that gave us 200 status codes before
 */

const https = require('https');

async function recreateWorkingApproach() {
  console.log('🔄 RECREATING HISTORICALLY SUCCESSFUL APPROACH');
  console.log('Using exact methods that gave us 200 status codes');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    console.log('📍 Location ID:', tokenData.location_id);
    
    // Recreate the working product data format
    const workingProductData = {
      name: 'Premium Car Detailing Service',
      description: 'Professional exterior and interior car detailing with eco-friendly products and expert care. Complete wash, wax, vacuum, and detail service for premium results.',
      type: 'DIGITAL',
      locationId: tokenData.location_id
    };
    
    // Try the endpoints that worked before
    const workingEndpoints = [
      '/products/',
      '/products',
      `/locations/${tokenData.location_id}/products`
    ];
    
    for (const endpoint of workingEndpoints) {
      console.log(`\n🧪 Testing: ${endpoint}`);
      
      const result = await tryCreateProductWorking(tokenData.access_token, endpoint, workingProductData);
      
      console.log(`📊 Status: ${result.statusCode}`);
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log('✅ SUCCESS! Found working endpoint');
        console.log('🎯 Working endpoint:', endpoint);
        console.log('📋 Response:', result.response.substring(0, 200));
        return result;
      } else if (result.statusCode === 403) {
        console.log('❌ 403 Forbidden - API access restricted');
      } else if (result.statusCode === 404) {
        console.log('❌ 404 Not Found - Wrong endpoint');
      } else {
        console.log(`❌ ${result.statusCode} - ${result.response.substring(0, 100)}`);
      }
    }
    
    // Try different product data formats that worked
    console.log('\n🔄 TRYING ALTERNATIVE WORKING FORMATS...');
    
    const alternativeFormats = [
      // Format that worked in Railway backend
      {
        name: 'Car Detailing Service',
        description: 'Professional car detailing service',
        productType: 'DIGITAL',
        availableInStore: true,
        price: 199.99,
        currency: 'USD'
      },
      // Basic format
      {
        name: 'Premium Car Detailing Service',
        description: 'Professional car detailing with eco-friendly products.',
        type: 'DIGITAL'
      },
      // With proper GoHighLevel fields
      {
        name: 'Premium Car Detailing Service',
        description: 'Professional car detailing service',
        type: 'DIGITAL',
        available: true,
        locationId: tokenData.location_id,
        productType: 'DIGITAL'
      }
    ];
    
    for (let i = 0; i < alternativeFormats.length; i++) {
      const productData = alternativeFormats[i];
      console.log(`\n🧪 Testing format ${i + 1}: ${JSON.stringify(productData).substring(0, 80)}...`);
      
      const result = await tryCreateProductWorking(tokenData.access_token, '/products/', productData);
      
      console.log(`📊 Status: ${result.statusCode}`);
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log('✅ SUCCESS! Found working format');
        console.log('📋 Response:', result.response.substring(0, 200));
        return result;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function tryCreateProductWorking(accessToken, endpoint, productData) {
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          response: data,
          success: res.statusCode === 200 || res.statusCode === 201
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        response: `Request error: ${error.message}`,
        success: false
      });
    });

    req.write(postData);
    req.end();
  });
}

recreateWorkingApproach().catch(console.error);