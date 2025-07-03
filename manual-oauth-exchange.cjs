/**
 * Manual OAuth Token Exchange with Location-Level Authentication
 * Process the authorization code directly to test the fix
 */

async function manualOAuthExchange() {
  console.log('🔄 MANUAL OAUTH TOKEN EXCHANGE');
  console.log('Testing location-level authentication fix directly');
  console.log('='.repeat(60));
  
  const authCode = '5139c9628a6333e8b0559a352d37f8c829a931af';
  const CLIENT_ID = '68474924a586bce22a6e64f7';
  const CLIENT_SECRET = 'mbpkmyu4';
  
  try {
    console.log('1. EXCHANGING AUTHORIZATION CODE FOR LOCATION-LEVEL TOKEN...');
    console.log(`   Auth Code: ${authCode}`);
    console.log(`   Requesting user_type: "location" (FIXED)`);
    
    // CRITICAL: Use location-level authentication
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: authCode,
        user_type: 'location', // ✅ FIXED: Location-level authentication
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
      }).toString()
    });

    console.log(`   Response Status: ${tokenResponse.status} ${tokenResponse.statusText}`);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('❌ Token exchange failed:');
      console.log(`   ${errorText}`);
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Location-level token exchange successful!');
    console.log('📊 Response fields:', Object.keys(tokenData));
    
    // Extract location_id from response
    const locationId = tokenData.location_id;
    console.log(`🎯 LOCATION ID: ${locationId}`);
    
    // 2. Verify token is location-level by decoding JWT
    console.log('\n2. VERIFYING TOKEN AUTHENTICATION LEVEL...');
    if (tokenData.access_token) {
      const tokenParts = tokenData.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('🔍 JWT Token Analysis:');
        console.log(`   Auth Class: ${payload.authClass}`);
        console.log(`   Auth Class ID: ${payload.authClassId}`);
        console.log(`   Primary Auth Class: ${payload.primaryAuthClassId || 'N/A'}`);
        console.log(`   Scopes: ${payload.oauthMeta.scopes.join(', ')}`);
        
        if (payload.authClass === 'Location') {
          console.log('✅ SUCCESS: Token is Location-level!');
          console.log('🧪 Now testing media upload with location-level token...');
          await testMediaUploadWithLocationToken(tokenData, locationId);
        } else if (payload.authClass === 'Company') {
          console.log('❌ FAILED: Still getting Company-level token');
          console.log('   The OAuth backend fix may not be deployed yet');
        } else {
          console.log(`⚠️  UNEXPECTED: Auth class is ${payload.authClass}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ OAuth exchange failed:', error.message);
  }
}

async function testMediaUploadWithLocationToken(tokenData, locationId) {
  try {
    const FormData = require('form-data');
    
    console.log('\n3. TESTING MEDIA UPLOAD WITH LOCATION-LEVEL TOKEN...');
    
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
      filename: 'location-level-test.png',
      contentType: 'image/png'
    });
    form.append('locationId', locationId);
    
    console.log(`   Uploading to location: ${locationId}`);
    console.log(`   File size: ${testImageData.length} bytes`);
    console.log(`   Using Location-level authentication`);
    
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
      
      // 4. Test complete workflow
      console.log('\n4. TESTING COMPLETE WORKFLOW...');
      await testCompleteWorkflow(tokenData, locationId, uploadResult);
      
    } else {
      const errorResponse = await uploadResponse.text();
      console.log('❌ MEDIA UPLOAD FAILED');
      console.log(`   Error: ${errorResponse}`);
      
      if (errorResponse.includes('authClass type is not allowed')) {
        console.log('   Root Cause: OAuth backend still using Company-level auth');
        console.log('   Next Step: Wait for Railway deployment to complete');
      }
    }
    
  } catch (error) {
    console.error('❌ Media upload test failed:', error.message);
  }
}

async function testCompleteWorkflow(tokenData, locationId, mediaResult) {
  try {
    // Create product with media and pricing
    const productData = {
      name: "Complete Workflow Test Product",
      productType: "DIGITAL",
      locationId: locationId,
      available: true,
      currency: "USD",
      description: "Product created with location-level auth, media upload, and embedded pricing",
      medias: mediaResult.url ? [mediaResult.url] : [],
      prices: [{
        name: "Standard Package", 
        amount: 4999, 
        currency: "USD", 
        type: "one_time"
      }]
    };
    
    console.log('   Creating product with media attachment...');
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
      console.log(`   Media Attached: ${productResult.medias && productResult.medias.length > 0 ? 'Yes' : 'No'}`);
      console.log(`   Pricing Included: ${productResult.prices && productResult.prices.length > 0 ? 'Yes' : 'No'}`);
      
      console.log('');
      console.log('🎉 FULL GOHIGHLEVEL WORKFLOW OPERATIONAL!');
      console.log('   ✅ OAuth Authentication (Location-level)');
      console.log('   ✅ Media Upload');
      console.log('   ✅ Product Creation');
      console.log('   ✅ Pricing Integration');
      console.log('');
      console.log('🏆 ALL SYSTEMS WORKING - READY FOR PRODUCTION!');
      
    } else {
      const productError = await productResponse.text();
      console.log('❌ Product creation failed:', productError);
    }
    
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error.message);
  }
}

manualOAuthExchange().catch(console.error);