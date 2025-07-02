#!/usr/bin/env node

/**
 * Fixed Complete GoHighLevel Product Workflow
 * Addresses version header and endpoint issues
 */

import https from 'https';
import fs from 'fs';

const installationId = 'install_1751436979939';

// Get OAuth token from Railway backend
async function getOAuthToken() {
  console.log('🔑 Getting OAuth token from Railway backend...');
  
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.accessToken) {
            console.log('✅ OAuth token retrieved successfully');
            resolve({
              accessToken: response.accessToken,
              installation: response.installation
            });
          } else {
            console.log('❌ Failed to get OAuth token');
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

    req.write(postData);
    req.end();
  });
}

// Extract location ID from token
function extractLocationId(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.authClassId || null;
  } catch (error) {
    console.log('Error extracting location ID:', error.message);
    return null;
  }
}

// Step 1: Upload media with proper version header
async function uploadMedia(accessToken, imageFilePath) {
  console.log('\n📷 Step 1: Uploading Media to GoHighLevel');
  console.log('Using method: POST /medias/upload-file');
  console.log('Adding Version header to fix 401 error');
  
  return new Promise((resolve) => {
    // Create a simple test image
    const imageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x00, 0x5E, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const boundary = '----formdata-boundary-' + Date.now();
    
    const formParts = [];
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="file"; filename="car-detailing.png"');
    formParts.push('Content-Type: image/png');
    formParts.push('');
    
    const formDataStr = formParts.join('\r\n') + '\r\n';
    const formDataEnd = `\r\n--${boundary}--\r\n`;
    
    const formData = Buffer.concat([
      Buffer.from(formDataStr),
      imageBuffer,
      Buffer.from(formDataEnd)
    ]);

    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/medias/upload-file',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28', // Adding the required version header
        'Content-Length': formData.length
      }
    };

    console.log('Making media upload request with Version header...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Media Upload Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Media uploaded successfully!');
            console.log('Media URL:', response.url || response.fileUrl);
            
            resolve({
              success: true,
              mediaUrl: response.url || response.fileUrl,
              response: response
            });
          } else {
            console.log('⚠️ Media upload failed');
            console.log('Error:', response.message || response.error);
            console.log('Full Response:', JSON.stringify(response, null, 2));
            
            resolve({
              success: false,
              error: response.message || response.error,
              response: response
            });
          }
        } catch (parseError) {
          console.log('❌ Media parse error:', parseError.message);
          console.log('Raw Response:', data);
          
          resolve({
            success: false,
            error: 'Failed to parse media response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Media upload failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(formData);
    req.end();
  });
}

// Step 2: Try different product creation endpoints
async function createProduct(accessToken, locationId, mediaUrl = null) {
  console.log('\n🚀 Step 2: Creating Product in GoHighLevel');
  console.log('Testing multiple endpoint variations...');
  
  const productData = {
    name: 'Premium Car Detailing Service',
    description: 'Professional exterior and interior car detailing with eco-friendly products.',
    type: 'DIGITAL',
    locationId: locationId
  };

  if (mediaUrl) {
    productData.image = mediaUrl;
  }

  // Try different endpoint formats
  const endpoints = [
    '/products',
    '/products/',
    `/locations/${locationId}/products`,
    '/v1/products'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);
    
    const result = await tryCreateProduct(accessToken, productData, endpoint);
    
    if (result.success) {
      console.log(`✅ Success with endpoint: ${endpoint}`);
      return result;
    } else {
      console.log(`❌ Failed with ${endpoint}: ${result.error}`);
    }
  }

  return {
    success: false,
    error: 'All product creation endpoints failed'
  };
}

