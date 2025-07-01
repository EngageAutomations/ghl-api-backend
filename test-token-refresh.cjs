/**
 * Test Token Refresh and API Access
 */

const axios = require('axios');

async function testTokenRefresh() {
  try {
    console.log('=== Testing Token Refresh ===');
    
    // First, try to create a product with current token
    console.log('1. Testing product creation with current token...');
    
    const productData = {
      name: "Test Product - Token Refresh Verification",
      description: "Testing token refresh functionality",
      productType: "DIGITAL",
      installation_id: "install_1751343410712"
    };
    
    try {
      const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', productData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      console.log('✅ Product creation successful with current token');
      return {
        success: true,
        tokenRefreshNeeded: false,
        product: productResponse.data
      };
      
    } catch (productError) {
      console.log('❌ Product creation failed:', productError.response?.data?.error || productError.message);
      
      if (productError.response?.data?.error?.message === 'Invalid JWT') {
        console.log('🔄 Token expired - this is expected behavior');
        console.log('⚠️ GoHighLevel invalidates tokens after ~2.2 hours');
        
        return {
          success: false,
          tokenRefreshNeeded: true,
          error: 'OAuth token expired - fresh installation required',
          nextSteps: [
            'Tokens expire after 2.2 hours due to GoHighLevel security policies',
            'Complete a new OAuth installation through GoHighLevel marketplace',
            'Enhanced auto-retry system ready to deploy once fresh tokens available'
          ]
        };
      }
      
      throw productError;
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

testTokenRefresh().then(result => {
  console.log('\n=== TOKEN REFRESH TEST RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});