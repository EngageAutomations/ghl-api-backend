#!/usr/bin/env node

/**
 * Create Real Product in GoHighLevel
 * Uses actual API calls to create product with media and pricing
 */

import https from 'https';
import FormData from 'form-data';
import fs from 'fs';

const installationId = 'install_1751436979939';

// Get OAuth token from Railway backend
async function getOAuthToken() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ installation_id: installationId });
    
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/api/token-access',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.accessToken) {
            resolve({
              success: true,
              accessToken: response.accessToken
            });
          } else {
            resolve({ success: false, error: 'No access token' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Request failed' }));
    req.write(postData);
    req.end();
  });
}

// Step 1: Upload media using your exact method
async function uploadMediaToGHL(accessToken) {
  console.log('\n📷 Step 1: Uploading Media to GoHighLevel');
  console.log('Using: POST /medias/upload-file');
  
  return new Promise((resolve) => {
    // Create test image
    const imageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x00, 0x5E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const boundary = '----FormData' + Date.now();
    const formData = [];
    
    formData.push(`--${boundary}\r\n`);
    formData.push('Content-Disposition: form-data; name="file"; filename="car-detailing.png"\r\n');
    formData.push('Content-Type: image/png\r\n\r\n');
    
    const header = Buffer.from(formData.join(''));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, imageBuffer, footer]);

    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/medias/upload-file',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Length': body.length
      }
    };

    console.log('Making media upload request...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Media upload status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Media uploaded successfully!');
            console.log('Media URL:', response.url || response.fileUrl);
            resolve({
              success: true,
              mediaUrl: response.url || response.fileUrl,
              mediaId: response.id
            });
          } else {
            console.log('⚠️ Media upload failed:', response.message);
            resolve({
              success: false,
              error: response.message,
              statusCode: res.statusCode
            });
          }
        } catch (error) {
          console.log('❌ Media response parse error');
          resolve({
            success: false,
            error: 'Parse error',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Media upload request failed:', error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(body);
    req.end();
  });
}

