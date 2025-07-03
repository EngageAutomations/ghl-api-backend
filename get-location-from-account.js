/**
 * Get Location ID from Installed Account
 * Proper flow: OAuth token → Account data → Valid location ID → API calls
 */

async function getLocationFromAccount() {
  console.log('🔍 GETTING LOCATION ID FROM INSTALLED ACCOUNT');
  console.log('Following proper OAuth → Account → Location → API flow');
  console.log('='.repeat(70));
  
  // Step 1: Get OAuth token from installation
  console.log('\n1️⃣ RETRIEVING OAUTH TOKEN FROM INSTALLATION');
  try {
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939');
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('❌ No access token available');
      return null;
    }
    
    console.log(`✅ OAuth token retrieved (${tokenData.access_token.length} chars)`);
    console.log(`Installation ID: ${tokenData.installation_id}`);
    console.log(`Status: ${tokenData.status}`);
    
    // Step 2: Use token to get account locations
    console.log('\n2️⃣ GETTING LOCATIONS FROM ACCOUNT');
    const accessToken = tokenData.access_token;
    
    // Try different location endpoints to find working one
    const locationEndpoints = [
      'https://services.leadconnectorhq.com/locations/',
      'https://services.leadconnectorhq.com/locations',
      'https://rest.gohighlevel.com/v1/locations/',
      'https://api.gohighlevel.com/v1/locations/'
    ];
    
    let accountLocations = null;
    
    for (const endpoint of locationEndpoints) {
      console.log(`   Testing: ${endpoint}`);
      
      try {
        const locResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`   Status: ${locResponse.status}`);
        
        if (locResponse.status === 200) {
          const locData = await locResponse.json();
          console.log(`   ✅ Found working endpoint: ${endpoint}`);
          console.log(`   Response structure:`, Object.keys(locData));
          
          if (locData.locations && Array.isArray(locData.locations)) {
            accountLocations = locData.locations;
            console.log(`   📍 Found ${accountLocations.length} locations in account`);
            break;
          } else if (locData.id) {
            // Single location response
            accountLocations = [locData];
            console.log(`   📍 Found single location: ${locData.name || locData.id}`);
            break;
          }
        } else {
          const errorData = await locResponse.json();
          console.log(`   ❌ ${locResponse.status}: ${errorData.message || 'Error'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }
    
    if (!accountLocations) {
      console.log('\n❌ Could not retrieve locations from account');
      console.log('Trying alternative approach...');
      return await tryAlternativeLocationRetrieval(accessToken);
    }
    
    // Step 3: Display account locations and test with first valid one
    console.log('\n3️⃣ ACCOUNT LOCATIONS FOUND:');
    accountLocations.forEach((location, index) => {
      console.log(`${index + 1}. ID: ${location.id}`);
      console.log(`   Name: ${location.name || 'Unnamed Location'}`);
      console.log(`   Type: ${location.type || 'N/A'}`);
      console.log(`   Status: ${location.status || 'N/A'}`);
    });
    
    // Step 4: Test product creation with first location
    const firstLocation = accountLocations[0];
    console.log(`\n4️⃣ TESTING PRODUCT CREATION WITH: ${firstLocation.name || firstLocation.id}`);
    
    const testResult = await testProductCreationWithLocation(accessToken, firstLocation.id);
    
    if (testResult.success) {
      console.log('\n🎉 SUCCESS: Found working location and API access!');
      console.log(`Working Location: ${firstLocation.name} (${firstLocation.id})`);
      return {
        locationId: firstLocation.id,
        locationName: firstLocation.name,
        accessToken: accessToken,
        allLocations: accountLocations
      };
    } else {
      console.log('\n❌ Product creation failed with account location');
      console.log('Testing other locations...');
      
      // Try other locations
      for (let i = 1; i < accountLocations.length; i++) {
        const location = accountLocations[i];
        console.log(`\nTesting with: ${location.name || location.id}`);
        
        const result = await testProductCreationWithLocation(accessToken, location.id);
        if (result.success) {
          console.log(`✅ Found working location: ${location.name} (${location.id})`);
          return {
            locationId: location.id,
            locationName: location.name,
            accessToken: accessToken,
            allLocations: accountLocations
          };
        }
      }
    }
    
    return {
      locationId: firstLocation.id,
      locationName: firstLocation.name,
      accessToken: accessToken,
      allLocations: accountLocations,
      apiWorking: false
    };
    
  } catch (error) {
    console.log(`❌ Error in location retrieval: ${error.message}`);
    return null;
  }
}

async function tryAlternativeLocationRetrieval(accessToken) {
  console.log('\n🔄 TRYING ALTERNATIVE LOCATION RETRIEVAL');
  
  // Try user/me endpoint
  try {
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (userResponse.status === 200) {
      const userData = await userResponse.json();
      console.log('User data:', JSON.stringify(userData, null, 2));
      
      if (userData.locationIds && userData.locationIds.length > 0) {
        console.log(`Found location IDs in user data: ${userData.locationIds}`);
        return userData.locationIds[0];
      }
    }
  } catch (error) {
    console.log(`Alternative method failed: ${error.message}`);
  }
  
  return null;
}

async function testProductCreationWithLocation(accessToken, locationId) {
  const requestTime = new Date();
  
  const productPayload = {
    name: `Test Product ${requestTime.getTime()}`,
    locationId: locationId,
    description: 'Testing product creation with account location ID',
    productType: 'DIGITAL',
    availableInStore: true
  };
  
  console.log(`   Request Time: ${requestTime.toISOString()}`);
  console.log(`   Location ID: ${locationId}`);
  console.log(`   Payload:`, JSON.stringify(productPayload, null, 4));
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
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
    const responseData = await response.json();
    
    console.log(`   Response Time: ${responseTime.toISOString()}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(responseData, null, 4));
    
    return {
      success: response.status === 200 || response.status === 201,
      status: response.status,
      response: responseData,
      timestamp: requestTime.toISOString(),
      duration: duration
    };
    
  } catch (error) {
    console.log(`   ❌ Request error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the proper location retrieval flow
getLocationFromAccount()
  .then(result => {
    if (result) {
      console.log('\n📋 FINAL RESULT:');
      console.log(`Location ID: ${result.locationId}`);
      console.log(`Location Name: ${result.locationName}`);
      console.log(`Total Locations: ${result.allLocations?.length || 0}`);
      console.log(`API Working: ${result.apiWorking !== false ? 'Unknown' : 'No'}`);
    } else {
      console.log('\n❌ Failed to retrieve location from account');
    }
  })
  .catch(console.error);