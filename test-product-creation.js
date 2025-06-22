/**
 * Test Product Creation with Railway Backend
 * Direct API call to create test product
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';
const LOCATION_ID = 'WAvk87RmW9rBSDJHeOpH';

async function createTestProduct() {
  console.log('Creating test product...');
  console.log(`Location ID: ${LOCATION_ID}`);
  console.log(`Railway URL: ${RAILWAY_URL}`);
  
  const productData = {
    installation_id: 'install_seed',
    name: 'Test Product - Railway API',
    description: 'Test product created via Railway backend API call',
    productType: 'DIGITAL',
    price: 29.99
  };

  try {
    const response = await fetch(`${RAILWAY_URL}/api/ghl/products/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    console.log('\n=== PRODUCT CREATION RESULT ===');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${result.success || false}`);
    
    if (result.success) {
      console.log('✅ Product created successfully!');
      console.log(`Product ID: ${result.product?.id}`);
      console.log(`Product Name: ${result.product?.name}`);
      console.log(`Location: ${result.product?.locationId}`);
    } else {
      console.log('❌ Product creation failed');
      console.log(`Error: ${result.error}`);
      console.log(`Details: ${JSON.stringify(result, null, 2)}`);
    }

    return result;

  } catch (error) {
    console.log('❌ API call failed');
    console.log(`Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test with different installation IDs
async function testMultipleInstallations() {
  const installationIds = ['install_seed', 'install_1', 'install_2', 'default'];
  
  for (const installationId of installationIds) {
    console.log(`\n--- Testing with installation ID: ${installationId} ---`);
    
    const productData = {
      installation_id: installationId,
      name: `Test Product - ${installationId}`,
      description: `Test product created with installation ${installationId}`,
      productType: 'DIGITAL',
      price: 19.99
    };

    try {
      const response = await fetch(`${RAILWAY_URL}/api/ghl/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();
      
      console.log(`Status: ${response.status}`);
      if (result.success) {
        console.log(`✅ Success with ${installationId}`);
        console.log(`Product: ${result.product?.name}`);
        return result; // Return on first success
      } else {
        console.log(`❌ Failed with ${installationId}: ${result.error}`);
      }

    } catch (error) {
      console.log(`❌ Network error with ${installationId}: ${error.message}`);
    }
  }
  
  return { success: false, error: 'No valid installation found' };
}

// Main execution
async function main() {
  console.log('=== RAILWAY PRODUCT CREATION TEST ===\n');
  
  // First try with default installation
  const result1 = await createTestProduct();
  
  // If that fails, try multiple installation IDs
  if (!result1.success) {
    console.log('\n--- Trying multiple installation IDs ---');
    const result2 = await testMultipleInstallations();
    
    if (!result2.success) {
      console.log('\n=== SUMMARY ===');
      console.log('Product creation failed with all installation IDs');
      console.log('This indicates the Railway backend needs:');
      console.log('1. Valid OAuth installation with active tokens');
      console.log('2. Proper environment variables (GHL_ACCESS_TOKEN)');
      console.log('3. Fresh OAuth flow completion');
    }
  }
}

main().catch(console.error);