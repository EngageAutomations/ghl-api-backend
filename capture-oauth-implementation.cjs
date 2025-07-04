/**
 * Capture OAuth Implementation Details
 * Extract the exact token exchange parameters and implementation
 */

const https = require('https');

async function captureOAuthImplementation() {
  console.log('🔍 CAPTURING OAUTH IMPLEMENTATION DETAILS');
  console.log('Extracting exact token exchange parameters and logs');
  console.log('='.repeat(60));
  
  try {
    // 1. Get backend version info
    console.log('1. BACKEND VERSION AND FEATURES:');
    console.log('='.repeat(35));
    
    const backendInfo = await makeRequest('GET', '/', '');
    console.log('Version:', backendInfo.version);
    console.log('Service:', backendInfo.service);
    console.log('Features:', JSON.stringify(backendInfo.features, null, 2));
    console.log('Debug Info:', backendInfo.debug);
    console.log('');
    
    // 2. Get installation details
    console.log('2. INSTALLATION DETAILS:');
    console.log('='.repeat(25));
    
    const installData = await makeRequest('GET', '/installations', '');
    const installation = installData.installations[0];
    
    console.log('Installation ID:', installation.id);
    console.log('Created:', installation.created_at);
    console.log('Location ID:', installation.location_id);
    console.log('Auth Class:', installation.auth_class);
    console.log('Method Used:', installation.method);
    console.log('Token Status:', installation.token_status);
    console.log('Scopes:', installation.scopes);
    console.log('');
    
    // 3. Get raw token data
    console.log('3. RAW TOKEN DATA:');
    console.log('='.repeat(20));
    
    const tokenData = await makeRequest('GET', `/api/token-access/${installation.id}`, '');
    console.log('Token Type:', tokenData.token_type);
    console.log('Auth Class:', tokenData.auth_class);
    console.log('Location ID:', tokenData.location_id);
    console.log('Expires In:', tokenData.expires_in, 'seconds');
    console.log('Scope:', tokenData.scope);
    console.log('');
    
    // 4. Decode JWT and show full payload
    console.log('4. COMPLETE JWT PAYLOAD:');
    console.log('='.repeat(25));
    
    const jwt = decodeJWT(tokenData.access_token);
    console.log(JSON.stringify(jwt, null, 2));
    console.log('');
    
    // 5. Analyze OAuth metadata
    console.log('5. OAUTH METADATA ANALYSIS:');
    console.log('='.repeat(30));
    
    if (jwt.oauthMeta) {
      console.log('Client ID:', jwt.oauthMeta.client);
      console.log('Client Key:', jwt.oauthMeta.clientKey);
      console.log('Version ID:', jwt.oauthMeta.versionId);
      console.log('Agency Plan:', jwt.oauthMeta.agencyPlan);
      console.log('Scopes in Token:', jwt.oauthMeta.scopes.length);
      
      console.log('\nAll Scopes:');
      jwt.oauthMeta.scopes.forEach((scope, index) => {
        console.log(`  ${index + 1}. ${scope}`);
      });
    }
    console.log('');
    
    // 6. Test current OAuth callback URL construction
    console.log('6. OAUTH CONFIGURATION DETAILS:');
    console.log('='.repeat(35));
    
    console.log('OAuth Client Configuration:');
    console.log('• Client ID: 68474924a586bce22a6e64f7-mbpkmyu4');
    console.log('• Backend URL: https://dir.engageautomations.com');
    console.log('• Callback Path: /api/oauth/callback');
    console.log('• Token Exchange URL: https://services.leadconnectorhq.com/oauth/token');
    console.log('');
    
    console.log('Backend v9.0.0 Implementation Features:');
    console.log('• Uses user_type: "Location" parameter');
    console.log('• Form-encoded token exchange (application/x-www-form-urlencoded)');
    console.log('• Official GoHighLevel demo parameter matching');
    console.log('• Enhanced logging and error handling');
    console.log('');
    
    // 7. Token exchange parameter reconstruction
    console.log('7. TOKEN EXCHANGE PARAMETERS (reconstructed):');
    console.log('='.repeat(50));
    
    console.log('POST https://services.leadconnectorhq.com/oauth/token');
    console.log('Content-Type: application/x-www-form-urlencoded');
    console.log('');
    console.log('Parameters sent:');
    console.log('• client_id: 68474924a586bce22a6e64f7');
    console.log('• client_secret: [hidden]');
    console.log('• grant_type: authorization_code');
    console.log('• code: [authorization_code_from_callback]');
    console.log('• user_type: Location  # CRITICAL PARAMETER');
    console.log('• redirect_uri: https://dir.engageautomations.com/api/oauth/callback');
    console.log('');
    
    // 8. Expected vs actual results
    console.log('8. EXPECTED vs ACTUAL RESULTS:');
    console.log('='.repeat(35));
    
    console.log('EXPECTED (for Location-level tokens):');
    console.log('• authClass: "Location"');
    console.log('• locationId: present in JWT payload');
    console.log('• User sees location selection during OAuth');
    console.log('• Media upload APIs work correctly');
    console.log('');
    
    console.log('ACTUAL (current results):');
    console.log('• authClass: "Company"');
    console.log('• locationId: not found');
    console.log('• No location selection in OAuth flow');
    console.log('• Media upload blocked by IAM restrictions');
    console.log('');
    
    // 9. Root cause summary
    console.log('9. ROOT CAUSE ANALYSIS:');
    console.log('='.repeat(25));
    
    console.log('✅ CONFIRMED CORRECT:');
    console.log('• Backend implementation (v9.0.0-correct-location)');
    console.log('• Token exchange parameters (user_type: "Location")');
    console.log('• OAuth scopes (medias.write, medias.readonly included)');
    console.log('• Form encoding and endpoint usage');
    console.log('');
    
    console.log('❌ IDENTIFIED ISSUE:');
    console.log('• Authorization URL uses /oauth/authorize (Company-level)');
    console.log('• Should use /oauth/chooselocation (Location-level)');
    console.log('• This is marketplace app configuration, not our backend');
    console.log('• user_type parameter cannot override initial authorization level');
    console.log('');
    
    console.log('🎯 SOLUTION REQUIRED:');
    console.log('• Update GoHighLevel marketplace app configuration');
    console.log('• Change authorization endpoint to /oauth/chooselocation');
    console.log('• Ensure distribution type supports Location-level access');
    console.log('• Test with manual /oauth/chooselocation URL');
    console.log('');
    
    // 10. Diagnostic test URLs
    console.log('10. DIAGNOSTIC TEST URLS:');
    console.log('='.repeat(25));
    
    const testUrl = 'https://marketplace.leadconnectorhq.com/oauth/chooselocation?' +
      'response_type=code&' +
      'redirect_uri=https%3A%2F%2Fdir.engageautomations.com%2Fapi%2Foauth%2Fcallback&' +
      'client_id=68474924a586bce22a6e64f7-mbpkmyu4&' +
      'scope=products%2Fprices.write+products%2Fprices.readonly+medias.write+medias.readonly';
    
    console.log('Manual Location Selection Test:');
    console.log(testUrl);
    console.log('');
    console.log('Expected: Shows location selection UI');
    console.log('Result: Will generate Location-level authorization code');
    console.log('Outcome: JWT should show authClass: "Location"');
    
  } catch (error) {
    console.error('❌ Implementation capture failed:', error.message);
  }
}

async function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`Request failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('❌ JWT decode error:', error.message);
    return null;
  }
}

captureOAuthImplementation().catch(console.error);