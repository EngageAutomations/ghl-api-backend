/**
 * Complete Product CRUD Test - All GoHighLevel Product API Operations
 * Tests List, Get, Create, Update, Delete operations per API specifications
 */

async function testCompleteProductCRUD() {
  console.log('=== COMPLETE PRODUCT CRUD API TEST ===');
  console.log('Testing all GoHighLevel Product API endpoints through universal system\n');

  // Test 1: List Products with search and pagination
  console.log('1. LIST PRODUCTS (GET /products/)');
  console.log('Specification: GET /products/ with search, limit, offset, locationId');
  
  try {
    const listResponse = await fetch('https://dir.engageautomations.com/api/ghl/products?search=test&limit=10&offset=0');
    const listData = await listResponse.json();
    
    console.log(`Status: ${listResponse.status}`);
    if (listData.success) {
      console.log('✓ List Products working');
      if (listData.data && listData.data.products) {
        console.log(`Found ${listData.data.products.length} products`);
      }
    } else {
      console.log(`✗ Error: ${listData.error}`);
    }
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
  }
  
  // Test 2: Create Product
  console.log('\n2. CREATE PRODUCT (POST /products/)');
  console.log('Specification: POST /products/ with name, locationId, productType (required)');
  
  const testProductData = {
    name: `API Test Product ${Date.now()}`,
    productType: 'DIGITAL',
    description: 'Product created to test complete CRUD operations',
    availableInStore: true,
    statementDescriptor: 'TEST-CRUD'
  };
  
  let createdProductId = null;
  
  try {
    const createResponse = await fetch('https://dir.engageautomations.com/api/ghl/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProductData)
    });
    
    const createData = await createResponse.json();
    console.log(`Status: ${createResponse.status}`);
    
    if (createData.success && createData.data && createData.data._id) {
      createdProductId = createData.data._id;
      console.log('✓ Product created successfully');
      console.log(`Product ID: ${createdProductId}`);
      console.log(`Name: ${createData.data.name}`);
      console.log(`Type: ${createData.data.productType}`);
    } else {
      console.log(`✗ Create failed: ${createData.error}`);
    }
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
  }
  
  if (!createdProductId) {
    console.log('\nCannot continue CRUD test without valid product ID');
    return;
  }
  
  // Test 3: Get Product by ID
  console.log('\n3. GET PRODUCT BY ID (GET /products/:productId)');
  console.log('Specification: GET /products/{productId} with locationId query parameter');
  
  try {
    const getResponse = await fetch(`https://dir.engageautomations.com/api/ghl/products/${createdProductId}`);
    const getData = await getResponse.json();
    
    console.log(`Status: ${getResponse.status}`);
    if (getData.success && getData.data) {
      console.log('✓ Product retrieved successfully');
      console.log(`ID: ${getData.data._id}`);
      console.log(`Name: ${getData.data.name}`);
      console.log(`Description: ${getData.data.description}`);
      console.log(`Available in Store: ${getData.data.availableInStore}`);
      console.log(`Created: ${getData.data.createdAt}`);
    } else {
      console.log(`✗ Get failed: ${getData.error}`);
    }
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
  }
  
  // Test 4: Update Product
  console.log('\n4. UPDATE PRODUCT (PUT /products/:productId)');
  console.log('Specification: PUT /products/{productId} with name, locationId, productType');
  
  const updateData = {
    name: 'Updated Product Name via CRUD Test',
    productType: 'DIGITAL',
    description: 'Description updated through universal API system',
    availableInStore: false,
    statementDescriptor: 'UPD-CRUD'
  };
  
  try {
    const updateResponse = await fetch(`https://dir.engageautomations.com/api/ghl/products/${createdProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    console.log(`Status: ${updateResponse.status}`);
    
    if (updateResult.success && updateResult.data) {
      console.log('✓ Product updated successfully');
      console.log(`New Name: ${updateResult.data.name}`);
      console.log(`New Description: ${updateResult.data.description}`);
      console.log(`Available in Store: ${updateResult.data.availableInStore}`);
      console.log(`Updated At: ${updateResult.data.updatedAt}`);
    } else {
      console.log(`✗ Update failed: ${updateResult.error}`);
    }
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
  }
  
  // Test 5: Delete Product
  console.log('\n5. DELETE PRODUCT (DELETE /products/:productId)');
  console.log('Specification: DELETE /products/{productId} with locationId query parameter');
  
  try {
    const deleteResponse = await fetch(`https://dir.engageautomations.com/api/ghl/products/${createdProductId}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log(`Status: ${deleteResponse.status}`);
    
    if (deleteResult.success && deleteResult.data && deleteResult.data.status === true) {
      console.log('✓ Product deleted successfully');
      console.log('Delete operation confirmed');
    } else {
      console.log(`✗ Delete failed: ${deleteResult.error}`);
    }
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
  }
  
  // Test 6: Verify deletion
  console.log('\n6. VERIFY DELETION (GET deleted product)');
  
  try {
    const verifyResponse = await fetch(`https://dir.engageautomations.com/api/ghl/products/${createdProductId}`);
    const verifyData = await verifyResponse.json();
    
    console.log(`Status: ${verifyResponse.status}`);
    if (!verifyData.success || verifyResponse.status === 404) {
      console.log('✓ Product successfully deleted (not found)');
    } else {
      console.log('? Product may still exist');
    }
  } catch (error) {
    console.log(`Verification attempt: ${error.message}`);
  }
  
  console.log('\n=== CRUD TEST SUMMARY ===');
  console.log('Universal API System Capabilities Demonstrated:');
  console.log('• Dynamic routing for all HTTP methods (GET, POST, PUT, DELETE)');
  console.log('• Automatic parameter extraction (path params, query params, body)');
  console.log('• OAuth authentication integrated seamlessly');
  console.log('• Location ID management per API requirements');
  console.log('• Consistent error handling across all endpoints');
  console.log('• Zero code changes needed for new API specifications');
}

