/**
 * Trace JWT Location Source
 * Deep dive into JWT token to find where SGtYHkPbOl2WJV08GOpg comes from
 */

async function traceJWTLocationSource() {
  console.log('🔍 TRACING JWT LOCATION SOURCE');
  console.log('Finding the exact source of SGtYHkPbOl2WJV08GOpg');
  console.log('='.repeat(60));
  
  try {
    // Get the current installation
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('No installations found');
      return;
    }
    
    const installation = installationsData.installations[0];
    console.log(`Installation: ${installation.id}`);
    
    // Get the raw token
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.id}`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('No access token found');
      return;
    }
    
    console.log('\n🔍 DECODING COMPLETE JWT TOKEN');
    console.log('='.repeat(40));
    
    // Decode JWT token completely
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
    
    const decoded = decodeJWTPayload(tokenData.access_token);
    
    if (!decoded) {
      console.log('Failed to decode JWT token');
      return;
    }
    
    // Print ALL fields in the JWT token
    console.log('COMPLETE JWT PAYLOAD:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🎯 LOCATION-RELATED FIELDS ANALYSIS');
    console.log('='.repeat(45));
    
    // Check every field that might contain location data
    const locationFields = [
      'authClassId',
      'primaryAuthClassId', 
      'authClass',
      'locationId',
      'sub',
      'companyId',
      'agencyId',
      'userId',
      'iss',
      'aud'
    ];
    
    locationFields.forEach(field => {
      if (decoded.hasOwnProperty(field)) {
        const value = decoded[field];
        console.log(`${field}: ${value}`);
        
        if (value === 'SGtYHkPbOl2WJV08GOpg') {
          console.log(`  ⚠️  THIS IS THE SOURCE OF SGtYHkPbOl2WJV08GOpg!`);
        }
      } else {
        console.log(`${field}: (not present)`);
      }
    });
    
    console.log('\n🔍 CHECKING ALL FIELDS FOR THE PROBLEM ID');
    console.log('='.repeat(45));
    
    // Check every single field for the problematic ID
    let foundSources = [];
    
    function searchObject(obj, path = '') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value === 'SGtYHkPbOl2WJV08GOpg') {
          foundSources.push(currentPath);
          console.log(`FOUND: ${currentPath} = ${value}`);
        } else if (typeof value === 'object' && value !== null) {
          searchObject(value, currentPath);
        }
      }
    }
    
    searchObject(decoded);
    
    if (foundSources.length === 0) {
      console.log('❌ SGtYHkPbOl2WJV08GOpg NOT FOUND in JWT token!');
      console.log('This means it\'s being set somewhere else in our code');
    } else {
      console.log(`✅ Found SGtYHkPbOl2WJV08GOpg in ${foundSources.length} location(s):`);
      foundSources.forEach(source => console.log(`  → ${source}`));
    }
    
    console.log('\n🎯 BACKEND LOGIC ANALYSIS');
    console.log('='.repeat(30));
    
    // Check what our backend logic is doing
    console.log('Backend reported extraction:');
    console.log(`  authClass: ${decoded.authClass}`);
    console.log(`  authClassId: ${decoded.authClassId}`);
    console.log(`  primaryAuthClassId: ${decoded.primaryAuthClassId}`);
    
    console.log('\nBackend extraction logic should be:');
    if (decoded.authClass === 'Location') {
      console.log(`  Location install → use authClassId: ${decoded.authClassId}`);
    } else if (decoded.authClass === 'Company') {
      console.log(`  Company install → use primaryAuthClassId: ${decoded.primaryAuthClassId}`);
    }
    
    // Check if the backend is using the right field
    const backendLocationId = tokenData.location_id;
    console.log(`\nBackend extracted location: ${backendLocationId}`);
    
    if (backendLocationId === 'SGtYHkPbOl2WJV08GOpg') {
      if (decoded.authClass === 'Company' && decoded.primaryAuthClassId === 'SGtYHkPbOl2WJV08GOpg') {
        console.log('✅ Backend correctly extracted from primaryAuthClassId');
      } else if (decoded.authClass === 'Location' && decoded.authClassId === 'SGtYHkPbOl2WJV08GOpg') {
        console.log('✅ Backend correctly extracted from authClassId');
      } else {
        console.log('❌ Backend extraction logic error - using wrong field');
      }
    }
    
    console.log('\n🤔 HYPOTHESIS TESTING');
    console.log('='.repeat(25));
    
    console.log('Possible explanations:');
    console.log('1. This IS the correct location ID from GoHighLevel');
    console.log('2. But this location doesn\'t have product API access');
    console.log('3. The account/location setup is the issue, not our extraction');
    
    // Try to get more info about this location
    console.log('\n🔍 TESTING LOCATION EXISTENCE');
    console.log('='.repeat(35));
    
    // Try different endpoints to see if this location exists
    const testEndpoints = [
      `https://services.leadconnectorhq.com/locations/${backendLocationId}`,
      `https://rest.gohighlevel.com/v1/locations/${backendLocationId}`,
      `https://services.leadconnectorhq.com/locations/`,
      `https://rest.gohighlevel.com/v1/locations/`
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const testResponse = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`  Status: ${testResponse.status}`);
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          console.log(`  ✅ Success:`, JSON.stringify(data, null, 2).substring(0, 200));
        } else {
          const errorText = await testResponse.text();
          console.log(`  ❌ Error: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`  ❌ Request failed: ${error.message}`);
      }
    }
    
    console.log('\n📊 CONCLUSION');
    console.log('='.repeat(15));
    
    if (foundSources.length > 0) {
      console.log('✅ SGtYHkPbOl2WJV08GOpg comes from JWT token fields:');
      foundSources.forEach(source => console.log(`  → ${source}`));
      console.log('');
      console.log('This suggests:');
      console.log('  • GoHighLevel IS providing this location ID');
      console.log('  • Our extraction logic IS working correctly');
      console.log('  • The issue is that this location lacks API permissions');
      console.log('  • Need to test with a different GoHighLevel account');
    } else {
      console.log('❌ SGtYHkPbOl2WJV08GOpg NOT found in JWT token');
      console.log('This suggests our backend is adding this ID from somewhere else');
      console.log('Need to check backend code for hardcoded values');
    }
    
  } catch (error) {
    console.error(`Failed to trace JWT location source: ${error.message}`);
  }
}

// Run the trace
traceJWTLocationSource().catch(console.error);