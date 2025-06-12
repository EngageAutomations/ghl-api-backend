/**
 * Check Installation Data Script
 * Analyzes what OAuth data was captured during installation
 */

import fetch from 'node-fetch';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

async function checkInstallationData() {
  log('\n=== OAuth Installation Data Analysis ===', colors.blue);
  
  try {
    // Check development server for captured data
    const devResponse = await fetch('http://localhost:5000/oauth/installation-data');
    const devData = await devResponse.json();
    
    if (devData.success && devData.installation) {
      log('✅ Found OAuth installation data on development server:', colors.green);
      log(`Installation Time: ${devData.installation.timestamp}`);
      log('\n--- User Information ---', colors.cyan);
      log(`User ID: ${devData.installation.user.id}`);
      log(`Email: ${devData.installation.user.email}`);
      log(`Name: ${devData.installation.user.name}`);
      log(`Phone: ${devData.installation.user.phone || 'Not provided'}`);
      log(`Company: ${devData.installation.user.company || 'Not provided'}`);
      
      log('\n--- Token Information ---', colors.cyan);
      log(`Access Token: ${devData.installation.tokens.hasAccessToken ? 'Present' : 'Missing'}`);
      log(`Refresh Token: ${devData.installation.tokens.hasRefreshToken ? 'Present' : 'Missing'}`);
      log(`Token Type: ${devData.installation.tokens.tokenType}`);
      log(`Expires In: ${devData.installation.tokens.expiresIn} seconds`);
      log(`Scopes: ${devData.installation.tokens.scopes}`);
      
      log('\n--- Location Information ---', colors.cyan);
      if (devData.installation.location) {
        log(`Location ID: ${devData.installation.location.id}`);
        log(`Location Name: ${devData.installation.location.name}`);
        log(`Business Type: ${devData.installation.location.businessType || 'Not specified'}`);
        log(`Address: ${devData.installation.location.address || 'Not provided'}`);
      } else {
        log('No location data captured');
      }
      
      return devData.installation;
    } else {
      log('❌ No OAuth installation data found on development server', colors.red);
      log('This indicates either:', colors.yellow);
      log('  1. Installation went to production server (dir.engageautomations.com)', colors.yellow);
      log('  2. Installation failed during token exchange', colors.yellow);
      log('  3. Server restarted and cleared the data', colors.yellow);
    }
    
  } catch (error) {
    log(`❌ Error checking installation data: ${error.message}`, colors.red);
  }
  
  // Generate fresh OAuth URL for another test
  log('\n=== Ready for New Installation Test ===', colors.blue);
  try {
    const urlResponse = await fetch('http://localhost:5000/oauth/callback?action=generate-url');
    const urlData = await urlResponse.json();
    
    if (urlData.success) {
      log('📋 Use this URL for a new installation test:', colors.cyan);
      log(urlData.authUrl);
      log('\nThis will capture data on the development server for analysis.', colors.yellow);
    }
  } catch (error) {
    log(`Error generating OAuth URL: ${error.message}`, colors.red);
  }
  
  return null;
}

// Run the check
checkInstallationData().then(data => {
  if (data) {
    log('\n✅ OAuth installation data successfully retrieved and analyzed', colors.green);
  } else {
    log('\n⚠️ No installation data found - ready for new test', colors.yellow);
  }
}).catch(error => {
  log(`❌ Analysis failed: ${error.message}`, colors.red);
  process.exit(1);
});