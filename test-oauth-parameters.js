/**
 * Test Different OAuth Parameters for GoHighLevel
 * Find the correct way to get location-level tokens
 */

import axios from 'axios';

async function testOAuthParameters() {
  console.log('🔍 TESTING GOHIGHLEVEL OAUTH PARAMETERS');
  console.log('Finding the correct way to get location-level authentication');
  console.log('='.repeat(60));
  
  const OAUTH_CONFIG = {
    clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
    clientSecret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
    redirectUri: 'https://dir.engageautomations.com/api/oauth/callback',
    tokenUrl: 'https://services.leadconnectorhq.com/oauth/token'
  };
  
  // Test authorization code (this will fail but shows us valid parameters)
  const testCode = '36f85ae4c9ed797385c3ca0db32ebc27fd8a95c9';
  
  const testCases = [
    {
      name: 'Standard OAuth (no user_type)',
      params: {
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code: testCode,
        redirect_uri: OAUTH_CONFIG.redirectUri
      }
    },
    {
      name: 'OAuth with auth_type=location',
      params: {
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code: testCode,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        auth_type: 'location'
      }
    },
    {
      name: 'OAuth with scope parameter',
      params: {
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code: testCode,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        scope: 'medias.write medias.readonly locations.readonly'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log('Parameters:', Object.keys(testCase.params).join(', '));
    
    try {
      const tokenData = new URLSearchParams(testCase.params);
      
      const response = await axios.post(OAUTH_CONFIG.tokenUrl, tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`Response: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS - Valid parameter combination');
        console.log('Token received:', !!response.data.access_token);
        
        // Decode JWT to check auth class
        if (response.data.access_token) {
          try {
            const payload = JSON.parse(Buffer.from(response.data.access_token.split('.')[1], 'base64').toString());
            console.log('Auth Class:', payload.authClass);
            console.log('Location ID:', payload.locationId || 'not found');
          } catch (jwtError) {
            console.log('JWT decode failed');
          }
        }
      } else if (response.status === 422) {
        console.log('❌ VALIDATION ERROR');
        console.log('Details:', response.data.message || response.data.error);
        
        if (response.data.message && Array.isArray(response.data.message)) {
          response.data.message.forEach(msg => {
            if (msg.includes('enum')) {
              console.log('🔍 Invalid enum value detected:', msg);
            }
          });
        }
      } else {
        console.log('❌ ERROR:', response.status);
        console.log('Details:', response.data.error || response.data.message);
      }
      
    } catch (error) {
      console.log('❌ REQUEST FAILED:', error.message);
    }
  }
  
  console.log('\n📊 ANALYSIS:');
  console.log('The OAuth API appears to reject user_type parameter entirely');
  console.log('GoHighLevel may determine auth level based on:');
  console.log('• App configuration in marketplace settings');
  console.log('• OAuth scope permissions');
  console.log('• Location selection during authorization flow');
  console.log('');
  console.log('💡 NEXT STEPS:');
  console.log('1. Check if app needs to be configured for location-level access');
  console.log('2. Use standard OAuth flow without user_type parameter');
  console.log('3. Test if chooselocation endpoint affects auth level');
}

testOAuthParameters().catch(console.error);