/**
 * Add Image to Existing Product
 * Upload image and attach it to the recently created product
 */

async function addImageToProduct() {
  console.log('🖼️ ADDING IMAGE TO EXISTING PRODUCT');
  console.log('Finding recent product and uploading image...');
  console.log('='.repeat(50));
  
  try {
    // 1. Get latest installation
    console.log('1. GETTING OAUTH INSTALLATION...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('❌ No OAuth installation found');
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
    
    console.log(`✅ Token retrieved for location: ${tokenData.location_id}`);
    
    // 3. List existing products to find recent one
    console.log('\n3. FINDING RECENT PRODUCTS...');
    const productsResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (!productsResponse.ok) {
      console.log('❌ Failed to fetch products');
      return;
    }
    
    const productsData = await productsResponse.json();
    console.log(`Found ${productsData.products?.length || 0} products`);
    
    if (!productsData.products || productsData.products.length === 0) {
      console.log('❌ No products found');
      return;
    }
    
    // Find the most recent product (assuming it's the one we just created)
    const recentProduct = productsData.products
      .sort((a, b) => new Date(b.createdAt || b.dateAdded) - new Date(a.createdAt || a.dateAdded))[0];
    
    console.log(`✅ Found recent product: ${recentProduct.id}`);
    console.log(`   Name: ${recentProduct.name}`);
    console.log(`   Has images: ${recentProduct.medias?.length || 0}`);
    
    // Check if product already has images
    if (recentProduct.medias && recentProduct.medias.length > 0) {
      console.log('⚠️ Product already has images:');
      recentProduct.medias.forEach((media, index) => {
        console.log(`   ${index + 1}. ${media.url}`);
      });
      console.log('Adding additional image...');
    }
    
    // 4. Upload new image
    console.log('\n4. UPLOADING IMAGE TO MEDIA LIBRARY...');
    const imageResult = await uploadProductImage(tokenData);
    
    if (!imageResult.success) {
      console.log('❌ Image upload failed:', imageResult.error);
      return;
    }
    
    console.log(`✅ Image uploaded: ${imageResult.data.id}`);
    console.log(`   URL: ${imageResult.data.url}`);
    
    // 5. Update product with new image
    console.log('\n5. UPDATING PRODUCT WITH IMAGE...');
    const updateResult = await updateProductWithImage(tokenData, recentProduct.id, imageResult.data, recentProduct);
    
    if (updateResult.success) {
      console.log('✅ PRODUCT UPDATED SUCCESSFULLY!');
      console.log(`Product ID: ${recentProduct.id}`);
      console.log(`Image URL: ${imageResult.data.url}`);
      console.log('Product now has image attached');
    } else {
      console.log('❌ Product update failed:', updateResult.error);
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
  }
}

async function uploadProductImage(tokenData) {
  try {
    const FormData = require('form-data');
    
    // Create a more detailed test image (sample product image)
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
      filename: 'product-image.png',
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
          name: data.name || 'product-image.png'
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
    // Prepare updated product data with new image
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

addImageToProduct().catch(console.error);