/**
 * Test Location Token Conversion Directly
 * Manual test using GoHighLevel's /oauth/locationToken API
 */

const axios = require('axios');

const INSTALLATION_ID = 'install_1751630886558';
const OAUTH_BACKEND = 'https://dir.engageautomations.com';

async function testLocationConversionDirect() {
  console.log('🧪 TESTING LOCATION TOKEN CONVERSION DIRECTLY');
  console.log('Using GoHighLevel /oauth/locationToken API');
  console.log('='.repeat(50));

  try {
    // Step 1: Get the Company token
    console.log('\n1. Getting Company token...');
    const tokenResponse = await axios.get(`${OAUTH_BACKEND}/api/token-access/${INSTALLATION_ID}`);
    const companyToken = tokenResponse.data.access_token;
    
    console.log('Company Token Info:');
    console.log('• Auth Class:', tokenResponse.data.auth_class);
    console.log('• Expires in:', tokenResponse.data.expires_in, 'seconds');
    console.log('• Location ID:', tokenResponse.data.location_id);

    // Step 2: Decode the JWT to get company ID
    console.log('\n2. Decoding JWT to get company ID...');
    const payload = decodeJWT(companyToken);
    console.log('JWT Payload:');
    console.log('• Auth Class:', payload.authClass);
    console.log('• Auth Class ID (Company ID):', payload.authClassId);
    console.log('• Location ID:', payload.locationId);

    // Step 3: Convert Company token to Location token
    console.log('\n3. Converting Company token to Location token...');
    const companyId = payload.authClassId;
    const locationId = 'WAvk87RmW9rBSDJHeOpH'; // Known working location

    const params = new URLSearchParams({
      companyId: companyId,
      locationId: locationId
    });

    console.log('Conversion parameters:');
    console.log('• Company ID:', companyId);
    console.log('• Location ID:', locationId);

    try {
      const conversionResponse = await axios.post(
        'https://services.leadconnectorhq.com/oauth/locationToken',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${companyToken}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('\n✅ LOCATION TOKEN CONVERSION SUCCESSFUL!');
      console.log('Location Token Data:');
      console.log('• Access Token:', conversionResponse.data.access_token ? 'Present' : 'Missing');
      console.log('• Refresh Token:', conversionResponse.data.refresh_token ? 'Present' : 'Missing');
      console.log('• Expires In:', conversionResponse.data.expires_in);
      console.log('• Location ID:', conversionResponse.data.locationId);

      // Step 4: Decode the Location token to verify
      console.log('\n4. Verifying Location token...');
      const locationPayload = decodeJWT(conversionResponse.data.access_token);
      console.log('Location Token JWT:');
      console.log('• Auth Class:', locationPayload.authClass);
      console.log('• Auth Class ID (Location ID):', locationPayload.authClassId);
      console.log('• Location ID:', locationPayload.locationId);

      // Step 5: Test media upload with Location token
      console.log('\n5. Testing media upload with Location token...');
      await testMediaUploadWithLocationToken(conversionResponse.data.access_token);

    } catch (conversionError) {
      console.error('\n❌ Location Token Conversion Failed:');
      console.error('Status:', conversionError.response?.status);
      console.error('Error:', conversionError.response?.data?.message || conversionError.message);
      
      if (conversionError.response?.status === 401) {
        console.log('💡 This may indicate the Company token lacks oauth.write scope');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testMediaUploadWithLocationToken(locationToken) {
  const FormData = require('form-data');
  const fs = require('fs');
  const path = require('path');

  try {
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-location-upload.png');
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageData);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-location-upload.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(
      'https://services.leadconnectorhq.com/medias/upload-file',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        timeout: 30000
      }
    );

    console.log('✅ MEDIA UPLOAD SUCCESSFUL WITH LOCATION TOKEN!');
    console.log('Upload Response:');
    console.log('• File ID:', uploadResponse.data.id);
    console.log('• File URL:', uploadResponse.data.url);
    console.log('• File Name:', uploadResponse.data.name);

    // Clean up test file
    fs.unlinkSync(testImagePath);

  } catch (uploadError) {
    console.error('❌ Media Upload Failed with Location Token:');
    console.error('Status:', uploadError.response?.status);
    console.error('Error:', uploadError.response?.data?.message || uploadError.message);
  }
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('JWT decode error:', error.message);
    return null;
  }
}

testLocationConversionDirect().catch(console.error);