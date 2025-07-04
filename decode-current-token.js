/**
 * Decode Current Token to Understand Why We're Getting Company Level
 */

import https from 'https';

async function decodeCurrentToken() {
  console.log('🔍 ANALYZING CURRENT TOKEN FOR LOCATION INFO');
  console.log('='.repeat(50));
  
  try {
    // Get current installation token
    console.log('1. Getting access token...');
    const tokenData = await getAccessToken('install_1751605944223');
    
    if (!tokenData.access_token) {
      console.log('❌ No access token available');
      return;
    }
    
    console.log('✅ Access token retrieved');
    
    // Decode JWT payload
    console.log('');
    console.log('2. Decoding JWT payload...');
    const payload = decodeJWTPayload(tokenData.access_token);
    
    if (payload) {
      console.log('📄 Full JWT payload:');
      console.log(JSON.stringify(payload, null, 2));
      
      console.log('');
      console.log('🔍 Key fields analysis:');
      console.log('• authClass:', payload.authClass);
      console.log('• locationId:', payload.locationId);
      console.log('• companyId:', payload.companyId);
      console.log('• userId:', payload.userId);
      console.log('• scope:', payload.scope);
      console.log('• iss (issuer):', payload.iss);
      console.log('• aud (audience):', payload.aud);
      
      // Check if there's a location ID we can use
      if (payload.locationId) {
        console.log('');
        console.log('✅ Location ID found in token:', payload.locationId);
        console.log('This suggests the token is associated with a specific location');
        console.log('But authClass is still Company - app may be configured for Company-level access');
      } else {
        console.log('');
        console.log('⚠️  No locationId in token payload');
        console.log('This suggests truly Company-level authentication');
      }
      
      // Check scopes
      if (payload.scope && payload.scope.includes('medias.write')) {
        console.log('');
        console.log('✅ medias.write scope is present in token');
        console.log('Scope is correct, but authClass blocks access');
      }
      
    } else {
      console.log('❌ Failed to decode JWT payload');
    }
    
    console.log('');
    console.log('🎯 CONCLUSION:');
    console.log('The app successfully requests medias.write scope but GoHighLevel');
    console.log('issues Company-level tokens. This suggests the app configuration');
    console.log('in GoHighLevel marketplace may need to be updated to request');
    console.log('Location-level access by default.');
    
  } catch (error) {
    console.error('❌ Token analysis failed:', error.message);
  }
}

async function getAccessToken(installationId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: `/api/token-access/${installationId}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Token access failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('❌ Error decoding JWT payload:', error);
    return null;
  }
}

decodeCurrentToken().catch(console.error);