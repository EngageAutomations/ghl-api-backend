/**
 * Test Multiple GoHighLevel API Endpoints
 * Demonstrates universal system handling many different API calls
 */

async function testMultipleAPIEndpoints() {
  console.log('=== TESTING MULTIPLE GOHIGHLEVEL API ENDPOINTS ===');
  
  // Test various API endpoints using fetch (built-in Node.js)
  const testEndpoints = [
    {
      name: 'List Products',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/products?limit=5&search=test',
      spec: 'GET /products/ with pagination and search'
    },
    {
      name: 'Get Product by ID',
      method: 'GET', 
      url: 'https://dir.engageautomations.com/api/ghl/products/6578278e879ad2646715ba9c',
      spec: 'GET /products/:productId with locationId query param'
    },
    {
      name: 'List Contacts',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/contacts?limit=5',
      spec: 'GET /locations/{locationId}/contacts'
    },
    {
      name: 'List Locations',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/locations',
      spec: 'GET /locations/'
    },
    {
      name: 'List Workflows',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/workflows',
      spec: 'GET /locations/{locationId}/workflows'
    },
    {
      name: 'List Forms',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/forms',
      spec: 'GET /locations/{locationId}/forms'
    },
    {
      name: 'Get User Info',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/user/info',
      spec: 'GET /oauth/userinfo'
    },
    {
      name: 'List Media Files',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/ghl/media?limit=5',
      spec: 'GET /locations/{locationId}/medias'
    }
  ];

  console.log(`Testing ${testEndpoints.length} different API endpoints:\n`);

  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`);
      console.log(`Specification: ${endpoint.spec}`);
      
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      
      if (data.success) {
        console.log(`Result: SUCCESS - Data received`);
        if (data.data) {
          if (Array.isArray(data.data.products)) {
            console.log(`Products found: ${data.data.products.length}`);
          } else if (Array.isArray(data.data.contacts)) {
            console.log(`Contacts found: ${data.data.contacts.length}`);
          } else if (Array.isArray(data.data.locations)) {
            console.log(`Locations found: ${data.data.locations.length}`);
          } else if (data.data._id) {
            console.log(`Single item ID: ${data.data._id}`);
          } else if (data.data.locationId) {
            console.log(`User location: ${data.data.locationId}`);
          } else {
            console.log(`Data type: ${typeof data.data}`);
          }
        }
      } else {
        console.log(`Result: API Error - ${data.error}`);
      }
      
    } catch (error) {
      console.log(`Result: REQUEST ERROR - ${error.message}`);
    }
    
    console.log('---');
  }
  
  // Test API documentation endpoint
  console.log('\nTesting API Documentation endpoint:');
  try {
    const docsResponse = await fetch('https://dir.engageautomations.com/api/ghl/docs');
    const docsData = await docsResponse.json();
    
    if (docsData.success) {
      console.log(`Total endpoints supported: ${docsData.documentation.totalEndpoints}`);
      console.log('Endpoint categories available:');
      
      const categories = [...new Set(docsData.documentation.endpoints.map(e => 
        e.scope.split('.')[0] || e.scope.split('/')[0]
      ))];
      
      categories.forEach(cat => {
        console.log(`  - ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
      });
    }
  } catch (error) {
    console.log(`Documentation test failed: ${error.message}`);
  }
}

// Test creating and updating products
async function testProductCRUDOperations() {
  console.log('\n=== TESTING PRODUCT CRUD OPERATIONS ===');
  
  try {
    // Test creating a product
    console.log('1. Creating test product...');
    const createResponse = await fetch('https://dir.engageautomations.com/api/ghl/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Test Product ${Date.now()}`,
        productType: 'DIGITAL',
        description: 'Product created via universal API system',
        availableInStore: true,
        statementDescriptor: 'TEST-API'
      })
    });
    
    const createData = await createResponse.json();
    console.log(`Create Status: ${createResponse.status}`);
    
    if (createData.success && createData.data && createData.data._id) {
      const productId = createData.data._id;
      console.log(`Product created: ${productId}`);
      
      // Test getting the product by ID (per your specification)
      console.log('\n2. Getting product by ID...');
      const getResponse = await fetch(`https://dir.engageautomations.com/api/ghl/products/${productId}`);
      const getData = await getResponse.json();
      
      console.log(`Get Status: ${getResponse.status}`);
      if (getData.success) {
        console.log('Product retrieved successfully');
        console.log(`Name: ${getData.data.name}`);
        console.log(`Type: ${getData.data.productType}`);
        console.log(`Available in Store: ${getData.data.availableInStore}`);
      }
      
      // Test updating the product (per previous specification)
      console.log('\n3. Updating product...');
      const updateResponse = await fetch(`https://dir.engageautomations.com/api/ghl/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Updated Product Name',
          productType: 'DIGITAL',
          description: 'Updated description via API',
          availableInStore: false,
          statementDescriptor: 'UPD-API'
        })
      });
      
      const updateData = await updateResponse.json();
      console.log(`Update Status: ${updateResponse.status}`);
      
      if (updateData.success) {
        console.log('Product updated successfully');
        console.log(`New name: ${updateData.data.name}`);
        console.log(`Available in Store: ${updateData.data.availableInStore}`);
        console.log(`Updated at: ${updateData.data.updatedAt}`);
      }
      
    } else {
      console.log('Product creation failed');
      console.log('Error:', createData.error);
    }
    
  } catch (error) {
    console.log(`CRUD test failed: ${error.message}`);
  }
}

// Test OAuth installation status
async function testOAuthInstallations() {
  console.log('\n=== CHECKING OAUTH INSTALLATIONS ===');
  
  try {
    const response = await fetch('https://dir.engageautomations.com/api/debug/installations');
    const data = await response.json();
    
    if (data.success) {
      console.log(`OAuth installations found: ${data.count}`);
      
      if (data.installations.length > 0) {
        const installation = data.installations[0];
        console.log(`Installation ${installation.id}:`);
        console.log(`  User ID: ${installation.ghlUserId}`);
        console.log(`  Location ID: ${installation.ghlLocationId || 'Not set'}`);
        console.log(`  Has Access Token: ${installation.hasAccessToken}`);
        console.log(`  Scopes: ${installation.scopes?.substring(0, 50)}...`);
        console.log(`  Installation Date: ${installation.installationDate}`);
        
        if (!installation.ghlLocationId) {
          console.log('\nNote: Location ID missing - this may affect some API calls');
        }
      }
    } else {
      console.log('No OAuth installations found');
    }
    
  } catch (error) {
    console.log(`OAuth check failed: ${error.message}`);
  }
}

console.log('Universal GoHighLevel API System Test');
console.log('=====================================');
console.log('This test demonstrates how the system accommodates many different API calls');
console.log('through a single universal router with dynamic endpoint handling.\n');

// Run all tests
testOAuthInstallations();
testMultipleAPIEndpoints();
testProductCRUDOperations();