const axios = require('axios');

async function debugTokenIssue() {
  try {
    console.log('=== Debugging Token and Request Format ===');
    
    // Get installation details
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    console.log('Installation scopes:', installation.scopes);
    console.log('Token status:', installation.tokenStatus);
    console.log('Expires at:', installation.expiresAt);
    
    // Let's examine the exact error by testing with minimal data
    console.log('\n=== Testing with Minimal Product Data ===');
    
    const minimalData = {
      name: "Minimal Test " + Date.now(),
      productType: "PHYSICAL",
      installation_id: installation.id
    };
    
    try {
      const response = await axios.post('https://dir.engageautomations.com/api/products/create', minimalData, {
        timeout: 30000
      });
      console.log('✅ Minimal data worked!');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (minimalError) {
      console.log('❌ Minimal data failed:');
      console.log('Status:', minimalError.response?.status);
      console.log('Response:', JSON.stringify(minimalError.response?.data, null, 2));
    }
    
    // Test if the issue is with the API version
    console.log('\n=== Testing API Version Issue ===');
    
    // The deployed OAuth server might be using wrong API version
    // Let's check what version is actually being used
    console.log('Current OAuth server version: 5.3.0-complete-workflow');
    console.log('API endpoint being used: https://services.leadconnectorhq.com/products/');
    console.log('API version header: 2021-07-28');
    
    // Check if GoHighLevel changed their API endpoint or requirements
    console.log('\nThe issue might be:');
    console.log('1. API version incompatibility');
    console.log('2. Required fields missing from request');
    console.log('3. Token refresh mechanism not working properly');
    console.log('4. GoHighLevel API endpoint changes');
    
  } catch (error) {
    console.log('Debug error:', error.message);
  }
}

debugTokenIssue();
