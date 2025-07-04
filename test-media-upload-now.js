/**
 * Test Media Upload with Current Installation
 * Test if Company-level token with medias.write scope can upload
 */

import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMediaUploadNow() {
  console.log('🖼️  TESTING MEDIA UPLOAD WITH CURRENT INSTALLATION');
  console.log('='.repeat(60));
  
  try {
    // Get current installation token
    console.log('1. Getting access token...');
    const tokenData = await getAccessToken('install_1751605944223');
    
    if (!tokenData.access_token) {
      console.log('❌ No access token available');
      return;
    }
    
    console.log('✅ Access token retrieved');
    console.log('📍 Location ID:', tokenData.location_id || 'not found');
    console.log('🔐 Auth Class:', tokenData.auth_class || 'unknown');
    console.log('📋 Scopes:', tokenData.scopes || 'not available');
    
    // Create a test image file
    console.log('');
    console.log('2. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple PNG image (1x1 pixel red)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // IHDR data
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF, // IDAT data
      0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, // IDAT data
      0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, // IEND chunk
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created');
    
    // Test media upload
    console.log('');
    console.log('3. Testing media upload to GoHighLevel...');
    const uploadResult = await uploadImageToGHL(tokenData.access_token, testImagePath);
    
    if (uploadResult.success) {
      console.log('🎉 SUCCESS: Media upload worked!');
      console.log('📄 Upload details:', uploadResult.data);
      console.log('');
      console.log('✅ CONCLUSION: Company-level token with medias.write scope CAN upload media');
      console.log('The IAM restriction may have been resolved or the scope makes the difference');
    } else {
      console.log('❌ FAILED: Media upload blocked');
      console.log('📄 Error details:', uploadResult.error);
      console.log('');
      console.log('⚠️  CONCLUSION: Still blocked despite medias.write scope');
      console.log('May need true Location-level authentication, not just scopes');
    }
    
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Test image cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Media upload test failed:', error.message);
  }
}

async function getAccessToken(installationId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: `/api/token-access/${installationId}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Token access failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function uploadImageToGHL(accessToken, imagePath) {
  return new Promise((resolve) => {
    const imageData = fs.readFileSync(imagePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    
    // Create multipart form data
    const formData = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="test-image.png"\r\n'),
      Buffer.from('Content-Type: image/png\r\n\r\n'),
      imageData,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/medias/upload-file',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📄 Media upload response status:', res.statusCode);
        console.log('📄 Media upload response:', data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          resolve({ success: false, error: `${res.statusCode} - ${data}` });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.write(formData);
    req.end();
  });
}

testMediaUploadNow().catch(console.error);