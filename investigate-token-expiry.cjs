const axios = require('axios');

async function investigateTokenExpiry() {
  try {
    console.log('=== Investigating Token Expiry Timeline ===');
    
    // Get current installation data
    const response = await axios.get('https://dir.engageautomations.com/installations');
    const installation = response.data.installations[0]; // Latest installation
    
    if (!installation) {
      console.log('❌ No installation found');
      return;
    }
    
    console.log('\n--- Installation Timeline Analysis ---');
    console.log('Installation ID:', installation.id);
    console.log('Created At:', installation.createdAt);
    console.log('Expires At:', installation.expiresAt);
    console.log('Current Time:', new Date().toISOString());
    
    // Calculate actual token lifetime
    const createdTime = new Date(installation.createdAt);
    const expiresTime = new Date(installation.expiresAt);
    const currentTime = new Date();
    
    const totalLifetimeMs = expiresTime - createdTime;
    const totalLifetimeHours = totalLifetimeMs / (1000 * 60 * 60);
    
    const timeElapsedMs = currentTime - createdTime;
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
    
    const timeRemainingMs = expiresTime - currentTime;
    const timeRemainingHours = timeRemainingMs / (1000 * 60 * 60);
    
    console.log('\n--- Token Lifetime Analysis ---');
    console.log(`Total Designed Lifetime: ${totalLifetimeHours.toFixed(2)} hours`);
    console.log(`Time Since Creation: ${timeElapsedHours.toFixed(2)} hours`);
    console.log(`Time Remaining: ${timeRemainingHours.toFixed(2)} hours`);
    console.log(`Expected Expiry: ${totalLifetimeHours === 24 ? '✅ Standard 24h' : '⚠️ Non-standard: ' + totalLifetimeHours + 'h'}`);
    
    // Check if token is actually working
    console.log('\n--- Token Functionality Test ---');
    
    try {
      const locationTest = await axios.get(`https://services.leadconnectorhq.com/locations/${installation.locationId}`, {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28'
        }
      });
      
      console.log('✅ Token actually works for location API!');
      console.log('Location Name:', locationTest.data.name);
      
      // If location API works, try media upload
      console.log('\n--- Testing Media Upload (Root Cause) ---');
      
      const FormData = require('form-data');
      const fs = require('fs');
      
      const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
      
      if (fs.existsSync(logoPath)) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(logoPath), {
          filename: 'token-expiry-test.png',
          contentType: 'image/png'
        });
        
        try {
          const mediaResponse = await axios.request({
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://services.leadconnectorhq.com/medias/upload-file',
            headers: { 
              'Accept': 'application/json', 
              'Authorization': `Bearer ${installation.accessToken}`,
              'Version': '2021-07-28',
              ...formData.getHeaders()
            },
            data: formData,
            params: {
              locationId: installation.locationId
            }
          });
          
          console.log('🎉 MEDIA UPLOAD WORKS! Token is actually valid!');
          console.log('Upload result:', mediaResponse.data);
          
          return {
            issue: 'false_alarm',
            token_status: 'actually_working',
            problem: 'Previous error was temporary or scope-related'
          };
          
        } catch (mediaError) {
          console.log('❌ Media upload failed:', mediaError.response?.data || mediaError.message);
          
          if (mediaError.response?.data?.message?.includes('authClass')) {
            console.log('\n🔍 CONFIRMED: OAuth authClass configuration issue');
            console.log('This is a GoHighLevel IAM setting, not token expiry');
            return {
              issue: 'oauth_authclass_config',
              token_status: 'valid_but_restricted',
              problem: 'GoHighLevel OAuth app needs authClass permission for media uploads'
            };
          }
          
          if (mediaError.response?.status === 401) {
            console.log('\n🔍 CONFIRMED: Token actually expired/invalid');
            return {
              issue: 'token_invalid',
              token_status: 'expired_early',
              problem: 'GoHighLevel invalidated token before scheduled expiry'
            };
          }
        }
      }
      
    } catch (locationError) {
      console.log('❌ Token failed for location API:', locationError.response?.data || locationError.message);
      
      if (locationError.response?.status === 401) {
        console.log('\n🔍 CONFIRMED: Token expired early');
        console.log('GoHighLevel invalidated the token before the 24-hour expiry time');
        
        return {
          issue: 'early_token_expiry',
          designed_lifetime: totalLifetimeHours,
          actual_lifetime: timeElapsedHours,
          problem: 'GoHighLevel security policy or app configuration issue'
        };
      }
    }
    
    // Check token format and structure
    console.log('\n--- Token Structure Analysis ---');
    console.log('Token Length:', installation.accessToken?.length || 'N/A');
    console.log('Token Prefix:', installation.accessToken?.substring(0, 10) + '...' || 'N/A');
    console.log('Refresh Token Present:', installation.refreshToken ? 'Yes' : 'No');
    console.log('Scopes:', installation.scopes || 'Not recorded');
    
    return {
      issue: 'investigation_complete',
      lifetime_analysis: {
        designed: totalLifetimeHours,
        elapsed: timeElapsedHours,
        remaining: timeRemainingHours
      }
    };
    
  } catch (error) {
    console.error('Investigation error:', error.message);
    return { error: error.message };
  }
}

investigateTokenExpiry().then(result => {
  console.log('\n=== INVESTIGATION RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});