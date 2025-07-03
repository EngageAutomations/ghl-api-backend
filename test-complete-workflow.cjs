/**
 * Test Complete GoHighLevel Workflow
 * Product creation + Media upload + Pricing - Full end-to-end test
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testCompleteWorkflow() {
  console.log('🚀 TESTING COMPLETE GOHIGHLEVEL WORKFLOW');
  console.log('Product Creation → Media Upload → Pricing');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get access token
    console.log('📡 Step 1: Getting access token...');
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    console.log('📍 Location ID:', tokenData.location_id);
    
    // Step 2: Create product with working structure
    console.log('\n🛍️ Step 2: Creating product...');
    const productData = {
      name: 'Complete Workflow Test Product',
      description: 'Testing complete workflow: product creation, media upload, and pricing setup.',
      productType: 'DIGITAL',
      locationId: tokenData.location_id,
      available: true,
      currency: 'USD'
    };
    
    const productResult = await createProduct(tokenData.access_token, productData);
    
    if (!productResult.success) {
      console.log('❌ Product creation failed:', productResult.error);
      return;
    }
    
    console.log('✅ Product created successfully');
    console.log('🆔 Product ID:', productResult.productId);
    
    // Step 3: Test media upload
    console.log('\n📸 Step 3: Testing media upload...');
    
    // Create a test image file
    const testImageData = createTestImage();
    const mediaResult = await uploadMedia(tokenData.access_token, testImageData, tokenData.location_id);
    
    if (mediaResult.success) {
      console.log('✅ Media upload successful');
      console.log('🖼️ Media URL:', mediaResult.mediaUrl);
      
      // Step 4: Add media to product
      console.log('\n🔗 Step 4: Linking media to product...');
      const linkResult = await linkMediaToProduct(tokenData.access_token, productResult.productId, mediaResult.mediaId);
      
      if (linkResult.success) {
        console.log('✅ Media linked to product');
      } else {
        console.log('⚠️ Media linking failed:', linkResult.error);
      }
    } else {
      console.log('⚠️ Media upload failed:', mediaResult.error);
    }
    
    // Step 5: Create pricing
    console.log('\n💰 Step 5: Creating product pricing...');
    
    const pricingData = {
      name: 'Standard Price',
      amount: 19999, // $199.99 in cents
      currency: 'USD',
      type: 'one_time',
      productId: productResult.productId
    };
    
    const pricingResult = await createPricing(tokenData.access_token, productResult.productId, pricingData);
    
    if (pricingResult.success) {
      console.log('✅ Pricing created successfully');
      console.log('💳 Price ID:', pricingResult.priceId);
    } else {
      console.log('⚠️ Pricing creation failed:', pricingResult.error);
    }
    
    // Step 6: Verify complete product
    console.log('\n🔍 Step 6: Verifying complete product...');
    const verifyResult = await verifyProduct(tokenData.access_token, productResult.productId);
    
    if (verifyResult.success) {
      console.log('✅ Product verification successful');
      console.log('📦 Final product details:');
      console.log('   Name:', verifyResult.product.name);
      console.log('   ID:', verifyResult.product._id);
      console.log('   Media count:', verifyResult.product.medias?.length || 0);
      console.log('   Price count:', verifyResult.product.prices?.length || 0);
    }
    
    console.log('\n🎉 COMPLETE WORKFLOW TEST FINISHED');
    console.log('✅ Product creation: Working');
    console.log(mediaResult.success ? '✅' : '⚠️', 'Media upload:', mediaResult.success ? 'Working' : 'Needs attention');
    console.log(pricingResult.success ? '✅' : '⚠️', 'Pricing creation:', pricingResult.success ? 'Working' : 'Needs attention');
    
    return {
      productCreation: true,
      mediaUpload: mediaResult.success,
      pricing: pricingResult.success,
      productId: productResult.productId
    };
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    return { error: error.message };
  }
}

async function createProduct(accessToken, productData) {
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
              productId: response._id,
              product: response
            });
          } else {
            resolve({
              success: false,
              error: response.message || `Status ${res.statusCode}`
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`
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

async function uploadMedia(accessToken, imageData, locationId) {
  try {
    const form = new FormData();
    form.append('file', imageData, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    form.append('locationId', locationId);

    const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        ...form.getHeaders()
      },
      body: form
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        mediaId: result.id,
        mediaUrl: result.url || result.fileUrl
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `Media upload failed: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Media upload error: ${error.message}`
    };
  }
}

async function createPricing(accessToken, productId, pricingData) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(pricingData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: `/products/${productId}/prices`,
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
              priceId: response._id || response.id,
              price: response
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
            rawResponse: data
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

async function linkMediaToProduct(accessToken, productId, mediaId) {
  const updateData = {
    medias: [mediaId]
  };
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(updateData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: `/products/${productId}`,
      method: 'PUT',
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
        resolve({
          success: res.statusCode === 200 || res.statusCode === 201,
          statusCode: res.statusCode,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function verifyProduct(accessToken, productId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: `/products/${productId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const product = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            product: product,
            statusCode: res.statusCode
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Parse error: ${error.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

function createTestImage() {
  // Create a simple PNG test image (1x1 pixel)
  const pngData = Buffer.from([
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
  
  return pngData;
}

testCompleteWorkflow().then(result => {
  console.log('\n📊 FINAL WORKFLOW RESULTS:');
  console.log(JSON.stringify(result, null, 2));
}).catch(console.error);