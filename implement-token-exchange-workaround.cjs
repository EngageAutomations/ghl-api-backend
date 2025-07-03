/**
 * Implement Agency-to-Location Token Exchange Workaround
 * Use GoHighLevel's token exchange endpoint to get Location-level tokens
 */

async function implementTokenExchangeWorkaround() {
  console.log('🔄 IMPLEMENTING AGENCY-TO-LOCATION TOKEN EXCHANGE WORKAROUND');
  console.log('Using GoHighLevel API to convert Company token to Location token');
  console.log('='.repeat(70));
  
  try {
    // 1. Get current Company-level token
    console.log('1. RETRIEVING CURRENT COMPANY-LEVEL TOKEN...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('❌ No installations found');
      return;
    }
    
    const latestInstallation = installationsData.installations[0];
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${latestInstallation.id}`);
    const tokenData = await tokenResponse.json();
    
    console.log(`✅ Company token retrieved for location: ${tokenData.location_id}`);
    
    // 2. Exchange Company token for Location token
    console.log('\n2. EXCHANGING COMPANY TOKEN FOR LOCATION TOKEN...');
    
    const exchangeResponse = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        locationId: tokenData.location_id
      })
    });
    
    console.log(`   Exchange Response: ${exchangeResponse.status} ${exchangeResponse.statusText}`);
    
    if (!exchangeResponse.ok) {
      const errorText = await exchangeResponse.text();
      console.log('❌ Token exchange failed:', errorText);
      
      // Try alternative endpoint paths
      console.log('\n3. TRYING ALTERNATIVE EXCHANGE ENDPOINTS...');
      
      const alternativeEndpoints = [
        'https://services.leadconnectorhq.com/oauth/location-token',
        'https://services.leadconnectorhq.com/locations/token',
        'https://services.leadconnectorhq.com/oauth/generateLocationToken'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        console.log(`   Trying: ${endpoint}`);
        
        const altResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            locationId: tokenData.location_id
          })
        });
        
        console.log(`   Status: ${altResponse.status}`);
        
        if (altResponse.ok) {
          const altResult = await altResponse.json();
          console.log('✅ Alternative endpoint worked!');
          await testLocationTokenWorkaround(altResult, tokenData.location_id);
          return;
        }
      }
      
      console.log('\n4. IMPLEMENTING DIRECT WORKAROUND SOLUTION...');
      await implementDirectWorkaround(tokenData);
      return;
    }
    
    const locationTokenData = await exchangeResponse.json();
    console.log('✅ Location token exchange successful!');
    console.log('📊 Location token fields:', Object.keys(locationTokenData));
    
    // 3. Verify location token and test media upload
    console.log('\n3. TESTING MEDIA UPLOAD WITH LOCATION TOKEN...');
    await testLocationTokenWorkaround(locationTokenData, tokenData.location_id);
    
  } catch (error) {
    console.error('❌ Token exchange workaround failed:', error.message);
  }
}

async function testLocationTokenWorkaround(locationTokenData, locationId) {
  try {
    const FormData = require('form-data');
    
    // Verify the location token
    const accessToken = locationTokenData.access_token || locationTokenData.token;
    
    if (!accessToken) {
      console.log('❌ No access token in response:', Object.keys(locationTokenData));
      return;
    }
    
    // Decode to verify it's location-level
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log(`🔍 Token Verification:`);
      console.log(`   Auth Class: ${payload.authClass}`);
      console.log(`   Location Context: ${payload.authClassId}`);
      
      if (payload.authClass !== 'Location') {
        console.log('⚠️  Token is still not Location-level');
        return;
      }
    }
    
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
      filename: 'location-token-test.png',
      contentType: 'image/png'
    });
    form.append('locationId', locationId);
    
    console.log(`   Using Location token for: ${locationId}`);
    
    const uploadResponse = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    console.log(`   Upload Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
    
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ MEDIA UPLOAD SUCCESS WITH LOCATION TOKEN!');
      console.log(`   Media ID: ${uploadResult.id || uploadResult._id}`);
      console.log(`   Media URL: ${uploadResult.url || uploadResult.link}`);
      console.log('');
      console.log('🎉 WORKAROUND SUCCESSFUL!');
      console.log('Location token exchange enables media upload access');
      
      // Update OAuth backend with workaround
      await deployWorkaroundToBackend(locationId);
      
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Media upload still failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Location token test failed:', error.message);
  }
}

async function implementDirectWorkaround(tokenData) {
  console.log('🔧 IMPLEMENTING DIRECT WORKAROUND SOLUTION...');
  console.log('Creating middleware to handle Company-to-Location token conversion');
  
  // Create backend middleware for token exchange
  const workaroundMiddleware = `
// Add to OAuth backend - Token Exchange Middleware
async function getLocationToken(companyToken, locationId) {
  // Try multiple approaches to get location-level access
  
  // Approach 1: Direct location token generation
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${companyToken}\`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({ locationId })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.access_token || result.token;
    }
  } catch (error) {
    console.log('Location token exchange attempt failed:', error.message);
  }
  
  // Approach 2: Use company token with location-specific headers
  // Some endpoints may work with company tokens if location context is provided
  return companyToken; // Fallback to original token
}

// Enhanced media upload endpoint
app.post('/api/media/upload', async (req, res) => {
  try {
    const installation = installations.get(req.params.installationId);
    const locationToken = await getLocationToken(installation.access_token, installation.location_id);
    
    // Use location token for media upload
    const uploadResponse = await uploadToGoHighLevel(locationToken, req.files, installation.location_id);
    res.json(uploadResponse);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
`;

  console.log('✅ Workaround middleware created');
  console.log('📋 Next steps:');
  console.log('1. Deploy workaround middleware to OAuth backend');
  console.log('2. Update frontend to use workaround endpoint');
  console.log('3. Test complete workflow with workaround');
  console.log('');
  console.log('💡 Alternative: Update marketplace app configuration for permanent fix');
}

async function deployWorkaroundToBackend(locationId) {
  console.log('\n4. DEPLOYING WORKAROUND TO OAUTH BACKEND...');
  console.log('Adding location token exchange to backend endpoints');
  
  // This would update the OAuth backend with the workaround
  console.log('✅ Workaround deployment planned');
  console.log(`   Target Location: ${locationId}`);
  console.log('   Strategy: Company-to-Location token exchange middleware');
}

implementTokenExchangeWorkaround().catch(console.error);