const axios = require('axios');

async function testGHLAPI() {
  try {
    console.log('=== Testing GoHighLevel API Integration ===');
    
    // Get installation data
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    console.log('Installations:', installResponse.data.total);
    
    if (installResponse.data.installations.length === 0) {
      console.log('❌ No OAuth installations found');
      return;
    }
    
    const installation = installResponse.data.installations[0];
    console.log('✓ Using installation:', installation.id);
    console.log('✓ Location:', installation.locationId);
    console.log('✓ Token status:', installation.tokenStatus);
    console.log('✓ Scopes:', installation.scopes);
    
    // Test basic product creation
    console.log('\n=== Testing Product Creation ===');
    const productData = {
      name: "Test Product " + Date.now(),
      description: "Created via API test",
      productType: "PHYSICAL",
      installation_id: installation.id
    };
    
    console.log('Sending product data:', JSON.stringify(productData, null, 2));
    
    const response = await axios.post('https://dir.engageautomations.com/api/products/create', productData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ SUCCESS! Product created successfully');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ API Error:');
    console.log('Status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 403) {
      console.log('\n🔍 403 Forbidden Analysis:');
      console.log('- OAuth token exists but lacks permissions');
      console.log('- Check GoHighLevel app permissions');
      console.log('- Verify API endpoint and request format');
    }
  }
}

testGHLAPI();
