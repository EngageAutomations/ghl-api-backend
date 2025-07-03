/**
 * Show Current Media Upload Request Format
 * Display the exact request structure being used
 */

async function showCurrentRequestFormat() {
  console.log('📋 CURRENT MEDIA UPLOAD REQUEST FORMAT');
  console.log('Showing exact request structure being used');
  console.log('='.repeat(60));
  
  // Get access token for demonstration
  const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
  const tokenData = await tokenResponse.json();
  
  console.log('🔧 REQUEST DETAILS:');
  console.log('');
  
  console.log('📍 Endpoint:');
  console.log('  https://services.leadconnectorhq.com/medias/upload-file');
  console.log('');
  
  console.log('🌐 Method:');
  console.log('  POST');
  console.log('');
  
  console.log('📋 Headers:');
  console.log('  Authorization: Bearer [ACCESS_TOKEN]');
  console.log('  Version: 2021-07-28');
  console.log('  Content-Type: multipart/form-data');
  console.log('');
  
  console.log('📦 Body (FormData):');
  console.log('  file: [BINARY_DATA] (filename: test-image.png, contentType: image/png)');
  console.log('  locationId:', tokenData.location_id);
  console.log('');
  
  console.log('🔍 Actual Request Code:');
  console.log(`
const FormData = require('form-data');

const form = new FormData();
form.append('file', imageData, {
  filename: 'test-image.png',
  contentType: 'image/png'
});
form.append('locationId', '${tokenData.location_id}');

const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${tokenData.access_token.substring(0, 20)}...',
    'Version': '2021-07-28',
    ...form.getHeaders()
  },
  body: form
});
`);
  
  console.log('🎯 Current Result:');
  console.log('  Status: 401');
  console.log('  Error: "This authClass type is not allowed to access this scope"');
  console.log('');
  
  console.log('❓ COMPARISON NEEDED:');
  console.log('Please share the working request format you have so I can compare:');
  console.log('  - Endpoint URL');
  console.log('  - HTTP method');
  console.log('  - Headers structure');
  console.log('  - Body format');
  console.log('  - Field names');
  console.log('');
  
  // Also test with different field names that might work
  console.log('🧪 TESTING ALTERNATIVE FIELD NAMES:');
  
  const alternativeFormats = [
    { field: 'file', locationField: 'locationId' },
    { field: 'media', locationField: 'locationId' },
    { field: 'upload', locationField: 'location_id' },
    { field: 'file', locationField: 'location' }
  ];
  
  for (const format of alternativeFormats) {
    console.log(`\n🔬 Testing: ${format.field} + ${format.locationField}`);
    
    try {
      const testResult = await testMediaFormat(tokenData.access_token, tokenData.location_id, format);
      console.log(`   Status: ${testResult.status}`);
      
      if (testResult.status !== 401) {
        console.log(`   ✅ Different result with ${format.field}/${format.locationField}!`);
        console.log(`   Response: ${testResult.response.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
}

async function testMediaFormat(accessToken, locationId, format) {
  const FormData = require('form-data');
  
  // Create minimal test image
  const testImage = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const form = new FormData();
  form.append(format.field, testImage, {
    filename: 'test.png',
    contentType: 'image/png'
  });
  form.append(format.locationField, locationId);

  try {
    const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        ...form.getHeaders()
      },
      body: form
    });

    const responseText = await response.text();
    
    return {
      status: response.status,
      response: responseText
    };
  } catch (error) {
    return {
      status: 0,
      response: error.message
    };
  }
}

showCurrentRequestFormat().catch(console.error);