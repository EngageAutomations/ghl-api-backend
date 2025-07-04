/**
 * Test Manual /oauth/chooselocation Flow
 * Generate the correct authorization URL to test location selection
 */

async function testManualChooseLocation() {
  console.log('🧪 TESTING MANUAL /oauth/chooselocation FLOW');
  console.log('Generating correct authorization URL for location selection');
  console.log('='.repeat(60));
  
  // OAuth configuration
  const CLIENT_ID = '68474924a586bce22a6e64f7-mbpkmyu4';
  const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';
  
  // Comprehensive scopes matching our backend
  const SCOPES = [
    'products/prices.write',
    'products/prices.readonly', 
    'products/collection.readonly',
    'medias.write',
    'medias.readonly',
    'locations.readonly',
    'contacts.readonly',
    'contacts.write',
    'products/collection.write',
    'users.readonly',
    'products.write',
    'products.readonly'
  ];
  
  console.log('📋 OAUTH CONFIGURATION:');
  console.log('   • Client ID:', CLIENT_ID);
  console.log('   • Redirect URI:', REDIRECT_URI);
  console.log('   • Scopes Count:', SCOPES.length);
  console.log('');
  
  // Construct the correct authorization URL
  const authUrl = constructChooseLocationURL(CLIENT_ID, REDIRECT_URI, SCOPES);
  
  console.log('🔗 CORRECT AUTHORIZATION URL:');
  console.log('='.repeat(30));
  console.log(authUrl);
  console.log('');
  
  console.log('🎯 KEY DIFFERENCES:');
  console.log('='.repeat(20));
  console.log('✅ CORRECT (this URL):');
  console.log('   • Uses /oauth/chooselocation endpoint');
  console.log('   • Forces location selection UI');
  console.log('   • Generates Location-level authorization codes');
  console.log('');
  console.log('❌ CURRENT MARKETPLACE (suspected):');
  console.log('   • Uses /oauth/authorize endpoint');
  console.log('   • Skips location selection');
  console.log('   • Generates Company-level authorization codes');
  console.log('');
  
  console.log('🧪 TESTING INSTRUCTIONS:');
  console.log('='.repeat(25));
  console.log('1. Copy the authorization URL above');
  console.log('2. Open in incognito/private browser window');
  console.log('3. Check if you see location selection UI');
  console.log('4. Complete OAuth flow and check resulting token');
  console.log('5. Expected result: authClass: "Location" in JWT');
  console.log('');
  
  console.log('🔍 WHAT TO LOOK FOR:');
  console.log('='.repeat(20));
  console.log('• Location selection dropdown/UI');
  console.log('• "Choose Location" or similar text');
  console.log('• List of available locations/sub-accounts');
  console.log('• Required selection before proceeding');
  console.log('');
  
  console.log('📊 EXPECTED vs ACTUAL RESULTS:');
  console.log('='.repeat(30));
  console.log('If URL shows location selection:');
  console.log('   → Authorization flow is correct');
  console.log('   → Issue is elsewhere in implementation');
  console.log('');
  console.log('If URL skips to immediate authorization:');
  console.log('   → Confirms /oauth/chooselocation works differently');
  console.log('   → May indicate single-location account');
  console.log('   → Or marketplace override behavior');
  console.log('');
  
  console.log('🎯 DIAGNOSTIC VALUE:');
  console.log('='.repeat(20));
  console.log('This test will determine if:');
  console.log('• /oauth/chooselocation endpoint works as expected');
  console.log('• User account has multiple locations available');
  console.log('• Manual flow generates Location-level tokens');
  console.log('• Issue is marketplace app configuration vs endpoint availability');
  console.log('');
  
  // Also generate a state parameter for security
  const state = generateState();
  const authUrlWithState = authUrl + '&state=' + state;
  
  console.log('🔒 AUTHORIZATION URL WITH STATE (recommended):');
  console.log('='.repeat(45));
  console.log(authUrlWithState);
  console.log('');
  console.log('State parameter:', state);
  console.log('(Verify this state value is returned in callback)');
}

function constructChooseLocationURL(clientId, redirectUri, scopes) {
  const baseUrl = 'https://marketplace.leadconnectorhq.com/oauth/chooselocation';
  const params = new URLSearchParams({
    'response_type': 'code',
    'redirect_uri': redirectUri,
    'client_id': clientId,
    'scope': scopes.join(' ')
  });
  
  return baseUrl + '?' + params.toString();
}

function generateState() {
  // Generate random state for OAuth security
  return 'test_' + Math.random().toString(36).substring(2, 15);
}

testManualChooseLocation().catch(console.error);