const axios = require('axios');

async function testDirectGHLAPI() {
  try {
    // First get the installation data
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    console.log('Installation response:', JSON.stringify(installResponse.data, null, 2));
    
    if (installResponse.data.installations.length === 0) {
      console.log('No installations found');
      return;
    }
    
    const installation = installResponse.data.installations[0];
    console.log('Using installation:', installation.id);
    console.log('Location ID:', installation.locationId);
    console.log('Scopes:', installation.scopes);
    
    // Test with minimal product data using the correct API format
    const productData = {
      name: "Direct API Test Product",
      description: "Testing direct GoHighLevel API",
      type: "PHYSICAL"
    };
    
    console.log('Attempting product creation with data:', JSON.stringify(productData, null, 2));
    
    // Make the direct API call
    const response = await axios.post('https://dir.engageautomations.com/api/products/create', {
      ...productData,
      installation_id: installation.id
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('SUCCESS! Product created:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('ERROR Details:');
    console.error('Status:', error.response?.status);
    console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

testDirectGHLAPI();
