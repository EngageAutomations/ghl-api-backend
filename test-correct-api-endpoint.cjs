/**
 * Test Correct GoHighLevel API Endpoint
 * Test the proper products API endpoint structure
 */

async function testCorrectAPIEndpoint() {
  console.log('🔧 TESTING CORRECT GOHIGHLEVEL API ENDPOINTS');
  console.log('Location ID: WAvk87RmW9rBSDJHeOpH');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token for testing');
    
    // Test different API endpoint structures
    const testEndpoints = [
      'https://services.leadconnectorhq.com/products',
      'https://services.leadconnectorhq.com/products/collection',
      `https://services.leadconnectorhq.com/products?locationId=${tokenData.location_id}`,
      'https://rest.gohighlevel.com/v1/products/',
      `https://rest.gohighlevel.com/v1/products/?locationId=${tokenData.location_id}`
    ];
    
    for (const endpoint of testEndpoints) {
      console.log(`\n🧪 Testing: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📊 Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SUCCESS! Found working endpoint');
          console.log('📦 Response structure:', Object.keys(data));
          
          if (data.products) {
            console.log(`📋 Products found: ${data.products.length}`);
          } else if (data.data) {
            console.log(`📋 Data items: ${data.data.length}`);
          }
          
          return { endpoint, data };
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed: ${errorText.substring(0, 100)}...`);
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 TESTING PRODUCT CREATION ENDPOINT...');
    
    // Test product creation endpoint
    const createEndpoint = 'https://services.leadconnectorhq.com/products';
    const testProduct = {
      name: "Test Product API Check",
      description: "Testing if product creation works",
      type: "PHYSICAL",
      locationId: tokenData.location_id
    };
    
    const createResponse = await fetch(createEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });
    
    console.log(`📊 Create Status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const createdProduct = await createResponse.json();
      console.log('✅ PRODUCT CREATION WORKS!');
      console.log('🆔 Created product ID:', createdProduct.id || createdProduct._id);
    } else {
      const createError = await createResponse.text();
      console.log('❌ Create failed:', createError);
      
      if (createResponse.status === 403) {
        console.log('🔒 API access restricted - contact GoHighLevel support');
      } else if (createResponse.status === 400) {
        console.log('📝 Request format issue - check required fields');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCorrectAPIEndpoint().catch(console.error);