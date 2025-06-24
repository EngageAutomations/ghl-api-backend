const http = require('http');

function testEndpoint(method, path, data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        data: body,
        success: res.statusCode < 400
      }));
    });

    req.on('error', () => resolve({ error: 'Connection failed' }));
    req.on('timeout', () => resolve({ error: 'Timeout' }));
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runComprehensiveTests() {
  console.log('Running Comprehensive API Tests...\n');

  const tests = [
    { name: 'OAuth Status', method: 'GET', path: '/api/oauth/status?installation_id=test' },
    { name: 'OAuth Callback', method: 'GET', path: '/oauth/callback?code=test123&location_id=WAVk87RmW9rBSDJHeOpH&user_id=test_user' },
    { name: 'Products API', method: 'GET', path: '/api/ghl/locations/WAVk87RmW9rBSDJHeOpH/products' },
    { name: 'Media API', method: 'GET', path: '/api/ghl/locations/WAVk87RmW9rBSDJHeOpH/media' },
    { name: 'Health Check', method: 'GET', path: '/' }
  ];

  const results = [];
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const result = await testEndpoint(test.method, test.path);
    
    if (result.error) {
      console.log(`   ❌ ${result.error}`);
    } else {
      console.log(`   ✅ ${result.status} - ${result.data.substring(0, 80)}...`);
    }
    
    results.push({ ...test, ...result });
    console.log('');
  }

  // Summary
  const working = results.filter(r => !r.error && r.success);
  const total = results.length;
  
  console.log('='.repeat(60));
  console.log(`API Test Results: ${working.length}/${total} endpoints working`);
  
  if (working.length >= 3) {
    console.log('✅ API system ready for testing');
    console.log('Ready for OAuth flow and GoHighLevel integration');
  } else {
    console.log('⚠️ Application may not be fully started');
  }
  
  return working.length >= 3;
}

// Wait for server startup then test
setTimeout(runComprehensiveTests, 3000);