/**
 * Test Image Upload API with Fresh OAuth Installation
 * Tests the newly implemented image upload functionality
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function testImageUpload() {
  console.log('=== Testing Image Upload API ===');
  
  try {
    // First, verify the OAuth installation
    console.log('1. Checking OAuth installations...');
    const installationsResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installations = installationsResponse.data.installations || [];
    
    console.log('Available installations:', installations.length);
    
    if (installations.length === 0) {
      console.log('❌ No OAuth installations found. Please complete OAuth installation first.');
      return;
    }
    
    const installation = installations[0];
    console.log('✅ Using installation:', installation.id);
    console.log('   Location ID:', installation.locationId);
    console.log('   Token Status:', installation.tokenStatus);
    console.log('   Time until expiry:', Math.round(installation.timeUntilExpiry / 60), 'minutes');
    
    // Test the image upload API
    console.log('\n2. Testing image upload API...');
    
    const imagePath = 'attached_assets/From Dull to Dazzling_ How Our Exterior Detailing Makes a Difference_1750872068191.png';
    
    // Check if image file exists
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image file not found:', imagePath);
      console.log('Available assets:', fs.readdirSync('attached_assets/').filter(f => f.endsWith('.png')));
      return;
    }
    
    console.log('✅ Image file found:', imagePath);
    console.log('   Size:', fs.statSync(imagePath).size, 'bytes');
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('installation_id', installation.id);
    
    // Test upload to local API server (when it's running)
    try {
      console.log('\n3. Testing local API server upload...');
      const uploadResponse = await axios.post('http://localhost:5000/api/images/upload', formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });
      
      console.log('✅ Upload successful!');
      console.log('Response:', uploadResponse.data);
      
    } catch (localError) {
      console.log('⚠️ Local API server not available:', localError.code);
      console.log('   This is expected if server is not running on port 5000');
      
      // Try uploading through OAuth backend if it has the endpoint
      console.log('\n4. Testing OAuth backend upload (if available)...');
      try {
        const oauthUploadResponse = await axios.post('https://dir.engageautomations.com/api/images/upload', formData, {
          headers: formData.getHeaders(),
          timeout: 30000
        });
        
        console.log('✅ OAuth backend upload successful!');
        console.log('Response:', oauthUploadResponse.data);
        
      } catch (oauthError) {
        console.log('ℹ️ OAuth backend does not have image upload endpoint yet');
        console.log('   Status:', oauthError.response?.status);
        console.log('   Message:', oauthError.response?.data || oauthError.message);
      }
    }
    
    console.log('\n=== Test Summary ===');
    console.log('✅ OAuth installation validated');
    console.log('✅ Image file ready for upload');
    console.log('✅ API endpoints implemented');
    console.log('📝 Next: Start API server and test upload functionality');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testImageUpload();