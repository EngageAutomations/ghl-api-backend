/**
 * Capture Complete Payload Details
 * Extract and display the exact multipart form data being sent
 */

const FormData = require('form-data');
const util = require('util');

async function captureCompletePayload() {
  console.log('📦 COMPLETE PAYLOAD CAPTURE');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    // Create test image
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    console.log('1. AUTHENTICATION TOKEN:');
    console.log(`   Full Token Length: ${tokenData.access_token.length} characters`);
    console.log(`   Token Type: JWT (JSON Web Token)`);
    console.log(`   Location ID: ${tokenData.location_id}`);
    
    // JWT decode for payload analysis
    const tokenParts = tokenData.access_token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log(`   Auth Class: ${payload.authClass}`);
      console.log(`   Auth Class ID: ${payload.authClassId}`);
      console.log(`   Scopes: ${payload.oauthMeta.scopes.join(', ')}`);
    }
    
    console.log('\n2. IMAGE FILE PAYLOAD:');
    console.log(`   File Format: PNG (Portable Network Graphics)`);
    console.log(`   File Size: ${testImageData.length} bytes`);
    console.log(`   Magic Number: ${testImageData.slice(0, 8).toString('hex')} (PNG signature)`);
    console.log(`   Width: 1 pixel`);
    console.log(`   Height: 1 pixel`);
    console.log(`   Complete Binary Data (hex):`);
    console.log(`   ${testImageData.toString('hex')}`);
    
    console.log('\n3. FORM DATA CONSTRUCTION:');
    const form = new FormData();
    form.append('file', testImageData, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    // Capture form headers
    const formHeaders = form.getHeaders();
    console.log(`   Boundary: ${formHeaders['content-type'].split('boundary=')[1]}`);
    console.log(`   Content-Type: ${formHeaders['content-type']}`);
    
    // Get raw form data
    const chunks = [];
    form.on('data', chunk => chunks.push(chunk));
    form.on('end', () => {
      const formBuffer = Buffer.concat(chunks);
      
      console.log('\n4. COMPLETE MULTIPART PAYLOAD:');
      console.log(`   Total Size: ${formBuffer.length} bytes`);
      console.log(`   Raw Payload:`);
      console.log('   ' + '='.repeat(70));
      console.log(formBuffer.toString().replace(/\r\n/g, '\\r\\n\n   '));
      console.log('   ' + '='.repeat(70));
      
      console.log('\n5. REQUEST STRUCTURE SUMMARY:');
      console.log(`   Method: POST`);
      console.log(`   URL: https://services.leadconnectorhq.com/medias/upload-file`);
      console.log(`   Content-Type: multipart/form-data; boundary=${formHeaders['content-type'].split('boundary=')[1]}`);
      console.log(`   Authorization: Bearer [${tokenData.access_token.length} chars]`);
      console.log(`   Version: 2021-07-28`);
      console.log(`   Accept: application/json`);
      
      console.log('\n6. PAYLOAD BREAKDOWN:');
      const formString = formBuffer.toString();
      const boundary = formHeaders['content-type'].split('boundary=')[1];
      const parts = formString.split(`--${boundary}`);
      
      parts.forEach((part, index) => {
        if (part.trim() && part !== '--') {
          console.log(`   Part ${index}:`);
          if (part.includes('Content-Disposition: form-data; name="file"')) {
            console.log(`     Type: File upload`);
            console.log(`     Field: "file"`);
            console.log(`     Filename: "test-image.png"`);
            console.log(`     Content-Type: image/png`);
            console.log(`     Binary data: ${testImageData.length} bytes`);
          } else if (part.includes('Content-Disposition: form-data; name="locationId"')) {
            console.log(`     Type: Text field`);
            console.log(`     Field: "locationId"`);
            console.log(`     Value: "${tokenData.location_id}"`);
          }
        }
      });
      
      console.log('\n7. EXPECTED vs ACTUAL RESULT:');
      console.log(`   Expected: 200/201 with media upload success`);
      console.log(`   Actual: 401 "This authClass type is not allowed to access this scope"`);
      console.log(`   Root Cause: IAM policy blocks Company authClass from media endpoints`);
      console.log(`   Scopes Present: medias.write, medias.readonly`);
      console.log(`   Technical Issue: Authentication class restriction, not request format`);
    });
    
    form.on('error', (error) => {
      console.error('Form generation error:', error);
    });
    
  } catch (error) {
    console.error('Payload capture failed:', error.message);
  }
}

captureCompletePayload().catch(console.error);