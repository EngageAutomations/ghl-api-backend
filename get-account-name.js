/**
 * Get Account Name from OAuth Token Data
 * Decode the JWT token to find account/company name information
 */

function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error.message);
    return null;
  }
}

async function getAccountName() {
  console.log('🔍 FINDING ACCOUNT NAME FOR LOCATION ID');
  console.log('Location ID: SGtYHkPbOl2WJV08GOpg');
  console.log('='.repeat(60));
  
  try {
    // Get the OAuth token
    const response = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939');
    const tokenData = await response.json();
    
    if (tokenData.access_token) {
      console.log('📄 DECODING JWT TOKEN FOR ACCOUNT INFORMATION:');
      const payload = decodeJWTPayload(tokenData.access_token);
      
      if (payload) {
        console.log('\n🏢 ACCOUNT DETAILS:');
        console.log(`Auth Class: ${payload.authClass}`);
        console.log(`Auth Class ID: ${payload.authClassId}`);
        console.log(`Primary Auth Class ID: ${payload.primaryAuthClassId}`);
        console.log(`Source: ${payload.source}`);
        console.log(`Source ID: ${payload.sourceId}`);
        console.log(`Channel: ${payload.channel}`);
        
        if (payload.oauthMeta) {
          console.log('\n🔑 OAUTH METADATA:');
          console.log(`Client: ${payload.oauthMeta.client}`);
          console.log(`Client Key: ${payload.oauthMeta.clientKey}`);
          console.log(`Version ID: ${payload.oauthMeta.versionId}`);
          console.log(`Agency Plan: ${payload.oauthMeta.agencyPlan}`);
          
          if (payload.oauthMeta.scopes) {
            console.log('\n📋 SCOPES:');
            payload.oauthMeta.scopes.forEach(scope => console.log(`• ${scope}`));
          }
        }
        
        console.log('\n⏰ TOKEN TIMING:');
        console.log(`Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
        console.log(`Expires At: ${new Date(payload.exp * 1000).toISOString()}`);
        
        // Try to get location info via API with different approaches
        console.log('\n🔍 ATTEMPTING TO FIND ACCOUNT NAME VIA API:');
        await tryGetAccountInfo(tokenData.access_token, payload.authClassId);
        
      } else {
        console.log('❌ Failed to decode JWT token');
      }
    } else {
      console.log('❌ No access token found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function tryGetAccountInfo(accessToken, locationId) {
  // Try different API endpoints to get account/location name
  const endpoints = [
    { url: `https://services.leadconnectorhq.com/locations/${locationId}`, name: 'Location by ID' },
    { url: 'https://services.leadconnectorhq.com/locations/', name: 'All Locations' },
    { url: 'https://services.leadconnectorhq.com/companies/', name: 'Companies' },
    { url: 'https://services.leadconnectorhq.com/users/me', name: 'Current User' },
    { url: 'https://services.leadconnectorhq.com/oauth/me', name: 'OAuth Me' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.name}: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! Response data:');
        console.log(JSON.stringify(data, null, 2));
        
        // Look for name fields
        if (data.name) {
          console.log(`🏢 ACCOUNT NAME: ${data.name}`);
        }
        if (data.companyName) {
          console.log(`🏢 COMPANY NAME: ${data.companyName}`);
        }
        if (data.businessName) {
          console.log(`🏢 BUSINESS NAME: ${data.businessName}`);
        }
        if (data.locations && data.locations.length > 0) {
          console.log('📍 LOCATIONS FOUND:');
          data.locations.forEach((loc, index) => {
            console.log(`${index + 1}. ID: ${loc.id}, Name: ${loc.name || 'Unnamed'}`);
          });
        }
        
      } else if (response.status === 400) {
        console.log(`❌ Bad Request: ${data.message || 'Unknown error'}`);
      } else if (response.status === 403) {
        console.log(`❌ Forbidden: ${data.message || 'Access denied'}`);
      } else if (response.status === 404) {
        console.log(`❌ Not Found: ${data.message || 'Resource not found'}`);
      } else {
        console.log(`⚠️ Status ${response.status}: ${data.message || 'Unknown'}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
}

// Run the account name finder
getAccountName().catch(console.error);