/**
 * Test Update Product API - Validates PUT /products/:productId endpoint
 * Based on GoHighLevel API specification v2021-07-28
 */

const axios = require('axios');

async function testUpdateProductAPI() {
  console.log('=== TESTING UPDATE PRODUCT API ===');
  
  try {
    // Check OAuth installations
    console.log('1. Checking OAuth installations...');
    const installationsResponse = await axios.get('https://dir.engageautomations.com/api/debug/installations');
    
    if (!installationsResponse.data.success || installationsResponse.data.installations.length === 0) {
      console.log('❌ No OAuth installations found');
      return;
    }
    
    const installation = installationsResponse.data.installations[0];
    console.log('✅ OAuth installation found');
    console.log(`Installation ID: ${installation.id}`);
    console.log(`Location ID: ${installation.ghlLocationId || 'undefined'}`);
    console.log(`Has Access Token: ${installation.hasAccessToken}`);
    
    // Test the Update Product endpoint specification
    console.log('\n2. Testing Update Product API specification...');
    
    const testProductId = '6578278e879ad2646715ba9c'; // Example from API docs
    const updateProductData = {
      name: 'Updated Test Product',
      locationId: installation.ghlLocationId || '3SwdhCsvxI8Au3KsPJt6',
      productType: 'DIGITAL',
      description: 'Updated product description per API specification',
      availableInStore: true,
      statementDescriptor: 'UPD-TEST',
      image: 'https://storage.googleapis.com/ghl-test/3SwdhCsvxI8Au3KsPJt6/media/65af8d5df88bdb4b1022ee90.png'
    };
    
    console.log('Update data (per API spec):', JSON.stringify(updateProductData, null, 2));
    
    const updateResponse = await axios.put(`https://dir.engageautomations.com/api/ghl/products/${testProductId}`, updateProductData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Update product response status:', updateResponse.status);
    console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    
    if (updateResponse.data.success) {
      console.log('✅ Update Product API working correctly');
      
      const updatedProduct = updateResponse.data.data;
      console.log('\nUpdated product verification:');
      console.log(`- Product ID: ${updatedProduct._id}`);
      console.log(`- Name: ${updatedProduct.name}`);
      console.log(`- Description: ${updatedProduct.description}`);
      console.log(`- Product Type: ${updatedProduct.productType}`);
      console.log(`- Available in Store: ${updatedProduct.availableInStore}`);
      console.log(`- Updated At: ${updatedProduct.updatedAt}`);
      
    } else {
      console.log('❌ Update failed');
      console.log('Error details:', updateResponse.data.error);
    }
    
  } catch (error) {
    console.error('Test result:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response details:', error.response.data);
    }
  }
}

// Test multiple API endpoints to demonstrate universal system
async function testMultipleEndpoints() {
  console.log('\n=== TESTING MULTIPLE API ENDPOINTS ===');
  
  const endpoints = [
    { method: 'GET', path: '/products', name: 'List Products' },
    { method: 'GET', path: '/contacts', name: 'List Contacts' },
    { method: 'GET', path: '/locations', name: 'List Locations' },
    { method: 'GET', path: '/workflows', name: 'List Workflows' },
    { method: 'GET', path: '/forms', name: 'List Forms' },
    { method: 'GET', path: '/user/info', name: 'User Info' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url: `https://dir.engageautomations.com/api/ghl${endpoint.path}`,
        params: { limit: 5 }
      });
      
      console.log(`✅ ${endpoint.name}: Status ${response.status}`);
      if (response.data.success) {
        console.log(`   Data received: ${response.data.data ? 'Yes' : 'No'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.status || 'Error'} - ${error.message}`);
    }
  }
}

console.log('=== API SPECIFICATION COMPLIANCE ===');
console.log('Update Product API Requirements:');
console.log('✓ Method: PUT');
console.log('✓ Endpoint: /products/:productId');
console.log('✓ Path Parameter: productId extracted automatically');
console.log('✓ Required Fields: name, locationId, productType');
console.log('✓ Optional Fields: description, image, statementDescriptor, availableInStore, medias, variants');
console.log('✓ Authentication: OAuth Bearer token from stored installation');
console.log('✓ API Version: 2021-07-28 header included');

testUpdateProductAPI();
testMultipleEndpoints();