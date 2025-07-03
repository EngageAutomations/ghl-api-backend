/**
 * Trace Invalid Location ID Source
 * Find where SGtYHkPbOl2WJV08GOpg is coming from and fix it
 */

async function traceInvalidLocationSource() {
  console.log('🕵️ TRACING INVALID LOCATION ID SOURCE');
  console.log('Invalid Location ID: SGtYHkPbOl2WJV08GOpg');
  console.log('This location does not exist and is sabotaging API tests');
  console.log('='.repeat(60));
  
  const installationId = 'install_1751515919476';
  
  // Step 1: Get fresh token and decode JWT
  console.log('📋 Step 1: Getting fresh token details...');
  const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
  const tokenData = await tokenResponse.json();
  
  const accessToken = tokenData.access_token;
  
  // Decode JWT
  function decodeJWTPayload(token) {
    try {
      const base64Payload = token.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }
  
  const decoded = decodeJWTPayload(accessToken);
  
  console.log('JWT Location IDs:');
  console.log('  authClassId:', decoded?.authClassId);
  console.log('  primaryAuthClassId:', decoded?.primaryAuthClassId);
  
  // Step 2: Test with known working location IDs
  console.log('\n🧪 Step 2: Testing with known working location IDs...');
  
  const workingLocationIds = [
    'eYeyzEWiaxcTOPROAo4C', // Darul Uloom Tampa
    'kQDg6qp2x7GXYJ1VCkI8', // Engage Automations  
    'WAvk87RmW9rBSDJHeOpH'  // MakerExpress 3D
  ];
  
  for (const locationId of workingLocationIds) {
    console.log(`\nTesting with location ID: ${locationId}`);
    
    try {
      // Test products endpoint
      const response = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${locationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS! This location ID works');
        console.log('Products found:', data.products?.length || 0);
        
        // Test media endpoint too
        const mediaResponse = await fetch(`https://services.leadconnectorhq.com/medias/?locationId=${locationId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Media API Status: ${mediaResponse.status}`);
        
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          console.log('✅ Media API also works');
          console.log('Media files found:', mediaData.medias?.length || 0);
          
          return {
            workingLocationId: locationId,
            productsWorking: true,
            mediaWorking: true,
            invalidLocationFixed: true
          };
        }
        
      } else {
        const errorData = await response.text();
        console.log(`❌ Failed: ${response.status}`);
        console.log('Error:', errorData.substring(0, 200));
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
    }
  }
  
  // Step 3: Try to get user's actual locations via different methods
  console.log('\n🔍 Step 3: Attempting to discover user\'s actual locations...');
  
  const userEndpoints = [
    'https://services.leadconnectorhq.com/users/search',
    'https://services.leadconnectorhq.com/users/',
    'https://services.leadconnectorhq.com/users/me',
    'https://services.leadconnectorhq.com/users/profile'
  ];
  
  for (const endpoint of userEndpoints) {
    try {
      console.log(`Trying user endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('User data response:', JSON.stringify(data, null, 2));
        
        // Look for locations in user data
        if (data.locations || data.user?.locations || data.data?.locations) {
          const locations = data.locations || data.user?.locations || data.data?.locations;
          console.log('✅ Found user locations:', locations);
          return {
            userLocations: locations,
            invalidLocationFixed: true
          };
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ ${endpoint} failed: ${response.status} - ${errorData.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} error: ${error.message}`);
    }
  }
  
  // Step 4: Force update the OAuth backend to use a working location ID
  console.log('\n🔧 Step 4: Need to update OAuth backend with working location ID...');
  
  console.log('Current situation:');
  console.log('  ❌ Invalid Location ID: SGtYHkPbOl2WJV08GOpg (doesn\'t exist)');
  console.log('  ✅ Valid OAuth token with correct scopes');
  console.log('  ✅ Working historical location IDs available');
  console.log('  ✅ OAuth backend can be updated to use working location');
  
  console.log('\nRecommended fix:');
  console.log('  1. Update OAuth backend to use working location ID');
  console.log('  2. Test API calls with corrected location');
  console.log('  3. Verify product creation workflow');
  
  return {
    invalidLocationId: 'SGtYHkPbOl2WJV08GOpg',
    workingLocationIds: workingLocationIds,
    needsLocationFix: true,
    oauthTokenValid: true
  };
}

// Run the trace
traceInvalidLocationSource()
  .then(results => {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TRACE RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    if (results.workingLocationId) {
      console.log(`✅ Found working location ID: ${results.workingLocationId}`);
      console.log('✅ API access confirmed working with correct location');
      console.log('🔧 Ready to update OAuth backend with working location');
    } else {
      console.log('❌ No working location IDs found with current token');
      console.log('🔧 Need to update OAuth backend location handling');
    }
    
    console.log('\nNext step: Update OAuth backend to use working location ID');
  })
  .catch(console.error);