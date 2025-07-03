/**
 * Test OAuth Parameters for Location-Level Authentication
 * Find the correct parameter name and values for location-level tokens
 */

async function testOAuthParameters() {
  console.log('🔍 TESTING OAUTH PARAMETERS FOR LOCATION-LEVEL AUTH');
  console.log('Finding correct parameter names and values');
  console.log('='.repeat(60));
  
  const authCode = '5139c9628a6333e8b0559a352d37f8c829a931af';
  const CLIENT_ID = '68474924a586bce22a6e64f7';
  const CLIENT_SECRET = 'mbpkmyu4';
  
  // Test different parameter combinations for location-level auth
  const parameterTests = [
    {
      name: 'Standard OAuth (no user_type)',
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
      }
    },
    {
      name: 'With scope parameter (location scopes)',
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback',
        scope: 'locations.readonly locations.write medias.write medias.readonly products.write products.readonly'
      }
    },
    {
      name: 'With auth_type parameter',
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback',
        auth_type: 'location'
      }
    },
    {
      name: 'With user_level parameter',
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback',
        user_level: 'location'
      }
    }
  ];
  
  for (const test of parameterTests) {
    try {
      console.log(`\n🧪 TESTING: ${test.name}`);
      console.log('   Parameters:', Object.keys(test.params).filter(k => k !== 'client_secret').join(', '));
      
      const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(test.params).toString()
      });

      console.log(`   Response Status: ${tokenResponse.status} ${tokenResponse.statusText}`);

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        console.log('✅ SUCCESS!');
        console.log('📊 Response fields:', Object.keys(tokenData));
        console.log(`🎯 Location ID: ${tokenData.location_id || 'Not provided'}`);
        
        // Decode JWT to check auth class
        if (tokenData.access_token) {
          const tokenParts = tokenData.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log(`🔍 Auth Class: ${payload.authClass}`);
            console.log(`   Auth Class ID: ${payload.authClassId}`);
            console.log(`   Scopes: ${payload.oauthMeta.scopes.join(', ')}`);
            
            if (payload.authClass === 'Location') {
              console.log('🎉 FOUND LOCATION-LEVEL TOKEN!');
              console.log('Testing media upload with this token...');
              await testMediaUpload(tokenData);
              return; // Stop testing once we find working method
            }
          }
        }
        
      } else {
        const errorText = await tokenResponse.text();
        console.log('❌ Failed:', errorText.substring(0, 100) + '...');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n💡 ANALYSIS:');
  console.log('If all tests show Company-level tokens, the issue might be:');
  console.log('1. GoHighLevel app configuration (marketplace settings)');
  console.log('2. OAuth app permissions/scopes in marketplace');
  console.log('3. Account-level authentication restrictions');
  console.log('4. Need different OAuth flow or app type');
}

async function testMediaUpload(tokenData) {
  try {
    const FormData = require('form-data');
    
    // Create test image
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    const form = new FormData();
    form.append('file', testImageData, {
      filename: 'auth-test.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    const uploadResponse = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    console.log(`   Media Upload Status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ MEDIA UPLOAD SUCCESS!');
      console.log(`   Media ID: ${result.id || result._id}`);
      console.log('🎉 FULL WORKFLOW OPERATIONAL!');
    } else {
      const error = await uploadResponse.text();
      console.log('❌ Media upload failed:', error.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Media upload test failed:', error.message);
  }
}

testOAuthParameters().catch(console.error);