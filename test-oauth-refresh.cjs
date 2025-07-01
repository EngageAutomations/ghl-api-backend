const axios = require('axios');

async function testOAuthRefresh() {
  try {
    console.log('=== Testing OAuth Token Refresh System ===');
    
    // Get installation details
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    console.log('Installation ID:', installation.id);
    console.log('Location ID:', installation.locationId);
    console.log('Token Status:', installation.tokenStatus);
    console.log('Expires At:', installation.expiresAt);
    console.log('Current Time:', new Date().toISOString());
    
    // Check if token is expired
    const expiresAt = new Date(installation.expiresAt);
    const now = new Date();
    const isExpired = expiresAt <= now;
    
    console.log('Token Expired?', isExpired);
    console.log('Time until expiry:', Math.round((expiresAt - now) / 1000 / 60), 'minutes');
    
    if (isExpired) {
      console.log('✨ Token is expired - OAuth server should auto-refresh');
    } else {
      console.log('✓ Token appears valid');
    }
    
    // Test API call through OAuth server (which handles token refresh)
    console.log('\n=== Testing Product Creation via OAuth Server ===');
    
    const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', {
      name: "OAuth Server Test Product " + Date.now(),
      description: "Testing through OAuth server with auto-refresh",
      productType: "PHYSICAL",
      installation_id: installation.id
    }, {
      timeout: 45000 // Longer timeout for token refresh
    });
    
    console.log('✅ SUCCESS! Product created via OAuth server');
    console.log('Response:', JSON.stringify(productResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ OAuth Server Error:');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.code === 'ECONNABORTED') {
      console.log('🔍 Request timed out - possibly token refresh taking too long');
    }
  }
}

testOAuthRefresh();
