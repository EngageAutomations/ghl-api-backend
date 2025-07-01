const axios = require('axios');

async function testExactFormat() {
  try {
    console.log('=== Testing Exact GoHighLevel Format ===');
    
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    // Use the EXACT format from the working product listing
    const exactFormatData = {
      name: "Exact Format Test " + Date.now(),
      description: "Testing with exact format from existing products",
      productType: "PHYSICAL", // Use productType (not type) as shown in existing products
      locationId: installation.locationId,
      taxInclusive: true,
      isTaxesEnabled: false
    };
    
    console.log('Using exact format from existing products:', JSON.stringify(exactFormatData, null, 2));
    
    const response = await axios.post('https://dir.engageautomations.com/api/products/create', {
      ...exactFormatData,
      installation_id: installation.id
    }, {
      timeout: 30000
    });
    
    console.log('✅ SUCCESS with exact format!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error with exact format:');
    console.log('Status:', error.response?.status);
    console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
    
    // Check if it's a permission issue specific to the marketplace app
    if (error.response?.status === 403) {
      console.log('\n🔍 403 Forbidden Analysis:');
      console.log('- Read operations work (listing products successful)');
      console.log('- Write operations fail (product creation blocked)');
      console.log('- This suggests marketplace app write permissions issue');
      console.log('- Or account-level restrictions on product creation');
    }
  }
}

testExactFormat();
