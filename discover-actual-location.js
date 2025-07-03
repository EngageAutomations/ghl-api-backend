/**
 * Discover Actual Location ID for Current Installation
 * Use GoHighLevel APIs to find the real location where the app is installed
 */

async function discoverActualLocation() {
  console.log('🔍 DISCOVERING ACTUAL LOCATION ID');
  console.log('Finding the real location where the app is installed');
  console.log('='.repeat(60));
  
  try {
    // Get current installation
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('No installations found - need fresh OAuth installation');
      return { needsInstallation: true };
    }
    
    const installation = installationsData.installations[0];
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.id}`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('No access token available');
      return { error: 'no_token' };
    }
    
    console.log(`Testing with installation: ${installation.id}`);
    
    // Method 1: Try user/company info to find associated locations
    console.log('\n📍 METHOD 1: Company/User Location Discovery');
    console.log('='.repeat(50));
    
    const infoEndpoints = [
      { url: 'https://services.leadconnectorhq.com/users/', desc: 'Users endpoint' },
      { url: 'https://services.leadconnectorhq.com/oauth/installedLocations', desc: 'Installed locations' },
      { url: 'https://services.leadconnectorhq.com/companies/', desc: 'Companies endpoint' },
      { url: 'https://rest.gohighlevel.com/v1/users/', desc: 'V1 Users endpoint' }
    ];
    
    for (const endpoint of infoEndpoints) {
      try {
        console.log(`Testing: ${endpoint.desc}`);
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS! Found data from ${endpoint.desc}`);
          console.log('Response data:', JSON.stringify(data, null, 2));
          
          // Look for location references in the response
          const locationRefs = [];
          function findLocationRefs(obj, path = '') {
            for (const [key, value] of Object.entries(obj)) {
              if (key.toLowerCase().includes('location') && typeof value === 'string' && value.length > 10) {
                locationRefs.push({ path: path + key, value });
              } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                  if (typeof item === 'object' && item !== null) {
                    findLocationRefs(item, `${path}${key}[${index}].`);
                  }
                });
              } else if (typeof value === 'object' && value !== null) {
                findLocationRefs(value, path + key + '.');
              }
            }
          }
          
          findLocationRefs(data);
          
          if (locationRefs.length > 0) {
            console.log('Found location references:');
            for (const ref of locationRefs) {
              console.log(`  ${ref.path}: ${ref.value}`);
              
              // Test this location ID
              const testResponse = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${ref.value}`, {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json'
                }
              });
              
              if (testResponse.ok) {
                const testData = await testResponse.json();
                const productCount = testData.products ? testData.products.length : 0;
                console.log(`  ✅ Location ${ref.value} WORKS! (${productCount} products)`);
                
                return {
                  method: 'api_discovery',
                  locationId: ref.value,
                  productCount: productCount,
                  source: endpoint.desc,
                  path: ref.path
                };
              } else {
                console.log(`  ❌ Location ${ref.value} failed: ${testResponse.status}`);
              }
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 150)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    // Method 2: Try locations listing endpoints with different parameters
    console.log('\n📋 METHOD 2: Direct Locations Listing');
    console.log('='.repeat(45));
    
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
          
          if (data.locations && Array.isArray(data.locations)) {
            console.log(`Found ${data.locations.length} location(s):`);
            
            for (const location of data.locations) {
              console.log(`Testing location: ${location.id} - ${location.name || 'Unnamed'}`);
              
              // Test each discovered location
              const testResponse = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${location.id}`, {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json'
                }
              });
              
              if (testResponse.ok) {
                const testData = await testResponse.json();
                const productCount = testData.products ? testData.products.length : 0;
                console.log(`✅ Location ${location.id} WORKS! (${productCount} products)`);
                
                return {
                  method: 'locations_api',
                  locationId: location.id,
                  locationName: location.name,
                  productCount: productCount,
                  allLocations: data.locations
                };
              } else {
                console.log(`❌ Location ${location.id} failed: ${testResponse.status}`);
              }
            }
          } else {
            console.log('No locations array found in response');
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    // Method 3: Try JWT token introspection endpoints
    console.log('\n🔍 METHOD 3: Token Introspection');
    console.log('='.repeat(35));
    
    const tokenEndpoints = [
      'https://services.leadconnectorhq.com/oauth/token/introspect',
      'https://services.leadconnectorhq.com/oauth/userinfo',
      'https://services.leadconnectorhq.com/oauth/me'
    ];
    
    for (const endpoint of tokenEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: `token=${tokenData.access_token}`
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SUCCESS! Token introspection data:');
          console.log(JSON.stringify(data, null, 2));
          
          // Look for location info in token introspection
          if (data.location_id || data.locationId) {
            const locationId = data.location_id || data.locationId;
            console.log(`Found location ID in token data: ${locationId}`);
            
            // Test this location
            const testResponse = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${locationId}`, {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Version': '2021-07-28',
                'Accept': 'application/json'
              }
            });
            
            if (testResponse.ok) {
              const testData = await testResponse.json();
              const productCount = testData.products ? testData.products.length : 0;
              console.log(`✅ Token location ${locationId} WORKS! (${productCount} products)`);
              
              return {
                method: 'token_introspection',
                locationId: locationId,
                productCount: productCount,
                tokenData: data
              };
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ NO ACTUAL LOCATION DISCOVERY METHODS WORKED');
    console.log('Unable to find the real location ID for this installation');
    
    return { 
      success: false, 
      error: 'no_location_discovered',
      recommendation: 'May need to contact GoHighLevel support or try different account'
    };
    
  } catch (error) {
    console.error(`Failed to discover actual location: ${error.message}`);
    return { error: error.message };
  }
}

// Run the actual location discovery
discoverActualLocation()
  .then(result => {
    console.log('\n📊 DISCOVERY RESULT');
    console.log('='.repeat(25));
    
    if (result.success !== false && result.locationId) {
      console.log(`✅ FOUND ACTUAL LOCATION: ${result.locationId}`);
      console.log(`Method: ${result.method}`);
      console.log(`Products: ${result.productCount}`);
      if (result.locationName) {
        console.log(`Name: ${result.locationName}`);
      }
      console.log('\nThis is the real location ID to use for your installation');
    } else {
      console.log('❌ Could not discover actual location ID');
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      if (result.recommendation) {
        console.log(`Recommendation: ${result.recommendation}`);
      }
    }
  })
  .catch(console.error);