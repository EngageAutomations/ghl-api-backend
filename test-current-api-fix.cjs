const axios = require('axios');

async function testCurrentAPIFix() {
  console.log('=== Testing Current API with Format Fix ===');
  
  try {
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[1];
    
    console.log('Installation:', installation.id);
    console.log('OAuth working - can list products');
    
    // The issue: Railway deployment uses 'productType' but GHL API expects 'type'
    console.log('\n🔍 Current Issue Analysis:');
    console.log('- OAuth tokens: ✅ Working (2 installations, can read products)');
    console.log('- API permissions: ✅ Has products.write scope'); 
    console.log('- API format: ❌ Using productType instead of type');
    console.log('- Deployment: ❌ Railway still on v5.3.0 (needs v5.4.0-api-fix)');
    
    console.log('\n🔧 Solution:');
    console.log('1. Deploy fixed version with type field');
    console.log('2. Test complete workflow endpoints');
    console.log('3. Build comprehensive photo + pricing workflow');
    
    // Test pricing endpoint (this should work since it has different format)
    console.log('\n--- Testing Pricing API (Different Format) ---');
    
    // Try to add pricing to an existing product
    const listResponse = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation.id}`);
    
    if (listResponse.data.products && listResponse.data.products.length > 0) {
      const existingProduct = listResponse.data.products[0];
      console.log(`Testing pricing on existing product: ${existingProduct.name}`);
      
      try {
        const priceResponse = await axios.post(`https://dir.engageautomations.com/api/products/${existingProduct._id}/prices`, {
          name: "Test Price " + Date.now(),
          type: "one_time",
          amount: 25.00,
          currency: "USD",
          installation_id: installation.id
        });
        
        console.log('✅ Pricing API works!');
        console.log('Price created:', priceResponse.data.price?.id);
        
      } catch (priceError) {
        console.log('❌ Pricing API failed:');
        console.log('Status:', priceError.response?.status);
        console.log('Error:', JSON.stringify(priceError.response?.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testCurrentAPIFix();
