const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testOfficialMediaUpload() {
  try {
    console.log('=== Testing Official GoHighLevel Media Upload API ===');
    
    const installation_id = "install_1751333384380";
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found for testing');
      return;
    }
    
    console.log('\n--- Method 1: Official /medias/upload-file Endpoint ---');
    
    try {
      // Get fresh token
      const installationResponse = await axios.get(`https://dir.engageautomations.com/api/bridge/installation/${installation_id}`);
      
      if (!installationResponse.data.success) {
        console.log('❌ Could not get installation data');
        return;
      }
      
      console.log('✅ Got installation data, testing upload...');
      
      // Method 1: Standard upload-file endpoint (current implementation)
      const formData1 = new FormData();
      formData1.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-expressed-logo.png',
        contentType: 'image/png'
      });
      
      const upload1 = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData1, {
        headers: {
          'Authorization': `Bearer ${installationResponse.data.installation.access_token}`,
          'Version': '2021-07-28',
          ...formData1.getHeaders()
        },
        params: {
          locationId: installationResponse.data.installation.location_id
        },
        timeout: 30000
      });
      
      console.log('✅ Method 1 Success:', upload1.data);
      
    } catch (method1Error) {
      console.log('❌ Method 1 Failed:');
      console.log('Status:', method1Error.response?.status);
      console.log('Error:', method1Error.response?.data);
      console.log('Headers:', method1Error.response?.headers);
    }
    
    console.log('\n--- Method 2: Alternative /medias/ Endpoint ---');
    
    try {
      // Method 2: Try just /medias/ endpoint
      const formData2 = new FormData();
      formData2.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-expressed-logo-v2.png',
        contentType: 'image/png'
      });
      
      const upload2 = await axios.post('https://services.leadconnectorhq.com/medias/', formData2, {
        headers: {
          'Authorization': `Bearer ${installationResponse.data.installation.access_token}`,
          'Version': '2021-07-28',
          ...formData2.getHeaders()
        },
        params: {
          locationId: installationResponse.data.installation.location_id
        },
        timeout: 30000
      });
      
      console.log('✅ Method 2 Success:', upload2.data);
      
    } catch (method2Error) {
      console.log('❌ Method 2 Failed:');
      console.log('Status:', method2Error.response?.status);
      console.log('Error:', method2Error.response?.data);
    }
    
    console.log('\n--- Method 3: With Alt-Type Header (Marketplace Standard) ---');
    
    try {
      // Method 3: Try with Alt-Type header as per marketplace docs
      const formData3 = new FormData();
      formData3.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-expressed-logo-v3.png',
        contentType: 'image/png'
      });
      
      const upload3 = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData3, {
        headers: {
          'Authorization': `Bearer ${installationResponse.data.installation.access_token}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
          'Alt-Type': 'application/json',
          ...formData3.getHeaders()
        },
        params: {
          locationId: installationResponse.data.installation.location_id,
          altType: 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ Method 3 Success:', upload3.data);
      
    } catch (method3Error) {
      console.log('❌ Method 3 Failed:');
      console.log('Status:', method3Error.response?.status);
      console.log('Error:', method3Error.response?.data);
    }
    
    console.log('\n--- Method 4: Direct Form Data Structure ---');
    
    try {
      // Method 4: Try with different form data structure
      const formData4 = new FormData();
      const fileStats = fs.statSync(logoPath);
      
      formData4.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-expressed-logo-v4.png',
        contentType: 'image/png',
        knownLength: fileStats.size
      });
      formData4.append('locationId', installationResponse.data.installation.location_id);
      
      const upload4 = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData4, {
        headers: {
          'Authorization': `Bearer ${installationResponse.data.installation.access_token}`,
          'Version': '2021-07-28',
          ...formData4.getHeaders()
        },
        timeout: 30000
      });
      
      console.log('✅ Method 4 Success:', upload4.data);
      
    } catch (method4Error) {
      console.log('❌ Method 4 Failed:');
      console.log('Status:', method4Error.response?.status);
      console.log('Error:', method4Error.response?.data);
    }
    
    console.log('\n--- Method 5: Base64 Encoded Upload ---');
    
    try {
      // Method 5: Try base64 encoding (some APIs prefer this)
      const fileBuffer = fs.readFileSync(logoPath);
      const base64Data = fileBuffer.toString('base64');
      
      const upload5 = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', {
        file: base64Data,
        filename: 'maker-expressed-logo-v5.png',
        contentType: 'image/png',
        locationId: installationResponse.data.installation.location_id
      }, {
        headers: {
          'Authorization': `Bearer ${installationResponse.data.installation.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ Method 5 Success:', upload5.data);
      
    } catch (method5Error) {
      console.log('❌ Method 5 Failed:');
      console.log('Status:', method5Error.response?.status);
      console.log('Error:', method5Error.response?.data);
    }
    
    console.log('\n=== OAuth Scope Analysis ===');
    
    try {
      // Check current OAuth scopes
      const scopeCheck = await axios.get(`https://dir.engageautomations.com/api/bridge/installation/${installation_id}`);
      
      if (scopeCheck.data.success) {
        console.log('Current OAuth Scopes:', scopeCheck.data.installation.scopes);
        console.log('Media scope included:', scopeCheck.data.installation.scopes.includes('medias.write'));
      }
      
    } catch (scopeError) {
      console.log('❌ Could not check OAuth scopes:', scopeError.message);
    }
    
    console.log('\n=== CONCLUSION ===');
    console.log('All methods tested - if all failed with "authClass type not allowed",');
    console.log('the issue is likely in GoHighLevel OAuth app configuration, not API format.');
    
  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

testOfficialMediaUpload();