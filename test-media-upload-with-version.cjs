/**
 * Test Media Upload with New OAuth Version
 * Check if Location-level tokens now work for media upload
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testMediaUploadWithVersion() {
  console.log('🧪 TESTING MEDIA UPLOAD WITH NEW OAUTH VERSION');
  console.log('Checking if Location-level tokens resolve IAM restriction');
  console.log('='.repeat(60));
  
  try {
    // 1. Check OAuth backend version
    console.log('1. Checking OAuth backend version...');
    const backendInfo = await getBackendInfo();
    console.log('📋 Backend Version:', backendInfo.version);
    console.log('📋 Features:', backendInfo.features);
    console.log('📋 Installations:', backendInfo.installs);
    console.log('');
    
    // 2. Get latest installation
    console.log('2. Getting latest installation...');
    const installations = await getInstallations();
    
    if (installations.length === 0) {
      console.log('❌ No installations found');
      return;
    }
    
    const latestInstall = installations[installations.length - 1];
    console.log('📍 Latest Installation:', latestInstall.id);
    console.log('📍 Location ID:', latestInstall.location_id);
    console.log('📍 Auth Class:', latestInstall.auth_class);
    console.log('📍 Scopes:', latestInstall.scopes);
    console.log('📍 Method:', latestInstall.method);
    console.log('');
    
    // 3. Get access token
    console.log('3. Getting access token...');
    const tokenData = await getAccessToken(latestInstall.id);
    console.log('🔐 Token Type:', tokenData.token_type);
    console.log('🔐 Auth Class:', tokenData.auth_class);
    console.log('🔐 Location ID:', tokenData.location_id);
    console.log('🔐 Scopes:', tokenData.scopes);
    console.log('⏱️  Expires In:', Math.floor(tokenData.expires_in / 60), 'minutes');
    console.log('');
    
    // 4. Analyze token for Location-level access
    console.log('4. Analyzing token for Location-level access...');
    const tokenPayload = decodeJWTPayload(tokenData.access_token);
    console.log('🔍 JWT Analysis:');
    console.log('📍 Auth Class:', tokenPayload?.authClass);
    console.log('📍 Location ID:', tokenPayload?.locationId || tokenPayload?.location_id);
    console.log('📍 User Type:', tokenPayload?.userType);
    console.log('📍 Company ID:', tokenPayload?.companyId);
    console.log('');
    
    if (tokenPayload?.authClass === 'Location') {
      console.log('🎉 SUCCESS: Location-level token detected!');
      console.log('✅ Should have media upload access');
    } else if (tokenPayload?.authClass === 'Company') {
      console.log('⚠️  WARNING: Still Company-level token');
      console.log('❌ Media upload may still be blocked');
    }
    console.log('');
    
    // 5. Test media upload
    console.log('5. Testing media upload...');
    
    // Create a simple test image file
    const testImageContent = createTestImageSVG();
    fs.writeFileSync('./test-image.svg', testImageContent);
    
    const uploadResult = await testMediaUpload(tokenData.access_token, tokenData.location_id);
    console.log('📤 Upload Result:', uploadResult);
    
    // Clean up test file
    if (fs.existsSync('./test-image.svg')) {
      fs.unlinkSync('./test-image.svg');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function getBackendInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Backend info failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function getInstallations() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/installations',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          resolve(result.installations || []);
        } else {
          reject(new Error(`Get installations failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function getAccessToken(installationId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: `/api/token-access/${installationId}`,
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Get access token failed: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('❌ Error decoding JWT payload:', error);
    return null;
  }
}

function createTestImageSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#4F46E5"/>
  <text x="50" y="55" font-family="Arial" font-size="14" fill="white" text-anchor="middle">TEST</text>
</svg>`;
}

async function testMediaUpload(accessToken, locationId) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', fs.createReadStream('./test-image.svg'), {
      filename: 'test-image.svg',
      contentType: 'image/svg+xml'
    });
    form.append('hosted', 'true');
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/medias/upload-file',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-04-15',
        ...form.getHeaders()
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📤 Upload Response Status:', res.statusCode);
        console.log('📤 Upload Response:', data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SUCCESS: Media upload worked!');
          console.log('🎉 Location-level token has media upload access');
          resolve({ success: true, status: res.statusCode, data: JSON.parse(data) });
        } else if (res.statusCode === 401) {
          console.log('❌ FAILURE: 401 Unauthorized - IAM restriction still active');
          resolve({ success: false, status: res.statusCode, error: data });
        } else {
          console.log(`❌ FAILURE: ${res.statusCode} - ${data}`);
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Upload request error:', error);
      reject(error);
    });
    
    form.pipe(req);
  });
}

testMediaUploadWithVersion().catch(console.error);