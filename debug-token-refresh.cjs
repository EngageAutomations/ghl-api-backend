const axios = require('axios');

async function debugTokenRefresh() {
  try {
    console.log('=== Debugging Token Refresh Mechanism ===');
    
    const installation_id = "install_1751333384380";
    
    // Step 1: Check current installation state
    console.log('\n--- Step 1: Current Installation State ---');
    
    const currentState = await axios.get('https://dir.engageautomations.com/installations');
    const installation = currentState.data.installations.find(i => i.id === installation_id);
    
    if (installation) {
      console.log('Current Token Status:', installation.tokenStatus);
      console.log('Expires At:', installation.expiresAt);
      console.log('Current Time:', new Date().toISOString());
      console.log('Time Until Expiry:', new Date(installation.expiresAt) - new Date(), 'milliseconds');
      console.log('Has Refresh Token:', 'refreshToken' in installation ? 'Yes' : 'No');
    }
    
    // Step 2: Try to manually trigger refresh
    console.log('\n--- Step 2: Attempting Manual Token Refresh ---');
    
    try {
      const refreshAttempt = await axios.post('https://dir.engageautomations.com/api/oauth/refresh-token', {
        installation_id: installation_id
      });
      
      console.log('✅ Manual refresh successful:', refreshAttempt.data);
      
    } catch (refreshError) {
      console.log('❌ Manual refresh failed:', refreshError.response?.data || refreshError.message);
      
      // Step 3: Try direct refresh with GoHighLevel
      console.log('\n--- Step 3: Testing Direct GoHighLevel Refresh ---');
      
      if (installation && installation.refreshToken) {
        try {
          const directRefresh = await axios.post('https://services.leadconnectorhq.com/oauth/token', new URLSearchParams({
            client_id: '675e4251e4b0e7a613050be3',
            client_secret: '675e4251e4b0e7a613050be3-3lGGH5vhNS4RJxXb',
            grant_type: 'refresh_token',
            refresh_token: installation.refreshToken
          }), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 15000
          });
          
          console.log('✅ Direct GoHighLevel refresh successful!');
          console.log('New token data:', {
            access_token: directRefresh.data.access_token?.substring(0, 20) + '...',
            expires_in: directRefresh.data.expires_in,
            refresh_token: directRefresh.data.refresh_token ? 'Present' : 'Missing'
          });
          
          // Step 4: Test new token with location API
          console.log('\n--- Step 4: Testing New Token ---');
          
          try {
            const locationTest = await axios.get(`https://services.leadconnectorhq.com/locations/${installation.locationId}`, {
              headers: {
                'Authorization': `Bearer ${directRefresh.data.access_token}`,
                'Version': '2021-07-28'
              }
            });
            
            console.log('✅ New token works for location API!');
            
            // Step 5: Try media upload with new token
            console.log('\n--- Step 5: Testing Media Upload with New Token ---');
            
            const FormData = require('form-data');
            const fs = require('fs');
            
            const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
            
            if (fs.existsSync(logoPath)) {
              const formData = new FormData();
              formData.append('file', fs.createReadStream(logoPath), {
                filename: 'maker-logo-refreshed-token.png',
                contentType: 'image/png'
              });
              
              let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://services.leadconnectorhq.com/medias/upload-file',
                headers: { 
                  'Accept': 'application/json', 
                  'Authorization': `Bearer ${directRefresh.data.access_token}`,
                  'Version': '2021-07-28',
                  ...formData.getHeaders()
                },
                data: formData,
                params: {
                  locationId: installation.locationId
                }
              };

              const mediaUpload = await axios.request(config);
              console.log('🎉 MEDIA UPLOAD SUCCESS WITH REFRESHED TOKEN!');
              console.log('Upload result:', mediaUpload.data);
              
              return {
                success: true,
                solution: 'Token refresh manually successful',
                media_upload_working: true,
                new_token: directRefresh.data.access_token?.substring(0, 20) + '...'
              };
              
            } else {
              console.log('Logo file not found for media test');
            }
            
          } catch (newTokenError) {
            console.log('❌ New token failed for location API:', newTokenError.response?.data);
          }
          
        } catch (directRefreshError) {
          console.log('❌ Direct GoHighLevel refresh failed:', directRefreshError.response?.data || directRefreshError.message);
          
          if (directRefreshError.response?.data?.error === 'invalid_grant') {
            console.log('\n🔍 DIAGNOSIS: Refresh Token Invalid');
            console.log('The refresh token has expired or been revoked');
            console.log('A fresh OAuth installation is required');
          }
        }
      } else {
        console.log('❌ No refresh token available in installation');
      }
    }
    
    // Step 6: Check Railway backend refresh implementation
    console.log('\n--- Step 6: Railway Backend Refresh Status ---');
    
    try {
      const backendStatus = await axios.get('https://dir.engageautomations.com/');
      console.log('Backend Status:', backendStatus.data.status);
      console.log('Backend Features:', backendStatus.data.features);
      console.log('Authenticated Installs:', backendStatus.data.authenticated);
      
    } catch (backendError) {
      console.log('❌ Could not check backend status:', backendError.message);
    }
    
    return {
      success: false,
      issue: 'token_refresh_failure',
      recommendation: 'Fresh OAuth installation required'
    };
    
  } catch (error) {
    console.error('Debug error:', error.message);
    return { success: false, error: error.message };
  }
}

debugTokenRefresh().then(result => {
  console.log('\n=== TOKEN REFRESH DEBUG RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});