/**
 * Comprehensive Dual Backend Testing Report Generator
 * Tests both backends with authentic payloads and generates detailed report
 */

async function generateComprehensiveDualBackendReport() {
  console.log('📊 COMPREHENSIVE DUAL BACKEND TESTING REPORT');
  console.log('Testing both OAuth and API backends with authentic data');
  console.log('='.repeat(80));
  
  const report = {
    testDate: new Date().toISOString(),
    architecture: 'Dual Backend System',
    backends: {
      oauth: 'https://dir.engageautomations.com',
      api: 'https://api.engageautomations.com'
    },
    installation: 'install_1751436979939',
    locationId: 'SGtYHkPbOl2WJV08GOpg',
    tests: []
  };
  
  // Test 1: OAuth Backend Health
  console.log('\n1️⃣ TESTING OAUTH BACKEND HEALTH');
  const oauthTest = await testOAuthBackend();
  report.tests.push(oauthTest);
  
  // Test 2: API Backend Health  
  console.log('\n2️⃣ TESTING API BACKEND HEALTH');
  const apiTest = await testAPIBackend();
  report.tests.push(apiTest);
  
  // Test 3: OAuth Token Retrieval
  console.log('\n3️⃣ TESTING OAUTH TOKEN RETRIEVAL');
  const tokenTest = await testTokenRetrieval();
  report.tests.push(tokenTest);
  
  if (tokenTest.success) {
    // Test 4: Dual Backend Product Creation Flow
    console.log('\n4️⃣ TESTING DUAL BACKEND PRODUCT CREATION');
    const productTest = await testDualBackendProductCreation(tokenTest.token);
    report.tests.push(productTest);
    
    // Test 5: Direct GoHighLevel API via Token
    console.log('\n5️⃣ TESTING DIRECT GOHIGHLEVEL API');
    const directTest = await testDirectGoHighLevelAPI(tokenTest.token);
    report.tests.push(directTest);
  }
  
  // Generate comprehensive report
  console.log('\n📋 GENERATING COMPREHENSIVE REPORT');
  generateDetailedReport(report);
  
  return report;
}

