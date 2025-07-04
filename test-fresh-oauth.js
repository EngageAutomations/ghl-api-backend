/**
 * Test Fresh OAuth Installation
 * Check if the current OAuth backend can generate Location-level tokens
 */

import fetch from 'node-fetch';

async function testFreshOAuth() {
  console.log('🎯 TESTING FRESH OAUTH INSTALLATION');
  console.log('='.repeat(50));
  
  try {
    console.log('1. Checking current OAuth backend version...');
    const statusResponse = await fetch('https://dir.engageautomations.com/');
    const status = await statusResponse.json();
    
    console.log('📊 Current Backend Status:');
    console.log(`• Version: ${status.version}`);
    console.log(`• Features: ${status.features.join(', ')}`);
    console.log(`• Debug: ${status.debug}`);
    console.log(`• Uptime: ${Math.floor(status.uptime / 60)} minutes`);
    
    console.log('\n2. Checking current installations...');
    const installsResponse = await fetch('https://dir.engageautomations.com/installations');
    const installations = await installsResponse.json();
    
    console.log(`📊 Current Installations: ${installations.count}`);
    
    if (installations.count > 0) {
      installations.installations.forEach(install => {
        console.log(`• ID: ${install.id}`);
        console.log(`• Location ID: ${install.location_id}`);
        console.log(`• Auth Class: ${install.auth_class}`);
        console.log(`• Created: ${install.created_at}`);
        console.log(`• Scopes: ${install.scopes}`);
        console.log('');
      });
    }
    
    console.log('3. Simple OAuth Test Approach:');
    console.log('Instead of forcing Railway deployments, let\'s test with fresh OAuth installation');
    console.log('');
    console.log('✅ SIMPLER APPROACH:');
    console.log('• Use existing OAuth backend (it may already support Location-level)');
    console.log('• Do fresh OAuth installation to clear Company-level token');
    console.log('• Test if GoHighLevel returns Location-level token naturally');
    console.log('• Check if media upload works with fresh token');
    console.log('');
    console.log('🔗 OAuth Installation URL:');
    console.log('https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    console.log('');
    console.log('💡 Key Point:');
    console.log('The case-sensitive "Location" fix may already be working');
    console.log('Railway deployment delays don\'t affect the OAuth flow');
    console.log('Fresh installation will test the actual authentication');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFreshOAuth().catch(console.error);