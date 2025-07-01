const axios = require('axios');

async function testAPIVersions() {
  try {
    console.log('=== Testing Different API Versions and Formats ===');
    
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const newInstallation = installResponse.data.installations[1]; // Use the newest installation
    
    console.log('New installation ID:', newInstallation.id);
    console.log('Same location ID:', newInstallation.locationId);
    console.log('Token status:', newInstallation.tokenStatus);
    
    // Test if the issue is with missing required fields
    // According to GHL docs, let's try with more complete data
    const completeProductData = {
      name: "Complete Format Test " + Date.now(),
      description: "Testing with all recommended fields",
      productType: "PHYSICAL",
      locationId: newInstallation.locationId,
      currency: "USD",
      taxInclusive: true,
      isTaxesEnabled: false,
      installation_id: newInstallation.id
    };
    
    console.log('Testing with complete data format...');
    
    const response = await axios.post('https://dir.engageautomations.com/api/products/create', completeProductData, {
      timeout: 30000
    });
    
    console.log('✅ SUCCESS! Product created with complete format');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Complete format also failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    // The issue might be in the OAuth server code itself
    // Let's check if it's properly handling the locationId and token
    console.log('\n🔍 Potential Issues:');
    console.log('1. OAuth server not properly including locationId in API request');
    console.log('2. Token format issue in authorization header');
    console.log('3. API version mismatch (using 2021-07-28)');
    console.log('4. Missing required headers or fields');
    console.log('5. OAuth server deployed version may need updates');
  }
}

testAPIVersions();
