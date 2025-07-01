const axios = require('axios');

async function testCorrectFormat() {
  try {
    console.log('=== Testing Correct GoHighLevel API Format ===');
    
    // Get installation
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    console.log('Using installation:', installation.id);
    console.log('Location ID:', installation.locationId);
    
    // Correct format based on GoHighLevel API docs
    const correctProductData = {
      name: "API Format Test " + Date.now(),
      description: "Testing with correct API format from documentation",
      type: "PHYSICAL",  // Changed from productType to type
      locationId: installation.locationId,
      currency: "USD"
    };
    
    console.log('Product data (corrected format):', JSON.stringify(correctProductData, null, 2));
    
    // Test through OAuth server with corrected format
    const response = await axios.post('https://dir.engageautomations.com/api/products/create', {
      name: correctProductData.name,
      description: correctProductData.description,
      productType: "PHYSICAL", // Keep using productType for OAuth server
      currency: "USD",
      installation_id: installation.id
    }, {
      timeout: 30000
    });
    
    console.log('✅ SUCCESS with OAuth server!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Still getting error:');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    // Let's try direct GoHighLevel API with corrected format
    console.log('\n=== Trying Direct GoHighLevel API ===');
    
    try {
      const installResponse = await axios.get('https://dir.engageautomations.com/installations');
      const installation = installResponse.data.installations[0];
      
      // Direct call with exactly what the docs show
      const directData = {
        name: "Direct API Test " + Date.now(),
        description: "Direct GoHighLevel API test",
        type: "PHYSICAL",
        locationId: installation.locationId
      };
      
      console.log('Direct call data:', JSON.stringify(directData, null, 2));
      
      // This won't work because we don't have direct access to the token
      // But let's see what error we get
      const directResponse = await axios.post('https://services.leadconnectorhq.com/products/', directData, {
        headers: {
          'Authorization': `Bearer ${installation.accessToken || 'invalid'}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Direct API SUCCESS!');
      console.log(JSON.stringify(directResponse.data, null, 2));
      
    } catch (directError) {
      console.log('Direct API Error:');
      console.log('Status:', directError.response?.status);
      console.log('Error:', JSON.stringify(directError.response?.data, null, 2));
    }
  }
}

testCorrectFormat();
