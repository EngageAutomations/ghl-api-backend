/**
 * Test Image Upload API
 * Test the image upload functionality with the car detailing image
 */

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testImageUpload() {
  try {
    console.log('=== Testing Image Upload API ===');
    
    // Get the installation ID
    const installationsResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installations = installationsResponse.data.installations;
    
    if (!installations || installations.length === 0) {
      console.log('❌ No OAuth installations found');
      return { success: false, error: 'No OAuth installations available' };
    }
    
    const installation = installations[0];
    console.log('Using installation:', installation.id);
    console.log('Token status:', installation.tokenStatus);
    console.log('Time until expiry:', installation.timeUntilExpiry, 'seconds');
    
    // Check if we have a test image file
    const imagePath = './attached_assets/From Dull to Dazzling_ How Our Exterior Detailing Makes a Difference_1750872068191.png';
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found at:', imagePath);
      return { success: false, error: 'Test image file not found' };
    }
    
    console.log('📷 Found test image file');
    console.log('File size:', fs.statSync(imagePath).size, 'bytes');
    
    // Create FormData for the upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('installation_id', installation.id);
    
    console.log('🚀 Uploading image to GoHighLevel media library...');
    
    const uploadResponse = await axios.post('https://dir.engageautomations.com/api/images/upload', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Upload successful!');
    console.log('Response:', uploadResponse.data);
    
    return {
      success: true,
      uploadResult: uploadResponse.data,
      message: 'Image successfully uploaded to GoHighLevel media library'
    };
    
  } catch (error) {
    console.error('❌ Image upload test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
      
      if (error.response.status === 404) {
        return {
          success: false,
          error: 'Image upload endpoint not found - deployment may still be in progress',
          suggestion: 'Wait for Railway deployment to complete, then try again'
        };
      }
    } else {
      console.error('Error:', error.message);
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

testImageUpload().then(result => {
  console.log('\n=== IMAGE UPLOAD TEST RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});