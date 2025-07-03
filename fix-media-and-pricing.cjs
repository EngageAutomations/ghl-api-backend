/**
 * Fix Media Upload and Pricing Creation
 * Test correct endpoints and scope requirements
 */

const https = require('https');

async function fixMediaAndPricing() {
  console.log('🔧 FIXING MEDIA UPLOAD AND PRICING CREATION');
  console.log('Testing correct endpoints and API structures');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    console.log('📍 Location ID:', tokenData.location_id);
    
    // Test 1: Media upload with different endpoints
    console.log('\n📸 TESTING MEDIA UPLOAD ENDPOINTS...');
    
    const mediaEndpoints = [
      'https://services.leadconnectorhq.com/medias/upload-file',
      'https://rest.gohighlevel.com/v1/medias/upload',
      `https://services.leadconnectorhq.com/locations/${tokenData.location_id}/medias/upload`
    ];
    
    for (const endpoint of mediaEndpoints) {
      console.log(`\n🧪 Testing media endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28'
          }
        });
        
        console.log(`📊 Status: ${response.status}`);
        
        if (response.status === 400 || response.status === 422) {
          const errorText = await response.text();
          console.log('📝 Required fields:', errorText.substring(0, 100));
        } else if (response.status === 401) {
          console.log('❌ Scope/permission issue');
        } else if (response.status === 404) {
          console.log('❌ Wrong endpoint');
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Test 2: Pricing endpoints
    console.log('\n💰 TESTING PRICING ENDPOINTS...');
    
    const testProductId = '686620520b7a703979659eca'; // From previous successful creation
    
    const pricingEndpoints = [
      `/products/${testProductId}/prices`,
      `/products/${testProductId}/price`,
      `/products/prices`,
      `/locations/${tokenData.location_id}/products/${testProductId}/prices`
    ];
    
    for (const endpoint of pricingEndpoints) {
      console.log(`\n🧪 Testing pricing endpoint: ${endpoint}`);
      
      const testPricing = {
        name: 'Test Price',
        amount: 9999,
        currency: 'USD',
        type: 'one_time'
      };
      
      const result = await testEndpoint('POST', endpoint, testPricing, tokenData.access_token);
      console.log(`📊 Status: ${result.statusCode}`);
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log('✅ Found working pricing endpoint!');
        console.log('📋 Response:', result.response.substring(0, 200));
        break;
      } else if (result.statusCode === 422) {
        console.log('📝 Validation error - check required fields');
        console.log('💡 Response:', result.response.substring(0, 150));
      } else if (result.statusCode === 404) {
        console.log('❌ Endpoint not found');
      } else {
        console.log(`⚠️ Status ${result.statusCode}:`, result.response.substring(0, 100));
      }
    }
    
    // Test 3: Check available scopes
    console.log('\n🔍 CHECKING AVAILABLE SCOPES...');
    
    // Decode JWT to see actual scopes
    const tokenParts = tokenData.access_token.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('📋 Available scopes:', payload.oauthMeta?.scopes || 'No scopes found');
        
        const hasMediaScope = payload.oauthMeta?.scopes?.includes('medias.write');
        const hasPriceScope = payload.oauthMeta?.scopes?.includes('products/prices.write');
        
        console.log('📸 Media write scope:', hasMediaScope ? '✅ Available' : '❌ Missing');
        console.log('💰 Price write scope:', hasPriceScope ? '✅ Available' : '❌ Missing');
        
      } catch (error) {
        console.log('❌ Could not decode JWT token');
      }
    }
    
    // Test 4: Alternative approaches
    console.log('\n🔄 TESTING ALTERNATIVE APPROACHES...');
    
    // Try creating pricing as part of product creation
    console.log('\n💡 Testing product creation with embedded pricing...');
    
    const productWithPricing = {
      name: 'Product with Embedded Pricing',
      description: 'Testing embedded pricing approach',
      productType: 'DIGITAL',
      locationId: tokenData.location_id,
      available: true,
      currency: 'USD',
      price: 199.99,
      prices: [{
        name: 'Standard Price',
        amount: 19999,
        currency: 'USD',
        type: 'one_time'
      }]
    };
    
    const embeddedResult = await testEndpoint('POST', '/products/', productWithPricing, tokenData.access_token);
    console.log(`📊 Embedded pricing status: ${embeddedResult.statusCode}`);
    
    if (embeddedResult.statusCode === 201) {
      console.log('✅ Embedded pricing works!');
      try {
        const productData = JSON.parse(embeddedResult.response);
        console.log('💳 Prices created:', productData.prices?.length || 0);
      } catch (error) {
        console.log('📋 Product created with pricing (parse error)');
      }
    } else {
      console.log('❌ Embedded pricing failed:', embeddedResult.response.substring(0, 100));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testEndpoint(method, path, data, accessToken) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    };
    
    if (data) {
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

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

fixMediaAndPricing().catch(console.error);