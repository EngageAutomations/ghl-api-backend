/**
 * Check JWT Token for Business ID
 * Look for company/business identifiers in the JWT token
 */

async function checkJWTBusinessId() {
  console.log('🔍 CHECKING JWT TOKEN FOR BUSINESS ID');
  console.log('Looking for company/business identifiers');
  console.log('='.repeat(50));
  
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
    
    console.log(`Installation: ${installation.id}`);
    
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
    
    if (!decoded) {
      console.log('Failed to decode JWT token');
      return { error: 'decode_failed' };
    }
    
    console.log('\n📋 COMPLETE JWT TOKEN PAYLOAD:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n🏢 BUSINESS/COMPANY RELATED FIELDS:');
    console.log('='.repeat(40));
    
    // Check for business/company related fields
    const businessFields = [
      'companyId',
      'businessId', 
      'agencyId',
      'authClassId',
      'primaryAuthClassId',
      'sourceId',
      'client',
      'clientKey'
    ];
    
    const foundBusinessIds = {};
    
    businessFields.forEach(field => {
      if (decoded.hasOwnProperty(field)) {
        const value = decoded[field];
        foundBusinessIds[field] = value;
        console.log(`${field}: ${value}`);
      } else {
        console.log(`${field}: (not present)`);
      }
    });
    
    // Check oauthMeta for additional business info
    if (decoded.oauthMeta) {
      console.log('\n📱 OAUTH META FIELDS:');
      console.log('='.repeat(25));
      Object.entries(decoded.oauthMeta).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
        if (key.toLowerCase().includes('client') || key.toLowerCase().includes('company') || key.toLowerCase().includes('agency')) {
          foundBusinessIds[`oauthMeta.${key}`] = value;
        }
      });
    }
    
    console.log('\n🧪 TESTING BUSINESS IDS AS POTENTIAL LOCATION IDS:');
    console.log('='.repeat(55));
    
    // Test each business-related ID to see if any work as location IDs
    for (const [field, value] of Object.entries(foundBusinessIds)) {
      if (typeof value === 'string' && value.length > 10) {
        console.log(`\nTesting ${field}: ${value}`);
        
        try {
          const response = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${value}`, {
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
            console.log(`✅ SUCCESS! ${field} works as location ID (${productCount} products)`);
            
            return {
              success: true,
              locationId: value,
              sourceField: field,
              productCount: productCount,
              method: 'business_id_as_location'
            };
          } else {
            const errorText = await response.text();
            console.log(`❌ Failed: ${errorText.substring(0, 100)}`);
          }
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
      }
    }
    
    // Try using business IDs to find associated locations
    console.log('\n🔍 USING BUSINESS IDS TO FIND LOCATIONS:');
    console.log('='.repeat(45));
    
    for (const [field, value] of Object.entries(foundBusinessIds)) {
      if (typeof value === 'string' && value.length > 10) {
        console.log(`\nUsing ${field} (${value}) to find locations...`);
        
        // Try different endpoints with business ID as parameter
        const endpoints = [
          `https://services.leadconnectorhq.com/locations/?companyId=${value}`,
          `https://services.leadconnectorhq.com/locations/?agencyId=${value}`,
          `https://rest.gohighlevel.com/v1/locations/?companyId=${value}`,
          `https://services.leadconnectorhq.com/oauth/installedLocations?companyId=${value}`
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`  Testing: ${endpoint}`);
            const response = await fetch(endpoint, {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Version': '2021-07-28',
                'Accept': 'application/json'
              }
            });
            
            console.log(`  Status: ${response.status}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log('  ✅ SUCCESS! Found data:');
              console.log('  ' + JSON.stringify(data, null, 2).substring(0, 300));
              
              // Look for locations in response
              if (data.locations && Array.isArray(data.locations)) {
                for (const location of data.locations) {
                  console.log(`  Testing discovered location: ${location.id}`);
                  
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
                    console.log(`  ✅ Location ${location.id} WORKS! (${productCount} products)`);
                    
                    return {
                      success: true,
                      locationId: location.id,
                      locationName: location.name,
                      sourceField: field,
                      sourceValue: value,
                      productCount: productCount,
                      method: 'business_id_lookup'
                    };
                  }
                }
              }
            } else {
              const errorText = await response.text();
              console.log(`  ❌ Failed: ${errorText.substring(0, 80)}`);
            }
          } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
          }
        }
      }
    }
    
    return {
      success: false,
      businessIds: foundBusinessIds,
      error: 'no_working_business_ids'
    };
    
  } catch (error) {
    console.error(`Failed to check JWT business ID: ${error.message}`);
    return { error: error.message };
  }
}

// Run the business ID check
checkJWTBusinessId()
  .then(result => {
    console.log('\n📊 BUSINESS ID CHECK RESULT');
    console.log('='.repeat(30));
    
    if (result.success) {
      console.log(`✅ FOUND WORKING LOCATION VIA BUSINESS ID!`);
      console.log(`Location ID: ${result.locationId}`);
      console.log(`Source: ${result.sourceField} = ${result.sourceValue || result.locationId}`);
      console.log(`Method: ${result.method}`);
      console.log(`Products: ${result.productCount}`);
      if (result.locationName) {
        console.log(`Name: ${result.locationName}`);
      }
    } else if (result.needsInstallation) {
      console.log('❌ No installations to test - need fresh OAuth installation');
    } else {
      console.log('❌ No working business IDs found as location identifiers');
      if (result.businessIds) {
        console.log('Business IDs found in JWT:');
        Object.entries(result.businessIds).forEach(([field, value]) => {
          console.log(`  ${field}: ${value}`);
        });
      }
    }
  })
  .catch(console.error);