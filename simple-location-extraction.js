/**
 * Simple Location ID Extraction
 * Get location ID directly from JWT token or installation context
 */

async function simpleLocationExtraction() {
  console.log('🎯 SIMPLE LOCATION ID EXTRACTION');
  console.log('Testing the most direct approach to get location ID');
  console.log('='.repeat(50));
  
  // Get a fresh OAuth installation to test with
  console.log('Step 1: Getting fresh OAuth token...');
  
  try {
    // First, check what installations we have
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    console.log('Current installations:', installationsData.count);
    
    if (installationsData.count === 0) {
      console.log('No installations found - need fresh OAuth installation');
      return { needsFreshInstallation: true };
    }
    
    // Use the most recent installation
    const latestInstallation = installationsData.installations[0];
    const installationId = latestInstallation.id;
    
    console.log(`Using installation: ${installationId}`);
    
    // Get token access
    const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log('No access token found');
      return { error: 'No access token' };
    }
    
    console.log('\nStep 2: Analyzing JWT token...');
    
    // Decode JWT token
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
    
    console.log('JWT Payload Location Fields:');
    console.log('  authClassId:', decoded?.authClassId);
    console.log('  primaryAuthClassId:', decoded?.primaryAuthClassId);
    console.log('  authClass:', decoded?.authClass);
    
    // The location ID should be in authClassId when authClass is "Location"
    // or primaryAuthClassId when authClass is "Company"
    let locationId = null;
    
    if (decoded?.authClass === 'Location') {
      locationId = decoded.authClassId;
      console.log('✅ App installed on Location - using authClassId');
    } else if (decoded?.authClass === 'Company') {
      locationId = decoded.primaryAuthClassId;
      console.log('✅ App installed on Company - using primaryAuthClassId');
    } else {
      locationId = decoded?.authClassId || decoded?.primaryAuthClassId;
      console.log('⚠️ Unknown authClass - trying available location ID');
    }
    
    if (!locationId) {
      console.log('❌ No location ID found in JWT token');
      return { error: 'No location ID in JWT' };
    }
    
    console.log(`\nStep 3: Testing location ID: ${locationId}`);
    
    // Test the location ID directly
    const testResponse = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${locationId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    console.log(`API Test Status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      const productCount = data.products ? data.products.length : 0;
      
      console.log('✅ SUCCESS! Location ID works');
      console.log(`Products found: ${productCount}`);
      
      return {
        success: true,
        locationId: locationId,
        productCount: productCount,
        authClass: decoded?.authClass,
        method: 'jwt_direct_extraction'
      };
      
    } else {
      const errorData = await testResponse.text();
      console.log('❌ Location ID test failed');
      console.log(`Error: ${errorData.substring(0, 200)}`);
      
      return {
        success: false,
        locationId: locationId,
        error: errorData,
        authClass: decoded?.authClass
      };
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

// Also test direct installation lookup
async function testInstallationLookup() {
  console.log('\n🔍 TESTING INSTALLATION LOOKUP');
  console.log('Check if installation contains location info directly');
  console.log('='.repeat(50));
  
  try {
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    if (installationsData.count === 0) {
      console.log('No installations to test');
      return { needsInstallation: true };
    }
    
    const installation = installationsData.installations[0];
    console.log('Installation data:');
    console.log(`  ID: ${installation.id}`);
    console.log(`  Location ID: ${installation.locationId}`);
    console.log(`  Location Name: ${installation.locationName}`);
    console.log(`  Token Status: ${installation.tokenStatus}`);
    
    if (installation.locationId && installation.locationId !== 'unknown') {
      console.log('✅ Installation already contains location ID');
      return {
        success: true,
        locationId: installation.locationId,
        locationName: installation.locationName,
        method: 'installation_direct'
      };
    } else {
      console.log('⚠️ Installation location ID is missing or unknown');
      return {
        success: false,
        locationId: installation.locationId
      };
    }
    
  } catch (error) {
    console.log(`❌ Installation lookup error: ${error.message}`);
    return { error: error.message };
  }
}

// Run both tests
async function runSimpleTests() {
  console.log('🚀 RUNNING SIMPLE LOCATION ID TESTS');
  console.log('Testing direct approaches to get correct location ID');
  console.log('='.repeat(60));
  
  const installationResult = await testInstallationLookup();
  const jwtResult = await simpleLocationExtraction();
  
  console.log('\n📊 RESULTS SUMMARY');
  console.log('='.repeat(30));
  
  console.log('Installation Lookup:');
  if (installationResult.success) {
    console.log(`  ✅ Success: ${installationResult.locationId} (${installationResult.locationName})`);
  } else {
    console.log(`  ❌ Failed: ${installationResult.error || 'No working location'}`);
  }
  
  console.log('JWT Token Extraction:');
  if (jwtResult.success) {
    console.log(`  ✅ Success: ${jwtResult.locationId} (${jwtResult.productCount} products)`);
  } else {
    console.log(`  ❌ Failed: ${jwtResult.error || 'No working location'}`);
  }
  
  // Determine best approach
  if (installationResult.success || jwtResult.success) {
    console.log('\n✅ SOLUTION FOUND');
    console.log('We can get the location ID using simple direct extraction');
    console.log('No complex discovery system needed');
    
    const workingMethod = installationResult.success ? installationResult : jwtResult;
    console.log(`Best method: ${workingMethod.method}`);
    console.log(`Location ID: ${workingMethod.locationId}`);
    
    return { success: true, recommendation: 'simple_extraction' };
  } else {
    console.log('\n❌ SIMPLE EXTRACTION FAILED');
    console.log('May need to investigate installation process or API access');
    return { success: false, recommendation: 'investigate_further' };
  }
}

// Execute the tests
runSimpleTests()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 RECOMMENDATION: Use simple direct location extraction');
      console.log('Update OAuth backend to use direct JWT location extraction');
    } else {
      console.log('\n⚠️ RECOMMENDATION: Need to investigate OAuth installation process');
    }
  })
  .catch(console.error);