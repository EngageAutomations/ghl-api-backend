import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BACKEND_URL = 'https://dir.engageautomations.com';

async function testProductCreation() {
  console.log('=== Testing GoHighLevel Product Creation ===');
  
  try {
    // Step 1: Check installations
    console.log('1. Checking OAuth installations...');
    const installResponse = await axios.get(`${BACKEND_URL}/installations`);
    console.log('Installations:', installResponse.data);
    
    if (installResponse.data.total === 0) {
      console.log('❌ No OAuth installations found. Need to complete OAuth flow first.');
      return;
    }
    
    // Step 2: Use the active installation
    const installationId = 'install_1750849067071'; // Use the actual installation ID
    
    // Step 3: Test connection
    console.log('2. Testing API connection...');
    const connectionTest = await axios.get(`${BACKEND_URL}/api/ghl/test-connection`, {
      params: { installation_id: installationId }
    });
    console.log('Connection test:', connectionTest.data);
    
    // Step 4: Create product images (simulated - using placeholder data)
    console.log('3. Creating product with images...');
    
    const productData = {
      installation_id: installationId,
      name: 'Premium Digital Course',
      description: 'Complete digital marketing course with video tutorials, worksheets, and bonus materials.',
      productType: 'DIGITAL',
      imageUrls: [
        'https://via.placeholder.com/800x600/4CAF50/white?text=Course+Cover',
        'https://via.placeholder.com/800x600/2196F3/white?text=Module+1',
        'https://via.placeholder.com/800x600/FF9800/white?text=Bonus+Content'
      ]
    };
    
    const productResponse = await axios.post(`${BACKEND_URL}/api/ghl/products/create`, productData);
    console.log('Product created:', productResponse.data);
    
    const productId = productResponse.data.product?.id;
    if (!productId) {
      console.log('❌ No product ID returned');
      return;
    }
    
    // Step 5: Add pricing to the product
    console.log('4. Adding pricing to product...');
    
    const priceData = {
      installation_id: installationId,
      name: 'One-time Purchase',
      type: 'one_time',
      amount: 19700, // $197.00 in cents
      currency: 'USD'
    };
    
    const priceResponse = await axios.post(`${BACKEND_URL}/api/ghl/products/${productId}/prices`, priceData);
    console.log('Price created:', priceResponse.data);
    
    // Step 6: List all products to verify
    console.log('5. Listing all products...');
    const listResponse = await axios.get(`${BACKEND_URL}/api/ghl/products`, {
      params: { installation_id: installationId }
    });
    console.log('All products:', listResponse.data);
    
    console.log('✅ Product creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during product creation:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('This may indicate an OAuth token issue or missing installation.');
    }
  }
}

testProductCreation();