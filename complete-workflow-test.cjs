/**
 * Complete GoHighLevel Workflow: Image + Product + Pricing
 * Tests the full three-step workflow with proper sequencing
 */

async function testCompleteWorkflow() {
  console.log('🚀 COMPLETE GOHIGHLEVEL WORKFLOW TEST');
  console.log('Testing: Image Upload → Product Creation → Pricing Setup');
  console.log('='.repeat(60));
  
  try {
    // 1. Check for active installation
    console.log('1. CHECKING OAUTH INSTALLATION...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('❌ No OAuth installation found');
      console.log('Install from: https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
      return;
    }
    
    const installation = installationsData.installations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    console.log(`✅ Using installation: ${installation.id}`);
    console.log(`   Location: ${installation.location_id}`);
    
    // 2. Get access token
    console.log('\n2. RETRIEVING ACCESS TOKEN...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.id}`);
    const tokenData = await tokenResponse.json();
    
    // Check token type
    const tokenParts = tokenData.access_token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log(`   Auth Class: ${payload.authClass}`);
    console.log(`   Location: ${tokenData.location_id}`);
    
    // 3. Execute complete workflow
    console.log('\n3. EXECUTING COMPLETE WORKFLOW...');
    const workflowResult = await executeWorkflow(tokenData);
    
    if (workflowResult.success) {
      console.log('\n🎉 COMPLETE WORKFLOW SUCCESS!');
      console.log(`Product ID: ${workflowResult.product.id}`);
      console.log(`Media URL: ${workflowResult.media.url}`);
      console.log(`Price: $${workflowResult.product.prices[0].amount / 100}`);
      console.log('\nSystem fully operational for production use!');
    } else {
      console.log('\n❌ Workflow failed:', workflowResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function executeWorkflow(tokenData) {
  const workflow = {
    success: false,
    steps: {},
    media: null,
    product: null,
    error: null
  };
  
  try {
    // Step 1: Upload Image
    console.log('\n   STEP 1: Uploading test image...');
    const mediaResult = await uploadTestImage(tokenData);
    
    if (!mediaResult.success) {
      workflow.error = `Image upload failed: ${mediaResult.error}`;
      return workflow;
    }
    
    workflow.media = mediaResult.data;
    workflow.steps.imageUpload = '✅ Success';
    console.log(`   ✅ Image uploaded: ${mediaResult.data.id}`);
    
    // Step 2: Create Product with Image
    console.log('\n   STEP 2: Creating product with image...');
    const productResult = await createProductWithImage(tokenData, mediaResult.data);
    
    if (!productResult.success) {
      workflow.error = `Product creation failed: ${productResult.error}`;
      return workflow;
    }
    
    workflow.product = productResult.data;
    workflow.steps.productCreation = '✅ Success';
    console.log(`   ✅ Product created: ${productResult.data.id}`);
    
    // Step 3: Add Additional Pricing (if needed)
    if (!productResult.data.prices || productResult.data.prices.length === 0) {
      console.log('\n   STEP 3: Adding pricing to product...');
      const pricingResult = await addProductPricing(tokenData, productResult.data.id);
      
      if (pricingResult.success) {
        workflow.steps.pricing = '✅ Success';
        console.log(`   ✅ Pricing added: ${pricingResult.data.id}`);
      } else {
        console.log(`   ⚠️ Pricing step failed: ${pricingResult.error}`);
        workflow.steps.pricing = '⚠️ Failed';
      }
    } else {
      workflow.steps.pricing = '✅ Embedded in product';
      console.log('   ✅ Pricing embedded in product creation');
    }
    
    workflow.success = true;
    return workflow;
    
  } catch (error) {
    workflow.error = error.message;
    return workflow;
  }
}

async function uploadTestImage(tokenData) {
  try {
    const FormData = require('form-data');
    
    // Create test PNG image (1x1 pixel)
    const testImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    const form = new FormData();
    form.append('file', testImageData, {
      filename: 'workflow-test-product.png',
      contentType: 'image/png'
    });
    form.append('locationId', tokenData.location_id);
    
    const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: {
          id: data.id || data._id,
          url: data.url || data.fileUrl,
          name: data.name || 'workflow-test-product.png'
        }
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error.substring(0, 100)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function createProductWithImage(tokenData, mediaData) {
  try {
    const productData = {
      name: 'Complete Workflow Product',
      description: 'Product created through complete workflow: image + product + pricing',
      productType: 'DIGITAL',
      locationId: tokenData.location_id,
      available: true,
      currency: 'USD',
      medias: [{
        url: mediaData.url,
        type: 'image'
      }],
      prices: [{
        name: 'Standard Price',
        amount: 4999, // $49.99
        currency: 'USD',
        type: 'one_time'
      }],
      variants: [],
      seo: {
        title: 'Complete Workflow Product',
        description: 'Product with image and pricing'
      }
    };
    
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error.substring(0, 200)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function addProductPricing(tokenData, productId) {
  try {
    const pricingData = {
      name: 'Premium Option',
      amount: 9999, // $99.99
      currency: 'USD',
      type: 'one_time',
      compareAtAmount: 12999 // $129.99
    };
    
    const response = await fetch(`https://services.leadconnectorhq.com/products/${productId}/prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pricingData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error.substring(0, 200)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

testCompleteWorkflow().catch(console.error);