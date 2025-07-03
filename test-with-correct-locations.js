/**
 * Test with Correct Location IDs
 * Using the actual valid location IDs from your account
 */

const realLocations = [
  { id: 'eYeyzEWiaxcTOPROAo4C', name: 'Darul Uloom Tampa' },
  { id: 'kQDg6qp2x7GXYJ1VCkI8', name: 'Engage Automations' },
  { id: 'WAvk87RmW9rBSDJHeOpH', name: 'MakerExpress 3D' }
];

async function testWithCorrectLocations() {
  console.log('🎯 TESTING WITH CORRECT LOCATION IDS');
  console.log('Using actual valid location IDs from your GoHighLevel account');
  console.log('='.repeat(70));
  
  // Get OAuth token
  const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q";
  
  console.log('\n📍 YOUR REAL LOCATION IDS:');
  realLocations.forEach((location, index) => {
    console.log(`${index + 1}. ${location.name} (${location.id})`);
  });
  
  // Test with each valid location ID
  for (const location of realLocations) {
    await testLocationAPI(accessToken, location);
  }
}

async function testLocationAPI(accessToken, location) {
  console.log(`\n🧪 TESTING: ${location.name} (${location.id})`);
  console.log('-'.repeat(50));
  
  // Test 1: Check if location exists
  console.log('1️⃣ Location Existence Check');
  try {
    const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${location.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    const locationData = await locationResponse.json();
    console.log(`   Status: ${locationResponse.status}`);
    
    if (locationResponse.status === 200) {
      console.log(`   ✅ ${location.name} EXISTS and accessible`);
      console.log(`   Name: ${locationData.name || 'N/A'}`);
      console.log(`   Type: ${locationData.type || 'N/A'}`);
    } else {
      console.log(`   ❌ ${location.name} not accessible: ${locationData.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Location check error: ${error.message}`);
  }
  
  // Test 2: Try product creation with valid location
  console.log('2️⃣ Product Creation Test');
  const productPayload = {
    name: `Test Product for ${location.name}`,
    locationId: location.id,
    description: `Testing product creation with valid location ${location.name}`,
    productType: 'DIGITAL',
    availableInStore: true
  };
  
  console.log(`   Using Location ID: ${location.id}`);
  console.log(`   Payload:`, JSON.stringify(productPayload, null, 6));
  
  const requestTime = new Date();
  
  try {
    const productResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productPayload)
    });
    
    const responseTime = new Date();
    const duration = responseTime - requestTime;
    const productData = await productResponse.json();
    
    console.log(`   Request Time: ${requestTime.toISOString()}`);
    console.log(`   Response Time: ${responseTime.toISOString()}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Status: ${productResponse.status}`);
    console.log(`   Response:`, JSON.stringify(productData, null, 6));
    
    if (productResponse.status === 200 || productResponse.status === 201) {
      console.log(`   🎉 SUCCESS! Product created with ${location.name}`);
      console.log(`   Product ID: ${productData.id || 'N/A'}`);
      
      // This means API access is working with correct location!
      console.log('\n🔥 BREAKTHROUGH: API ACCESS WORKING WITH CORRECT LOCATION!');
      return true;
    } else if (productResponse.status === 403) {
      console.log(`   ❌ 403 Forbidden with ${location.name}`);
    } else if (productResponse.status === 400) {
      console.log(`   ❌ 400 Bad Request with ${location.name}: ${productData.message}`);
    } else {
      console.log(`   ❌ ${productResponse.status} with ${location.name}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Product creation error: ${error.message}`);
  }
  
  return false;
}

// Run the test with correct locations
testWithCorrectLocations().catch(console.error);