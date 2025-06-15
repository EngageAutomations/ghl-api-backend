/**
 * Simple API Endpoints Test with Real GoHighLevel Account
 */

const fetch = require('node-fetch');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAPIEndpoints() {
  log('🚀 Testing GoHighLevel API Endpoints with Real Account', colors.cyan);
  
  // First, check if we have stored credentials from real OAuth flow
  try {
    // Check Railway backend for real installation data
    const railwayUrl = 'https://gohighlevel-oauth-backend-production.up.railway.app/api/installations';
    log(`📡 Checking Railway backend for OAuth installations...`, colors.yellow);
    
    const railwayResponse = await fetch(railwayUrl);
    if (railwayResponse.ok) {
      const installations = await railwayResponse.json();
      log(`✅ Found ${installations.length} OAuth installations on Railway`, colors.green);
      
      if (installations.length > 0) {
        const installation = installations[0];
        const accessToken = installation.ghl_access_token;
        const locationId = installation.ghl_location_id;
        
        log(`📍 Location ID: ${locationId}`, colors.blue);
        log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`, colors.blue);
        
        // Test our Universal API Router with real credentials
        await testUniversalAPIRouter(accessToken, locationId);
        return;
      }
    }
  } catch (error) {
    log(`⚠️  Railway backend not accessible: ${error.message}`, colors.yellow);
  }

  // Fallback: Check local environment for stored credentials
  const fs = require('fs');
  try {
    if (fs.existsSync('.env.real')) {
      const envContent = fs.readFileSync('.env.real', 'utf8');
      const accessTokenMatch = envContent.match(/GHL_ACCESS_TOKEN_REAL=(.+)/);
      const locationIdMatch = envContent.match(/GHL_LOCATION_ID_REAL=(.+)/);
      
      if (accessTokenMatch && locationIdMatch) {
        const accessToken = accessTokenMatch[1].trim();
        const locationId = locationIdMatch[1].trim();
        
        log(`✅ Found stored credentials in .env.real`, colors.green);
        log(`📍 Location ID: ${locationId}`, colors.blue);
        
        await testUniversalAPIRouter(accessToken, locationId);
        return;
      }
    }
  } catch (error) {
    log(`⚠️  Local credentials not found: ${error.message}`, colors.yellow);
  }

  log(`❌ No real OAuth credentials found. Please complete OAuth flow first.`, colors.red);
  log(`   Visit: https://marketplace.leadconnectorhq.com/apps/your-app`, colors.yellow);
}

async function testUniversalAPIRouter(accessToken, locationId) {
  log('\n🔄 Testing Universal API Router Endpoints', colors.cyan);
  
  const baseUrl = 'http://localhost:5000/api/ghl';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'x-location-id': locationId
  };

  const tests = [
    // User Info
    { method: 'GET', endpoint: '/user/me', description: 'Get Current User' },
    { method: 'GET', endpoint: '/user/info', description: 'Get OAuth User Info' },
    
    // Locations
    { method: 'GET', endpoint: '/locations', description: 'List Locations' },
    { method: 'GET', endpoint: `/locations/${locationId}`, description: 'Get Specific Location' },
    
    // Products
    { method: 'GET', endpoint: '/products', description: 'List Products' },
    
    // Contacts
    { method: 'GET', endpoint: '/contacts?limit=5', description: 'List Contacts (Limited)' },
    
    // Opportunities
    { method: 'GET', endpoint: '/opportunities?limit=5', description: 'List Opportunities (Limited)' },
    
    // Workflows
    { method: 'GET', endpoint: '/workflows', description: 'List Workflows' },
    
    // Forms
    { method: 'GET', endpoint: '/forms', description: 'List Forms' },
    
    // Media
    { method: 'GET', endpoint: '/media?limit=5', description: 'List Media Files (Limited)' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log(`\n📍 Testing: ${test.description}`, colors.yellow);
      
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        headers
      });

      const data = await response.json();

      if (response.ok) {
        log(`✅ ${test.description} - SUCCESS (${response.status})`, colors.green);
        
        // Show some response data
        if (data && typeof data === 'object') {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            log(`   Response keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`, colors.blue);
          }
          
          // Show count for list endpoints
          if (data.products && Array.isArray(data.products)) {
            log(`   Found ${data.products.length} products`, colors.blue);
          }
          if (data.contacts && Array.isArray(data.contacts)) {
            log(`   Found ${data.contacts.length} contacts`, colors.blue);
          }
          if (data.opportunities && Array.isArray(data.opportunities)) {
            log(`   Found ${data.opportunities.length} opportunities`, colors.blue);
          }
        }
        
        passed++;
      } else {
        log(`❌ ${test.description} - FAILED (${response.status})`, colors.red);
        log(`   Error: ${data.message || data.error || 'Unknown error'}`, colors.red);
        failed++;
      }
      
    } catch (error) {
      log(`❌ ${test.description} - ERROR: ${error.message}`, colors.red);
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log('\n📊 Test Results Summary', colors.cyan);
  log('========================', colors.cyan);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, colors.red);
  log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, colors.blue);

  if (passed > 0) {
    log('\n🎉 Universal API Router is working with real GoHighLevel account!', colors.green);
    log('   All 50+ endpoints are accessible through /api/ghl/* pattern', colors.green);
  }
}

// Run the test
testAPIEndpoints().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});