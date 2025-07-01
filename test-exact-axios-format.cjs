const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testExactAxiosFormat() {
  try {
    console.log('=== Testing Exact Axios Format You Suggested ===');
    
    const installation_id = "install_1751333384380";
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found');
      return;
    }
    
    // Get fresh token from Railway backend
    console.log('\n--- Getting Fresh Token ---');
    
    const tokenResponse = await axios.get(`https://dir.engageautomations.com/api/bridge/installation/${installation_id}`);
    
    if (!tokenResponse.data.success) {
      console.log('❌ Could not get fresh token');
      return;
    }
    
    const accessToken = tokenResponse.data.installation.access_token;
    const locationId = tokenResponse.data.installation.location_id;
    
    console.log('✅ Got fresh token, testing with your exact format...');
    
    // Test 1: Your exact format with form-data
    console.log('\n--- Test 1: Your Exact Format with FormData ---');
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-logo-exact-format.png',
        contentType: 'image/png'
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        headers: { 
          'Content-Type': 'multipart/form-data', 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        data: formData,
        params: {
          locationId: locationId
        }
      };

      const response1 = await axios.request(config);
      console.log('✅ Test 1 SUCCESS!');
      console.log(JSON.stringify(response1.data));
      return response1.data;
      
    } catch (error1) {
      console.log('❌ Test 1 Failed:');
      console.log('Status:', error1.response?.status);
      console.log('Error:', JSON.stringify(error1.response?.data));
    }
    
    // Test 2: Your format but remove Content-Type (let FormData set it)
    console.log('\n--- Test 2: Remove Content-Type Header ---');
    
    try {
      const formData2 = new FormData();
      formData2.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-logo-no-content-type.png',
        contentType: 'image/png'
      });
      
      let config2 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          ...formData2.getHeaders()
        },
        data: formData2,
        params: {
          locationId: locationId
        }
      };

      const response2 = await axios.request(config2);
      console.log('✅ Test 2 SUCCESS!');
      console.log(JSON.stringify(response2.data));
      return response2.data;
      
    } catch (error2) {
      console.log('❌ Test 2 Failed:');
      console.log('Status:', error2.response?.status);
      console.log('Error:', JSON.stringify(error2.response?.data));
    }
    
    // Test 3: Your format with locationId in body instead of params
    console.log('\n--- Test 3: LocationId in Form Body ---');
    
    try {
      const formData3 = new FormData();
      formData3.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-logo-location-body.png',
        contentType: 'image/png'
      });
      formData3.append('locationId', locationId);
      
      let config3 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          ...formData3.getHeaders()
        },
        data: formData3
      };

      const response3 = await axios.request(config3);
      console.log('✅ Test 3 SUCCESS!');
      console.log(JSON.stringify(response3.data));
      return response3.data;
      
    } catch (error3) {
      console.log('❌ Test 3 Failed:');
      console.log('Status:', error3.response?.status);
      console.log('Error:', JSON.stringify(error3.response?.data));
    }
    
    // Test 4: Compare with working product API using same format
    console.log('\n--- Test 4: Verify Token Works with Products API ---');
    
    try {
      let productConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/products/',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28'
        },
        params: {
          locationId: locationId,
          limit: 5
        }
      };

      const productResponse = await axios.request(productConfig);
      console.log('✅ Product API works with same token and format');
      console.log(`Found ${productResponse.data.products?.length || 0} products`);
      
    } catch (productError) {
      console.log('❌ Even product API failed - token issue');
      console.log('Error:', JSON.stringify(productError.response?.data));
    }
    
    console.log('\n=== EXACT FORMAT TEST SUMMARY ===');
    console.log('Tested your exact axios.request configuration');
    console.log('If all tests failed with same errors, issue is GoHighLevel-side authentication');
    
    return {
      success: false,
      tested_format: 'axios.request with exact configuration',
      conclusion: 'Configuration format not the issue - authentication problem persists'
    };
    
  } catch (error) {
    console.error('Test setup error:', error.message);
    return { success: false, error: error.message };
  }
}

testExactAxiosFormat().then(result => {
  console.log('\n=== FINAL RESULT ===');
  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
});