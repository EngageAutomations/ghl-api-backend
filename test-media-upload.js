/**
 * Test Media Upload to GoHighLevel Account
 * Tests image upload using OAuth backend with correct credentials
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function testMediaUpload() {
  console.log('🖼️ TESTING MEDIA UPLOAD TO GHL ACCOUNT');
  console.log('Testing with OAuth backend: https://dir.engageautomations.com');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Check OAuth backend status
    console.log('1. Checking OAuth backend status...');
    const backendStatus = await axios.get('https://dir.engageautomations.com/');
    console.log('Backend status:', backendStatus.data.version);
    console.log('Active installations:', backendStatus.data.installs);
    
    if (backendStatus.data.installs === 0) {
      console.log('❌ No active installations found');
      console.log('💡 You need to complete OAuth installation first:');
      console.log('   https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
      return;
    }
    
    // Step 2: Get installations
    console.log('\n2. Getting installation data...');
    const installations = await axios.get('https://dir.engageautomations.com/installations');
    console.log('Installations found:', installations.data.count);
    
    if (installations.data.count === 0) {
      console.log('❌ No installations available');
      return;
    }
    
    // Get the latest installation
    const latestInstall = installations.data.installations[0];
    console.log('Using installation:', latestInstall.id);
    console.log('Location ID:', latestInstall.location_id);
    console.log('Installation status:', latestInstall.active ? 'Active' : 'Inactive');
    
    // Step 3: Get access token
    console.log('\n3. Getting access token...');
    const tokenResponse = await axios.get(`https://dir.engageautomations.com/api/token-access/${latestInstall.id}`);
    console.log('Token retrieved successfully');
    console.log('Location ID:', tokenResponse.data.location_id);
    console.log('Token expires in:', Math.floor(tokenResponse.data.expires_in / 60), 'minutes');
    
    const accessToken = tokenResponse.data.access_token;
    const locationId = tokenResponse.data.location_id;
    
    // Step 4: Create test image
    console.log('\n4. Creating test image...');
    const testImageData = createTestImage();
    fs.writeFileSync('test-upload.png', testImageData);
    console.log('Test image created: test-upload.png');
    
    // Step 5: Upload image to GoHighLevel
    console.log('\n5. Uploading image to GoHighLevel media library...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-upload.png'));
    formData.append('locationId', locationId);
    
    const uploadResponse = await axios.post(
      'https://services.leadconnectorhq.com/medias/upload-file',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        timeout: 30000,
        validateStatus: () => true
      }
    );
    
    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response data:', uploadResponse.data);
    
    if (uploadResponse.status === 200 || uploadResponse.status === 201) {
      console.log('✅ Image uploaded successfully!');
      console.log('Media URL:', uploadResponse.data.url || uploadResponse.data.fileUrl);
      console.log('Media ID:', uploadResponse.data.id || uploadResponse.data.mediaId);
      
      // Step 6: List media files to verify
      console.log('\n6. Verifying upload by listing media files...');
      const mediaListResponse = await axios.get(
        `https://services.leadconnectorhq.com/medias/?locationId=${locationId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28'
          },
          timeout: 15000,
          validateStatus: () => true
        }
      );
      
      console.log('Media list response:', mediaListResponse.status);
      if (mediaListResponse.status === 200) {
        console.log('Media files count:', mediaListResponse.data.medias?.length || 0);
        console.log('Recent uploads:', mediaListResponse.data.medias?.slice(0, 3)?.map(m => m.name) || []);
      }
      
    } else {
      console.log('❌ Upload failed');
      console.log('Error details:', uploadResponse.data);
      
      if (uploadResponse.status === 401) {
        console.log('💡 Authentication error - token may be expired or invalid');
      } else if (uploadResponse.status === 403) {
        console.log('💡 Permission denied - app may not have media upload scope');
      } else if (uploadResponse.status === 422) {
        console.log('💡 Validation error - check file format or size');
      }
    }
    
    // Cleanup
    fs.unlinkSync('test-upload.png');
    console.log('\n✅ Test completed - temporary file cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Cleanup on error
    try {
      fs.unlinkSync('test-upload.png');
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

function createTestImage() {
  // Create a simple PNG image (1x1 pixel transparent)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // RGBA, no compression
    0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x1D, 0x01, 0x00, 0x00, 0x00, 0x05, // compressed data
    0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, // (transparent pixel)
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
    0x60, 0x82
  ]);
  
  return pngData;
}

testMediaUpload().catch(console.error);