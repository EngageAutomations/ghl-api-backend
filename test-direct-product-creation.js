#!/usr/bin/env node

/**
 * Direct Product Creation Test
 * Tests actual GoHighLevel API product creation with fresh OAuth installation
 */

import https from 'https';

const installationId = 'install_1751436979939';

// Step 1: Get OAuth token from Railway backend
async function getOAuthToken() {
  console.log('🔑 Getting OAuth token from Railway backend...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: `/installations`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.installations && response.installations.length > 0) {
            const install = response.installations.find(i => i.id === installationId);
            if (install) {
              console.log('✅ Found installation with token');
              console.log('- Location ID:', install.locationId);
              console.log('- Token Status:', install.tokenStatus);
              resolve({
                accessToken: install.accessToken,
                locationId: install.locationId
              });
            } else {
              console.log('❌ Installation not found');
              resolve(null);
            }
          } else {
            console.log('❌ No installations found');
            resolve(null);
          }
        } catch (error) {
          console.log('❌ Parse error:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Step 2: Create product directly in GoHighLevel
async function createProductInGHL(accessToken, locationId) {
  console.log('🚀 Creating product directly in GoHighLevel...');
  
  const productData = {
    name: 'Premium Car Detailing Service',
    description: 'Professional exterior and interior car detailing with eco-friendly products and expert care. Complete wash, wax, vacuum, and detail service for premium results.',
    type: 'DIGITAL',
    locationId: locationId
  };

  console.log('Product data:', productData);

  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/products/',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Version': '2021-07-28'
      }
    };

    console.log('Making request to GoHighLevel API...');

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Response Body:', data);
        
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Product created successfully!');
            console.log('Product ID:', response.id);
            resolve(response);
          } else {
            console.log('⚠️ Product creation failed');
            console.log('Error:', response.message || response.error);
            resolve(null);
          }
        } catch (error) {
          console.log('⚠️ Non-JSON response or parse error');
          console.log('Raw response:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// Main test function
async function testDirectProductCreation() {
  console.log('🧪 DIRECT GOHIGHLEVEL PRODUCT CREATION TEST');
  console.log('Installation ID:', installationId);
  console.log('='.repeat(60));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData) {
    console.log('❌ Failed to get OAuth token');
    return;
  }

  console.log('Access token length:', tokenData.accessToken?.length || 0);
  console.log('Location ID:', tokenData.locationId);

  // Create product
  const result = await createProductInGHL(tokenData.accessToken, tokenData.locationId);
  
  console.log('\n🎯 TEST RESULTS');
  console.log('='.repeat(60));
  if (result) {
    console.log('✅ SUCCESS: Product created in GoHighLevel!');
    console.log('Product ID:', result.id);
    console.log('Product Name:', result.name);
  } else {
    console.log('❌ FAILED: Product creation unsuccessful');
    console.log('Check OAuth token permissions and API format');
  }
}

testDirectProductCreation().catch(console.error);