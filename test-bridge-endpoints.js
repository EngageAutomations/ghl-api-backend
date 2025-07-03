/**
 * Test Additional Bridge Endpoints
 * Check what other communication we can set up between servers
 */

async function testBridgeEndpoints() {
  console.log('🔗 TESTING ADDITIONAL BRIDGE ENDPOINTS');
  console.log('Checking what other server-to-server communication is available');
  console.log('='.repeat(70));
  
  const endpoints = [
    { name: 'OAuth Status', url: 'https://dir.engageautomations.com/api/oauth/status' },
    { name: 'Installation Info', url: 'https://dir.engageautomations.com/api/installations' },
    { name: 'Token Health', url: 'https://dir.engageautomations.com/api/token-health/install_1751436979939' },
    { name: 'Refresh Token', url: 'https://dir.engageautomations.com/api/refresh-token/install_1751436979939' },
    { name: 'Installation List', url: 'https://dir.engageautomations.com/installations' },
    { name: 'API Products', url: 'https://api.engageautomations.com/api/products' },
    { name: 'API Media', url: 'https://api.engageautomations.com/api/media' },
    { name: 'API Status', url: 'https://api.engageautomations.com/status' }
  ];
  
  const workingEndpoints = [];
  const failedEndpoints = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Working: ${endpoint.name}`);
        console.log(`   Response:`, JSON.stringify(data, null, 2));
        workingEndpoints.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          data: data
        });
      } else {
        console.log(`   ❌ Failed: ${response.status}`);
        failedEndpoints.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.status
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failedEndpoints.push({
        name: endpoint.name,
        url: endpoint.url,
        error: error.message
      });
    }
  }
  
  // Test API server calling OAuth server with different methods
  console.log('\n🔄 TESTING API SERVER CALLING OAUTH SERVER');
  await testAPItoOAuthCommunication();
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 BRIDGE ENDPOINTS SUMMARY');
  console.log('='.repeat(70));
  
  console.log(`\n✅ Working Endpoints (${workingEndpoints.length}):`);
  workingEndpoints.forEach(ep => {
    console.log(`   • ${ep.name}: ${ep.url}`);
  });
  
  console.log(`\n❌ Failed Endpoints (${failedEndpoints.length}):`);
  failedEndpoints.forEach(ep => {
    console.log(`   • ${ep.name}: ${ep.url} (${ep.status || ep.error})`);
  });
  
  return { workingEndpoints, failedEndpoints };
}

async function testAPItoOAuthCommunication() {
  console.log('\n📡 API SERVER → OAUTH SERVER COMMUNICATION PATTERNS');
  
  // Test different ways API server can communicate with OAuth server
  const communicationTests = [
    {
      name: 'Direct Token Request',
      method: 'GET',
      url: 'https://dir.engageautomations.com/api/token-access/install_1751436979939'
    },
    {
      name: 'Installation Status Check',
      method: 'GET', 
      url: 'https://dir.engageautomations.com/api/installation-status/install_1751436979939'
    },
    {
      name: 'Token Validation',
      method: 'POST',
      url: 'https://dir.engageautomations.com/api/validate-token',
      body: { installation_id: 'install_1751436979939' }
    }
  ];
  
  for (const test of communicationTests) {
    console.log(`\n   Testing: ${test.name}`);
    
    try {
      const options = {
        method: test.method,
        headers: { 'Accept': 'application/json' }
      };
      
      if (test.body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(test.url, options);
      console.log(`      Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`      ✅ ${test.name}: Working`);
        console.log(`      Data available: ${Object.keys(data).join(', ')}`);
      } else {
        console.log(`      ⚠️ ${test.name}: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`      ❌ ${test.name}: ${error.message}`);
    }
  }
}

// Run bridge endpoints test
testBridgeEndpoints().catch(console.error);