async function testOAuthBackend() {
  const startTime = new Date();
  console.log(`   Request Time: ${startTime.toISOString()}`);
  
  try {
    const response = await fetch('https://dir.engageautomations.com/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    });
    
    const endTime = new Date();
    const data = await response.json();
    
    const test = {
      name: 'OAuth Backend Health Check',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${endTime - startTime}ms`,
      method: 'GET',
      endpoint: 'https://dir.engageautomations.com/',
      status: response.status,
      success: response.ok,
      response: data,
      headers: {
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    };
    
    console.log(`   ✅ OAuth Backend: ${response.status} (${endTime - startTime}ms)`);
    console.log(`   Response: ${data.status || data.message || 'Healthy'}`);
    
    return test;
  } catch (error) {
    const endTime = new Date();
    const test = {
      name: 'OAuth Backend Health Check',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      method: 'GET',
      endpoint: 'https://dir.engageautomations.com/',
      success: false,
      error: error.message
    };
    
    console.log(`   ❌ OAuth Backend Error: ${error.message}`);
    return test;
  }
}

async function testAPIBackend() {
  const startTime = new Date();
  console.log(`   Request Time: ${startTime.toISOString()}`);
  
  try {
    const response = await fetch('https://api.engageautomations.com/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    });
    
    const endTime = new Date();
    const data = await response.json();
    
    const test = {
      name: 'API Backend Health Check',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${endTime - startTime}ms`,
      method: 'GET',
      endpoint: 'https://api.engageautomations.com/',
      status: response.status,
      success: response.ok,
      response: data,
      headers: {
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    };
    
    console.log(`   ✅ API Backend: ${response.status} (${endTime - startTime}ms)`);
    console.log(`   Response: ${data.status || data.message || 'Healthy'}`);
    
    return test;
  } catch (error) {
    const endTime = new Date();
    const test = {
      name: 'API Backend Health Check',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      method: 'GET',
      endpoint: 'https://api.engageautomations.com/',
      success: false,
      error: error.message
    };
    
    console.log(`   ❌ API Backend Error: ${error.message}`);
    return test;
  }
}

async function testTokenRetrieval() {
  const startTime = new Date();
  console.log(`   Request Time: ${startTime.toISOString()}`);
  
  try {
    const response = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    });
    
    const endTime = new Date();
    const data = await response.json();
    
    const test = {
      name: 'OAuth Token Retrieval',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${endTime - startTime}ms`,
      method: 'GET',
      endpoint: '/api/token-access/install_1751436979939',
      status: response.status,
      success: response.ok && !!data.access_token,
      tokenPreview: data.access_token ? data.access_token.substring(0, 50) + '...' : null,
      response: data,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    };
    
    if (data.access_token) {
      test.token = data.access_token;
      console.log(`   ✅ Token Retrieved: ${data.access_token.substring(0, 50)}...`);
    } else {
      console.log(`   ❌ No Token: ${JSON.stringify(data)}`);
    }
    
    return test;
  } catch (error) {
    const endTime = new Date();
    const test = {
      name: 'OAuth Token Retrieval',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      method: 'GET',
      endpoint: '/api/token-access/install_1751436979939',
      success: false,
      error: error.message
    };
    
    console.log(`   ❌ Token Retrieval Error: ${error.message}`);
    return test;
  }
}

async function testDualBackendProductCreation(token) {
  const startTime = new Date();
  console.log(`   Request Time: ${startTime.toISOString()}`);
  
  // Test payload for dual backend
  const productPayload = {
    installation_id: 'install_1751436979939',
    name: `Dual Backend Test ${startTime.getTime()}`,
    description: 'Testing dual backend product creation workflow',
    productType: 'DIGITAL',
    availableInStore: true,
    price: 99.99,
    currency: 'USD'
  };
  
  console.log('   Request Payload:', JSON.stringify(productPayload, null, 2));
  
  try {
    const response = await fetch('https://api.engageautomations.com/api/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dual-Backend-Test/1.0'
      },
      body: JSON.stringify(productPayload)
    });
    
    const endTime = new Date();
    const data = await response.json();
    
    const test = {
      name: 'Dual Backend Product Creation',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${endTime - startTime}ms`,
      method: 'POST',
      endpoint: 'https://api.engageautomations.com/api/products/create',
      status: response.status,
      success: response.ok && data.success,
      requestPayload: productPayload,
      response: data,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dual-Backend-Test/1.0'
      }
    };
    
    console.log(`   Status: ${response.status} (${endTime - startTime}ms)`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('   ✅ Dual Backend Product Creation: SUCCESS');
    } else {
      console.log('   ❌ Dual Backend Product Creation: FAILED');
      if (data.error?.includes('Forbidden')) {
        console.log('   📍 403 Forbidden detected via dual backend');
      }
    }
    
    return test;
  } catch (error) {
    const endTime = new Date();
    const test = {
      name: 'Dual Backend Product Creation',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      method: 'POST',
      endpoint: 'https://api.engageautomations.com/api/products/create',
      requestPayload: productPayload,
      success: false,
      error: error.message
    };
    
    console.log(`   ❌ Dual Backend Error: ${error.message}`);
    return test;
  }
}

