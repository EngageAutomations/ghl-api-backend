/**
 * Verify Location Access and Permissions
 * Check if the location ID actually exists and has proper API access
 */

async function verifyLocationAccess() {
  console.log('🔍 VERIFYING LOCATION ACCESS AND PERMISSIONS');
  console.log('='.repeat(60));
  
  const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q";
  const locationId = "SGtYHkPbOl2WJV08GOpg";
  
  console.log(`📍 Testing Location ID: ${locationId}`);
  console.log(`🔑 OAuth Scopes: locations.readonly, products.write, products.readonly`);
  
  // Test 1: Check if location exists
  console.log('\n1️⃣ TESTING LOCATION EXISTENCE');
  try {
    const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    const locationData = await locationResponse.json();
    console.log(`Status: ${locationResponse.status}`);
    console.log('Response:', JSON.stringify(locationData, null, 2));
    
    if (locationResponse.status === 200) {
      console.log('✅ Location EXISTS and is accessible');
    } else if (locationResponse.status === 403) {
      console.log('❌ Location access FORBIDDEN');
    } else if (locationResponse.status === 404) {
      console.log('❌ Location NOT FOUND - Invalid location ID');
    }
  } catch (error) {
    console.log(`❌ Location check error: ${error.message}`);
  }
  
  // Test 2: List all available locations
  console.log('\n2️⃣ LISTING ALL AVAILABLE LOCATIONS');
  try {
    const locationsResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    const locationsData = await locationsResponse.json();
    console.log(`Status: ${locationsResponse.status}`);
    console.log('Available Locations:', JSON.stringify(locationsData, null, 2));
    
    if (locationsResponse.status === 200 && locationsData.locations) {
      console.log(`✅ Found ${locationsData.locations.length} available locations`);
      locationsData.locations.forEach((loc, index) => {
        console.log(`${index + 1}. ID: ${loc.id}, Name: ${loc.name}`);
        if (loc.id === locationId) {
          console.log('   ✅ This matches our location ID!');
        }
      });
    }
  } catch (error) {
    console.log(`❌ Locations list error: ${error.message}`);
  }
  
  // Test 3: Check existing products for this location
  console.log('\n3️⃣ CHECKING EXISTING PRODUCTS');
  try {
    const productsResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    const productsData = await productsResponse.json();
    console.log(`Status: ${productsResponse.status}`);
    console.log('Products Response:', JSON.stringify(productsData, null, 2));
    
    if (productsResponse.status === 200) {
      console.log('✅ Products API accessible for this location');
    } else if (productsResponse.status === 403) {
      console.log('❌ Products API FORBIDDEN for this location');
    }
  } catch (error) {
    console.log(`❌ Products check error: ${error.message}`);
  }
  
  // Test 4: Alternative product endpoint
  console.log('\n4️⃣ TESTING ALTERNATIVE PRODUCT ENDPOINT');
  try {
    const altProductsResponse = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    const altProductsData = await altProductsResponse.json();
    console.log(`Status: ${altProductsResponse.status}`);
    console.log('Alternative Products Response:', JSON.stringify(altProductsData, null, 2));
    
    if (altProductsResponse.status === 200) {
      console.log('✅ Global products endpoint accessible');
    } else if (altProductsResponse.status === 403) {
      console.log('❌ Global products endpoint FORBIDDEN');
    }
  } catch (error) {
    console.log(`❌ Alternative products error: ${error.message}`);
  }
  
  console.log('\n📋 LOCATION VERIFICATION COMPLETE');
}

// Run the location verification
verifyLocationAccess().catch(console.error);