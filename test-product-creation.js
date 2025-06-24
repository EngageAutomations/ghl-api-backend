/**
 * Test Product Creation with Railway Backend
 * Tests the actual OAuth installation and product creation workflow
 */

async function testProductCreation() {
  const baseUrl = 'https://dir.engageautomations.com';
  
  console.log('🧪 Testing Railway Backend Product Creation');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Check backend health
    console.log('1. Checking Railway backend health...');
    const healthResponse = await fetch(`${baseUrl}/`);
    const healthData = await healthResponse.text();
    console.log('Health response:', healthData.substring(0, 200));
    
    // Test 2: Check for installations endpoint
    console.log('\n2. Looking for installations endpoint...');
    const installationsResponse = await fetch(`${baseUrl}/api/installations`);
    console.log('Installations status:', installationsResponse.status);
    
    // Test 3: Try universal API approach
    console.log('\n3. Testing universal API endpoint...');
    const universalResponse = await fetch(`${baseUrl}/api/universal/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Universal API status:', universalResponse.status);
    
    // Test 4: Create product using proper endpoint structure
    console.log('\n4. Attempting product creation...');
    const productData = {
      name: 'Test Marketplace Product',
      description: 'Test product created from Replit marketplace',
      type: 'DIGITAL',
      price: 2999, // Price in cents
      locationId: 'auto-detect' // Let backend find the location
    };
    
    const createResponse = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    console.log('Product creation status:', createResponse.status);
    const createResult = await createResponse.text();
    console.log('Product creation response:', createResult.substring(0, 500));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testProductCreation();