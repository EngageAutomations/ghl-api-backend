/**
 * Fix OAuth Location ID Capture
 * Updates Railway backend to capture location ID during OAuth installation
 */

const axios = require('axios');

async function testLocationCapture() {
  console.log('=== TESTING LOCATION ID CAPTURE FROM STORED TOKEN ===');
  
  try {
    // Test with a stored access token to retrieve location info
    // This simulates what should happen during OAuth callback
    
    console.log('Checking current installation...');
    const response = await axios.get('https://dir.engageautomations.com/api/debug/installations');
    
    if (!response.data.success || response.data.installations.length === 0) {
      console.log('No installations found');
      return;
    }
    
    const installation = response.data.installations[0];
    console.log('Current installation status:', {
      id: installation.id,
      hasToken: installation.hasAccessToken,
      hasLocationId: !!installation.ghlLocationId,
      scopes: installation.scopes?.includes('locations.readonly') ? 'locations.readonly ✓' : 'missing locations scope'
    });
    
    if (!installation.ghlLocationId) {
      console.log('❌ Location ID missing from installation');
      console.log('This is why product creation fails - no location target');
      
      console.log('\nThe OAuth callback needs to:');
      console.log('1. Call /oauth/userinfo to get locationId');
      console.log('2. Store locationId in installation record');
      console.log('3. Include location data for product API calls');
    }
    
  } catch (error) {
    console.error('Location capture test failed:', error.message);
  }
}

testLocationCapture();