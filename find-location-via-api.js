/**
 * Find Location ID via API Calls
 * Alternative methods to get valid location ID without JWT token
 */

async function findLocationViaAPI() {
  console.log('🔍 FINDING LOCATION ID VIA API CALLS');
  console.log('Testing alternative methods to get valid location ID');
  console.log('='.repeat(60));
  
  try {
    // Get current installation
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('No installations found');
      return;
    }
    
    const installation = installationsData.installations[0];
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.id}`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('No access token available');
      return;
    }
    
    console.log(`Testing with installation: ${installation.id}`);
    console.log('Available OAuth scopes:', tokenData.access_token ? 'Token available' : 'No token');
    
    // Method 1: Try locations endpoint
    console.log('\n📍 METHOD 1: Locations API');
    console.log('='.repeat(30));
    
    const locationEndpoints = [
      'https://services.leadconnectorhq.com/locations/',
      'https://rest.gohighlevel.com/v1/locations/',
      'https://services.leadconnectorhq.com/locations',
      'https://rest.gohighlevel.com/v1/locations'
    ];
    
    for (const endpoint of locationEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SUCCESS! Found locations data:');
          console.log(JSON.stringify(data, null, 2));
          
          // Extract location IDs
          if (data.locations && Array.isArray(data.locations)) {
            console.log('\n📋 AVAILABLE LOCATIONS:');
            data.locations.forEach((loc, index) => {
              console.log(`  ${index + 1}. ${loc.id} - ${loc.name || 'Unnamed'}`);
            });
            return { method: 'locations_api', locations: data.locations };
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 150)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    // Method 2: Try user/account info endpoints
    console.log('\n👤 METHOD 2: User/Account Info');
    console.log('='.repeat(35));
    
    const userEndpoints = [
      'https://services.leadconnectorhq.com/users/me',
      'https://rest.gohighlevel.com/v1/users/me',
      'https://services.leadconnectorhq.com/users/',
      'https://rest.gohighlevel.com/v1/users/',
      'https://services.leadconnectorhq.com/oauth/installedLocations',
      'https://services.leadconnectorhq.com/oauth/me'
    ];
    
    for (const endpoint of userEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SUCCESS! Found user/account data:');
          console.log(JSON.stringify(data, null, 2));
          
          // Look for location references
          const locationRefs = [];
          function findLocationRefs(obj, path = '') {
            for (const [key, value] of Object.entries(obj)) {
              if (key.toLowerCase().includes('location') && typeof value === 'string' && value.length > 10) {
                locationRefs.push({ path: path + key, value });
              } else if (typeof value === 'object' && value !== null) {
                findLocationRefs(value, path + key + '.');
              }
            }
          }
          
          findLocationRefs(data);
          
          if (locationRefs.length > 0) {
            console.log('\n📍 FOUND LOCATION REFERENCES:');
            locationRefs.forEach(ref => {
              console.log(`  ${ref.path}: ${ref.value}`);
            });
            return { method: 'user_info_api', locationRefs, data };
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    // Method 3: Try working backwards from products
    console.log('\n🛍️ METHOD 3: Product Discovery');
    console.log('='.repeat(35));
    
    // Try to find locations by testing product endpoints with known working location IDs
    const knownWorkingLocations = [
      'WAvk87RmW9rBSDJHeOpH', // MakerExpress 3D
      'kQDg6qp2x7GXYJ1VCkI8', // Engage Automations
      'eYeyzEWiaxcTOPROAo4C'  // Darul Uloom Tampa
    ];
    
    console.log('Testing known working location IDs to see if token has access...');
    
    for (const locationId of knownWorkingLocations) {
      try {
        console.log(`Testing location: ${locationId}`);
        const response = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${locationId}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          const productCount = data.products ? data.products.length : 0;
          console.log(`✅ SUCCESS! Found ${productCount} products in location ${locationId}`);
          return { method: 'working_location_test', locationId, productCount };
        } else {
          const errorText = await response.text();
          console.log(`❌ No access: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    // Method 4: Try company/agency endpoints
    console.log('\n🏢 METHOD 4: Company/Agency Endpoints');
    console.log('='.repeat(40));
    
    const companyEndpoints = [
      'https://services.leadconnectorhq.com/companies/me',
      'https://rest.gohighlevel.com/v1/companies/me',
      'https://services.leadconnectorhq.com/agencies/me',
      'https://rest.gohighlevel.com/v1/agencies/me'
    ];
    
    for (const endpoint of companyEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SUCCESS! Found company/agency data:');
          console.log(JSON.stringify(data, null, 2));
          return { method: 'company_api', data };
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ NO ALTERNATIVE LOCATION DISCOVERY METHODS WORKED');
    console.log('All API endpoints either failed or returned no location data');
    
    return { method: 'none', success: false };
    
  } catch (error) {
    console.error(`Failed to find location via API: ${error.message}`);
    return { error: error.message };
  }
}

// Run the location discovery
findLocationViaAPI()
  .then(result => {
    console.log('\n📊 FINAL RESULT');
    console.log('='.repeat(20));
    
    if (result && result.method !== 'none') {
      console.log(`✅ Found alternative location discovery method: ${result.method}`);
      
      if (result.locations) {
        console.log('Available locations found via API');
      } else if (result.locationId) {
        console.log(`Working location ID found: ${result.locationId}`);
      } else if (result.locationRefs) {
        console.log('Location references found in user data');
      }
    } else {
      console.log('❌ No alternative location discovery methods worked');
      console.log('May need to contact GoHighLevel support or try different account');
    }
  })
  .catch(console.error);