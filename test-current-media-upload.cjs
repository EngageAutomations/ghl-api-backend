/**
 * Test Current Media Upload
 * Test with fresh installation to see current behavior
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const INSTALLATION_ID = 'install_1751630886558';
const OAUTH_BACKEND = 'https://dir.engageautomations.com';

async function testCurrentMediaUpload() {
  console.log('🎯 TESTING CURRENT MEDIA UPLOAD');
  console.log('Installation ID:', INSTALLATION_ID);
  console.log('='.repeat(50));

  try {
    // Step 1: Get token info
    console.log('\n1. Getting token info...');
    const tokenResponse = await axios.get(`${OAUTH_BACKEND}/api/token-access/${INSTALLATION_ID}`);
    console.log('Token Info:', {
      auth_class: tokenResponse.data.auth_class,
      location_id: tokenResponse.data.location_id,
      expires_in: tokenResponse.data.expires_in
    });

    // Step 2: Test direct GoHighLevel media upload with Company token
    console.log('\n2. Testing direct GoHighLevel media upload with Company token...');
    
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageData);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    try {
      const uploadResponse = await axios.post(
        'https://services.leadconnectorhq.com/medias/upload-file',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.data.access_token}`,
            'Version': '2021-07-28',
            ...formData.getHeaders()
          },
          maxBodyLength: Infinity,
          timeout: 30000
        }
      );

      console.log('✅ MEDIA UPLOAD SUCCESSFUL with Company token!');
      console.log('Upload Response:', uploadResponse.data);

    } catch (uploadError) {
      console.error('❌ Media Upload Failed with Company token');
      console.error('Status:', uploadError.response?.status);
      console.error('Error:', uploadError.response?.data?.message || uploadError.message);
      
      if (uploadError.response?.status === 401) {
        console.log('🔍 This confirms Company token lacks media upload permissions');
        console.log('💡 Location token conversion needed');
      }
    }

    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCurrentMediaUpload().catch(console.error);