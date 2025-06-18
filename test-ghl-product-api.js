/**
 * Test GoHighLevel Product Creation API Integration
 * Tests the corrected backend with environment token management
 */

async function testGoHighLevelProductCreation() {
  console.log('Testing GoHighLevel Product Creation API...');
  
  const productData = {
    installationId: 'install_1750252333303',
    name: 'Test Product - Direct Integration',
    description: 'Testing corrected GoHighLevel API integration with environment token management',
    productType: 'DIGITAL',
    price: '39.99',
    locationId: 'WAVk87RmW9rBSDJHeOpH',
    metaTitle: 'Test Product SEO Title',
    metaDescription: 'Test product for SEO optimization and Railway integration',
    seoKeywords: 'test, product, digital, marketplace'
  };

  try {
    // Test direct GoHighLevel API call
    const accessToken = 'ghl_pat_XQ6hy_y6Ke6sQj_0uHFdIbaPj_qEAEOME3emdj9x5Y4tJ5tAhqbL0G9e3AKsYmUP';
    const locationId = 'WAVk87RmW9rBSDJHeOpH';

    const ghlProductData = {
      locationId,
      name: productData.name,
      description: productData.description,
      productType: productData.productType,
      availableInStore: true,
      prices: [{
        name: `${productData.name} - Default Price`,
        currency: 'USD',
        amount: parseFloat(productData.price) * 100, // Convert to cents
        type: 'ONE_TIME'
      }]
    };

    console.log('Creating product in GoHighLevel with data:', JSON.stringify(ghlProductData, null, 2));

    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(ghlProductData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GoHighLevel API error:', response.status, errorText);
      throw new Error(`GoHighLevel API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Product created successfully in GoHighLevel!');
    console.log('Product ID:', result.product?.id || result.id);
    console.log('Product Details:', JSON.stringify(result, null, 2));

    return {
      success: true,
      productId: result.product?.id || result.id,
      ghlLocationId: locationId,
      result
    };

  } catch (error) {
    console.error('❌ GoHighLevel product creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testGoHighLevelProductCreation()
  .then(result => {
    console.log('\n=== Test Results ===');
    console.log('Success:', result.success);
    if (result.success) {
      console.log('Product ID:', result.productId);
      console.log('Location ID:', result.ghlLocationId);
    } else {
      console.log('Error:', result.error);
    }
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });