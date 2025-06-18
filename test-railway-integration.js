/**
 * Test Railway Backend Integration with Auto Token Refresh
 * Tests the updated backend that forwards to Railway with installation_id
 */

async function testRailwayIntegration() {
  console.log('Testing Railway backend integration with installation_id...');
  
  const productData = {
    installationId: 'install_1750252333303',
    name: 'Railway Integration Test Product',
    description: 'Testing Railway backend with automatic token refresh',
    productType: 'DIGITAL',
    price: '49.99',
    locationId: 'WAVk87RmW9rBSDJHeOpH',
    metaTitle: 'Railway Test Product',
    metaDescription: 'Product created via Railway backend integration',
    seoKeywords: 'railway, integration, test'
  };

  try {
    console.log('Sending request to Railway backend:', productData);

    const response = await fetch('https://dir.engageautomations.com/api/ghl/products?installation_id=install_1750252333303', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });

    console.log('Railway response status:', response.status);
    console.log('Railway response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Railway backend error:', response.status, errorText);
      return {
        success: false,
        error: `Railway error: ${response.status} - ${errorText}`
      };
    }

    const result = await response.json();
    console.log('✅ Railway backend success!');
    console.log('Railway Response:', JSON.stringify(result, null, 2));

    return {
      success: true,
      result
    };

  } catch (error) {
    console.error('❌ Railway integration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testRailwayIntegration()
  .then(result => {
    console.log('\n=== Railway Integration Test Results ===');
    console.log('Success:', result.success);
    if (result.success) {
      console.log('Railway handled the request successfully with automatic token management');
      console.log('Product ID:', result.result?.product?.id || result.result?.productId);
    } else {
      console.log('Error:', result.error);
    }
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });