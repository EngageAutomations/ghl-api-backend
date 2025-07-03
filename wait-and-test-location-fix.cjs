/**
 * Wait for Railway Deployment and Test Location-Level Fix
 * Monitor deployment status and test immediately when ready
 */

async function waitAndTestLocationFix() {
  console.log('⏳ MONITORING RAILWAY DEPLOYMENT');
  console.log('Waiting for v8.5.0-location-level-fix to deploy...');
  console.log('='.repeat(50));
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes max wait
  
  while (attempts < maxAttempts) {
    try {
      const healthResponse = await fetch('https://dir.engageautomations.com/health');
      const healthData = await healthResponse.json();
      
      console.log(`Check ${attempts + 1}: ${healthData.status} - Version: ${healthData.version || 'checking...'}`);
      
      // Check if new version is deployed
      if (healthData.version === '8.5.0-location-level-fix') {
        console.log('✅ NEW VERSION DEPLOYED!');
        console.log('🧪 Starting location-level authentication tests...');
        console.log('');
        
        // Now test with current installation first
        await testCurrentInstallation();
        
        console.log('');
        console.log('📋 OAUTH REINSTALLATION NEEDED');
        console.log('Current installation is still Company-level.');
        console.log('Please reinstall OAuth from GoHighLevel marketplace to get Location-level token.');
        console.log('');
        console.log('🔗 OAuth Installation URL:');
        console.log('   https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
        console.log('');
        console.log('✅ After reinstallation, the system will automatically:');
        console.log('   • Request user_type: "location" in OAuth exchange');
        console.log('   • Generate authClass: "Location" JWT token');
        console.log('   • Enable media upload access');
        console.log('   • Complete full workflow (media + products + pricing)');
        
        return;
      }
      
      // Wait 30 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 30000));
      attempts++;
      
    } catch (error) {
      console.log(`Check ${attempts + 1}: Error - ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 30000));
      attempts++;
    }
  }
  
  console.log('⚠️  Deployment taking longer than expected');
  console.log('   Please check Railway deployment status manually');
}

async function testCurrentInstallation() {
  try {
    console.log('🔍 TESTING CURRENT INSTALLATION...');
    
    // Get current installations
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('❌ No installations found');
      return;
    }
    
    const latestInstallation = installationsData.installations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    console.log(`   Installation: ${latestInstallation.id}`);
    console.log(`   Location: ${latestInstallation.location_id}`);
    
    // Get token and check auth class
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${latestInstallation.id}`);
    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      const tokenParts = tokenData.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log(`   Auth Class: ${payload.authClass}`);
        
        if (payload.authClass === 'Location') {
          console.log('✅ Already have Location-level token!');
          console.log('🧪 Testing media upload...');
          await testMediaUpload(tokenData);
        } else {
          console.log('❌ Still Company-level token - reinstallation needed');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
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
      filename: 'location-auth-test.png',
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
    
    console.log(`   Upload Status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ MEDIA UPLOAD SUCCESS!');
      console.log(`   Media ID: ${result.id || result._id}`);
      console.log('🎉 FULL WORKFLOW OPERATIONAL!');
    } else {
      const error = await uploadResponse.text();
      console.log('❌ Media upload failed:', error);
    }
    
  } catch (error) {
    console.log('❌ Media upload test failed:', error.message);
  }
}

waitAndTestLocationFix().catch(console.error);