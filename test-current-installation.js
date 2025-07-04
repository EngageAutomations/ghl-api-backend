/**
 * Test Media Upload with Current Installation
 * Check if Company-level token now works with case-sensitive fix
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testCurrentInstallation() {
  console.log('🎯 TESTING CURRENT INSTALLATION');
  console.log('='.repeat(50));
  
  try {
    const installationId = 'install_1751582859348';
    
    console.log('1. Getting installation details...');
    const installsResponse = await fetch('https://dir.engageautomations.com/installations');
    const data = await installsResponse.json();
    
    const installation = data.installations[0];
    console.log('📊 Installation ID:', installation.id);
    console.log('📍 Location ID:', installation.location_id);
    console.log('🔐 Auth Class:', installation.auth_class);
    console.log('🔑 Scopes:', installation.scopes);
    
    console.log('2. Getting access token...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('❌ No access token available:', tokenData);
      return;
    }
    
    console.log('✅ Access token retrieved');
    console.log('🔐 Token expires in:', tokenData.expires_in, 'seconds');
    
    // Extract location ID from JWT token
    const tokenParts = tokenData.access_token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('📍 Location ID from token:', payload.locationId);
    console.log('🔐 Auth Class from token:', payload.authClass);
    
    console.log('3. Testing media upload...');
    
    // Create a test image file
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('/tmp/test-image.png', testImageData);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('/tmp/test-image.png'), {
      filename: 'test-upload.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.text();
    console.log('📤 Upload Response Status:', uploadResponse.status);
    console.log('📤 Upload Response:', uploadResult);
    
    if (uploadResponse.status === 200 || uploadResponse.status === 201) {
      console.log('✅ MEDIA UPLOAD SUCCESS!');
      
      // Test media listing
      console.log('4. Testing media listing...');
      const mediaResponse = await fetch(`https://services.leadconnectorhq.com/locations/${payload.locationId}/medias`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28'
        }
      });
      
      const mediaResult = await mediaResponse.text();
      console.log('📋 Media List Status:', mediaResponse.status);
      console.log('📋 Media List:', mediaResult);
      
    } else {
      console.log('❌ Media upload failed');
      
      if (uploadResult.includes('IAM') || uploadResult.includes('scope')) {
        console.log('');
        console.log('🔍 ANALYSIS: Still IAM/scope restricted');
        console.log('• Current auth class:', payload.authClass);
        console.log('• Available scopes:', installation.scopes.split(' '));
        console.log('• Media upload may still be restricted at account level');
      }
    }
    
    // Test product creation to verify token works
    console.log('5. Testing product creation to verify token...');
    const productData = {
      name: 'Test Product Media Upload',
      productType: 'DIGITAL',
      locationId: payload.locationId,
      available: true,
      currency: 'USD',
      prices: [{
        name: 'Standard',
        amount: 2999,
        currency: 'USD',
        type: 'one_time'
      }]
    };
    
    const productResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const productResult = await productResponse.text();
    console.log('🛍️ Product Creation Status:', productResponse.status);
    console.log('🛍️ Product Creation Result:', productResult);
    
    // Cleanup
    fs.unlinkSync('/tmp/test-image.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrentInstallation().catch(console.error);