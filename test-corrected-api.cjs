const axios = require('axios');

async function testCorrectedAPI() {
  try {
    console.log('=== Testing Corrected GoHighLevel Products API ===');
    
    // Get the OAuth installation
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    console.log('Testing with installation:', installation.id);
    console.log('Location ID:', installation.locationId);
    
    // Try direct GoHighLevel API call with correct format
    const testProductData = {
      name: "Direct Test Product " + Date.now(),
      description: "Testing direct API format",
      type: "PHYSICAL",
      locationId: installation.locationId
    };
    
    console.log('Making direct GoHighLevel API call...');
    console.log('Product data:', JSON.stringify(testProductData, null, 2));
    
    // Get fresh token first
    const tokenResponse = await axios.get(`https://dir.engageautomations.com/?installation_id=${installation.id}`);
    console.log('Token refresh check completed');
    
    // Make direct call to GoHighLevel API
    const directResponse = await axios.post('https://services.leadconnectorhq.com/products/', testProductData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ DIRECT API SUCCESS!');
    console.log('Product created:', JSON.stringify(directResponse.data, null, 2));
    
  } catch (error) {
    console.log('Direct API Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      console.log('🔍 401 = Invalid/expired token');
    } else if (error.response?.status === 403) {
      console.log('🔍 403 = Valid token, insufficient permissions');
    } else if (error.response?.status === 422) {
      console.log('🔍 422 = Validation error in request data');
    }
  }
}

testCorrectedAPI();