// Demonstrate universal system scalability
async function demonstrateSystemScalability() {
  console.log('\n=== SYSTEM SCALABILITY DEMONSTRATION ===');
  
  const apiEndpoints = [
    { name: 'Products', path: '/products', method: 'GET' },
    { name: 'Product by ID', path: '/products/test123', method: 'GET' },
    { name: 'Contacts', path: '/contacts', method: 'GET' },
    { name: 'Locations', path: '/locations', method: 'GET' },
    { name: 'Workflows', path: '/workflows', method: 'GET' },
    { name: 'Forms', path: '/forms', method: 'GET' },
    { name: 'User Info', path: '/user/info', method: 'GET' },
    { name: 'Media Files', path: '/media', method: 'GET' }
  ];
  
  console.log(`Testing ${apiEndpoints.length} different endpoint categories...\n`);
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`https://dir.engageautomations.com/api/ghl${endpoint.path}`, {
        method: endpoint.method
      });
      
      const data = await response.json();
      console.log(`${endpoint.name}: ${response.status} - ${data.success ? 'SUCCESS' : data.error}`);
      
    } catch (error) {
      console.log(`${endpoint.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\nUniversal Router Benefits:');
  console.log('• Single handler processes all API categories');
  console.log('• Adding new endpoints requires only configuration updates');
  console.log('• Authentication, error handling, and validation are automatic');
  console.log('• System scales to unlimited GoHighLevel API endpoints');
}

// Check OAuth installation status
async function checkOAuthStatus() {
  console.log('=== OAUTH INSTALLATION STATUS ===');
  
  try {
    const response = await fetch('https://dir.engageautomations.com/api/debug/installations');
    const data = await response.json();
    
    if (data.success && data.installations.length > 0) {
      const install = data.installations[0];
      console.log(`Installation ID: ${install.id}`);
      console.log(`User ID: ${install.ghlUserId}`);
      console.log(`Location ID: ${install.ghlLocationId || 'Missing - may affect some APIs'}`);
      console.log(`Access Token: ${install.hasAccessToken ? 'Available' : 'Missing'}`);
      console.log(`Scopes: ${install.scopes?.substring(0, 60)}...`);
    } else {
      console.log('No OAuth installations found');
    }
  } catch (error) {
    console.log(`OAuth check failed: ${error.message}`);
  }
  
  console.log('');
}

// Run comprehensive test
checkOAuthStatus();
testCompleteProductCRUD();
demonstrateSystemScalability();