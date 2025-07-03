/**
 * Test Axios with Version Header
 * Fix the version header requirement discovered
 */

const axios = require('axios');
const FormData = require('form-data');

async function testAxiosWithVersion() {
  console.log('🔧 TESTING AXIOS WITH CORRECT VERSION HEADER');
  console.log('Fixing the "version header was not found" error');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    
    // Create test image
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, // image data
      0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00, // checksum
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);
    
    // Create FormData
    const form = new FormData();
    form.append('file', testImageData, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    // Test with correct version header in axios format
    console.log('\n🚀 TESTING WITH VERSION HEADER...');
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://services.leadconnectorhq.com/medias/upload-file',
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json', 
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        ...form.getHeaders()
      },
      data: form
    };

    const response = await axios.request(config);
    
    console.log('✅ SUCCESS! Media upload working!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.log('📊 Status:', error.response?.status || 'No status');
    console.log('📋 Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
    
    if (error.response?.status === 401) {
      const errorMsg = error.response.data.message || '';
      if (errorMsg.includes('version header')) {
        console.log('❌ Still missing version header');
      } else if (errorMsg.includes('authClass')) {
        console.log('❌ Back to IAM authClass error');
      } else {
        console.log('💡 Different 401 error:', errorMsg);
      }
    }
    
    return null;
  }
}

testAxiosWithVersion().catch(console.error);