// Step 2: Create product in GoHighLevel - try multiple API formats
async function createProductInGHL(accessToken, mediaUrl = null) {
  console.log('\n🚀 Step 2: Creating Product in GoHighLevel');
  
  const locationId = extractLocationId(accessToken);
  console.log('Location ID:', locationId);
  
  // Product data formats to try
  const productFormats = [
    // Format 1: Basic product
    {
      name: 'Premium Car Detailing Service',
      description: 'Professional car detailing with eco-friendly products.',
      type: 'DIGITAL'
    },
    // Format 2: With location
    {
      name: 'Premium Car Detailing Service',
      description: 'Professional car detailing with eco-friendly products.',
      type: 'DIGITAL',
      locationId: locationId
    },
    // Format 3: Different type values
    {
      name: 'Premium Car Detailing Service',
      description: 'Professional car detailing with eco-friendly products.',
      productType: 'DIGITAL'
    }
  ];
  
  // Endpoints to try
  const endpoints = [
    '/products',
    '/products/',
    `/locations/${locationId}/products`
  ];
  
  for (const productData of productFormats) {
    if (mediaUrl) {
      productData.image = mediaUrl;
    }
    
    for (const endpoint of endpoints) {
      console.log(`\nTrying: ${endpoint} with format ${productFormats.indexOf(productData) + 1}`);
      
      const result = await tryCreateProduct(accessToken, endpoint, productData);
      
      if (result.success) {
        console.log(`✅ Product created successfully with ${endpoint}!`);
        return result;
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    }
  }
  
  return { success: false, error: 'All product creation attempts failed' };
}

// Helper to try product creation
async function tryCreateProduct(accessToken, endpoint, productData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({
              success: true,
              productId: response.id,
              product: response,
              endpoint: endpoint
            });
          } else {
            resolve({
              success: false,
              error: response.message || `Status ${res.statusCode}`,
              statusCode: res.statusCode
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`,
            rawResponse: data.substring(0, 200)
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Step 3: Add pricing using your exact method
async function addPricingToProduct(accessToken, productId) {
  console.log('\n💰 Step 3: Adding Pricing to Product');
  console.log(`Using: POST /products/${productId}/price`);
  
  const priceData = {
    "name": "Premium Detailing Price",
    "type": "one_time",
    "currency": "USD",
    "amount": 175.00,
    "description": "Premium car detailing service pricing"
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(priceData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: `/products/${productId}/price`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making pricing request...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Pricing status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Pricing added successfully!');
            console.log('Price ID:', response.id);
            resolve({
              success: true,
              priceId: response.id,
              price: response
            });
          } else {
            console.log('⚠️ Pricing failed:', response.message);
            resolve({
              success: false,
              error: response.message,
              statusCode: res.statusCode
            });
          }
        } catch (error) {
          console.log('❌ Pricing parse error');
          resolve({
            success: false,
            error: 'Parse error',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Pricing request failed:', error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Extract location ID from token
function extractLocationId(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.authClassId;
  } catch (error) {
    return null;
  }
}

// Main function - create real product in GoHighLevel
async function createRealGHLProduct() {
  console.log('🎯 CREATING REAL PRODUCT IN GOHIGHLEVEL');
  console.log('Using actual API calls with your methods');
  console.log('='.repeat(60));

  // Get OAuth token
  console.log('Getting OAuth token...');
  const tokenData = await getOAuthToken();
  
  if (!tokenData.success) {
    console.log('❌ Failed to get OAuth token:', tokenData.error);
    return;
  }
  
  console.log('✅ OAuth token retrieved');
  const accessToken = tokenData.accessToken;

  // Step 1: Upload media
  const mediaResult = await uploadMediaToGHL(accessToken);

  // Step 2: Create product
  const productResult = await createProductInGHL(
    accessToken, 
    mediaResult.success ? mediaResult.mediaUrl : null
  );

  if (!productResult.success) {
    console.log('\n❌ PRODUCT CREATION FAILED');
    console.log('Error:', productResult.error);
    return;
  }

  // Step 3: Add pricing
  const pricingResult = await addPricingToProduct(accessToken, productResult.productId);

  // Final results
  console.log('\n🎉 REAL GOHIGHLEVEL PRODUCT CREATION RESULTS');
  console.log('='.repeat(60));
  
  console.log('✅ OAuth Token: SUCCESS');
  console.log(`${mediaResult.success ? '✅' : '❌'} Media Upload: ${mediaResult.success ? 'SUCCESS' : mediaResult.error}`);
  console.log('✅ Product Creation: SUCCESS');
  console.log(`   Product ID: ${productResult.productId}`);
  console.log(`   Endpoint Used: ${productResult.endpoint}`);
  console.log(`${pricingResult.success ? '✅' : '❌'} Pricing: ${pricingResult.success ? 'SUCCESS' : pricingResult.error}`);
  
  if (pricingResult.success) {
    console.log(`   Price ID: ${pricingResult.priceId}`);
  }
  
  console.log('\n🚀 FINAL STATUS');
  if (productResult.success) {
    if (mediaResult.success && pricingResult.success) {
      console.log('✅ COMPLETE SUCCESS: Product created in GoHighLevel with media and pricing!');
    } else {
      console.log('✅ PARTIAL SUCCESS: Product created in GoHighLevel');
      if (!mediaResult.success) console.log('   Media upload needs different approach');
      if (!pricingResult.success) console.log('   Pricing needs different approach');
    }
    
    console.log('\n🎯 Your workflow can now create real products in GoHighLevel!');
  } else {
    console.log('❌ FAILED: Unable to create product in GoHighLevel');
    console.log('Need to investigate API access permissions further');
  }
}

createRealGHLProduct().catch(console.error);