/**
 * Test API with Fresh OAuth Installation
 * Decode token, identify account, and test GoHighLevel API calls
 */

async function testAPIWithFreshInstallation() {
  console.log('🧪 TESTING API WITH FRESH OAUTH INSTALLATION');
  console.log('Installation ID: install_1751515919476');
  console.log('='.repeat(60));
  
  const installationId = 'install_1751515919476';
  
  // Step 1: Get token access details
  console.log('📋 Step 1: Getting token access details...');
  const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
  const tokenData = await tokenResponse.json();
  
  console.log('Token Data:', JSON.stringify(tokenData, null, 2));
  
  const accessToken = tokenData.access_token;
  const locationId = tokenData.location_id;
  
  // Step 2: Decode JWT to identify account
  console.log('\n🔍 Step 2: Decoding JWT token to identify account...');
  
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
  console.log('Decoded JWT Token:', JSON.stringify(decoded, null, 2));
  
  // Extract account information
  const accountInfo = {
    authClass: decoded?.authClass,
    authClassId: decoded?.authClassId,
    primaryAuthClassId: decoded?.primaryAuthClassId,
    clientKey: decoded?.oauthMeta?.clientKey,
    agencyPlan: decoded?.oauthMeta?.agencyPlan,
    scopes: decoded?.oauthMeta?.scopes || [],
    issuedAt: new Date(decoded?.iat * 1000),
    expiresAt: new Date(decoded?.exp * 1000)
  };
  
  console.log('\n📊 ACCOUNT INFORMATION:');
  console.log('='.repeat(40));
  console.log('Account Type:', accountInfo.authClass);
  console.log('Account ID:', accountInfo.authClassId);
  console.log('Primary Location ID:', accountInfo.primaryAuthClassId);
  console.log('Client Key:', accountInfo.clientKey);
  console.log('Agency Plan:', accountInfo.agencyPlan);
  console.log('Token Issued:', accountInfo.issuedAt.toISOString());
  console.log('Token Expires:', accountInfo.expiresAt.toISOString());
  console.log('Available Scopes:', accountInfo.scopes.join(', '));
  
  // Step 3: Test location discovery
  console.log('\n🔍 Step 3: Testing location discovery...');
  
  const locationEndpoints = [
    'https://services.leadconnectorhq.com/locations/',
    'https://services.leadconnectorhq.com/locations',
    'https://rest.gohighlevel.com/v1/locations/',
    'https://rest.gohighlevel.com/v1/locations'
  ];
  
  let discoveredLocations = [];
  
  for (const endpoint of locationEndpoints) {
    try {
      console.log(`Trying location endpoint: ${endpoint}`);
      
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
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.locations && Array.isArray(data.locations)) {
          discoveredLocations = data.locations;
          console.log(`✅ Found ${data.locations.length} locations via ${endpoint}`);
          break;
        } else if (Array.isArray(data)) {
          discoveredLocations = data;
          console.log(`✅ Found ${data.length} locations via ${endpoint}`);
          break;
        }
      } else {
        const errorData = await response.text();
        console.log(`❌ ${endpoint} failed: ${response.status} - ${errorData.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} error: ${error.message}`);
    }
  }
  
  console.log(`\n📍 Location Discovery Result: ${discoveredLocations.length} locations found`);
  if (discoveredLocations.length > 0) {
    console.log('Available Locations:');
    discoveredLocations.forEach((loc, index) => {
      console.log(`  ${index + 1}. ${loc.name || loc.businessName} (${loc.id})`);
    });
  }
  
  // Step 4: Test product API endpoints
  console.log('\n🛍️ Step 4: Testing Product API endpoints...');
  
  // Use a valid location ID if available, otherwise use the JWT location ID
  const testLocationId = discoveredLocations.length > 0 ? discoveredLocations[0].id : locationId;
  console.log(`Using Location ID for API tests: ${testLocationId}`);
  
  const productEndpoints = [
    {
      name: 'List Products',
      method: 'GET',
      url: `https://services.leadconnectorhq.com/products/?locationId=${testLocationId}`,
    },
    {
      name: 'List Products (Alternative)',
      method: 'GET', 
      url: `https://services.leadconnectorhq.com/locations/${testLocationId}/products`,
    },
    {
      name: 'List Media Files',
      method: 'GET',
      url: `https://services.leadconnectorhq.com/medias/?locationId=${testLocationId}`,
    }
  ];
  
  const apiResults = [];
  
  for (const endpoint of productEndpoints) {
    try {
      console.log(`\n${endpoint.name}:`);
      console.log(`${endpoint.method} ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        apiResults.push({
          endpoint: endpoint.name,
          status: 'success',
          statusCode: response.status,
          data: data
        });
      } else {
        const errorData = await response.text();
        console.log(`❌ Failed: ${response.status}`);
        console.log('Error:', errorData.substring(0, 300));
        
        apiResults.push({
          endpoint: endpoint.name,
          status: 'failed',
          statusCode: response.status,
          error: errorData.substring(0, 300)
        });
      }
      
    } catch (error) {
      console.log(`❌ Request error: ${error.message}`);
      apiResults.push({
        endpoint: endpoint.name,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Step 5: Test a simple product creation
  console.log('\n🏗️ Step 5: Testing Product Creation...');
  
  const testProduct = {
    name: 'API Test Product',
    description: 'Test product created via API to verify functionality',
    type: 'PHYSICAL',
    available: true,
    locationId: testLocationId
  };
  
  try {
    console.log('Creating test product:', JSON.stringify(testProduct, null, 2));
    
    const createResponse = await fetch(`https://services.leadconnectorhq.com/products/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });
    
    console.log(`Product Creation Status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const productData = await createResponse.json();
      console.log('✅ Product created successfully!');
      console.log('Created Product:', JSON.stringify(productData, null, 2));
      
      apiResults.push({
        endpoint: 'Product Creation',
        status: 'success',
        statusCode: createResponse.status,
        data: productData
      });
    } else {
      const errorData = await createResponse.text();
      console.log(`❌ Product creation failed: ${createResponse.status}`);
      console.log('Error:', errorData);
      
      apiResults.push({
        endpoint: 'Product Creation',
        status: 'failed',
        statusCode: createResponse.status,
        error: errorData
      });
    }
    
  } catch (error) {
    console.log(`❌ Product creation error: ${error.message}`);
    apiResults.push({
      endpoint: 'Product Creation',
      status: 'error',
      error: error.message
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 API TESTING SUMMARY');
  console.log('='.repeat(60));
  
  console.log('Account Details:');
  console.log(`  Type: ${accountInfo.authClass}`);
  console.log(`  ID: ${accountInfo.authClassId}`);
  console.log(`  Plan: ${accountInfo.agencyPlan}`);
  console.log(`  Scopes: ${accountInfo.scopes.length} permissions`);
  
  console.log(`\nLocation Discovery: ${discoveredLocations.length} locations found`);
  console.log(`Test Location ID: ${testLocationId}`);
  
  console.log('\nAPI Test Results:');
  apiResults.forEach((result, index) => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`  ${index + 1}. ${status} ${result.endpoint}: ${result.status} (${result.statusCode || 'N/A'})`);
  });
  
  const successfulCalls = apiResults.filter(r => r.status === 'success').length;
  const totalCalls = apiResults.length;
  
  console.log(`\nOverall Success Rate: ${successfulCalls}/${totalCalls} (${Math.round(successfulCalls/totalCalls*100)}%)`);
  
  if (successfulCalls > 0) {
    console.log('🎉 API functionality confirmed working!');
    console.log('The OAuth installation and API calls are operational');
  } else {
    console.log('⚠️ All API calls failed - investigating location or permission issues');
  }
  
  return {
    accountInfo,
    discoveredLocations,
    apiResults,
    successRate: successfulCalls / totalCalls
  };
}

// Run the comprehensive API test
testAPIWithFreshInstallation()
  .then(results => {
    console.log('\n✅ API testing completed');
    console.log('Results available for further analysis');
  })
  .catch(console.error);