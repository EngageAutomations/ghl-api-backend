const axios = require('axios');

async function fixProductCreation() {
  console.log('=== Analyzing Product Creation Issue ===');
  
  try {
    // Get current installation details
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    console.log('Installation details:');
    console.log('- ID:', installation.id);
    console.log('- Location:', installation.locationId);
    console.log('- Token Status:', installation.tokenStatus);
    console.log('- Scopes:', installation.scopes);
    
    // Check if this is a scope issue by testing a different endpoint
    console.log('\n=== Testing Different API Endpoint ===');
    
    // Try listing existing products (read-only operation)
    const listResponse = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation.id}`, {
      timeout: 30000
    });
    
    console.log('✅ Product listing works!');
    console.log('Existing products:', listResponse.data.count);
    
    if (listResponse.data.products && listResponse.data.products.length > 0) {
      console.log('Sample product structure:', JSON.stringify(listResponse.data.products[0], null, 2));
    }
    
  } catch (error) {
    console.log('❌ Product listing also fails:');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 403) {
      console.log('\n🔍 Analysis: 403 Forbidden on read operations suggests:');
      console.log('1. OAuth app lacks marketplace permissions');
      console.log('2. Token format issue in OAuth server');
      console.log('3. GoHighLevel account restrictions');
    }
  }
  
  // Test media endpoint (different scope)
  console.log('\n=== Testing Media API (Different Scope) ===');
  try {
    const mediaResponse = await axios.get(`https://dir.engageautomations.com/api/media/list?installation_id=${installation.id}`, {
      timeout: 30000
    });
    
    console.log('✅ Media API works!');
    console.log('Media count:', mediaResponse.data.count);
    
  } catch (mediaError) {
    console.log('❌ Media API fails:');
    console.log('Status:', mediaError.response?.status);
    console.log('Error:', JSON.stringify(mediaError.response?.data, null, 2));
  }
}

fixProductCreation();
