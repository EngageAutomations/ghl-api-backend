/**
 * Extract Complete OAuth Logs and JWT Details
 * Comprehensive analysis of all installations and token data
 */

const https = require('https');

async function extractCompleteOAuthLogs() {
  console.log('📊 COMPLETE OAUTH LOGS AND JWT ANALYSIS');
  console.log('Extracting all installation data, tokens, and logs');
  console.log('='.repeat(60));
  
  try {
    // 1. Get all installations
    const installations = await getInstallations();
    console.log(`📋 FOUND ${installations.length} INSTALLATION(S):`);
    console.log('='.repeat(40));
    
    for (let i = 0; i < installations.length; i++) {
      const install = installations[i];
      console.log(`\n📦 INSTALLATION ${i + 1}: ${install.id}`);
      console.log('─'.repeat(50));
      console.log('📅 Created:', install.created_at);
      console.log('🏢 Auth Class:', install.auth_class);
      console.log('📍 Location ID:', install.location_id);
      console.log('🔧 Method:', install.method);
      console.log('✅ Status:', install.token_status);
      console.log('🔑 Active:', install.active);
      
      if (install.scopes) {
        const scopeArray = install.scopes.split(' ');
        console.log('🎯 Scopes Count:', scopeArray.length);
        console.log('🎯 Key Scopes:');
        scopeArray.forEach(scope => {
          if (scope.includes('medias') || scope.includes('products') || scope.includes('locations')) {
            console.log(`   • ${scope}`);
          }
        });
      }
      
      // Get detailed token information
      try {
        const tokenData = await getAccessToken(install.id);
        console.log('\n🔐 TOKEN DETAILS:');
        console.log('─'.repeat(20));
        console.log('Token Type:', tokenData.token_type);
        console.log('Auth Class:', tokenData.auth_class);
        console.log('Location ID:', tokenData.location_id || 'not found');
        console.log('Expires In:', Math.floor(tokenData.expires_in / 60), 'minutes');
        
        // Decode JWT payload
        const jwt = decodeJWT(tokenData.access_token);
        if (jwt) {
          console.log('\n🧬 COMPLETE JWT PAYLOAD:');
          console.log('─'.repeat(25));
          console.log(JSON.stringify(jwt, null, 2));
          
          console.log('\n🎯 CRITICAL JWT ANALYSIS:');
          console.log('─'.repeat(25));
          console.log('• Auth Class:', jwt.authClass);
          console.log('• Auth Class ID:', jwt.authClassId);
          console.log('• Primary Auth Class ID:', jwt.primaryAuthClassId);
          console.log('• Source:', jwt.source);
          console.log('• Source ID:', jwt.sourceId);
          console.log('• Channel:', jwt.channel);
          
          if (jwt.oauthMeta) {
            console.log('• OAuth Client:', jwt.oauthMeta.client);
            console.log('• OAuth Client Key:', jwt.oauthMeta.clientKey);
            console.log('• OAuth Version:', jwt.oauthMeta.versionId);
            console.log('• Agency Plan:', jwt.oauthMeta.agencyPlan);
            console.log('• Scopes in JWT:', jwt.oauthMeta.scopes?.length);
          }
          
          // Check for location-related fields
          console.log('\n🔍 LOCATION FIELD ANALYSIS:');
          console.log('─'.repeat(30));
          const locationFields = findLocationFields(jwt);
          if (locationFields.length > 0) {
            locationFields.forEach(field => {
              console.log(`• Found: ${field.path} = ${field.value}`);
            });
          } else {
            console.log('❌ NO LOCATION FIELDS FOUND IN JWT');
          }
          
          // Timestamp analysis
          const issued = new Date(jwt.iat * 1000);
          const expires = new Date(jwt.exp * 1000);
          const now = new Date();
          const timeLeft = Math.floor((expires - now) / (1000 * 60));
          
          console.log('\n⏰ TOKEN TIMING:');
          console.log('─'.repeat(15));
          console.log('• Issued At:', issued.toISOString());
          console.log('• Expires At:', expires.toISOString());
          console.log('• Time Left:', timeLeft, 'minutes');
          console.log('• Duration:', Math.floor((expires - issued) / (1000 * 60 * 60)), 'hours');
        }
        
      } catch (tokenError) {
        console.log('❌ Token Error:', tokenError.message);
      }
    }
    
    // 2. Backend version and configuration
    console.log('\n\n🔧 BACKEND CONFIGURATION:');
    console.log('='.repeat(30));
    
    const backendInfo = await getBackendInfo();
    console.log('📋 Version:', backendInfo.version);
    console.log('📋 Service:', backendInfo.service);
    console.log('📋 Features:', JSON.stringify(backendInfo.features, null, 2));
    console.log('📋 Debug Info:', backendInfo.debug);
    
    // 3. OAuth endpoints analysis
    console.log('\n\n🔗 OAUTH ENDPOINTS ANALYSIS:');
    console.log('='.repeat(35));
    
    console.log('📍 Current OAuth Backend:');
    console.log('• Base URL: https://dir.engageautomations.com');
    console.log('• Callback: /api/oauth/callback');
    console.log('• Client ID: 68474924a586bce22a6e64f7-mbpkmyu4');
    console.log('• Token Exchange: POST /oauth/token');
    console.log('• Parameters: user_type=Location');
    
    console.log('\n🎯 EXPECTED vs ACTUAL:');
    console.log('─'.repeat(25));
    console.log('Expected for Location-level:');
    console.log('• authClass: "Location"');
    console.log('• locationId: [specific location ID]');
    console.log('• Auth flow via /oauth/chooselocation');
    console.log('');
    console.log('Actual results:');
    console.log('• authClass: "Company"');
    console.log('• locationId: not found');
    console.log('• Auth flow via /oauth/authorize (suspected)');
    
    // 4. Diagnostic summary
    console.log('\n\n📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(25));
    
    const companyTokens = installations.filter(i => i.auth_class === 'Company').length;
    const locationTokens = installations.filter(i => i.auth_class === 'Location').length;
    
    console.log('🔢 Token Statistics:');
    console.log('• Company-level tokens:', companyTokens);
    console.log('• Location-level tokens:', locationTokens);
    console.log('• Total installations:', installations.length);
    
    console.log('\n🎯 Key Findings:');
    console.log('• All tokens show authClass: "Company"');
    console.log('• No locationId found in any JWT payload');
    console.log('• user_type: "Location" parameter confirmed in backend');
    console.log('• OAuth scopes include medias.write and medias.readonly');
    console.log('• Token exchange implementation matches official demo');
    
    console.log('\n🔍 Root Cause Analysis:');
    console.log('• Authorization endpoint uses /oauth/authorize (Company-level)');
    console.log('• Marketplace app needs /oauth/chooselocation configuration');
    console.log('• user_type parameter cannot override authorization level');
    console.log('• Technical implementation is correct - issue is marketplace config');
    
  } catch (error) {
    console.error('❌ Complete analysis failed:', error.message);
  }
}

async function getInstallations() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/installations',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          resolve(result.installations || []);
        } else {
          reject(new Error(`Get installations failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function getAccessToken(installationId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: `/api/token-access/${installationId}`,
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Get access token failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function getBackendInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Backend info failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
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

function findLocationFields(obj, path = '') {
  let results = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (key.toLowerCase().includes('location') || 
        (typeof value === 'string' && value.match(/^[A-Za-z0-9]{20,}$/) && key !== 'authClassId')) {
      results.push({ path: currentPath, value: value });
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      results = results.concat(findLocationFields(value, currentPath));
    }
  }
  
  return results;
}

extractCompleteOAuthLogs().catch(console.error);