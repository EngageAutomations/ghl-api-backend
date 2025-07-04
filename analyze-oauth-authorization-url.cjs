/**
 * Analyze OAuth Authorization URL Issue
 * The problem might be that we need to use /oauth/chooselocation in the auth URL
 */

const https = require('https');

async function analyzeOAuthAuthorizationURL() {
  console.log('🔍 ANALYZING OAUTH AUTHORIZATION URL ISSUE');
  console.log('Official demo uses /oauth/chooselocation - marketplace apps might use different endpoint');
  console.log('='.repeat(70));
  
  console.log('💡 KEY INSIGHT from Official GoHighLevel Demo:');
  console.log('');
  console.log('Authorization URL Pattern:');
  console.log('https://marketplace.leadconnectorhq.com/oauth/chooselocation?');
  console.log('  response_type=code');
  console.log('  redirect_uri=CALLBACK_URL');
  console.log('  client_id=CLIENT_ID');
  console.log('  scope=SCOPES');
  console.log('');
  console.log('Token Exchange:');
  console.log('  POST https://services.leadconnectorhq.com/oauth/token');
  console.log('  Body: client_id, client_secret, grant_type, code, user_type: "Location", redirect_uri');
  console.log('');
  
  console.log('🎯 ROOT CAUSE ANALYSIS:');
  console.log('');
  console.log('1. AUTHORIZATION ENDPOINT DIFFERENCE:');
  console.log('   • Official Demo: /oauth/chooselocation (Forces location selection)');
  console.log('   • Marketplace Apps: Maybe using /oauth/authorize (Company-level default)');
  console.log('');
  console.log('2. USER FLOW DIFFERENCE:');
  console.log('   • /oauth/chooselocation: User must select specific location → Location-level token');
  console.log('   • /oauth/authorize: User authorizes at company level → Company-level token');
  console.log('');
  console.log('3. MARKETPLACE APP CONFIGURATION:');
  console.log('   • Distribution Type: Must be configured for Location-level access');
  console.log('   • Redirect URL: Must point to proper authorization endpoint');
  console.log('');
  
  console.log('💡 SOLUTION HYPOTHESES:');
  console.log('');
  console.log('A. APP CONFIGURATION ISSUE:');
  console.log('   • GoHighLevel marketplace app must be configured for Sub-Account (Location) distribution');
  console.log('   • Currently might be configured for Agency-level access only');
  console.log('');
  console.log('B. AUTHORIZATION URL ISSUE:');
  console.log('   • Marketplace installs might redirect to wrong OAuth endpoint');
  console.log('   • Need to ensure users go through /oauth/chooselocation flow');
  console.log('');
  console.log('C. SCOPE vs AUTH CLASS CONFLICT:');
  console.log('   • Having correct scopes doesn\'t guarantee Location-level access');
  console.log('   • Auth class determined by authorization flow, not just scopes');
  console.log('');
  
  console.log('📋 NEXT STEPS:');
  console.log('');
  console.log('1. CHECK MARKETPLACE APP CONFIGURATION:');
  console.log('   • Distribution Type: Must be "Sub-Account" or "Agency & Sub-Account"');
  console.log('   • OAuth Settings: Verify authorization endpoint configuration');
  console.log('');
  console.log('2. TEST DIRECT /oauth/chooselocation FLOW:');
  console.log('   • Manually construct authorization URL with /oauth/chooselocation');
  console.log('   • Test if direct location selection produces Location-level tokens');
  console.log('');
  console.log('3. VERIFY TOKEN EXCHANGE PARAMETERS:');
  console.log('   • Already using user_type: "Location" correctly');
  console.log('   • All other parameters match official demo');
  console.log('');
  
  // Test if we can get details about the current OAuth flow
  console.log('🔍 CURRENT INSTALLATION ANALYSIS:');
  console.log('');
  
  try {
    const installations = await getInstallations();
    if (installations.length > 0) {
      const latest = installations[installations.length - 1];
      console.log('📍 Latest Installation Details:');
      console.log('   • ID:', latest.id);
      console.log('   • Method:', latest.method || 'not specified');
      console.log('   • Auth Class:', latest.auth_class);
      console.log('   • Location ID Found:', latest.location_id !== 'not found');
      console.log('   • Scopes Include medias.write:', latest.scopes?.includes('medias.write'));
      console.log('');
      
      if (latest.auth_class === 'Company') {
        console.log('❌ CONFIRMED: Company-level token despite user_type parameter');
        console.log('🎯 ROOT CAUSE: Authorization flow, not token exchange');
        console.log('💡 SOLUTION: Need to fix authorization URL to use /oauth/chooselocation');
      }
    }
  } catch (error) {
    console.log('❌ Could not analyze current installation:', error.message);
  }
  
  console.log('');
  console.log('🚨 CRITICAL FINDING:');
  console.log('The user_type: "Location" parameter only works if the authorization');
  console.log('flow started with location selection (/oauth/chooselocation).');
  console.log('Marketplace apps might be using /oauth/authorize by default.');
  console.log('');
  console.log('This requires updating the GoHighLevel marketplace app configuration');
  console.log('to ensure proper Location-level authorization flow.');
}

async function getInstallations() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/installations',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          resolve(result.installations || []);
        } else {
          reject(new Error(`Get installations failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

analyzeOAuthAuthorizationURL().catch(console.error);