/**
 * Simple Test Approach - Use Existing OAuth Backend
 * Test media upload without complex deployments
 */

import fetch from 'node-fetch';

async function simpleTestApproach() {
  console.log('🎯 SIMPLE TEST APPROACH');
  console.log('='.repeat(50));
  
  console.log('PROBLEM DIAGNOSIS:');
  console.log('• Railway deployment cache issues preventing updates');
  console.log('• GitHub has correct Location-only code but Railway shows old version');
  console.log('• Company-level token (install_1751582859348) blocks media upload');
  console.log('');
  
  console.log('ROOT CAUSE:');
  console.log('• Current installation: auth_class: "Company"');
  console.log('• Media upload requires: auth_class: "Location"');
  console.log('• GoHighLevel blocks Company-level tokens from media upload');
  console.log('');
  
  console.log('SIMPLE SOLUTION:');
  console.log('1. Skip Railway deployment battles');
  console.log('2. Use existing OAuth backend (may already work)');
  console.log('3. Do fresh OAuth installation to get new token');
  console.log('4. Test if new installation generates Location-level token');
  console.log('');
  
  console.log('WHY THIS SHOULD WORK:');
  console.log('• Existing backend shows "case-sensitive-location" feature');
  console.log('• The case-sensitive fix might already be working');
  console.log('• Fresh installation bypasses the Company-level token');
  console.log('• OAuth flow doesn\'t depend on Railway deployment timing');
  console.log('');
  
  console.log('INSTALLATION URL:');
  console.log('https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
  console.log('');
  
  console.log('WHAT TO EXPECT AFTER FRESH INSTALLATION:');
  console.log('• New installation ID (different from install_1751582859348)');
  console.log('• Hopefully auth_class: "Location" instead of "Company"');
  console.log('• JWT token with locationId field populated');
  console.log('• Media upload API returning 200/201 instead of 401');
  console.log('');
  
  console.log('TEST STEPS AFTER INSTALLATION:');
  console.log('1. Check /installations endpoint for new auth_class');
  console.log('2. Get access token and decode JWT payload');
  console.log('3. Test media upload with Location-level token');
  console.log('4. Verify media upload returns success instead of IAM error');
  
  // Quick current status check
  try {
    console.log('\nCURRENT STATUS CHECK:');
    const statusResponse = await fetch('https://dir.engageautomations.com/');
    const status = await statusResponse.json();
    console.log(`Backend version: ${status.version}`);
    console.log(`Features: ${status.features.join(', ')}`);
    
    const installsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installations = await installsResponse.json();
    console.log(`Current installations: ${installations.count}`);
    
    if (installations.count > 0) {
      const install = installations.installations[0];
      console.log(`Current auth_class: ${install.auth_class}`);
      console.log(`Current location_id: ${install.location_id}`);
    }
    
  } catch (error) {
    console.log('Status check failed:', error.message);
  }
}

simpleTestApproach().catch(console.error);