const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testImageUpload() {
  try {
    console.log('=== Testing Image Upload Workflow ===');
    
    const installation_id = "install_1751333384380";
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found:', logoPath);
      return;
    }
    
    console.log('Found logo file:', logoPath);
    console.log('File size:', fs.statSync(logoPath).size, 'bytes');
    
    // Test different upload endpoints
    const endpoints = [
      '/api/media/upload',
      '/api/images/upload', 
      '/api/photos/upload-multiple'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n--- Testing ${endpoint} ---`);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(logoPath), {
          filename: 'maker-expressed-logo.png',
          contentType: 'image/png'
        });
        formData.append('installation_id', installation_id);
        
        const uploadResponse = await axios.post(`https://dir.engageautomations.com${endpoint}`, formData, {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000
        });
        
        console.log(`✅ ${endpoint} SUCCESS!`);
        console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
        
        if (uploadResponse.data.mediaId || uploadResponse.data.mediaIds) {
          console.log('Media ID obtained, can attach to product');
          return uploadResponse.data;
        }
        
      } catch (uploadError) {
        console.log(`❌ ${endpoint} failed:`, uploadError.response?.status, uploadError.response?.data?.error || uploadError.message);
      }
    }
    
    console.log('\n--- Testing direct media upload to GoHighLevel ---');
    
    // Get installation details
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    // Note: This would need the access token which isn't exposed
    console.log('Installation scopes:', installation.scopes);
    console.log('Has media write scope:', installation.scopes.includes('medias.write'));
    
  } catch (error) {
    console.error('Image upload test error:', error.message);
  }
}

testImageUpload();