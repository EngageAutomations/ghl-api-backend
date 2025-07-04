/**
 * Direct OAuth Test - Bypass Railway Deployment Issues
 * Test media upload by working with existing OAuth backend
 */

import fetch from 'node-fetch';

async function directOAuthTest() {
  console.log('DIRECT OAUTH AUTHENTICATION TEST');
  console.log('='.repeat(50));
  
  try {
    // Check current status
    console.log('1. Current OAuth backend status:');
    const statusResponse = await fetch('https://dir.engageautomations.com/');
    const status = await statusResponse.json();
    console.log(`Version: ${status.version}`);
    console.log(`Features: ${status.features.join(', ')}`);
    
    // Check installations
    const installsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installations = await installsResponse.json();
    
    console.log('\n2. Current installation analysis:');
    if (installations.count > 0) {
      const install = installations.installations[0];
      console.log(`ID: ${install.id}`);
      console.log(`Auth Class: ${install.auth_class}`);
      console.log(`Location ID: ${install.location_id}`);
      console.log(`Scopes: ${install.scopes}`);
      
      // Check if scopes include media upload
      const hasMediaWrite = install.scopes.includes('medias.write');
      const hasMediaRead = install.scopes.includes('medias.readonly');
      console.log(`Media write permission: ${hasMediaWrite}`);
      console.log(`Media read permission: ${hasMediaRead}`);
      
      if (install.auth_class === 'Company') {
        console.log('\n3. Company-level token detected');
        console.log('This explains the 401 IAM restriction for media upload');
        console.log('GoHighLevel blocks Company-level tokens from media APIs');
      }
    }
    
    console.log('\n4. Solution approach:');
    console.log('The existing OAuth backend shows "case-sensitive-location" feature');
    console.log('This means it should generate Location-level tokens for new installations');
    
    console.log('\n5. Next steps:');
    console.log('a) Complete fresh OAuth installation');
    console.log('b) Check if new installation has auth_class: "Location"');
    console.log('c) Test media upload with Location-level token');
    
    console.log('\nInstallation URL:');
    console.log('https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    
    console.log('\nExpected after fresh installation:');
    console.log('- New installation ID');
    console.log('- auth_class: "Location" (not "Company")');
    console.log('- location_id: populated (not "not found")');
    console.log('- Media upload should return 200/201 instead of 401');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

directOAuthTest().catch(console.error);