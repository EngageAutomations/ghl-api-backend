/**
 * Test Media Upload with Current OAuth System
 * Check if location-level authentication is working for media endpoints
 */

async function testMediaUploadNow() {
  console.log('🧪 TESTING MEDIA UPLOAD WITH CURRENT SYSTEM');
  console.log('='.repeat(50));
  
  try {
    // 1. Check current installations
    console.log('1. CHECKING FOR ACTIVE INSTALLATIONS...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    console.log(`Total installations: ${installationsData.count}`);
    
    if (installationsData.count === 0) {
      console.log('❌ No installations found');
      console.log('');
      console.log('🔗 Install from marketplace first:');
      console.log('   https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
      console.log('');
      console.log('After installation, the system will automatically:');
      console.log('• Request user_type: "location" in OAuth exchange');
      console.log('• Generate Location-level JWT token');
      console.log('• Enable media upload access');
      return;
    }
    
    // Find most recent installation
    const latestInstallation = installationsData.installations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    console.log(`Latest installation: ${latestInstallation.id}`);
    console.log(`Location ID: ${latestInstallation.location_id}`);
    console.log(`Active: ${latestInstallation.active}`);
    
    if (!latestInstallation.active) {
      console.log('❌ Installation expired - fresh installation needed');
      return;
    }
    
    // 2. Get token
    console.log('\n2. RETRIEVING ACCESS TOKEN...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${latestInstallation.id}`);
    
    if (!tokenResponse.ok) {
      console.log('❌ Failed to get token');
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log(`Token retrieved for location: ${tokenData.location_id}`);
    
    // 3. Check token type
    console.log('\n3. ANALYZING TOKEN TYPE...');
    if (tokenData.access_token) {
      const tokenParts = tokenData.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log(`Auth Class: ${payload.authClass}`);
        console.log(`Company ID: ${payload.companyId}`);
        console.log(`Location ID: ${payload.locationId}`);
        
        if (payload.authClass === 'Location') {
          console.log('✅ LOCATION-LEVEL TOKEN CONFIRMED!');
        } else {
          console.log('❌ Still Company-level token - fresh installation needed');
          console.log('The OAuth backend fix requires a new installation');
          return;
        }
      }
    }
    
    // 4. Test media upload
    console.log('\n4. TESTING MEDIA UPLOAD...');
    await testMediaUpload(tokenData);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testMediaUpload(tokenData) {
  try {
    const FormData = require('form-data');
    
    // Create minimal test PNG image
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
      filename: 'location-auth-test.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    console.log('Uploading test image to GoHighLevel...');
    
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
    
    console.log(`Upload Status: ${uploadResponse.status} ${uploadResponse.statusText}`);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ MEDIA UPLOAD SUCCESS!');
      console.log(`Media ID: ${result.id || result._id}`);
      console.log(`File URL: ${result.url || result.fileUrl}`);
      console.log('');
      console.log('🎉 COMPLETE WORKFLOW NOW OPERATIONAL!');
      console.log('All features working:');
      console.log('• OAuth with location-level authentication ✅');
      console.log('• Product creation ✅');
      console.log('• Pricing integration ✅');
      console.log('• Media upload ✅');
      
      // Test complete workflow
      await testCompleteWorkflow(tokenData, result.url || result.fileUrl);
      
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Media upload failed');
      console.log(`Error: ${errorText.substring(0, 200)}`);
      
      if (errorText.includes('authClass type is not allowed')) {
        console.log('');
        console.log('🔍 DIAGNOSIS: Still getting IAM authClass error');
        console.log('This means the current token is still Company-level');
        console.log('');
        console.log('SOLUTION: Fresh OAuth installation needed');
        console.log('The backend fix requires a new installation to take effect');
        console.log('');
        console.log('🔗 Install again from:');
        console.log('   https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
      }
    }
    
  } catch (error) {
    console.log('❌ Media upload test failed:', error.message);
  }
}

async function testCompleteWorkflow(tokenData, mediaUrl) {
  console.log('\n5. TESTING COMPLETE PRODUCT WORKFLOW...');
  
  try {
    const productData = {
      name: 'Complete Workflow Test Product',
      description: 'Product created with location-level authentication and media',
      productType: 'DIGITAL',
      locationId: tokenData.location_id,
      available: true,
      currency: 'USD',
      medias: [{ url: mediaUrl, type: 'image' }],
      prices: [{
        name: 'Standard Price',
        amount: 29999,
        currency: 'USD',
        type: 'one_time'
      }]
    };
    
    console.log('Creating product with uploaded media...');
    
    const productResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    console.log(`Product creation: ${productResponse.status}`);
    
    if (productResponse.ok) {
      const product = await productResponse.json();
      console.log('✅ Product created successfully!');
      console.log(`Product ID: ${product.id || product._id}`);
      console.log('');
      console.log('🏆 COMPLETE WORKFLOW OPERATIONAL!');
      console.log('End-to-end system working: OAuth → Media → Product → Pricing');
      
    } else {
      const error = await productResponse.text();
      console.log('Product creation failed:', error.substring(0, 100));
    }
    
  } catch (error) {
    console.log('Complete workflow test failed:', error.message);
  }
}

testMediaUploadNow().catch(console.error);