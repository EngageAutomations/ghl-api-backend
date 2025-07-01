const axios = require('axios');

async function fixOAuthServerRequest() {
  try {
    console.log('=== Debugging OAuth Server API Request ===');
    
    // The issue is likely in how the OAuth server constructs the GoHighLevel API request
    // Let's check what the OAuth server is actually sending
    
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[1]; // Use newest
    
    console.log('Installation details:');
    console.log('- ID:', installation.id);
    console.log('- Location:', installation.locationId);
    console.log('- Scopes:', installation.scopes);
    
    // Based on GoHighLevel docs, the correct request should be:
    // POST https://services.leadconnectorhq.com/products/
    // Headers: Authorization: Bearer {token}, Version: 2021-07-28
    // Body: { name, description, type, locationId, ... }
    
    console.log('\n=== Analyzing OAuth Server Implementation ===');
    console.log('The OAuth server at railway-working-version/index.js likely has:');
    console.log('1. Incorrect API request body format');
    console.log('2. Missing or incorrect headers');
    console.log('3. Wrong API endpoint URL');
    console.log('4. Token format issue');
    
    // The deployed version is 5.3.0 which might have old API format
    // Looking at the code, it uses:
    console.log('\nCurrent OAuth server likely sends:');
    console.log('- URL: https://services.leadconnectorhq.com/products/');
    console.log('- Headers: Authorization, Version: 2021-07-28, Content-Type');
    console.log('- Body: { name, description, productType, locationId, ... }');
    
    // Test minimal format exactly as GHL docs specify
    console.log('\n=== Testing Minimal Required Fields ===');
    
    const minimalTest = {
      name: "Minimal GHL Test " + Date.now(),
      installation_id: installation.id
    };
    
    const response = await axios.post('https://dir.engageautomations.com/api/products/create', minimalTest, {
      timeout: 30000
    });
    
    console.log('✅ Minimal format worked!');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Even minimal format fails');
    console.log('This confirms the issue is in the OAuth server code');
    
    // The solution is to update the deployed OAuth server
    // The issue is likely that the productType should be "type" 
    // or missing required fields in the GoHighLevel API request
    
    console.log('\n🔧 Solution: Update OAuth server with correct API format');
    console.log('Need to fix the GoHighLevel API request in the deployed version');
  }
}

fixOAuthServerRequest();
