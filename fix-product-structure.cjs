/**
 * Fix Product Structure Based on 422 Error Response
 * Use exact field requirements from GoHighLevel API validation
 */

const https = require('https');

async function fixProductStructure() {
  console.log('🔧 FIXING PRODUCT STRUCTURE BASED ON API VALIDATION');
  console.log('Using 422 error guidance: "productType should not be empty"');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    
    // Fixed product data based on 422 error requirements
    const correctProductData = {
      name: 'Premium Car Detailing Service',
      description: 'Professional exterior and interior car detailing with eco-friendly products and expert care.',
      productType: 'DIGITAL',  // API specifically requires this field
      locationId: tokenData.location_id,
      available: true,
      currency: 'USD'
    };
    
    console.log('📦 Product data with required fields:');
    console.log(JSON.stringify(correctProductData, null, 2));
    
    console.log('\n🚀 CREATING PRODUCT WITH CORRECT STRUCTURE...');
    
    const result = await createProductCorrect(tokenData.access_token, '/products/', correctProductData);
    
    console.log(`📊 Status: ${result.statusCode}`);
    console.log('📋 Response:', result.response);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log('✅ SUCCESS! Product created successfully');
      
      try {
        const productResponse = JSON.parse(result.response);
        console.log('🆔 Product ID:', productResponse.id || productResponse._id);
        console.log('📦 Product details:', productResponse);
        
        return productResponse;
      } catch (parseError) {
        console.log('✅ Product created (non-JSON response)');
        return result.response;
      }
    } else if (result.statusCode === 422) {
      console.log('⚠️ Still validation errors - need more field adjustments');
      
      // Try with additional fields that might be required
      const enhancedProductData = {
        ...correctProductData,
        type: 'DIGITAL',  // Try both type and productType
        price: 199.99,
        sku: 'CAR-DETAIL-001',
        taxable: false,
        availableInStore: true,
        medias: [],
        variants: []
      };
      
      console.log('\n🔄 TRYING ENHANCED PRODUCT DATA...');
      console.log(JSON.stringify(enhancedProductData, null, 2));
      
      const enhancedResult = await createProductCorrect(tokenData.access_token, '/products/', enhancedProductData);
      
      console.log(`📊 Enhanced Status: ${enhancedResult.statusCode}`);
      console.log('📋 Enhanced Response:', enhancedResult.response);
      
      if (enhancedResult.statusCode === 200 || enhancedResult.statusCode === 201) {
        console.log('✅ SUCCESS with enhanced data!');
        return JSON.parse(enhancedResult.response);
      }
      
    } else if (result.statusCode === 403) {
      console.log('❌ API access still restricted');
    } else {
      console.log(`❌ Unexpected status: ${result.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createProductCorrect(accessToken, endpoint, productData) {
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

fixProductStructure().catch(console.error);