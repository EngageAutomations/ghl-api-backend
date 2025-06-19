/**
 * Test OAuth Location ID Retrieval
 * Retrieves location information using stored access token
 */

const axios = require('axios');

async function testLocationRetrieval() {
  try {
    console.log('=== TESTING OAUTH LOCATION RETRIEVAL ===');
    
    // Get stored installations
    const installationsResponse = await fetch('https://dir.engageautomations.com/api/debug/installations');
    const installationsData = await installationsResponse.json();
    
    if (!installationsData.success || installationsData.installations.length === 0) {
      console.log('❌ No OAuth installations found');
      return;
    }
    
    const installation = installationsData.installations[0];
    console.log('Found installation:', {
      id: installation.id,
      userId: installation.ghlUserId,
      hasToken: installation.hasAccessToken,
      scopes: installation.scopes
    });
    
    // Test if we can get user info to find location ID
    const userInfoUrl = 'https://services.leadconnectorhq.com/oauth/userinfo';
    console.log('Testing user info endpoint...');
    
    // This would require the actual access token which is not exposed in debug endpoint
    console.log('Note: Cannot test location retrieval without access token from backend');
    console.log('The OAuth installation needs to capture location ID during callback');
    
    // Show what the OAuth callback should capture
    console.log('\n=== REQUIRED OAUTH CALLBACK UPDATES ===');
    console.log('1. Get user info with access token');
    console.log('2. Extract locationId from user info');
    console.log('3. Store locationId in installation record');
    console.log('4. Ensure location ID is available for product API calls');
    
  } catch (error) {
    console.error('Location retrieval test failed:', error.message);
  }
}

testLocationRetrieval();