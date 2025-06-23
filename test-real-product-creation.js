/**
 * Test Real GoHighLevel Product Creation
 * Creates actual product in GoHighLevel account with robot image
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testRealProductCreation() {
  try {
    // Use environment variables for credentials
    const accessToken = process.env.GHL_ACCESS_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;
    
    if (!accessToken || !locationId) {
      console.log('Missing credentials in .env.real');
      return;
    }
    
    console.log('Testing real GoHighLevel product creation...');
    console.log('Location ID:', locationId);
    console.log('Access token present:', accessToken ? 'Yes' : 'No');
    
    // Step 1: Upload robot image
    console.log('\nStep 1: Uploading robot image to GoHighLevel...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('attached_assets/a8bd7a871c55a5829132fb2d4ade0628_1200_80_1750651707669.webp'));
    formData.append('locationId', locationId);
    
    const uploadResponse = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload response:', uploadResult);
    
    let imageUrl = null;
    if (uploadResult.url) {
      imageUrl = uploadResult.url;
      console.log('Image uploaded successfully:', imageUrl);
    }
    
    // Step 2: Create product
    console.log('\nStep 2: Creating AI Robot Assistant Pro product...');
    const productData = {
      locationId: locationId,
      name: 'AI Robot Assistant Pro - Real Test',
      description: 'Advanced AI automation assistant with intelligent task routing, business process automation, and seamless GoHighLevel integration. Features custom robot branding for professional automation solutions.',
      price: 797.00,
      productType: 'DIGITAL',
      availabilityType: 'AVAILABLE_NOW'
    };
    
    if (imageUrl) {
      productData.imageUrl = imageUrl;
    }
    
    const productResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(productData)
    });
    
    const productResult = await productResponse.json();
    console.log('Product creation response:', productResult);
    
    if (productResult.id) {
      console.log('\n✅ SUCCESS: Real GoHighLevel product created!');
      console.log('Product ID:', productResult.id);
      console.log('Product Name:', productResult.name);
      console.log('Product Price:', productResult.price);
      console.log('Product URL:', `https://app.gohighlevel.com/location/${locationId}/products/${productResult.id}`);
    } else {
      console.log('\n❌ Product creation failed');
      console.log('Response:', productResult);
    }
    
  } catch (error) {
    console.error('Error testing product creation:', error);
  }
}

testRealProductCreation();