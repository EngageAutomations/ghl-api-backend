/**
 * Test Product Creation with Current OAuth Installation
 */

const axios = require('axios');

async function testProductCreation() {
  try {
    console.log('=== Testing Product Creation ===');
    
    // Get current installation details
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    if (!installation) {
      throw new Error('No OAuth installation found');
    }
    
    console.log(`Using installation: ${installation.id}`);
    console.log(`Location ID: ${installation.locationId}`);
    console.log(`Token Status: ${installation.tokenStatus}`);
    
    // Try creating a test product
    const productData = {
      name: "Test Product - OAuth Verification",
      description: "Testing API functionality with your fresh OAuth tokens",
      productType: "DIGITAL",
      installation_id: installation.id
    };
    
    console.log('Creating product with data:', productData);
    
    const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', productData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('Product creation response:', productResponse.data);
    
    return {
      success: true,
      installation: installation,
      product: productResponse.data
    };
    
  } catch (error) {
    console.error('Product creation test failed:', error.response?.data || error.message);
    
    // Check if it's an endpoint issue
    if (error.response?.status === 404) {
      console.log('404 Error - API endpoint not available in current backend version');
      return {
        success: false,
        error: 'API endpoint not available',
        needsEnhancement: true
      };
    }
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

testProductCreation().then(result => {
  console.log('\n=== TEST RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});