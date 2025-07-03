/**
 * Test OAuth Backend Deployment
 * Verify the enhanced location fix is working
 */

async function testOAuthDeployment() {
  console.log('🧪 TESTING OAUTH BACKEND DEPLOYMENT');
  console.log('Checking if enhanced location handling is active');
  console.log('='.repeat(60));
  
  const tests = [
    {
      name: 'Root Endpoint Version Check',
      url: 'https://dir.engageautomations.com/',
      expectedFeature: 'v7.0.0-location-fix'
    },
    {
      name: 'Enhanced Token Access',
      url: 'https://dir.engageautomations.com/api/token-access/install_1751436979939',
      expectedFeature: 'location_status'
    },
    {
      name: 'Installation Status (New)',
      url: 'https://dir.engageautomations.com/api/installation-status/install_1751436979939',
      expectedFeature: 'new endpoint'
    },
    {
      name: 'Token Health (New)',
      url: 'https://dir.engageautomations.com/api/token-health/install_1751436979939',
      expectedFeature: 'new endpoint'
    }
  ];
  
  let deploymentSuccess = false;
  let enhancedFeatures = 0;
  
  for (const test of tests) {
    console.log(`\n${test.name}:`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        // Check for enhanced features
        if (test.name === 'Root Endpoint Version Check') {
          if (data.status && data.status.includes('v7.0.0-location-fix')) {
            console.log('✅ Enhanced version detected');
            deploymentSuccess = true;
            enhancedFeatures++;
          } else if (data.features && Array.isArray(data.features)) {
            console.log('✅ Enhanced features detected');
            deploymentSuccess = true;
            enhancedFeatures++;
          } else {
            console.log('⚠️ Still showing old version');
          }
        }
        
        if (test.name === 'Enhanced Token Access') {
          if (data.location_status || data.account_locations) {
            console.log('✅ Enhanced location handling working');
            enhancedFeatures++;
          } else {
            console.log('⚠️ Basic token access only');
          }
        }
        
        if (test.name.includes('(New)') && response.status === 200) {
          console.log('✅ New endpoint working');
          enhancedFeatures++;
        }
        
      } else {
        const errorData = await response.text();
        console.log(`❌ Failed: ${response.status}`);
        console.log(`Error: ${errorData.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT STATUS SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Enhanced Features Working: ${enhancedFeatures}/${tests.length}`);
  
  if (deploymentSuccess && enhancedFeatures >= 2) {
    console.log('🎉 OAuth backend enhancement successfully deployed!');
    console.log('Location fix and enhanced endpoints are operational');
    console.log('Ready to test API workflows with proper location handling');
    return true;
  } else if (enhancedFeatures > 0) {
    console.log('⚠️ Partial deployment - some enhanced features working');
    console.log('Railway may still be deploying changes');
    return false;
  } else {
    console.log('❌ Enhanced features not yet active');
    console.log('Railway deployment may be in progress or failed');
    return false;
  }
}

// Run deployment test
testOAuthDeployment()
  .then(success => {
    if (success) {
      console.log('\n✅ OAuth backend ready for enhanced API workflow testing');
    } else {
      console.log('\n⏳ Waiting for Railway deployment to complete...');
    }
  })
  .catch(console.error);