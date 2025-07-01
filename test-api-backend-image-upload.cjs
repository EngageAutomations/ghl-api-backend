/**
 * Test Image Upload API via Separate API Backend
 * Test image upload using the dedicated API backend at api.engageautomations.com
 */

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testAPIBackendImageUpload() {
  try {
    console.log('=== Testing Image Upload via API Backend ===');
    
    // First, get the installation ID from the OAuth backend
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
    
    // Check API backend status
    try {
      const apiHealthResponse = await axios.get('https://api.engageautomations.com/', { timeout: 10000 });
      console.log('✅ API backend is accessible');
    } catch (apiError) {
      console.log('❌ API backend not accessible:', apiError.message);
      
      // Try local Replit server instead
      console.log('🔄 Trying local Replit server...');
      try {
        const localHealthResponse = await axios.get('http://localhost:5000/', { timeout: 5000 });
        console.log('✅ Local Replit server is accessible');
        return await testLocalImageUpload(installation.id);
      } catch (localError) {
        return {
          success: false,
          error: 'Neither API backend nor local server accessible',
          details: { apiError: apiError.message, localError: localError.message }
        };
      }
    }
    
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
    
    console.log('🚀 Uploading image via API backend...');
    
    const uploadResponse = await axios.post('https://api.engageautomations.com/api/images/upload', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Upload successful via API backend!');
    console.log('Response:', uploadResponse.data);
    
    return {
      success: true,
      uploadResult: uploadResponse.data,
      backend: 'api.engageautomations.com',
      message: 'Image successfully uploaded via separate API backend'
    };
    
  } catch (error) {
    console.error('❌ API backend image upload test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      backend: 'api.engageautomations.com'
    };
  }
}

async function testLocalImageUpload(installationId) {
  try {
    console.log('=== Testing Local Server Image Upload ===');
    
    const imagePath = './attached_assets/From Dull to Dazzling_ How Our Exterior Detailing Makes a Difference_1750872068191.png';
    
    // Create FormData for the upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('installation_id', installationId);
    
    console.log('🚀 Uploading image via local server...');
    
    const uploadResponse = await axios.post('http://localhost:5000/api/images/upload', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Upload successful via local server!');
    console.log('Response:', uploadResponse.data);
    
    return {
      success: true,
      uploadResult: uploadResponse.data,
      backend: 'local Replit server',
      message: 'Image successfully uploaded via local server'
    };
    
  } catch (error) {
    console.error('❌ Local server upload failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
      backend: 'local server'
    };
  }
}

testAPIBackendImageUpload().then(result => {
  console.log('\n=== IMAGE UPLOAD TEST RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});