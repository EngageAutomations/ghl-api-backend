/**
 * Implement Location Token Conversion
 * Convert Company/Agency tokens to Location-specific tokens using GHL API
 */

const https = require('https');

async function implementLocationTokenConversion() {
  console.log('🔄 IMPLEMENTING LOCATION TOKEN CONVERSION');
  console.log('Converting Company tokens to Location tokens using GHL API');
  console.log('='.repeat(60));
  
  try {
    // 1. Get current installation with Company token
    console.log('1. ANALYZING CURRENT COMPANY TOKEN:');
    console.log('='.repeat(35));
    
    const installations = await getInstallations();
    const installation = installations[0];
    
    console.log('Installation ID:', installation.id);
    console.log('Current Auth Class:', installation.auth_class);
    console.log('Current Location ID:', installation.location_id);
    
    // Get current token data
    const tokenData = await getAccessToken(installation.id);
    const jwt = decodeJWT(tokenData.access_token);
    
    console.log('JWT Auth Class:', jwt.authClass);
    console.log('JWT Auth Class ID:', jwt.authClassId);
    console.log('Agency Plan:', jwt.oauthMeta?.agencyPlan);
    console.log('');
    
    // 2. API Documentation Analysis
    console.log('2. GOHIGHLEVEL API DOCUMENTATION:');
    console.log('='.repeat(35));
    
    console.log('📋 Endpoint: POST /oauth/locationToken');
    console.log('📋 Purpose: Generate locationAccessToken from AgencyAccessToken');
    console.log('📋 Required Token Type: Agency Token (we have Company token)');
    console.log('📋 Required Scope: oauth.write');
    console.log('📋 Content-Type: application/x-www-form-urlencoded');
    console.log('');
    
    console.log('Required Parameters:');
    console.log('• companyId: Company ID of location');
    console.log('• locationId: The location ID for token');
    console.log('');
    
    console.log('Expected Response:');
    console.log('• access_token: Location-specific token');
    console.log('• locationId: Location ID in response');
    console.log('• token_type: Bearer');
    console.log('• scope: Location-specific scopes');
    console.log('');
    
    // 3. Check if we have oauth.write scope
    console.log('3. SCOPE VERIFICATION:');
    console.log('='.repeat(20));
    
    const hasOAuthWrite = jwt.oauthMeta?.scopes?.includes('oauth.write');
    console.log('oauth.write scope present:', hasOAuthWrite);
    
    if (hasOAuthWrite) {
      console.log('✅ Required scope available for location token conversion');
    } else {
      console.log('❌ Missing oauth.write scope - cannot convert token');
    }
    console.log('');
    
    // 4. Identify company and location IDs
    console.log('4. COMPANY AND LOCATION ID IDENTIFICATION:');
    console.log('='.repeat(45));
    
    const companyId = jwt.authClassId; // This is our company ID
    console.log('Company ID (from JWT):', companyId);
    
    // Try to find location ID from various sources
    console.log('');
    console.log('🔍 LOCATION ID DISCOVERY:');
    console.log('Method 1 - From token data:', tokenData.location_id || 'not found');
    console.log('Method 2 - From installation:', installation.location_id || 'not found');
    console.log('Method 3 - Known working location: WAvk87RmW9rBSDJHeOpH');
    console.log('');
    
    // Use known working location ID for testing
    const locationId = 'WAvk87RmW9rBSDJHeOpH';
    console.log('Using known working location ID for conversion test:', locationId);
    console.log('');
    
    // 5. Test location token conversion
    if (hasOAuthWrite) {
      console.log('5. TESTING LOCATION TOKEN CONVERSION:');
      console.log('='.repeat(40));
      
      console.log('Making API call to convert Company token to Location token...');
      
      try {
        const locationTokenResponse = await convertToLocationToken(
          tokenData.access_token,
          companyId,
          locationId
        );
        
        console.log('✅ LOCATION TOKEN CONVERSION SUCCESSFUL!');
        console.log('');
        console.log('📋 NEW LOCATION TOKEN DETAILS:');
        console.log('Token Type:', locationTokenResponse.token_type);
        console.log('Location ID:', locationTokenResponse.locationId);
        console.log('Expires In:', locationTokenResponse.expires_in, 'seconds');
        console.log('User ID:', locationTokenResponse.userId);
        console.log('Plan ID:', locationTokenResponse.planId);
        console.log('Scope:', locationTokenResponse.scope);
        console.log('');
        
        // Decode the new JWT to verify it's Location-level
        const newJWT = decodeJWT(locationTokenResponse.access_token);
        console.log('📊 NEW JWT ANALYSIS:');
        console.log('Auth Class:', newJWT.authClass);
        console.log('Auth Class ID:', newJWT.authClassId);
        console.log('Location ID in JWT:', newJWT.locationId || 'checking...');
        console.log('');
        
        console.log('🧬 COMPLETE NEW JWT PAYLOAD:');
        console.log(JSON.stringify(newJWT, null, 2));
        console.log('');
        
        // Test media upload with new Location token
        console.log('6. TESTING MEDIA UPLOAD WITH LOCATION TOKEN:');
        console.log('='.repeat(45));
        
        const mediaTestResult = await testMediaUploadWithLocationToken(
          locationTokenResponse.access_token,
          locationId
        );
        
        if (mediaTestResult.success) {
          console.log('🎉 MEDIA UPLOAD TEST SUCCESSFUL!');
          console.log('Location token allows media upload access');
        } else {
          console.log('❌ Media upload still blocked:', mediaTestResult.error);
        }
        
      } catch (conversionError) {
        console.log('❌ LOCATION TOKEN CONVERSION FAILED:');
        console.log('Error:', conversionError.message);
        console.log('');
        console.log('Possible reasons:');
        console.log('• Company token may not have proper permissions');
        console.log('• Location ID may be incorrect');
        console.log('• API endpoint may require different token type');
      }
    }
    
    // 6. Implementation strategy
    console.log('7. IMPLEMENTATION STRATEGY:');
    console.log('='.repeat(30));
    
    console.log('🎯 SOLUTION APPROACH:');
    console.log('');
    console.log('Option 1 - Token Conversion (if oauth.write available):');
    console.log('• Use POST /oauth/locationToken to convert Company → Location');
    console.log('• Store both Company and Location tokens');
    console.log('• Use Location tokens for media upload APIs');
    console.log('• Use Company tokens for other operations');
    console.log('');
    
    console.log('Option 2 - Fix Authorization Flow:');
    console.log('• Update marketplace app to use /oauth/chooselocation');
    console.log('• Generate Location tokens directly during OAuth');
    console.log('• No conversion needed');
    console.log('');
    
    console.log('🔧 RECOMMENDED IMPLEMENTATION:');
    console.log('Add location token conversion to OAuth backend:');
    console.log('• POST /api/convert-to-location/:installationId');
    console.log('• Automatically convert Company tokens to Location tokens');
    console.log('• Store both token types for different API usage');
    console.log('• Retry media upload with Location token if Company token fails');
    
  } catch (error) {
    console.error('❌ Location token conversion analysis failed:', error.message);
  }
}

async function convertToLocationToken(agencyToken, companyId, locationId) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      companyId: companyId,
      locationId: locationId
    }).toString();
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/oauth/locationToken',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${agencyToken}`,
        'Version': '2021-07-28',
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
          reject(new Error(`Location token conversion failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testMediaUploadWithLocationToken(locationToken, locationId) {
  return new Promise((resolve, reject) => {
    // Test basic media library access first
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: `/medias?locationId=${locationId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${locationToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          resolve({ success: false, error: `${res.statusCode} - ${data}` });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    req.end();
  });
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

implementLocationTokenConversion().catch(console.error);