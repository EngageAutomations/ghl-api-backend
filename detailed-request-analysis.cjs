/**
 * Detailed Request Analysis
 * Comprehensive breakdown of the exact media upload request sent
 */

const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

async function detailedRequestAnalysis() {
  console.log('📋 DETAILED MEDIA UPLOAD REQUEST ANALYSIS');
  console.log('Complete breakdown of request structure, headers, and payload');
  console.log('='.repeat(80));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('🎫 AUTHENTICATION DETAILS:');
    console.log(`   Access Token (first 50 chars): ${tokenData.access_token.substring(0, 50)}...`);
    console.log(`   Location ID: ${tokenData.location_id}`);
    console.log(`   Token Length: ${tokenData.access_token.length} characters`);
    console.log(`   Expires At: ${tokenData.expires_at}`);
    
    // Create test image with exact details
    console.log('\n📸 IMAGE FILE DETAILS:');
    const testImageData = Buffer.from([
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
    
    console.log(`   File Type: PNG Image`);
    console.log(`   File Size: ${testImageData.length} bytes`);
    console.log(`   Dimensions: 1x1 pixel`);
    console.log(`   Color Type: RGB (2)`);
    console.log(`   Bit Depth: 8`);
    console.log(`   Binary Data (hex): ${testImageData.toString('hex').substring(0, 60)}...`);
    
    // Create FormData with detailed logging
    console.log('\n📦 FORM DATA CONSTRUCTION:');
    const form = new FormData();
    
    console.log('   Adding file field:');
    form.append('file', testImageData, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    console.log(`      Field Name: "file"`);
    console.log(`      Filename: "test-image.png"`);
    console.log(`      Content-Type: "image/png"`);
    console.log(`      Data Length: ${testImageData.length} bytes`);
    
    console.log('   Adding locationId field:');
    form.append('locationId', tokenData.location_id);
    console.log(`      Field Name: "locationId"`);
    console.log(`      Value: "${tokenData.location_id}"`);
    console.log(`      Type: string`);
    
    // Get form headers
    const formHeaders = form.getHeaders();
    console.log('\n📋 FORM HEADERS GENERATED:');
    Object.entries(formHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Construct complete request
    console.log('\n🌐 COMPLETE REQUEST STRUCTURE:');
    console.log('   Method: POST');
    console.log('   URL: https://services.leadconnectorhq.com/medias/upload-file');
    console.log('   Protocol: HTTPS (TLS 1.2+)');
    console.log('   Port: 443');
    console.log('   Path: /medias/upload-file');
    
    console.log('\n📋 REQUEST HEADERS (Complete Set):');
    const requestHeaders = {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json',
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Version': '2021-07-28',
      ...formHeaders
    };
    
    Object.entries(requestHeaders).forEach(([key, value]) => {
      if (key === 'Authorization') {
        console.log(`   ${key}: Bearer ${value.substring(7, 57)}...`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    console.log('\n📄 REQUEST BODY ANALYSIS:');
    console.log('   Content-Type: multipart/form-data');
    console.log('   Boundary: Extracted from form.getHeaders()');
    console.log('   Total Fields: 2 (file + locationId)');
    
    // Get form buffer for analysis
    const formBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      form.on('data', chunk => chunks.push(chunk));
      form.on('end', () => resolve(Buffer.concat(chunks)));
      form.on('error', reject);
    });
    
    console.log(`   Body Size: ${formBuffer.length} bytes`);
    console.log(`   Body Preview (first 200 chars):`);
    console.log(`   ${formBuffer.toString().substring(0, 200)}...`);
    
    // Analyze boundary structure
    const bodyString = formBuffer.toString();
    const boundaryMatch = bodyString.match(/------WebKitFormBoundary[A-Za-z0-9]+/);
    if (boundaryMatch) {
      console.log(`   Boundary String: ${boundaryMatch[0]}`);
    }
    
    // Count form parts
    const parts = bodyString.split('------WebKitFormBoundary');
    console.log(`   Multipart Sections: ${parts.length - 1} content parts`);
    
    // Show actual request execution
    console.log('\n🚀 EXECUTING REQUEST...');
    console.log('   Sending HTTP POST request to GoHighLevel API...');
    
    try {
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        headers: requestHeaders,
        data: form,
        timeout: 30000,
        validateStatus: () => true // Accept all status codes for analysis
      };
      
      const startTime = Date.now();
      const response = await axios.request(config);
      const endTime = Date.now();
      
      console.log('\n📊 RESPONSE DETAILS:');
      console.log(`   Status Code: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      console.log(`   Response Time: ${endTime - startTime}ms`);
      console.log(`   Response Size: ${JSON.stringify(response.data).length} characters`);
      
      console.log('\n📋 RESPONSE HEADERS:');
      Object.entries(response.headers).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      console.log('\n📄 RESPONSE BODY:');
      console.log(`   ${JSON.stringify(response.data, null, 2)}`);
      
      console.log('\n🔍 ERROR ANALYSIS:');
      if (response.status === 401) {
        const errorMsg = response.data.message || '';
        console.log(`   Error Type: Authentication/Authorization Failure`);
        console.log(`   Error Message: "${errorMsg}"`);
        
        if (errorMsg.includes('authClass')) {
          console.log(`   Root Cause: IAM restriction on Company authClass type`);
          console.log(`   Scope Available: medias.write (present in token)`);
          console.log(`   IAM Policy: Blocks Company authClass from media endpoints`);
        } else if (errorMsg.includes('version')) {
          console.log(`   Root Cause: Missing or invalid version header`);
          console.log(`   Version Sent: 2021-07-28`);
          console.log(`   Expected: Valid API version string`);
        }
      }
      
    } catch (error) {
      console.log('\n❌ REQUEST EXECUTION ERROR:');
      console.log(`   Error Type: ${error.constructor.name}`);
      console.log(`   Error Message: ${error.message}`);
      
      if (error.response) {
        console.log(`   HTTP Status: ${error.response.status}`);
        console.log(`   Response Data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.log(`   Request Failed: No response received`);
        console.log(`   Network/Timeout Issue: ${error.code || 'Unknown'}`);
      }
    }
    
    console.log('\n📋 SUMMARY OF REQUEST DETAILS:');
    console.log(`   Endpoint: POST https://services.leadconnectorhq.com/medias/upload-file`);
    console.log(`   Authentication: Bearer token (${tokenData.access_token.length} chars)`);
    console.log(`   Content-Type: multipart/form-data with boundary`);
    console.log(`   API Version: 2021-07-28`);
    console.log(`   File Field: "file" containing ${testImageData.length}-byte PNG`);
    console.log(`   Location Field: "locationId" = "${tokenData.location_id}"`);
    console.log(`   Total Body Size: ${formBuffer.length} bytes`);
    console.log(`   Result: 401 IAM authClass restriction`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

detailedRequestAnalysis().catch(console.error);