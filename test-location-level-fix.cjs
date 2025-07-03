/**
 * Test Location-Level Authentication Fix
 * Verify the OAuth fix works and test complete workflow
 */

const FormData = require('form-data');

async function testLocationLevelFix() {
  console.log('🧪 TESTING LOCATION-LEVEL AUTHENTICATION FIX');
  console.log('='.repeat(70));
  
  try {
    // 1. Check latest installation
    console.log('1. CHECKING LATEST INSTALLATION...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('❌ No installations found - fresh OAuth needed');
      return;
    }
    
    // Get the latest installation
    const latestInstallation = installationsData.installations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    console.log(`✅ Found latest installation: ${latestInstallation.id}`);
    console.log(`   Auth Level: ${latestInstallation.auth_level || 'checking...'}`);
    console.log(`   Location ID: ${latestInstallation.location_id}`);
    console.log(`   Created: ${latestInstallation.created_at}`);
    console.log(`   Active: ${latestInstallation.active}`);
    
    // 2. Get access token and verify auth class
    console.log('\n2. RETRIEVING ACCESS TOKEN...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${latestInstallation.id}`);
    
    if (!tokenResponse.ok) {
      console.log('❌ Failed to get access token');
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log(`✅ Token retrieved for location: ${tokenData.location_id}`);
    console.log(`   Auth Level: ${tokenData.auth_level}`);
    console.log(`   Expires: ${tokenData.expires_at}`);
    
    // 3. Decode JWT to verify auth class
    console.log('\n3. VERIFYING TOKEN AUTH CLASS...');
    const tokenParts = tokenData.access_token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log(`   Auth Class: ${payload.authClass}`);
      console.log(`   Auth Class ID: ${payload.authClassId}`);
      console.log(`   Location Context: ${payload.primaryAuthClassId || 'N/A'}`);
      console.log(`   Scopes: ${payload.oauthMeta.scopes.join(', ')}`);
      
      if (payload.authClass === 'Location') {
        console.log('✅ SUCCESS: Token is Location-level!');
      } else if (payload.authClass === 'Company') {
        console.log('❌ FAILED: Still getting Company-level token');
        console.log('   This means the OAuth fix needs to be deployed');
        return;
      } else {
        console.log(`⚠️  UNEXPECTED: Auth class is ${payload.authClass}`);
      }
    }
    
    // 4. Test media upload with location-level token
    console.log('\n4. TESTING MEDIA UPLOAD WITH LOCATION-LEVEL TOKEN...');
    
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
      filename: 'location-test.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    console.log(`   Uploading to location: ${tokenData.location_id}`);
    console.log(`   File size: ${testImageData.length} bytes`);
    console.log(`   Using Location-level token (${payload.authClass})`);
    
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
    
    console.log(`   Response Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
    
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ MEDIA UPLOAD SUCCESS!');
      console.log(`   Media ID: ${uploadResult.id || uploadResult._id || 'Unknown'}`);
      console.log(`   Media URL: ${uploadResult.url || uploadResult.link || 'Unknown'}`);
      console.log(`   File Name: ${uploadResult.name || uploadResult.filename || 'Unknown'}`);
      
      // 5. Test complete workflow with media
      console.log('\n5. TESTING COMPLETE WORKFLOW WITH MEDIA...');
      await testCompleteWorkflowWithMedia(tokenData, uploadResult);
      
    } else {
      const errorResponse = await uploadResponse.text();
      console.log('❌ MEDIA UPLOAD FAILED');
      console.log(`   Error: ${errorResponse}`);
      
      if (errorResponse.includes('authClass type is not allowed')) {
        console.log('   Root Cause: Still using wrong auth class');
        console.log('   Solution: Deploy OAuth backend fix and reinstall');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testCompleteWorkflowWithMedia(tokenData, mediaResult) {
  try {
    // Create product with media
    const productData = {
      name: "Location-Level Test Product",
      productType: "DIGITAL",
      locationId: tokenData.location_id,
      available: true,
      currency: "USD",
      description: "Product created with location-level authentication and media",
      medias: mediaResult.url ? [mediaResult.url] : [],
      prices: [{
        name: "Standard Price", 
        amount: 2999, 
        currency: "USD", 
        type: "one_time"
      }]
    };
    
    console.log('   Creating product with media...');
    const productResponse = await fetch('https://services.leadconnectorhq.com/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify(productData)
    });
    
    console.log(`   Product Response: ${productResponse.status} ${productResponse.statusText}`);
    
    if (productResponse.ok) {
      const productResult = await productResponse.json();
      console.log('✅ COMPLETE WORKFLOW SUCCESS!');
      console.log(`   Product ID: ${productResult.id || productResult._id}`);
      console.log(`   Product Name: ${productResult.name}`);
      console.log(`   Media Attached: ${productResult.medias ? 'Yes' : 'No'}`);
      console.log(`   Pricing Included: ${productResult.prices ? 'Yes' : 'No'}`);
      console.log('');
      console.log('🎉 FULL GOHRLEVLEVEL WORKFLOW OPERATIONAL:');
      console.log('   ✅ OAuth Authentication (Location-level)');
      console.log('   ✅ Media Upload');
      console.log('   ✅ Product Creation');
      console.log('   ✅ Pricing Integration');
      
    } else {
      const productError = await productResponse.text();
      console.log('❌ Product creation failed:', productError);
    }
    
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error.message);
  }
}

testLocationLevelFix().catch(console.error);