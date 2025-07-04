/**
 * Test Image Upload to GoHighLevel Media Browser
 * Uses the Location Token API to upload an image via the installation
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  console.log('🖼️ TESTING IMAGE UPLOAD TO GOHIGHLEVEL MEDIA BROWSER');
  console.log('='.repeat(60));

  const installationId = 'install_1751635532116';
  const apiServerUrl = 'http://localhost:5000';
  
  try {
    // Step 1: Request Location Token
    console.log('\n1️⃣ REQUESTING LOCATION TOKEN');
    console.log(`Installation ID: ${installationId}`);
    
    const tokenResponse = await axios.post(`${apiServerUrl}/api/location-token/request`, {
      installation_id: installationId
    });
    
    console.log('✅ Location Token Response:', tokenResponse.data);
    
    if (!tokenResponse.data.success) {
      throw new Error('Failed to get Location token');
    }
    
    // Step 2: Find an image file to upload
    console.log('\n2️⃣ PREPARING IMAGE FOR UPLOAD');
    
    // Look for image files in attached_assets
    const assetsDir = './attached_assets';
    let imageFile = null;
    
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      imageFile = files.find(file => 
        file.toLowerCase().endsWith('.png') || 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg')
      );
    }
    
    if (!imageFile) {
      console.log('⚠️  No image files found in attached_assets, creating a test image...');
      // Create a simple test image (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x3A, 0x8D, 0xB8, 0x20, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync('test-image.png', testImageBuffer);
      imageFile = 'test-image.png';
    } else {
      imageFile = path.join(assetsDir, imageFile);
    }
    
    console.log(`📸 Using image file: ${imageFile}`);
    
    // Step 3: Upload the image
    console.log('\n3️⃣ UPLOADING IMAGE TO MEDIA BROWSER');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imageFile));
    formData.append('installation_id', installationId);
    
    const uploadResponse = await axios.post(`${apiServerUrl}/api/media/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ UPLOAD SUCCESSFUL!');
    console.log('📋 Upload Response:', JSON.stringify(uploadResponse.data, null, 2));
    
    // Step 4: List media to verify upload
    console.log('\n4️⃣ VERIFYING UPLOAD - LISTING MEDIA');
    
    const listResponse = await axios.get(`${apiServerUrl}/api/media/list`, {
      params: { installation_id: installationId }
    });
    
    console.log('✅ Media List Response:', JSON.stringify(listResponse.data, null, 2));
    
    console.log('\n🎉 IMAGE UPLOAD TEST COMPLETE!');
    console.log('✅ Location token conversion working');
    console.log('✅ Image successfully uploaded to GoHighLevel media browser');
    console.log('✅ Media listing functional');
    
  } catch (error) {
    console.error('❌ IMAGE UPLOAD TEST FAILED:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the API server is running on port 5000');
    }
  }
}

// Run the test
testImageUpload().catch(console.error);