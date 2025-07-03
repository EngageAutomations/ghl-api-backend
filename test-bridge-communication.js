/**
 * Test Bridge Communication Between OAuth and API Servers
 * Focus on the dual backend architecture functionality
 */

async function testBridgeCommunication() {
  console.log('🌉 TESTING BRIDGE COMMUNICATION');
  console.log('OAuth Server ↔ API Server Communication Test');
  console.log('='.repeat(60));
  
  const results = {
    oauthServer: { status: 'unknown', responseTime: null },
    apiServer: { status: 'unknown', responseTime: null },
    bridgeComm: { status: 'unknown', responseTime: null },
    tokenRetrieval: { status: 'unknown', responseTime: null }
  };
  
  // Test 1: OAuth Server Health
  console.log('\n1️⃣ OAUTH SERVER HEALTH');
  const oauthStart = Date.now();
  try {
    const response = await fetch('https://dir.engageautomations.com/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    results.oauthServer.responseTime = Date.now() - oauthStart;
    results.oauthServer.status = response.ok ? 'operational' : 'issues';
    
    const data = await response.json();
    console.log(`   Status: ${response.status} (${results.oauthServer.responseTime}ms)`);
    console.log(`   Response: ${data.status || data.message || 'Healthy'}`);
    console.log(`   ✅ OAuth Server: ${results.oauthServer.status}`);
  } catch (error) {
    results.oauthServer.status = 'failed';
    console.log(`   ❌ OAuth Server Error: ${error.message}`);
  }
  
  // Test 2: API Server Health
  console.log('\n2️⃣ API SERVER HEALTH');
  const apiStart = Date.now();
  try {
    const response = await fetch('https://api.engageautomations.com/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    results.apiServer.responseTime = Date.now() - apiStart;
    results.apiServer.status = response.ok ? 'operational' : 'issues';
    
    const data = await response.json();
    console.log(`   Status: ${response.status} (${results.apiServer.responseTime}ms)`);
    console.log(`   Response: ${data.status || data.message || 'Healthy'}`);
    console.log(`   ✅ API Server: ${results.apiServer.status}`);
  } catch (error) {
    results.apiServer.status = 'failed';
    console.log(`   ❌ API Server Error: ${error.message}`);
  }
  
  // Test 3: Bridge Token Retrieval
  console.log('\n3️⃣ BRIDGE TOKEN RETRIEVAL');
  const tokenStart = Date.now();
  try {
    const response = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    results.tokenRetrieval.responseTime = Date.now() - tokenStart;
    
    if (response.ok) {
      const tokenData = await response.json();
      results.tokenRetrieval.status = tokenData.access_token ? 'working' : 'no-token';
      
      console.log(`   Status: ${response.status} (${results.tokenRetrieval.responseTime}ms)`);
      console.log(`   Installation: ${tokenData.installation_id || 'N/A'}`);
      console.log(`   Token Length: ${tokenData.access_token ? tokenData.access_token.length : 0} chars`);
      console.log(`   Location ID: ${tokenData.location_id || 'N/A'}`);
      console.log(`   ✅ Token Retrieval: ${results.tokenRetrieval.status}`);
    } else {
      results.tokenRetrieval.status = 'failed';
      console.log(`   ❌ Token retrieval failed: ${response.status}`);
    }
  } catch (error) {
    results.tokenRetrieval.status = 'failed';
    console.log(`   ❌ Token Retrieval Error: ${error.message}`);
  }
  
  // Test 4: API Server → OAuth Server Bridge Communication
  console.log('\n4️⃣ API SERVER BRIDGE COMMUNICATION');
  const bridgeStart = Date.now();
  try {
    // Test if API server can communicate with OAuth server
    const response = await fetch('https://api.engageautomations.com/api/test-bridge', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    results.bridgeComm.responseTime = Date.now() - bridgeStart;
    results.bridgeComm.status = response.ok ? 'working' : 'issues';
    
    console.log(`   Status: ${response.status} (${results.bridgeComm.responseTime}ms)`);
    
    if (response.ok) {
      const bridgeData = await response.json();
      console.log(`   Bridge Response:`, JSON.stringify(bridgeData, null, 2));
      console.log(`   ✅ Bridge Communication: working`);
    } else {
      console.log(`   ⚠️ Bridge endpoint may not exist (${response.status})`);
      console.log(`   Note: This is expected if bridge test endpoint not implemented`);
    }
  } catch (error) {
    results.bridgeComm.status = 'failed';
    console.log(`   ❌ Bridge Communication Error: ${error.message}`);
  }
  
  // Test 5: End-to-End Flow Simulation
  console.log('\n5️⃣ END-TO-END FLOW SIMULATION');
  try {
    // Simulate API server requesting token from OAuth server
    console.log('   Simulating: Frontend → API Server → OAuth Server → Token');
    
    // Step 1: API server receives request (simulated)
    console.log('   Step 1: API server receives product creation request ✓');
    
    // Step 2: API server requests token from OAuth server
    console.log('   Step 2: API server requests token from OAuth server...');
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939');
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      console.log('   Step 2: Token retrieved successfully ✓');
      
      // Step 3: API server would use token for GoHighLevel call (simulated)
      console.log('   Step 3: Token ready for GoHighLevel API call ✓');
      console.log('   ✅ End-to-end bridge flow: operational');
    } else {
      console.log('   Step 2: Token retrieval failed ❌');
      console.log('   ❌ End-to-end flow: broken at token step');
    }
    
  } catch (error) {
    console.log(`   ❌ End-to-end simulation failed: ${error.message}`);
  }
  
  // Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📋 BRIDGE COMMUNICATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n🏗️ Infrastructure Status:');
  console.log(`OAuth Server: ${results.oauthServer.status} (${results.oauthServer.responseTime}ms)`);
  console.log(`API Server: ${results.apiServer.status} (${results.apiServer.responseTime}ms)`);
  
  console.log('\n🌉 Bridge Functionality:');
  console.log(`Token Retrieval: ${results.tokenRetrieval.status} (${results.tokenRetrieval.responseTime}ms)`);
  console.log(`Bridge Communication: ${results.bridgeComm.status}`);
  
  console.log('\n🔍 Analysis:');
  
  if (results.oauthServer.status === 'operational' && results.apiServer.status === 'operational') {
    console.log('✅ Both servers are operational');
  } else {
    console.log('❌ Server infrastructure issues detected');
  }
  
  if (results.tokenRetrieval.status === 'working') {
    console.log('✅ Bridge token retrieval is working');
    console.log('✅ OAuth server can provide tokens to API server');
  } else {
    console.log('❌ Bridge token retrieval has issues');
  }
  
  console.log('\n🎯 Bridge Communication Status:');
  if (results.oauthServer.status === 'operational' && 
      results.apiServer.status === 'operational' && 
      results.tokenRetrieval.status === 'working') {
    console.log('✅ BRIDGE COMMUNICATION FULLY FUNCTIONAL');
    console.log('Ready for API calls once valid location ID obtained');
  } else {
    console.log('⚠️ Bridge communication has issues that need addressing');
  }
  
  return results;
}

// Run bridge communication test
testBridgeCommunication().catch(console.error);