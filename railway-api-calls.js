/**
 * Railway API Calls with Location ID
 * Demonstrates how to make API calls to Railway backend
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';
const LOCATION_ID = 'WAvk87RmW9rBSDJHeOpH'; // Default location from backend code

// Method 1: Direct API calls (requires valid installation_id)
async function makeDirectAPICall(installationId, endpoint, method = 'GET', data = null) {
  const url = `${RAILWAY_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (method === 'GET') {
    const params = new URLSearchParams({
      installation_id: installationId,
      location_id: LOCATION_ID
    });
    return fetch(`${url}?${params}`);
  } else {
    options.body = JSON.stringify({
      installation_id: installationId,
      location_id: LOCATION_ID,
      ...data
    });
    return fetch(url, options);
  }
}

// Method 2: Test connection with location ID
async function testConnectionWithLocation(installationId = 'install_seed') {
  try {
    const response = await makeDirectAPICall(installationId, '/api/ghl/test-connection');
    const data = await response.json();
    
    console.log('Connection Test Result:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Method 3: Get products with location ID
async function getProductsWithLocation(installationId = 'install_seed', limit = 5) {
  try {
    const response = await makeDirectAPICall(installationId, '/api/ghl/products');
    const data = await response.json();
    
    console.log('Products API Result:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Products API failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Method 4: Create product with location ID
async function createProductWithLocation(installationId = 'install_seed', productData) {
  try {
    const response = await makeDirectAPICall(installationId, '/api/ghl/products/create', 'POST', productData);
    const data = await response.json();
    
    console.log('Create Product Result:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Create product failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Method 5: Upload media with location ID
async function uploadMediaWithLocation(installationId = 'install_seed', file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('installation_id', installationId);
    formData.append('location_id', LOCATION_ID);

    const response = await fetch(`${RAILWAY_URL}/api/ghl/media/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    console.log('Media Upload Result:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Media upload failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Method 6: Create contact with location ID
async function createContactWithLocation(installationId = 'install_seed', contactData) {
  try {
    const response = await makeDirectAPICall(installationId, '/api/ghl/contacts/create', 'POST', contactData);
    const data = await response.json();
    
    console.log('Create Contact Result:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Create contact failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Method 7: Check OAuth status
async function checkOAuthStatus(installationId = 'install_seed') {
  try {
    const response = await fetch(`${RAILWAY_URL}/api/oauth/status?installation_id=${installationId}`);
    const data = await response.json();
    
    console.log('OAuth Status:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('OAuth status check failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Example usage functions
async function demonstrateAPICalls() {
  console.log('=== RAILWAY API CALLS DEMONSTRATION ===\n');
  
  console.log(`Location ID: ${LOCATION_ID}`);
  console.log(`Railway URL: ${RAILWAY_URL}\n`);

  // Test different installation IDs
  const installationIds = ['install_seed', 'install_1', 'install_2'];
  
  for (const installationId of installationIds) {
    console.log(`--- Testing with installation ID: ${installationId} ---`);
    
    // Check OAuth status
    await checkOAuthStatus(installationId);
    
    // Test connection
    await testConnectionWithLocation(installationId);
    
    // Try to get products
    await getProductsWithLocation(installationId);
    
    console.log('');
  }
}

// CLI execution
if (typeof require !== 'undefined' && typeof window === 'undefined') {
  demonstrateAPICalls().catch(console.error);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    makeDirectAPICall,
    testConnectionWithLocation,
    getProductsWithLocation,
    createProductWithLocation,
    uploadMediaWithLocation,
    createContactWithLocation,
    checkOAuthStatus,
    RAILWAY_URL,
    LOCATION_ID
  };
}