/**
 * Decode OAuth Token to Find Correct Location ID
 * Check what location ID is actually in the JWT payload
 */

function decodeJWTPayload(token) {
  try {
    // Split JWT token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error.message);
    return null;
  }
}

async function findCorrectLocationId() {
  console.log('🔍 FINDING CORRECT LOCATION ID FROM OAUTH TOKEN');
  console.log('='.repeat(60));
  
  try {
    // Get the OAuth token
    const response = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939');
    const tokenData = await response.json();
    
    console.log('📄 OAuth Response:');
    console.log(`Installation ID: ${tokenData.installation_id}`);
    console.log(`Location ID (from response): ${tokenData.location_id}`);
    console.log(`Token Status: ${tokenData.status}`);
    
    if (tokenData.access_token) {
      console.log('\n🔓 DECODING JWT TOKEN PAYLOAD:');
      const payload = decodeJWTPayload(tokenData.access_token);
      
      if (payload) {
        console.log('Auth Class:', payload.authClass);
        console.log('Auth Class ID:', payload.authClassId);
        console.log('Primary Auth Class ID:', payload.primaryAuthClassId);
        console.log('Source:', payload.source);
        console.log('Channel:', payload.channel);
        
        if (payload.oauthMeta && payload.oauthMeta.scopes) {
          console.log('OAuth Scopes:', payload.oauthMeta.scopes);
        }
        
        console.log('\n📍 LOCATION ID ANALYSIS:');
        console.log(`Auth Class ID: ${payload.authClassId}`);
        console.log(`Primary Auth Class ID: ${payload.primaryAuthClassId}`);
        console.log(`Response Location ID: ${tokenData.location_id}`);
        
        // Check if they match
        if (payload.authClassId === tokenData.location_id) {
          console.log('✅ Location IDs MATCH - Using correct location ID');
        } else {
          console.log('❌ Location IDs DO NOT MATCH');
          console.log(`JWT says: ${payload.authClassId}`);
          console.log(`Response says: ${tokenData.location_id}`);
        }
        
        console.log('\n🎯 CORRECT LOCATION ID TO USE:');
        console.log(`Location ID: ${payload.authClassId}`);
        
        return payload.authClassId;
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the location ID finder
findCorrectLocationId().catch(console.error);