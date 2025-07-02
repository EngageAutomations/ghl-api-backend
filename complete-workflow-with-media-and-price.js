#!/usr/bin/env node

/**
 * Complete GoHighLevel Product Workflow
 * Creates product with image upload and pricing using successful methods
 */

import https from 'https';
import fs from 'fs';
import FormData from 'form-data';

const installationId = 'install_1751436979939';

// Get OAuth token from Railway backend (this method was working)
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

// Step 1: Upload media using your exact method
async function uploadMedia(accessToken, imageFilePath) {
  console.log('\n📷 Step 1: Uploading Media to GoHighLevel');
  console.log('Using method: POST /medias/upload-file');
  
  return new Promise((resolve) => {
    // Create a simple test image if file doesn't exist
    let imageBuffer;
    if (!fs.existsSync(imageFilePath)) {
      // Create a minimal 1x1 pixel PNG
      imageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0x00, 0x5E, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      console.log('Using generated test image (1x1 PNG)');
    } else {
      imageBuffer = fs.readFileSync(imageFilePath);
      console.log(`Using image file: ${imageFilePath}`);
    }

    const boundary = '----formdata-boundary-' + Date.now();
    
    // Prepare multipart form data following your exact method
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
      path: '/medias/upload-file', // Your exact endpoint
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': formData.length
      }
    };

    console.log('Making media upload request...');
    console.log('Endpoint:', `https://services.leadconnectorhq.com/medias/upload-file`);
    
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
            console.log('Media ID:', response.id);
            
            resolve({
              success: true,
              mediaUrl: response.url || response.fileUrl,
              mediaId: response.id,
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
            error: 'Failed to parse media upload response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Media upload request failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(formData);
    req.end();
  });
}

// Step 2: Create product using the successful method we found
async function createProduct(accessToken, locationId, mediaUrl = null) {
  console.log('\n🚀 Step 2: Creating Product in GoHighLevel');
  console.log('Using successful method from Railway backend');
  
  // Use the successful product data format we found
  const productData = {
    name: 'Premium Car Detailing Service',
    description: 'Professional exterior and interior car detailing with eco-friendly products and expert care. Complete wash, wax, vacuum, and detail service.',
    type: 'DIGITAL',
    locationId: locationId
  };

  // Add media URL if we have one
  if (mediaUrl) {
    productData.image = mediaUrl;
    console.log('Including media URL:', mediaUrl);
  }

  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/products/', // The successful endpoint format we found
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Version': '2021-07-28'
      }
    };

    console.log('Making product creation request...');
    console.log('Endpoint:', `https://services.leadconnectorhq.com/products/`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Product Creation Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Product created successfully!');
            console.log('Product ID:', response.id);
            console.log('Product Name:', response.name);
            
            resolve({
              success: true,
              productId: response.id,
              product: response
            });
          } else {
            console.log('⚠️ Product creation failed');
            console.log('Error:', response.message || response.error);
            console.log('Full Response:', JSON.stringify(response, null, 2));
            
            resolve({
              success: false,
              error: response.message || response.error,
              response: response
            });
          }
        } catch (parseError) {
          console.log('❌ Product parse error:', parseError.message);
          console.log('Raw Response:', data);
          
          resolve({
            success: false,
            error: 'Failed to parse product creation response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Product creation request failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Step 3: Add price using your exact method
async function addPrice(accessToken, productId, locationId) {
  console.log('\n💰 Step 3: Adding Price to Product');
  console.log('Using method: POST /products/:productId/price');
  
  // Use your exact price data format
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
      path: `/products/${productId}/price`, // Your exact endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making price creation request...');
    console.log('Endpoint:', `https://services.leadconnectorhq.com/products/${productId}/price`);
    console.log('Price Amount: $175.00 USD');

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
            console.log('Amount:', `$${response.amount}`);
            console.log('Currency:', response.currency);
            
            resolve({
              success: true,
              priceId: response.id,
              price: response
            });
          } else {
            console.log('⚠️ Price creation failed');
            console.log('Error:', response.message || response.error);
            console.log('Full Response:', JSON.stringify(response, null, 2));
            
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
            error: 'Failed to parse price creation response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Price creation request failed:', error.message);
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
async function runCompleteWorkflow() {
  console.log('🎯 COMPLETE GOHIGHLEVEL PRODUCT WORKFLOW');
  console.log('Product + Media + Pricing Creation');
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
  
  // Step 2: Create Product (with or without media)
  const productResult = await createProduct(
    accessToken, 
    locationId, 
    mediaResult.success ? mediaResult.mediaUrl : null
  );
  
  if (!productResult.success) {
    console.log('\n❌ Product creation failed - stopping workflow');
    console.log('Error:', productResult.error);
    return;
  }

  // Step 3: Add Pricing
  const priceResult = await addPrice(accessToken, productResult.productId, locationId);
  
  // Final Results
  console.log('\n🎉 WORKFLOW COMPLETE!');
  console.log('='.repeat(70));
  
  console.log('✅ OAuth Authentication: SUCCESS');
  console.log(`${mediaResult.success ? '✅' : '⚠️'} Media Upload: ${mediaResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (mediaResult.success) {
    console.log(`   Media URL: ${mediaResult.mediaUrl}`);
  }
  
  console.log('✅ Product Creation: SUCCESS');
  console.log(`   Product ID: ${productResult.productId}`);
  
  console.log(`${priceResult.success ? '✅' : '⚠️'} Price Creation: ${priceResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (priceResult.success) {
    console.log(`   Price ID: ${priceResult.priceId}`);
    console.log(`   Amount: $175.00 USD`);
  }
  
  console.log('\n🚀 Complete GoHighLevel product with media and pricing ready!');
  
  if (mediaResult.success && priceResult.success) {
    console.log('\n🎯 FULL SUCCESS: All workflow steps completed successfully!');
    console.log('Your dynamic workflow system is now ready for production use.');
  } else {
    console.log('\n⚠️ PARTIAL SUCCESS: Product created but some steps need adjustment.');
  }
}

// Run the complete workflow
runCompleteWorkflow().catch(console.error);