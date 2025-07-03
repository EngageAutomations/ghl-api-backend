/**
 * Find Product and Add Image
 * Helper script to find existing product and add image
 */

async function findAndUpdateProduct() {
  console.log('🔍 FINDING PRODUCT AND ADDING IMAGE');
  console.log('This script will help add an image to your existing product');
  console.log('='.repeat(60));
  
  // Check if user provided product ID directly
  const args = process.argv.slice(2);
  let productId = null;
  let installationId = null;
  
  if (args.length >= 2) {
    productId = args[0];
    installationId = args[1];
    console.log(`Using provided Product ID: ${productId}`);
    console.log(`Using provided Installation ID: ${installationId}`);
  }
  
  if (!productId || !installationId) {
    console.log('📋 USAGE INSTRUCTIONS:');
    console.log('');
    console.log('To add an image to your existing product, run:');
    console.log('node find-and-update-product.cjs [PRODUCT_ID] [INSTALLATION_ID]');
    console.log('');
    console.log('Example:');
    console.log('node find-and-update-product.cjs 686620520b7a703979659eca install_1720000000000');
    console.log('');
    console.log('OR:');
    console.log('1. Get a fresh OAuth installation from:');
    console.log('   https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    console.log('2. Check installation ID from OAuth backend');
    console.log('3. List products to find your product ID');
    console.log('4. Run this script with both IDs');
    console.log('');
    console.log('🔧 ALTERNATIVE APPROACH:');
    console.log('If you have the product ID from your recent creation, you can:');
    console.log('1. Install OAuth from marketplace');
    console.log('2. Use the workflow tester at /workflow-tester');
    console.log('3. Upload image directly through the UI');
    console.log('');
    console.log('💡 WORKFLOW API METHOD:');
    console.log('The complete workflow system is ready to:');
    console.log('• Upload image to GoHighLevel media library');
    console.log('• Create new product with image and pricing');
    console.log('• Or update existing product with new image');
    return;
  }
  
  try {
    // Get access token
    console.log('\n1. RETRIEVING ACCESS TOKEN...');
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
    
    if (!tokenResponse.ok) {
      console.log('❌ Failed to get access token');
      console.log('Check that the installation ID is correct and active');
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log(`✅ Token retrieved for location: ${tokenData.location_id}`);
    
    // Upload image first
    console.log('\n2. UPLOADING IMAGE...');
    const imageResult = await uploadImage(tokenData);
    
    if (!imageResult.success) {
      console.log('❌ Image upload failed:', imageResult.error);
      
      if (imageResult.error.includes('authClass type is not allowed')) {
        console.log('');
        console.log('🔍 DIAGNOSIS: IAM Authentication Error');
        console.log('This means you need a Location-level token for media upload');
        console.log('');
        console.log('SOLUTION: Fresh OAuth installation needed');
        console.log('The current token is Company-level, but media APIs require Location-level');
        console.log('');
        console.log('Install fresh OAuth from:');
        console.log('https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
        console.log('');
        console.log('The OAuth backend will automatically request Location-level tokens');
      }
      return;
    }
    
    console.log(`✅ Image uploaded: ${imageResult.data.id}`);
    console.log(`   URL: ${imageResult.data.url}`);
    
    // Get current product details
    console.log('\n3. GETTING PRODUCT DETAILS...');
    const productResponse = await fetch(`https://services.leadconnectorhq.com/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (!productResponse.ok) {
      console.log('❌ Failed to get product details');
      console.log('Check that the product ID is correct');
      return;
    }
    
    const product = await productResponse.json();
    console.log(`✅ Product found: ${product.name}`);
    console.log(`   Current images: ${product.medias?.length || 0}`);
    
    // Update product with image
    console.log('\n4. UPDATING PRODUCT WITH IMAGE...');
    const updateResult = await updateProductWithImage(tokenData, productId, imageResult.data, product);
    
    if (updateResult.success) {
      console.log('🎉 SUCCESS! PRODUCT UPDATED WITH IMAGE');
      console.log(`Product ID: ${productId}`);
      console.log(`Image URL: ${imageResult.data.url}`);
      console.log(`Total images now: ${(product.medias?.length || 0) + 1}`);
    } else {
      console.log('❌ Product update failed:', updateResult.error);
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
  }
}

async function uploadImage(tokenData) {
  try {
    const FormData = require('form-data');
    
    // Create test image
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
      filename: 'updated-product-image.png',
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
          name: data.name || 'updated-product-image.png'
        }
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

async function updateProductWithImage(tokenData, productId, imageData, existingProduct) {
  try {
    const existingMedias = existingProduct.medias || [];
    const newMedias = [
      ...existingMedias,
      {
        url: imageData.url,
        type: 'image'
      }
    ];
    
    const updateData = {
      name: existingProduct.name,
      description: existingProduct.description,
      productType: existingProduct.productType,
      locationId: tokenData.location_id,
      available: existingProduct.available,
      currency: existingProduct.currency,
      medias: newMedias,
      prices: existingProduct.prices || [],
      variants: existingProduct.variants || [],
      seo: existingProduct.seo || {
        title: existingProduct.name,
        description: existingProduct.description
      }
    };
    
    const response = await fetch(`https://services.leadconnectorhq.com/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
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

findAndUpdateProduct().catch(console.error);