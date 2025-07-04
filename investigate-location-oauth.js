/**
 * Investigate Location-Level OAuth Requirements
 * Research how to get Location-level tokens instead of Company-level
 */

console.log('INVESTIGATING LOCATION-LEVEL OAUTH REQUIREMENTS');
console.log('='.repeat(60));

console.log('\n1. CURRENT PROBLEM:');
console.log('• Working OAuth backend generates Company-level tokens');
console.log('• Company-level tokens blocked from media upload by GoHighLevel IAM');
console.log('• Need Location-level tokens for media upload access');

console.log('\n2. OAUTH FLOW ANALYSIS:');
console.log('• Authorization URL: https://marketplace.gohighlevel.com/oauth/chooselocation');
console.log('• Token Exchange: https://services.leadconnectorhq.com/oauth/token');
console.log('• Current result: authClass: "Company"');
console.log('• Required result: authClass: "Location"');

console.log('\n3. POTENTIAL SOLUTIONS TO INVESTIGATE:');

console.log('\nA) OAuth Authorization URL Parameters:');
console.log('• Current: https://marketplace.gohighlevel.com/oauth/chooselocation');
console.log('• Possible: Add scope parameter for location-level access');
console.log('• Possible: Add response_type parameter specifying location access');
console.log('• Possible: Add access_type parameter');

console.log('\nB) Token Exchange Parameters:');
console.log('• Standard OAuth 2.0: client_id, client_secret, grant_type, code, redirect_uri');
console.log('• GoHighLevel specific: user_type parameter (causes deployment failure)');
console.log('• Alternative: scope parameter in token exchange');

console.log('\nC) App Configuration in GoHighLevel Marketplace:');
console.log('• App permissions may be set to Company-level by default');
console.log('• May need to update app configuration to request Location-level access');
console.log('• Scopes in app configuration determine available auth levels');

console.log('\n4. IMMEDIATE TEST APPROACH:');
console.log('Deploy working OAuth backend and test with fresh installation');
console.log('This will confirm if the issue is:');
console.log('• Code-level (OAuth implementation)');
console.log('• Configuration-level (GoHighLevel app settings)');
console.log('• Account-level (User permissions during installation)');

console.log('\n5. NEXT STEPS:');
console.log('1. Deploy clean working OAuth backend');
console.log('2. Test fresh OAuth installation');
console.log('3. Check what auth level GoHighLevel naturally provides');
console.log('4. If Company-level persists, investigate app configuration');
console.log('5. Research GoHighLevel documentation for Location-level OAuth');

console.log('\nKEY INSIGHT: Auth level may be determined by app marketplace configuration,');
console.log('not by OAuth flow parameters. Testing will reveal the root cause.');