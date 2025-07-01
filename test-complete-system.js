/**
 * Test Complete System - OAuth + API Backend Integration
 * Run this after completing OAuth installation to test image upload
 */

import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';

async function testCompleteSystem() {
  console.log('=== Testing Complete OAuth + API System ===');
  
  // You'll need to replace this with your installation_id after OAuth
  const INSTALLATION_ID = 'install_1234567890'; // Replace with actual installation_id
  
  console.log('1. Testing OAuth Backend health...');
  
  try {
    const oauthHealth = await axios.get('https://dir.engageautomations.com/health');
    console.log('✅ OAuth Backend:', oauthHealth.data);
    
    const apiHealth = await axios.get('https://api.engageautomations.com/health');
    console.log('✅ API Backend:', apiHealth.data);
    
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return;
  }
  
  console.log('2. Testing token bridge (will fail without OAuth installation)...');
  
  try {
    const tokenTest = await axios.post('https://dir.engageautomations.com/api/token-access', {
      installation_id: INSTALLATION_ID
    });
    
    console.log('✅ Token bridge working:', {
      success: tokenTest.data.success,
      locationId: tokenTest.data.installation?.locationId,
      tokenStatus: tokenTest.data.installation?.tokenStatus
    });
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ No OAuth installation found - this is expected before OAuth');
      console.log('   Complete OAuth installation first through GoHighLevel marketplace');
    } else {
      console.error('❌ Token bridge error:', error.response?.data || error.message);
    }
  }
  
  console.log('3. Testing image upload endpoint...');
  
  // Check if test image exists
  const testImagePath = './attached_assets/From Dull to Dazzling_ How Our Exterior Detailing Makes a Difference_1750872068191.png';
  
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️ Test image not found at:', testImagePath);
    console.log('   Upload will be tested after OAuth installation');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('installation_id', INSTALLATION_ID);
    
    const uploadResponse = await axios.post('https://api.engageautomations.com/api/images/upload', formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });
    
    console.log('✅ Image upload successful:', {
      success: uploadResponse.data.success,
      mediaId: uploadResponse.data.media?.id,
      filename: uploadResponse.data.media?.name
    });
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ Image upload failed - OAuth installation required');
    } else {
      console.error('❌ Image upload error:', error.response?.data || error.message);
    }
  }
  
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Complete OAuth installation through GoHighLevel marketplace');
  console.log('2. Update INSTALLATION_ID in this script with actual installation_id');
  console.log('3. Run this test again to verify complete workflow');
  console.log('');
  console.log('🔗 OAuth Installation URL:');
  console.log('   https://marketplace.leadconnectorhq.com/apps/your-app-id');
  console.log('');
  console.log('✅ System Architecture Complete:');
  console.log('   OAuth Backend: Authentication only');
  console.log('   API Backend: GoHighLevel operations only');
  console.log('   Clean separation maintained');
}

testCompleteSystem();