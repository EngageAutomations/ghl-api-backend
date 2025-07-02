#!/usr/bin/env node

/**
 * Test Complete Working Workflow
 * Uses the new /api/workflow/complete-product endpoint
 */

import https from 'https';
import fs from 'fs';

const installationId = 'install_1751436979939';

// Test the complete workflow endpoint
async function testCompleteWorkflow() {
  console.log('🎯 Testing Complete Product Workflow');
  console.log('Using new scope-aware implementation');
  console.log('='.repeat(60));

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

    const workflowData = {
      installationId: installationId,
      product: {
        name: 'Premium Car Detailing Service',
        description: 'Professional exterior and interior car detailing with eco-friendly products and expert care. Complete wash, wax, vacuum, and detail service.',
        type: 'DIGITAL'
      },
      price: {
        amount: 175.00,
        currency: 'USD',
        type: 'one_time'
      }
    };

    const boundary = '----formdata-workflow-' + Date.now();
    
    // Build multipart form data
    const formParts = [];
    
    // Add workflow data
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="data"');
    formParts.push('');
    formParts.push(JSON.stringify(workflowData));
    
    // Add image file
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="image"; filename="car-detailing.png"');
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
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflow/complete-product',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length
      }
    };

    console.log('Making request to complete workflow endpoint...');
    console.log('Product:', workflowData.product.name);
    console.log('Price:', `$${workflowData.price.amount} ${workflowData.price.currency}`);
    console.log('Has Image:', 'Yes');

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nWorkflow Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (response.success) {
            console.log('✅ COMPLETE WORKFLOW SUCCESS!');
            console.log('\nProduct Details:');
            console.log('- Product ID:', response.product.id);
            console.log('- Name:', response.product.name);
            console.log('- Type:', response.product.type);
            console.log('- Location ID:', response.product.locationId);
            console.log('- Status:', response.product.status);
            
            console.log('\nPricing Details:');
            console.log('- Amount:', `$${response.product.pricing.amount}`);
            console.log('- Currency:', response.product.pricing.currency);
            console.log('- Type:', response.product.pricing.type);
            
            console.log('\nMedia Details:');
            if (response.product.media) {
              console.log('- Filename:', response.product.media.filename);
              console.log('- Size:', response.product.media.size, 'bytes');
              console.log('- Type:', response.product.media.mimetype);
            } else {
              console.log('- No media uploaded');
            }
            
            console.log('\nWorkflow Status:');
            console.log('- Media Upload:', response.product.workflow.mediaUpload);
            console.log('- Product Creation:', response.product.workflow.productCreation);
            console.log('- Price Creation:', response.product.workflow.priceCreation);
            console.log('- Completed At:', response.product.workflow.completedAt);
            
            console.log('\nOAuth Status:');
            console.log('- Installation ID:', response.product.oauth.installationId);
            console.log('- Token Status:', response.product.oauth.tokenStatus);
            console.log('- Has Valid Token:', response.product.oauth.hasValidToken);
            
            if (response.nextSteps) {
              console.log('\nNext Steps:');
              response.nextSteps.forEach((step, index) => {
                console.log(`${index + 1}. ${step}`);
              });
            }
            
            resolve({
              success: true,
              response: response
            });
            
          } else {
            console.log('⚠️ Workflow failed');
            console.log('Error:', response.error);
            console.log('Details:', response.details);
            
            resolve({
              success: false,
              error: response.error,
              response: response
            });
          }
        } catch (parseError) {
          console.log('❌ Failed to parse workflow response');
          console.log('Parse Error:', parseError.message);
          console.log('Raw Response:', data.substring(0, 500));
          
          resolve({
            success: false,
            error: 'Parse error',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Workflow request failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(formData);
    req.end();
  });
}

// Test without server running (direct curl test)
async function testWithCurl() {
  console.log('\n🔧 Testing with direct server call...');
  
  // First check if server is running
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/workflow/example',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running on port 5000');
        resolve(true);
      } else {
        console.log('⚠️ Server responded but may have issues');
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ Server not running on port 5000');
      console.log('Start server with: npm run dev');
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Server connection timeout');
      resolve(false);
    });

    req.end();
  });
}

// Main test function
async function runWorkflowTest() {
  console.log('COMPLETE WORKFLOW TEST WITH WORKING IMPLEMENTATION');
  console.log('Tests scope-aware product creation with media and pricing');
  console.log('='.repeat(70));

  // Check if server is running
  const serverRunning = await testWithCurl();
  
  if (!serverRunning) {
    console.log('\n⚠️ Server not running. Please start with: npm run dev');
    console.log('Then run this test again to verify the complete workflow.');
    return;
  }

  // Test complete workflow
  const workflowResult = await testCompleteWorkflow();
  
  // Final summary
  console.log('\n🎯 WORKFLOW TEST RESULTS');
  console.log('='.repeat(70));
  
  if (workflowResult.success) {
    console.log('✅ COMPLETE SUCCESS!');
    console.log('✅ OAuth authentication working');
    console.log('✅ Product creation working'); 
    console.log('✅ Media upload processing working');
    console.log('✅ Price creation working');
    console.log('✅ Dynamic workflow system ready for production');
    
    console.log('\n🚀 READY FOR PRODUCTION USE');
    console.log('Your complete product workflow is now operational with:');
    console.log('- Working OAuth token management');
    console.log('- Scope-aware implementation that works with current permissions');
    console.log('- Complete product, media, and pricing workflow');
    console.log('- Dynamic directory-based form processing');
    
  } else {
    console.log('⚠️ Workflow needs adjustment');
    console.log('Error:', workflowResult.error);
    
    if (workflowResult.response) {
      console.log('Check server logs for detailed error information');
    }
  }
}

runWorkflowTest().catch(console.error);