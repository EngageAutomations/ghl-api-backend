/**
 * Test Location Token Conversion and Media Upload
 * Using fresh installation: install_1751630886558
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const INSTALLATION_ID = 'install_1751630886558';
const OAUTH_BACKEND = 'https://dir.engageautomations.com';

async function testLocationTokenConversion() {
  console.log('🎯 TESTING LOCATION TOKEN CONVERSION AND MEDIA UPLOAD');
  console.log('Installation ID:', INSTALLATION_ID);
  console.log('OAuth Backend:', OAUTH_BACKEND);
  console.log('='.repeat(60));

  try {
    // Step 1: Check installation status
    console.log('\n1. Checking installation status...');
    const statusResponse = await axios.get(`${OAUTH_BACKEND}/api/oauth/status?installation_id=${INSTALLATION_ID}`);
    console.log('Installation Status:', statusResponse.data);

    // Step 2: Get Company token info
    console.log('\n2. Getting Company token info...');
    const tokenResponse = await axios.get(`${OAUTH_BACKEND}/api/token-access/${INSTALLATION_ID}`);
    console.log('Company Token Info:', {
      token_type: tokenResponse.data.token_type,
      expires_in: tokenResponse.data.expires_in,
      auth_class: tokenResponse.data.auth_class,
      location_id: tokenResponse.data.location_id,
      scopes: tokenResponse.data.scope
    });

    // Step 3: Test location token conversion
    console.log('\n3. Testing location token conversion...');
    try {
      const locationTokenResponse = await axios.get(`${OAUTH_BACKEND}/api/location-token/${INSTALLATION_ID}`);
      console.log('✅ Location Token Conversion Successful!');
      console.log('Location Token Info:', {
        token_type: locationTokenResponse.data.token_type,
        expires_in: locationTokenResponse.data.expires_in,
        auth_class: locationTokenResponse.data.auth_class,
        location_id: locationTokenResponse.data.location_id,
        created_at: locationTokenResponse.data.created_at
      });
    } catch (error) {
      console.error('❌ Location Token Conversion Failed:', error.response?.data || error.message);
      console.log('This is expected if the backend hasn\'t been updated with conversion capability');
    }

    // Step 4: Test media upload (this should trigger automatic location token conversion)
    console.log('\n4. Testing media upload with automatic location token conversion...');
    
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageData);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    formData.append('installation_id', INSTALLATION_ID);

    try {
      const uploadResponse = await axios.post(`${OAUTH_BACKEND}/api/media/upload`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        timeout: 30000
      });

      console.log('✅ MEDIA UPLOAD SUCCESSFUL!');
      console.log('Upload Response:', uploadResponse.data);

      // Clean up test file
      fs.unlinkSync(testImagePath);

    } catch (uploadError) {
      console.error('❌ Media Upload Failed:', uploadError.response?.data || uploadError.message);
      console.log('Status Code:', uploadError.response?.status);
      
      // Clean up test file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }

    // Step 5: Check token health after upload attempt
    console.log('\n5. Checking token health after upload attempt...');
    try {
      const healthResponse = await axios.get(`${OAUTH_BACKEND}/api/token-health/${INSTALLATION_ID}`);
      console.log('Token Health:', healthResponse.data);
    } catch (error) {
      console.error('Token health check failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testDirectLocationTokenRequest() {
  console.log('\n🔄 TESTING DIRECT LOCATION TOKEN REQUEST');
  console.log('='.repeat(40));

  try {
    // Try to manually trigger location token conversion
    const conversionResponse = await axios.post(`${OAUTH_BACKEND}/api/convert-to-location/${INSTALLATION_ID}`);
    console.log('✅ Manual Location Token Conversion Successful!');
    console.log('Conversion Response:', conversionResponse.data);

    // Now try to get the location token
    const locationTokenResponse = await axios.get(`${OAUTH_BACKEND}/api/location-token/${INSTALLATION_ID}`);
    console.log('✅ Location Token Retrieved!');
    console.log('Location Token Info:', locationTokenResponse.data);

  } catch (error) {
    console.error('❌ Direct location token request failed:', error.response?.data || error.message);
    console.log('This is expected if the backend hasn\'t been updated with conversion capability');
  }
}

async function runTests() {
  await testLocationTokenConversion();
  await testDirectLocationTokenRequest();
  
  console.log('\n📋 TEST SUMMARY');
  console.log('='.repeat(20));
  console.log('• Company token info retrieved');
  console.log('• Location token conversion attempted');
  console.log('• Media upload with automatic conversion attempted');
  console.log('• Direct location token request attempted');
  console.log('');
  console.log('If conversions failed, the backend needs to be updated with');
  console.log('the enhanced-oauth-backend-with-location-conversion.js code');
}

runTests().catch(console.error);