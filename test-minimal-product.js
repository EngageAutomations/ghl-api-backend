/**
 * Test Minimal Product Creation
 * Create product with absolute minimum fields - no price, no image
 */

async function getOAuthToken() {
  // Use the fresh token from current OAuth installation
  return "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q";
}

async function testMinimalProduct() {
  console.log('🧪 TESTING MINIMAL PRODUCT CREATION');
  console.log('Testing absolute minimum product - no price, no image');
  console.log('='.repeat(60));
  
  const accessToken = await getOAuthToken();
  if (!accessToken) {
    console.log('❌ Cannot proceed without OAuth token');
    return;
  }
  
  console.log('✅ OAuth Token Retrieved');
  
  // Test 1: Absolute minimum fields
  console.log('\n1️⃣ Testing Absolute Minimum Fields');
  const minimalProduct = {
    locationId: "WAVk87RmW9rBSDJHeOpH",
    name: "Minimal Test Product",
    description: "Basic test product"
  };
  
  await testProductCreation(accessToken, minimalProduct, 'Absolute Minimum');
  
  // Test 2: Add required type field
  console.log('\n2️⃣ Testing With Required Type Field');
  const productWithType = {
    locationId: "WAVk87RmW9rBSDJHeOpH",
    name: "Minimal Test Product",
    description: "Basic test product",
    type: "COURSE"
  };
  
  await testProductCreation(accessToken, productWithType, 'With Type Field');
  
  // Test 3: Add all basic fields but no arrays
  console.log('\n3️⃣ Testing Basic Fields Only');
  const basicProduct = {
    locationId: "WAVk87RmW9rBSDJHeOpH",
    name: "Minimal Test Product",
    description: "Basic test product",
    type: "COURSE",
    productType: "DIGITAL",
    sharable: true,
    trackQuantity: false,
    allowOutOfStockPurchases: true,
    availableInStore: true
  };
  
  await testProductCreation(accessToken, basicProduct, 'Basic Fields Only');
  
  // Test 4: Test via API backend
  console.log('\n4️⃣ Testing Via API Backend');
  await testViaAPIBackend(accessToken, basicProduct);
}

async function testProductCreation(accessToken, productData, testName) {
  console.log(`\n  Testing: ${testName}`);
  console.log('  Product Data:', JSON.stringify(productData, null, 2));
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    console.log(`  Status: ${response.status}`);
    if (response.ok) {
      console.log('  ✅ SUCCESS!');
      console.log('  Product ID:', result.id || result._id);
      console.log('  Product Name:', result.name);
    } else {
      console.log('  ❌ FAILED');
      console.log('  Error:', result.message || result.error);
      console.log('  Details:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('  ❌ REQUEST ERROR');
    console.log('  Error:', error.message);
  }
}

async function testViaAPIBackend(accessToken, productData) {
  console.log('\n  Testing via API Backend:');
  console.log('  Endpoint: https://api.engageautomations.com/api/products/create');
  
  try {
    const response = await fetch('https://api.engageautomations.com/api/products/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    console.log(`  Status: ${response.status}`);
    if (response.ok) {
      console.log('  ✅ SUCCESS via API Backend!');
      console.log('  Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('  ❌ FAILED via API Backend');
      console.log('  Error:', result.message || result.error);
      console.log('  Details:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('  ❌ API Backend REQUEST ERROR');
    console.log('  Error:', error.message);
  }
}

// Run test
testMinimalProduct().catch(console.error);