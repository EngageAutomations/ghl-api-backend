/**
 * Decode JWT Access Token
 * Check authClass field to determine if we have Location or Company level access
 */

const https = require('https');

async function decodeJWTToken() {
  console.log('🔍 DECODING JWT ACCESS TOKEN');
  console.log('Checking authClass field to determine token type');
  console.log('='.repeat(50));
  
  try {
    // 1. Get latest installation
    console.log('1. Getting latest installation...');
    const installations = await getInstallations();
    
    if (installations.length === 0) {
      console.log('❌ No installations found');
      return;
    }
    
    const latestInstall = installations[installations.length - 1];
    console.log('📍 Installation ID:', latestInstall.id);
    console.log('');
    
    // 2. Get access token
    console.log('2. Getting access token...');
    const tokenData = await getAccessToken(latestInstall.id);
    console.log('🔐 Token retrieved successfully');
    console.log('');
    
    // 3. Decode JWT token
    console.log('3. Decoding JWT token...');
    const accessToken = tokenData.access_token;
    const decoded = decodeJWT(accessToken);
    
    if (!decoded) {
      console.log('❌ Failed to decode JWT token');
      return;
    }
    
    console.log('📋 JWT TOKEN ANALYSIS:');
    console.log('='.repeat(30));
    
    // Core fields
    console.log('🔐 Auth Class:', decoded.authClass || 'not found');
    console.log('📍 Location ID:', decoded.locationId || decoded.location_id || 'not found');
    console.log('🏢 Company ID:', decoded.companyId || decoded.company_id || 'not found');
    console.log('👤 User Type:', decoded.userType || decoded.user_type || 'not found');
    console.log('');
    
    // Additional analysis
    console.log('📋 ADDITIONAL TOKEN INFO:');
    console.log('🆔 Subject (sub):', decoded.sub || 'not found');
    console.log('📧 Email:', decoded.email || 'not found');
    console.log('👤 User ID:', decoded.userId || decoded.user_id || 'not found');
    console.log('⏰ Issued At:', decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'not found');
    console.log('⏰ Expires At:', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'not found');
    console.log('');
    
    // Scopes analysis
    if (decoded.scopes || decoded.scope) {
      const scopes = decoded.scopes || decoded.scope;
      console.log('📋 SCOPES ANALYSIS:');
      console.log('📝 Total Scopes:', Array.isArray(scopes) ? scopes.length : 'not array');
      console.log('📤 Media Write:', scopes?.includes ? scopes.includes('medias.write') : 'unknown');
      console.log('📥 Media Read:', scopes?.includes ? scopes.includes('medias.readonly') : 'unknown');
      console.log('🛍️ Products Write:', scopes?.includes ? scopes.includes('products.write') : 'unknown');
      console.log('');
    }
    
    // Results interpretation
    console.log('🎯 RESULTS INTERPRETATION:');
    console.log('='.repeat(30));
    
    const authClass = decoded.authClass;
    if (authClass === 'Location') {
      console.log('✅ SUCCESS: Location-level token detected!');
      console.log('🎉 This token should have media upload access');
      console.log('💡 Media upload APIs should work with this token');
    } else if (authClass === 'Company') {
      console.log('❌ ISSUE: Company-level token detected');
      console.log('🚫 This token will be blocked from media upload APIs');
      console.log('💡 Need Location-level authorization flow to fix this');
    } else {
      console.log('⚠️  UNKNOWN: Auth class not found or unrecognized');
      console.log('🔍 Unusual token structure - needs investigation');
    }
    console.log('');
    
    // Location ID analysis
    const locationId = decoded.locationId || decoded.location_id;
    if (locationId) {
      console.log('📍 LOCATION ID FOUND:', locationId);
      console.log('✅ Token is properly scoped to specific location');
    } else {
      console.log('❌ NO LOCATION ID FOUND');
      console.log('⚠️  Token may not be location-specific');
    }
    console.log('');
    
    // Full payload for debugging
    console.log('🔍 FULL JWT PAYLOAD (for debugging):');
    console.log('='.repeat(40));
    console.log(JSON.stringify(decoded, null, 2));
    
  } catch (error) {
    console.error('❌ Token decoding failed:', error.message);
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

function decodeJWT(token) {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format - should have 3 parts');
      return null;
    }
    
    // The payload is the second part (index 1)
    const payload = parts[1];
    
    // Add padding if necessary for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode from base64
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    
    // Parse as JSON
    const parsedPayload = JSON.parse(decodedPayload);
    
    return parsedPayload;
    
  } catch (error) {
    console.error('❌ Error decoding JWT:', error.message);
    return null;
  }
}

decodeJWTToken().catch(console.error);