async function testDirectGoHighLevelAPI(token) {
  const startTime = new Date();
  console.log(`   Request Time: ${startTime.toISOString()}`);
  
  // Direct GoHighLevel payload (July 1st working format)
  const ghlPayload = {
    name: `Direct GHL Test ${startTime.getTime()}`,
    locationId: 'SGtYHkPbOl2WJV08GOpg',
    description: 'Testing direct GoHighLevel API call with dual backend token',
    productType: 'DIGITAL',
    availableInStore: true
  };
  
  console.log('   Request Payload:', JSON.stringify(ghlPayload, null, 2));
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Version': '2021-07-28',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Dual-Backend-Test/1.0'
  };
  
  console.log('   Request Headers:');
  Object.entries(headers).forEach(([key, value]) => {
    if (key === 'Authorization') {
      console.log(`     ${key}: Bearer ${value.substring(7, 50)}...`);
    } else {
      console.log(`     ${key}: ${value}`);
    }
  });
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(ghlPayload)
    });
    
    const endTime = new Date();
    const data = await response.json();
    
    const test = {
      name: 'Direct GoHighLevel API Call',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${endTime - startTime}ms`,
      method: 'POST',
      endpoint: 'https://services.leadconnectorhq.com/products/',
      status: response.status,
      success: response.status === 200 || response.status === 201,
      requestPayload: ghlPayload,
      requestHeaders: headers,
      response: data
    };
    
    console.log(`   Status: ${response.status} (${endTime - startTime}ms)`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log('   ✅ Direct GoHighLevel API: SUCCESS');
      console.log('   🎉 API ACCESS RESTORED!');
    } else if (response.status === 403) {
      console.log('   ❌ Direct GoHighLevel API: 403 FORBIDDEN');
      console.log('   📍 API access still restricted');
    } else if (response.status === 401) {
      console.log('   ❌ Direct GoHighLevel API: 401 UNAUTHORIZED');
      console.log('   📍 Token authentication issue');
    } else {
      console.log(`   ⚠️ Direct GoHighLevel API: Unexpected status ${response.status}`);
    }
    
    return test;
  } catch (error) {
    const endTime = new Date();
    const test = {
      name: 'Direct GoHighLevel API Call',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      method: 'POST',
      endpoint: 'https://services.leadconnectorhq.com/products/',
      requestPayload: ghlPayload,
      requestHeaders: headers,
      success: false,
      error: error.message
    };
    
    console.log(`   ❌ Direct GoHighLevel Error: ${error.message}`);
    return test;
  }
}

function generateDetailedReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE DUAL BACKEND REPORT');
  console.log('='.repeat(80));
  
  console.log(`\nTest Date: ${report.testDate}`);
  console.log(`Architecture: ${report.architecture}`);
  console.log(`OAuth Backend: ${report.backends.oauth}`);
  console.log(`API Backend: ${report.backends.api}`);
  console.log(`Installation ID: ${report.installation}`);
  console.log(`Location ID: ${report.locationId}`);
  
  console.log('\n🔍 TEST RESULTS SUMMARY:');
  report.tests.forEach((test, index) => {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (test.duration) {
      console.log(`   Duration: ${test.duration}`);
    }
    if (test.status) {
      console.log(`   HTTP Status: ${test.status}`);
    }
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  // Find critical results
  const tokenTest = report.tests.find(t => t.name === 'OAuth Token Retrieval');
  const productTest = report.tests.find(t => t.name === 'Dual Backend Product Creation');
  const directTest = report.tests.find(t => t.name === 'Direct GoHighLevel API Call');
  
  console.log('\n📊 CRITICAL ANALYSIS:');
  
  if (tokenTest?.success) {
    console.log('✅ OAuth Token: Retrieved successfully from dual backend');
  } else {
    console.log('❌ OAuth Token: Failed to retrieve from dual backend');
  }
  
  if (productTest?.success) {
    console.log('✅ Dual Backend Flow: Product creation working');
  } else {
    console.log('❌ Dual Backend Flow: Product creation failed');
    if (productTest?.response?.error?.includes('Forbidden')) {
      console.log('   📍 403 Forbidden error detected via dual backend');
    }
  }
  
  if (directTest) {
    if (directTest.success) {
      console.log('✅ GoHighLevel API: Direct access working');
      console.log('🎉 API ACCESS ISSUE RESOLVED!');
    } else if (directTest.status === 403) {
      console.log('❌ GoHighLevel API: 403 Forbidden (access restricted)');
    } else if (directTest.status === 401) {
      console.log('❌ GoHighLevel API: 401 Unauthorized (token issue)');
    } else {
      console.log(`❌ GoHighLevel API: ${directTest.status} error`);
    }
  }
  
  console.log('\n🏗️ DUAL BACKEND ARCHITECTURE STATUS:');
  const oauthHealthy = report.tests.find(t => t.name === 'OAuth Backend Health Check')?.success;
  const apiHealthy = report.tests.find(t => t.name === 'API Backend Health Check')?.success;
  
  console.log(`OAuth Backend (${report.backends.oauth}): ${oauthHealthy ? '✅ Healthy' : '❌ Issues'}`);
  console.log(`API Backend (${report.backends.api}): ${apiHealthy ? '✅ Healthy' : '❌ Issues'}`);
  
  if (oauthHealthy && apiHealthy && tokenTest?.success) {
    console.log('✅ Dual backend infrastructure: Fully operational');
    console.log('✅ OAuth token retrieval: Working via bridge');
    console.log('📋 Ready for GoHighLevel API access restoration');
  } else {
    console.log('⚠️ Dual backend infrastructure: Issues detected');
  }
  
  console.log('\n📋 REPORT COMPLETE - Ready for GoHighLevel Support');
}

// Run comprehensive dual backend testing
generateComprehensiveDualBackendReport().catch(console.error);