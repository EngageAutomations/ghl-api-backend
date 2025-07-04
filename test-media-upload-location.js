/**
 * Test Media Upload with Location-Level Authentication
 * Using the fresh OAuth installation with case-sensitive Location auth
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testMediaUploadLocation() {
  console.log('🎯 TESTING MEDIA UPLOAD WITH LOCATION-LEVEL AUTH');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Fetching installations from OAuth backend...');
    const installsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installations = await installsResponse.json();
    
    console.log('📊 Current installations:', installations.length);
    
    if (installations.length === 0) {
      console.log('❌ No installations found. OAuth installation needed first.');
      return;
    }
    
    const installation = installations[0];
    console.log('🎯 Using installation:', installation.installation_id);
    console.log('📍 Location ID:', installation.location_id);
    console.log('🔐 Auth Class:', installation.authClass);
    
    console.log('2. Getting fresh access token...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.installation_id}`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('❌ No access token available:', tokenData);
      return;
    }
    
    console.log('✅ Access token retrieved');
    console.log('🔐 Token type:', tokenData.token_type);
    console.log('📍 Location ID from token:', tokenData.location_id);
    
    console.log('3. Testing media upload with Location-level token...');
    
    // Create a test image file
    const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('/tmp/test-image.png', testImageData);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('/tmp/test-image.png'), {
      filename: 'test-image.png',
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
    console.log('📤 Upload Response Headers:', Object.fromEntries(uploadResponse.headers));
    
    if (uploadResponse.status === 200 || uploadResponse.status === 201) {
      console.log('✅ MEDIA UPLOAD SUCCESS!');
      console.log('📄 Upload result:', uploadResult);
      
      // Test getting media files
      console.log('4. Testing media files listing...');
      const mediaResponse = await fetch(`https://services.leadconnectorhq.com/locations/${installation.location_id}/medias`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28'
        }
      });
      
      const mediaResult = await mediaResponse.text();
      console.log('📋 Media List Status:', mediaResponse.status);
      console.log('📋 Media List Result:', mediaResult);
      
    } else {
      console.log('❌ Media upload failed');
      console.log('📄 Error response:', uploadResult);
      
      // Check if it's still an IAM/scope issue
      if (uploadResult.includes('IAM') || uploadResult.includes('scope') || uploadResult.includes('permission')) {
        console.log('');
        console.log('🔍 ANALYSIS: IAM/Scope restriction detected');
        console.log('• Location-level token obtained but upload still restricted');
        console.log('• May need additional scopes or permissions');
        console.log('• GoHighLevel might require specific media upload permissions');
      }
    }
    
    // Cleanup
    fs.unlinkSync('/tmp/test-image.png');
    
  } catch (error) {
    console.error('❌ Media upload test failed:', error.message);
  }
}

testMediaUploadLocation().catch(console.error);