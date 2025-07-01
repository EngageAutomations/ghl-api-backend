/**
 * Test API with Fresh OAuth Installation
 */

const axios = require('axios');

async function testFreshInstallation() {
  try {
    console.log('=== Testing Fresh Installation ===');
    
    // Use the latest installation
    const installation_id = "install_1751344841730";
    
    console.log(`Testing with installation: ${installation_id}`);
    
    // Test product creation
    const productData = {
      name: "Car Detailing Service - Premium Package",
      description: "Professional car detailing service with interior and exterior cleaning, waxing, and protection. Includes dashboard cleaning, leather conditioning, and tire shine.",
      productType: "SERVICE",
      installation_id: installation_id
    };
    
    console.log('Creating product:', productData);
    
    const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', productData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ Product creation successful!');
    console.log('Product ID:', productResponse.data.product?.id);
    
    // Test product listing
    console.log('\nTesting product listing...');
    const listResponse = await axios.get(`https://dir.engageautomations.com/api/products?installation_id=${installation_id}`);
    
    console.log('✅ Product listing successful!');
    console.log(`Found ${listResponse.data.count} products`);
    
    return {
      success: true,
      installation_id,
      product: productResponse.data.product,
      totalProducts: listResponse.data.count,
      message: 'API fully functional with fresh tokens'
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.error?.message === 'Invalid JWT') {
      return {
        success: false,
        error: 'Token expired again',
        recommendation: 'GoHighLevel tokens expire after ~2 hours. Auto-retry system deployment needed.'
      };
    }
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

testFreshInstallation().then(result => {
  console.log('\n=== FRESH INSTALLATION TEST RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});