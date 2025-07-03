/**
 * Test Photo Upload to GoHighLevel
 * Direct test of media upload functionality
 */

async function testPhotoUpload() {
  console.log('📸 TESTING PHOTO UPLOAD TO GOHIGHLEVEL');
  console.log('='.repeat(50));
  
  try {
    // 1. Check for installations
    console.log('1. Checking OAuth installations...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    console.log(`Found ${installationsData.count} installations`);
    
    if (installationsData.count === 0) {
      console.log('❌ No OAuth installation found');
      console.log('Need fresh installation from: https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
      return;
    }
    
    const installation = installationsData.installations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    console.log(`Using installation: ${installation.id}`);
    console.log(`Location: ${installation.location_id}`);
    console.log(`Active: ${installation.active}`);
    
    if (!installation.active) {
      console.log('❌ Installation expired');
      return;
    }
    
    // 2. Get access token
    console.log('\n2. Getting access token...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.id}`);
    
    if (!tokenResponse.ok) {
      console.log('❌ Failed to get token');
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log(`Token retrieved for location: ${tokenData.location_id}`);
    
    // 3. Check token type
    console.log('\n3. Analyzing token...');
    if (tokenData.access_token) {
      const tokenParts = tokenData.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log(`Auth Class: ${payload.authClass}`);
        console.log(`Company ID: ${payload.companyId}`);
        console.log(`Location ID: ${payload.locationId}`);
        
        if (payload.authClass !== 'Location') {
          console.log('⚠️ Warning: Token is not Location-level');
          console.log('Media upload may fail with IAM restrictions');
        }
      }
    }
    
    // 4. Test photo upload
    console.log('\n4. Uploading test photo...');
    const uploadResult = await uploadTestPhoto(tokenData);
    
    if (uploadResult.success) {
      console.log('✅ PHOTO UPLOAD SUCCESS!');
      console.log(`Media ID: ${uploadResult.data.id}`);
      console.log(`Photo URL: ${uploadResult.data.url}`);
      console.log('Photo should now appear in your GoHighLevel media library');
      
      // 5. Verify upload by listing media
      console.log('\n5. Verifying upload in media library...');
      await verifyMediaUpload(tokenData, uploadResult.data.id);
      
    } else {
      console.log('❌ PHOTO UPLOAD FAILED');
      console.log(`Error: ${uploadResult.error}`);
      
      if (uploadResult.error.includes('authClass')) {
        console.log('\n🔍 DIAGNOSIS: Authentication Issue');
        console.log('Current token does not have media upload permissions');
        console.log('Need Location-level token for media library access');
        console.log('\nSOLUTION: Fresh OAuth installation required');
        console.log('The OAuth backend will request Location-level tokens automatically');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function uploadTestPhoto(tokenData) {
  try {
    const FormData = require('form-data');
    
    // Create a more substantial test image (100x100 PNG)
    const testImageData = createTestImage();
    
    const form = new FormData();
    form.append('file', testImageData, {
      filename: `test-photo-${Date.now()}.png`,
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    console.log('Uploading to GoHighLevel media library...');
    
    const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    console.log(`Upload response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: {
          id: data.id || data._id,
          url: data.url || data.fileUrl,
          name: data.name || data.fileName
        }
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `${response.status}: ${errorText.substring(0, 300)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function verifyMediaUpload(tokenData, mediaId) {
  try {
    console.log('Checking media library...');
    
    const response = await fetch('https://services.leadconnectorhq.com/medias/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const mediaData = await response.json();
      const mediaCount = mediaData.medias?.length || 0;
      console.log(`Total media files in library: ${mediaCount}`);
      
      if (mediaCount > 0) {
        const recentMedia = mediaData.medias.find(m => m.id === mediaId);
        if (recentMedia) {
          console.log('✅ Upload verified in media library');
          console.log(`File: ${recentMedia.name}`);
        } else {
          console.log('⚠️ Upload successful but not found in recent list');
        }
      }
    } else {
      console.log('Could not verify upload in media library');
    }
    
  } catch (error) {
    console.log('Verification check failed:', error.message);
  }
}

function createTestImage() {
  // Create a simple 100x100 PNG image
  const width = 100;
  const height = 100;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(2, 17); // Color type (RGB)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace
  
  // Simple CRC for IHDR
  const crc = require('crypto').createHash('md5').update(ihdr.slice(4, 21)).digest();
  ihdr.writeUInt32BE(crc.readUInt32BE(0), 21);
  
  // Simple IDAT chunk with minimal data
  const idat = Buffer.from([
    0x00, 0x00, 0x00, 0x0C, // Length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x00, 0x01,
    0x5C, 0xCD, 0x90, 0x0A // CRC
  ]);
  
  // IEND chunk
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // Length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

testPhotoUpload().catch(console.error);