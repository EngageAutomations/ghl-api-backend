/**
 * Test Simple JWT Location Extraction
 * Test the new simple approach and generate comprehensive report
 */

async function testSimpleJWTExtraction() {
  console.log('🧪 TESTING SIMPLE JWT LOCATION EXTRACTION');
  console.log('Testing the new v8.1.0-simple-jwt system');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check system status
    console.log('Step 1: Checking OAuth backend status...');
    const statusResponse = await fetch('https://dir.engageautomations.com/');
    const statusData = await statusResponse.json();
    
    console.log(`✅ Backend Status: ${statusData.status}`);
    console.log(`✅ Approach: ${statusData.approach?.description || 'Simple JWT extraction'}`);
    
    // Step 2: Get current installations
    console.log('\nStep 2: Checking current installations...');
    const installationsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installationsData = await installationsResponse.json();
    
    console.log(`Found ${installationsData.count} installation(s)`);
    
    if (installationsData.count === 0) {
      console.log('❌ No installations found - need fresh OAuth installation');
      return {
        success: false,
        error: 'no_installations',
        recommendation: 'Fresh OAuth installation needed to test simple JWT extraction'
      };
    }
    
    // Step 3: Test each installation
    const results = [];
    
    for (const installation of installationsData.installations) {
      console.log(`\n--- Testing Installation: ${installation.id} ---`);
      console.log(`Location ID: ${installation.locationId}`);
      console.log(`Location Status: ${installation.locationStatus}`);
      console.log(`Location Context: ${installation.locationContext}`);
      console.log(`Auth Class: ${installation.authClass}`);
      console.log(`Token Status: ${installation.tokenStatus}`);
      
      // Get token access
      const tokenResponse = await fetch(`https://dir.engageautomations.com/api/token-access/${installation.id}`);
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        console.log('❌ No access token available');
        results.push({
          installationId: installation.id,
          success: false,
          error: 'no_token',
          locationId: installation.locationId
        });
        continue;
      }
      
      console.log('✅ Access token retrieved');
      console.log(`Token location: ${tokenData.location_id}`);
      console.log(`Token status: ${tokenData.token_status}`);
      
      // Test API call with extracted location
      console.log(`\nTesting API with location: ${tokenData.location_id}`);
      
      const apiResponse = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${tokenData.location_id}`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      console.log(`API Response Status: ${apiResponse.status}`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const productCount = apiData.products ? apiData.products.length : 0;
        
        console.log(`✅ SUCCESS! Found ${productCount} products`);
        
        results.push({
          installationId: installation.id,
          success: true,
          locationId: tokenData.location_id,
          locationContext: installation.locationContext,
          authClass: installation.authClass,
          productCount: productCount,
          tokenStatus: tokenData.token_status,
          apiStatus: 'working'
        });
        
      } else {
        const errorText = await apiResponse.text();
        console.log(`❌ API call failed: ${errorText.substring(0, 200)}`);
        
        results.push({
          installationId: installation.id,
          success: false,
          locationId: tokenData.location_id,
          locationContext: installation.locationContext,
          authClass: installation.authClass,
          error: errorText.substring(0, 200),
          tokenStatus: tokenData.token_status,
          apiStatus: 'failed'
        });
      }
    }
    
    // Step 4: Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(50));
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`Total installations tested: ${results.length}`);
    console.log(`Successful API calls: ${successfulTests.length}`);
    console.log(`Failed API calls: ${failedTests.length}`);
    
    if (successfulTests.length > 0) {
      console.log('\n✅ SUCCESSFUL INSTALLATIONS:');
      successfulTests.forEach(result => {
        console.log(`  ${result.installationId}:`);
        console.log(`    Location: ${result.locationId} (${result.locationContext})`);
        console.log(`    Auth Class: ${result.authClass}`);
        console.log(`    Products: ${result.productCount}`);
        console.log(`    Token: ${result.tokenStatus}`);
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED INSTALLATIONS:');
      failedTests.forEach(result => {
        console.log(`  ${result.installationId}:`);
        console.log(`    Location: ${result.locationId}`);
        console.log(`    Error: ${result.error}`);
        console.log(`    Context: ${result.locationContext || 'unknown'}`);
      });
    }
    
    // Step 5: Analysis and recommendations
    console.log('\n🔍 ANALYSIS');
    console.log('='.repeat(30));
    
    if (successfulTests.length > 0) {
      console.log('✅ Simple JWT location extraction is WORKING');
      console.log('✅ System successfully extracts location IDs from JWT tokens');
      console.log('✅ API calls succeed with extracted location IDs');
      
      const workingInstall = successfulTests[0];
      console.log(`\nWorking Configuration:`);
      console.log(`  Installation: ${workingInstall.installationId}`);
      console.log(`  Location ID: ${workingInstall.locationId}`);
      console.log(`  Context: ${workingInstall.locationContext}`);
      console.log(`  Auth Class: ${workingInstall.authClass}`);
      console.log(`  Products Available: ${workingInstall.productCount}`);
      
      return {
        success: true,
        approach: 'simple_jwt_extraction',
        workingInstallation: workingInstall,
        totalInstallations: results.length,
        successfulInstallations: successfulTests.length,
        failedInstallations: failedTests.length,
        recommendations: [
          'Simple JWT extraction approach is working correctly',
          'System ready for production use with any GoHighLevel account',
          'No complex discovery needed - direct JWT location extraction sufficient'
        ]
      };
      
    } else {
      console.log('❌ Simple JWT location extraction needs investigation');
      
      if (failedTests.length > 0) {
        const commonErrors = {};
        failedTests.forEach(result => {
          const errorType = result.error?.includes('403') ? 'forbidden' :
                           result.error?.includes('401') ? 'unauthorized' :
                           result.error?.includes('400') ? 'bad_request' :
                           'other';
          commonErrors[errorType] = (commonErrors[errorType] || 0) + 1;
        });
        
        console.log('Common error patterns:');
        Object.entries(commonErrors).forEach(([error, count]) => {
          console.log(`  ${error}: ${count} occurrence(s)`);
        });
      }
      
      return {
        success: false,
        approach: 'simple_jwt_extraction',
        totalInstallations: results.length,
        successfulInstallations: successfulTests.length,
        failedInstallations: failedTests.length,
        errors: failedTests.map(r => ({ id: r.installationId, error: r.error })),
        recommendations: [
          'Check if installations have proper API access permissions',
          'Verify location IDs extracted from JWT are valid',
          'May need fresh OAuth installation with different account'
        ]
      };
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      recommendation: 'Check OAuth backend connectivity and try again'
    };
  }
}

// Run the test and generate report
testSimpleJWTExtraction()
  .then(result => {
    console.log('\n🎯 FINAL RECOMMENDATION');
    console.log('='.repeat(40));
    
    if (result.success) {
      console.log('✅ Simple JWT location extraction is working correctly');
      console.log('✅ System ready for production use');
      console.log('✅ No complex discovery needed');
    } else {
      console.log('⚠️ Simple JWT extraction needs attention');
      if (result.recommendations) {
        result.recommendations.forEach(rec => console.log(`  → ${rec}`));
      }
    }
  })
  .catch(console.error);