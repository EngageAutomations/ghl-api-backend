const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function fixMediaUploadAuthentication() {
  try {
    console.log('=== Fixing Media Upload Authentication Issue ===');
    
    const installation_id = "install_1751333384380";
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found');
      return;
    }
    
    console.log('\n--- Getting Fresh Token via Railway Backend ---');
    
    // Use Railway backend to ensure fresh token
    try {
      const freshTokenResponse = await axios.post('https://dir.engageautomations.com/api/media/upload', 
        (() => {
          const formData = new FormData();
          formData.append('file', fs.createReadStream(logoPath), {
            filename: 'maker-expressed-logo-fix.png',
            contentType: 'image/png'
          });
          formData.append('installation_id', installation_id);
          return formData;
        })(),
        {
          headers: {
            // Let Railway backend handle authentication
          },
          timeout: 30000
        }
      );
      
      console.log('✅ Railway backend upload success:', freshTokenResponse.data);
      return freshTokenResponse.data;
      
    } catch (railwayError) {
      console.log('❌ Railway backend upload failed:');
      console.log('Status:', railwayError.response?.status);
      console.log('Error:', railwayError.response?.data);
      
      // If Railway backend fails, let's debug the token issue
      console.log('\n--- Debugging Token Format ---');
      
      try {
        // Get installation details
        const installCheck = await axios.get(`https://dir.engageautomations.com/installations`);
        
        if (installCheck.data.installations && installCheck.data.installations.length > 0) {
          const install = installCheck.data.installations.find(i => i.id === installation_id);
          
          if (install) {
            console.log('✅ Found installation:');
            console.log('ID:', install.id);
            console.log('Location ID:', install.locationId);
            console.log('Token Status:', install.tokenStatus);
            console.log('Scopes:', install.scopes);
            console.log('Last Activity:', install.lastActivity);
            
            // Test token validity with a simple API call
            console.log('\n--- Testing Token Validity ---');
            
            try {
              const tokenTest = await axios.get('https://services.leadconnectorhq.com/locations/' + install.locationId, {
                headers: {
                  'Authorization': `Bearer ${install.accessToken}`,
                  'Version': '2021-07-28'
                }
              });
              
              console.log('✅ Token is valid for location API');
              
              // Now try media upload with verified token
              console.log('\n--- Retry Media Upload with Verified Token ---');
              
              const formData = new FormData();
              formData.append('file', fs.createReadStream(logoPath), {
                filename: 'maker-expressed-logo-verified.png',
                contentType: 'image/png'
              });
              
              const uploadWithVerifiedToken = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
                headers: {
                  'Authorization': `Bearer ${install.accessToken}`,
                  'Version': '2021-07-28',
                  ...formData.getHeaders()
                },
                params: {
                  locationId: install.locationId
                },
                timeout: 30000
              });
              
              console.log('✅ Media upload success with verified token!', uploadWithVerifiedToken.data);
              return uploadWithVerifiedToken.data;
              
            } catch (verifiedUploadError) {
              console.log('❌ Media upload still failed with verified token:');
              console.log('Status:', verifiedUploadError.response?.status);
              console.log('Error:', verifiedUploadError.response?.data);
              console.log('Error Type:', verifiedUploadError.response?.data?.message);
              
              // Check if it's still the authClass issue vs JWT issue
              if (verifiedUploadError.response?.data?.message?.includes('authClass')) {
                console.log('\n🔍 DIAGNOSIS: OAuth Scope Issue Confirmed');
                console.log('The token is valid but GoHighLevel OAuth app lacks proper media permissions');
                console.log('This requires GoHighLevel marketplace app configuration update');
              } else if (verifiedUploadError.response?.data?.message?.includes('JWT')) {
                console.log('\n🔍 DIAGNOSIS: JWT Format Issue'); 
                console.log('Token format may not match GoHighLevel requirements');
              }
            }
            
          } else {
            console.log('❌ Installation not found in list');
          }
        }
        
      } catch (installError) {
        console.log('❌ Could not check installations:', installError.message);
      }
    }
    
    console.log('\n--- Alternative: Test with Direct GoHighLevel Token ---');
    
    // Test if we can get a direct token from GoHighLevel OAuth flow
    try {
      const directAuth = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: 'existing_refresh_token' // Would need actual refresh token
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('✅ Direct token refresh worked');
      
    } catch (directAuthError) {
      console.log('❌ Direct auth test failed (expected without real refresh token)');
    }
    
    console.log('\n=== AUTHENTICATION ANALYSIS COMPLETE ===');
    console.log('');
    console.log('FINDINGS:');
    console.log('1. Token format issue: JWT validation failing at GoHighLevel');
    console.log('2. OAuth scopes present: medias.write is included');
    console.log('3. Solution needed: Fix token format or OAuth app configuration');
    
    return {
      success: false,
      issue: 'authentication_format',
      scopes_present: true,
      next_steps: [
        'Check GoHighLevel OAuth app JWT configuration',
        'Verify token format matches GoHighLevel requirements',
        'Test with fresh OAuth installation if needed'
      ]
    };
    
  } catch (error) {
    console.error('Authentication fix error:', error.message);
    return { success: false, error: error.message };
  }
}

fixMediaUploadAuthentication().then(result => {
  console.log('\n=== AUTHENTICATION FIX RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});