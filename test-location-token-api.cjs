/**
 * Test Location Token API Endpoint
 * Test the new API endpoints for requesting and checking Location tokens
 */

const axios = require('axios');

async function testLocationTokenAPI() {
  console.log('🧪 TESTING LOCATION TOKEN API ENDPOINTS');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:5000'; // API server running locally
  
  // You'll need to replace this with your actual installation ID from the successful OAuth installation
  const installationId = 'test-installation-id'; // Replace with real installation ID
  
  try {
    console.log('\n1️⃣ TESTING LOCATION TOKEN REQUEST');
    console.log('POST /api/location-token/request');
    
    const requestResponse = await axios.post(`${baseUrl}/api/location-token/request`, {
      installation_id: installationId
    });
    
    console.log('✅ Request Response:', requestResponse.data);
    
    console.log('\n2️⃣ TESTING LOCATION TOKEN STATUS');
    console.log(`GET /api/location-token/status/${installationId}`);
    
    const statusResponse = await axios.get(`${baseUrl}/api/location-token/status/${installationId}`);
    
    console.log('✅ Status Response:', statusResponse.data);
    
    console.log('\n🎯 LOCATION TOKEN API TESTS COMPLETE');
    console.log('Both endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the API server is running on port 5000');
    }
  }
}

// Usage instructions
console.log('📋 LOCATION TOKEN API TEST INSTRUCTIONS:');
console.log('1. Make sure your API server is running (npm run dev)');
console.log('2. Replace "test-installation-id" with your real installation ID');
console.log('3. Run: node test-location-token-api.cjs');
console.log('');

// Run the test
testLocationTokenAPI().catch(console.error);