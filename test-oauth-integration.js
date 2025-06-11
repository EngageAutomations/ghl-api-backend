// Test GoHighLevel OAuth Integration
// This script tests the complete OAuth flow with real credentials

const clientId = '68474924a586bce22a6e64f7-mbpkmyu4';
const clientSecret = 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
const redirectUri = 'https://dir.engageautomations.com/oauth-complete.html';

// Step 1: Generate OAuth Authorization URL
function generateAuthUrl() {
  const state = `test_${Date.now()}`;
  const scopes = 'contacts.read contacts.write locations.read';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state: state
  });
  
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?${params.toString()}`;
  
  console.log('=== OAuth Authorization URL ===');
  console.log('URL:', authUrl);
  console.log('State:', state);
  console.log('Redirect URI:', redirectUri);
  console.log('Client ID:', clientId);
  console.log('Scopes:', scopes);
  
  return { authUrl, state };
}

// Step 2: Test Token Exchange (simulated with a test code)
async function testTokenExchange(testCode) {
  console.log('\n=== Testing Token Exchange ===');
  console.log('Test Code:', testCode.substring(0, 10) + '...');
  
  const tokenData = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code: testCode,
    redirect_uri: redirectUri
  };
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      const tokens = JSON.parse(responseText);
      console.log('✓ Token exchange successful');
      console.log('Access Token:', tokens.access_token ? 'present' : 'missing');
      console.log('Token Type:', tokens.token_type);
      console.log('Expires In:', tokens.expires_in);
      console.log('Scope:', tokens.scope);
      return tokens;
    } else {
      console.log('✗ Token exchange failed');
      return null;
    }
  } catch (error) {
    console.error('Token exchange error:', error.message);
    return null;
  }
}

// Step 3: Test User Info API (with valid token)
async function testUserInfo(accessToken) {
  console.log('\n=== Testing User Info API ===');
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const userInfo = await response.json();
      console.log('✓ User info retrieved successfully');
      console.log('User ID:', userInfo.id);
      console.log('Name:', userInfo.name);
      console.log('Email:', userInfo.email);
      return userInfo;
    } else {
      const errorText = await response.text();
      console.log('✗ User info failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('User info error:', error.message);
    return null;
  }
}

// Main test function
async function runOAuthTest() {
  console.log('GoHighLevel OAuth Integration Test');
  console.log('='.repeat(50));
  
  // Step 1: Generate authorization URL
  const { authUrl, state } = generateAuthUrl();
  
  console.log('\n📋 Manual Steps Required:');
  console.log('1. Copy the authorization URL above');
  console.log('2. Open it in a browser');
  console.log('3. Complete the OAuth flow');
  console.log('4. Copy the authorization code from the redirect');
  console.log('5. Run testTokenExchange(code) with the real code');
  
  // Step 2: Test with a placeholder code (will fail, but shows the flow)
  console.log('\n🧪 Testing token exchange with placeholder code...');
  const testCode = 'placeholder_code_for_testing';
  await testTokenExchange(testCode);
  
  console.log('\n=== Test Configuration Summary ===');
  console.log('Client ID:', clientId);
  console.log('Redirect URI:', redirectUri);
  console.log('Token Endpoint:', 'https://services.leadconnectorhq.com/oauth/token');
  console.log('User Info Endpoint:', 'https://services.leadconnectorhq.com/oauth/userinfo');
  console.log('Authorization Endpoint:', 'https://marketplace.gohighlevel.com/oauth/chooselocation');
}

// Export functions for manual testing
if (typeof module !== 'undefined') {
  module.exports = {
    generateAuthUrl,
    testTokenExchange,
    testUserInfo,
    runOAuthTest
  };
}

// Run the test
runOAuthTest().catch(console.error);