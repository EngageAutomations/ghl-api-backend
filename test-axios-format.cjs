/**
 * Test Axios Format for Media Upload
 * Use the exact axios structure provided by user
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testAxiosFormat() {
  console.log('🧪 TESTING AXIOS FORMAT FOR MEDIA UPLOAD');
  console.log('Using exact structure provided by user');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    console.log('📍 Location ID:', tokenData.location_id);
    
    // Create test image file
    const testImageData = createTestImage();
    
    // Test 1: Exact axios format from user (without file data)
    console.log('\n🔬 TEST 1: Exact user format (no file data)');
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://services.leadconnectorhq.com/medias/upload-file',
      headers: { 
        'Content-Type': 'multipart/form-data', 
        'Accept': 'application/json', 
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    };

    try {
      const response = await axios.request(config);
      console.log('✅ Success:', JSON.stringify(response.data));
    } catch (error) {
      console.log('📊 Status:', error.response?.status || 'No status');
      console.log('📋 Error:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        console.log('💡 400 error suggests endpoint works but needs file data');
      }
    }
    
    // Test 2: Axios format with proper FormData
    console.log('\n🔬 TEST 2: Axios with FormData');
    
    const form = new FormData();
    form.append('file', testImageData, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    let configWithData = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://services.leadconnectorhq.com/medias/upload-file',
      headers: { 
        'Accept': 'application/json', 
        'Authorization': `Bearer ${tokenData.access_token}`,
        ...form.getHeaders()
      },
      data: form
    };

    try {
      const response = await axios.request(configWithData);
      console.log('✅ Success with data:', JSON.stringify(response.data));
    } catch (error) {
      console.log('📊 Status:', error.response?.status || 'No status');
      console.log('📋 Error:', error.response?.data || error.message);
    }
    
    // Test 3: Axios with different header combinations
    console.log('\n🔬 TEST 3: Different header combinations');
    
    const headerVariations = [
      {
        name: 'No Content-Type (let axios set)',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      },
      {
        name: 'With Version header',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28'
        }
      },
      {
        name: 'Minimal headers',
        headers: { 
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    ];
    
    for (const variation of headerVariations) {
      console.log(`\n🧪 Testing: ${variation.name}`);
      
      const testConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        headers: {
          ...variation.headers,
          ...form.getHeaders()
        },
        data: form
      };

      try {
        const response = await axios.request(testConfig);
        console.log('✅ Success:', response.status, JSON.stringify(response.data).substring(0, 100));
      } catch (error) {
        console.log('📊 Status:', error.response?.status || 'No status');
        
        if (error.response?.status !== 401) {
          console.log('💡 Different result!');
          console.log('📋 Response:', error.response?.data || error.message);
        } else {
          console.log('❌ Still 401 IAM error');
        }
      }
    }
    
    // Test 4: Different endpoints with axios
    console.log('\n🔬 TEST 4: Alternative endpoints with axios');
    
    const endpoints = [
      'https://services.leadconnectorhq.com/medias/upload',
      'https://services.leadconnectorhq.com/media/upload',
      'https://rest.gohighlevel.com/v1/medias/upload'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🧪 Testing endpoint: ${endpoint}`);
      
      const endpointConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: endpoint,
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${tokenData.access_token}`,
          ...form.getHeaders()
        },
        data: form
      };

      try {
        const response = await axios.request(endpointConfig);
        console.log('✅ Found working endpoint!');
        console.log('📊 Status:', response.status);
        console.log('📋 Data:', JSON.stringify(response.data));
      } catch (error) {
        console.log('📊 Status:', error.response?.status || 'No status');
        
        if (error.response?.status === 404) {
          console.log('❌ Endpoint not found');
        } else if (error.response?.status !== 401) {
          console.log('💡 Different response:', error.response?.data);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function createTestImage() {
  // Create a simple PNG test image (1x1 pixel)
  const pngData = Buffer.from([
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
  
  return pngData;
}

testAxiosFormat().catch(console.error);