// Helper function to try a specific product endpoint
async function tryCreateProduct(accessToken, productData, endpoint) {
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status ${res.statusCode} for ${endpoint}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve({
              success: true,
              productId: response.id,
              product: response,
              endpoint: endpoint
            });
          } else {
            resolve({
              success: false,
              error: response.message || response.error || `Status ${res.statusCode}`,
              statusCode: res.statusCode
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: `Parse error: ${parseError.message}`,
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Step 3: Add price with proper headers
async function addPrice(accessToken, productId, locationId) {
  console.log('\n💰 Step 3: Adding Price to Product');
  console.log('Using your exact method with Version header');
  
  const priceData = {
    "name": "Premium Detailing Price",
    "type": "one_time",
    "currency": "USD",
    "amount": 175.00,
    "description": "Premium car detailing service pricing",
    "locationId": locationId,
    "isDigitalProduct": true
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
        'Version': '2021-07-28', // Adding version header
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making price creation request with Version header...');

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Price Creation Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Price added successfully!');
            console.log('Price ID:', response.id);
            
            resolve({
              success: true,
              priceId: response.id,
              price: response
            });
          } else {
            console.log('⚠️ Price creation failed');
            console.log('Error:', response.message || response.error);
            
            resolve({
              success: false,
              error: response.message || response.error,
              response: response
            });
          }
        } catch (parseError) {
          console.log('❌ Price parse error:', parseError.message);
          console.log('Raw Response:', data);
          
          resolve({
            success: false,
            error: 'Failed to parse price response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Price request failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Alternative: Use Railway backend for product creation
async function createProductViaRailway(accessToken, locationId, mediaUrl = null) {
  console.log('\n🔄 Alternative: Creating Product via Railway Backend');
  
  return new Promise((resolve) => {
    const productData = {
      installation_id: installationId,
      name: 'Premium Car Detailing Service',
      description: 'Professional exterior and interior car detailing service.',
      productType: 'DIGITAL',
      locationId: locationId
    };

    if (mediaUrl) {
      productData.image = mediaUrl;
    }

    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/api/products/create', // Railway backend endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Using Railway backend product creation...');

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Railway Product Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (response.success || response.product) {
            console.log('✅ Product created via Railway backend!');
            console.log('Product ID:', response.product?.id);
            
            resolve({
              success: true,
              productId: response.product?.id || response.productId,
              product: response.product,
              method: 'railway-backend'
            });
          } else {
            console.log('⚠️ Railway product creation failed');
            console.log('Error:', response.error);
            
            resolve({
              success: false,
              error: response.error,
              response: response
            });
          }
        } catch (parseError) {
          console.log('❌ Railway parse error:', parseError.message);
          
          resolve({
            success: false,
            error: 'Failed to parse Railway response'
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Railway request failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Main workflow function
async function runFixedWorkflow() {
  console.log('🎯 FIXED COMPLETE GOHIGHLEVEL WORKFLOW');
  console.log('Testing media upload, product creation, and pricing');
  console.log('='.repeat(70));

  // Get OAuth token
  const tokenData = await getOAuthToken();
  if (!tokenData) {
    console.log('❌ Failed to get OAuth token - cannot proceed');
    return;
  }

  const { accessToken } = tokenData;
  const locationId = extractLocationId(accessToken);
  
  console.log('OAuth Token Length:', accessToken.length);
  console.log('Location ID:', locationId);

  // Step 1: Upload Media
  const mediaResult = await uploadMedia(accessToken, './test-image.png');
  
  // Step 2: Create Product (try direct API first, then Railway backup)
  let productResult = await createProduct(
    accessToken, 
    locationId, 
    mediaResult.success ? mediaResult.mediaUrl : null
  );
  
  // If direct API fails, try Railway backend
  if (!productResult.success) {
    console.log('\nDirect API failed, trying Railway backend...');
    productResult = await createProductViaRailway(
      accessToken,
      locationId,
      mediaResult.success ? mediaResult.mediaUrl : null
    );
  }
  
  if (!productResult.success) {
    console.log('\n❌ All product creation methods failed');
    console.log('Error:', productResult.error);
    return;
  }

  // Step 3: Add Pricing (if we have a product ID)
  let priceResult = { success: false, error: 'No product ID for pricing' };
  
  if (productResult.productId) {
    priceResult = await addPrice(accessToken, productResult.productId, locationId);
  }
  
  // Final Results
  console.log('\n🎉 WORKFLOW RESULTS');
  console.log('='.repeat(70));
  
  console.log('✅ OAuth Authentication: SUCCESS');
  console.log(`${mediaResult.success ? '✅' : '⚠️'} Media Upload: ${mediaResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log('✅ Product Creation: SUCCESS');
  console.log(`   Product ID: ${productResult.productId}`);
  console.log(`   Method: ${productResult.method || 'direct-api'}`);
  console.log(`${priceResult.success ? '✅' : '⚠️'} Price Creation: ${priceResult.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (mediaResult.success && priceResult.success) {
    console.log('\n🚀 COMPLETE SUCCESS: Full workflow operational!');
  } else {
    console.log('\n⚠️ PARTIAL SUCCESS: Product created, investigating remaining issues');
  }
}

runFixedWorkflow().catch(console.error);