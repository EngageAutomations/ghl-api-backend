/**
 * Simple GoHighLevel Product Creation Test
 * Tests minimal payload with just location ID
 */

const axios = require('axios');

async function testSimpleProductCreation() {
  try {
    console.log('=== Testing Simple GHL Product Creation ===');
    
    // Minimal product data - just what's needed
    const productData = {
      locationId: "WAvk87RmW9rBSDJHeOpH",
      name: "Simple Test Product " + Date.now(),
      description: "Created with minimal data payload",
      productType: "DIGITAL"
    };

    console.log('Product data:', productData);

    // Test direct GHL API call with Railway OAuth
    const response = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
        // Note: Railway backend should inject the Authorization header
      },
      timeout: 15000
    });

    console.log('✅ Product created successfully!');
    console.log('Status:', response.status);
    console.log('Product ID:', response.data.id);
    console.log('Product Name:', response.data.name);
    console.log('Location ID:', response.data.locationId);

    return {
      success: true,
      product: response.data,
      productId: response.data.id
    };

  } catch (error) {
    console.error('❌ Product creation failed');
    console.error('Error:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// Run the test
testSimpleProductCreation()
  .then(result => {
    console.log('\n=== Final Result ===');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(console.error);