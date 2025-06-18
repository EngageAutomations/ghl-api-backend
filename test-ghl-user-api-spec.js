/**
 * Test GoHighLevel User API Specification
 * Based on official API documentation at https://marketplace.gohighlevel.com/docs/ghl/users/get-user
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testGoHighLevelUserAPI() {
  log('🔍 Testing GoHighLevel User API Specification', colors.cyan);
  
  // Test different possible endpoints based on common GHL patterns
  const testEndpoints = [
    // Current implementation (likely incorrect)
    'https://services.leadconnectorhq.com/v1/users/me',
    
    // Alternative endpoints from documentation patterns
    'https://services.leadconnectorhq.com/users/me',
    'https://services.leadconnectorhq.com/users/current',
    'https://services.leadconnectorhq.com/user',
    'https://services.leadconnectorhq.com/v1/user',
    
    // Version variations
    'https://services.leadconnectorhq.com/v2/users/me',
    'https://services.leadconnectorhq.com/api/v1/users/me'
  ];
  
  log('\n📋 Testing Various User API Endpoints:', colors.yellow);
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test_token',
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Expected: 401 Unauthorized with JSON response (token is invalid but endpoint exists)
      // Unexpected: 404 Not Found (endpoint doesn't exist)
      
      if (response.status === 401 && isJson) {
        log(`✅ ${endpoint} - EXISTS (401 Unauthorized with JSON - correct)`, colors.green);
      } else if (response.status === 404) {
        log(`❌ ${endpoint} - NOT FOUND (404)`, colors.red);
      } else {
        log(`⚠️  ${endpoint} - ${response.status} (${isJson ? 'JSON' : 'HTML'})`, colors.yellow);
      }
      
    } catch (error) {
      log(`❌ ${endpoint} - Error: ${error.message}`, colors.red);
    }
  }
}

async function analyzeAPIRequirements() {
  log('\n🔬 Analyzing API Requirements from Documentation', colors.cyan);
  
  const analysis = {
    currentImplementation: {
      endpoint: 'https://services.leadconnectorhq.com/v1/users/me',
      headers: {
        'Authorization': 'Bearer {token}',
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      method: 'GET'
    },
    
    commonIssues: [
      'Incorrect endpoint URL',
      'Missing required headers',
      'Wrong API version',
      'Invalid scope requirements',
      'Incorrect authentication format'
    ]
  };
  
  log('Current Implementation Analysis:', colors.yellow);
  log(`Endpoint: ${analysis.currentImplementation.endpoint}`);
  log(`Headers: ${JSON.stringify(analysis.currentImplementation.headers, null, 2)}`);
  
  log('\nCommon Issues That Cause "user_info_failed":', colors.yellow);
  analysis.commonIssues.forEach((issue, index) => {
    log(`${index + 1}. ${issue}`);
  });
}

async function generateCorrectedImplementation() {
  log('\n🔧 Generating Corrected Implementation Options', colors.cyan);
  
  const implementations = [
    {
      name: 'Standard Implementation',
      code: `
// Option 1: Standard GoHighLevel User API
const ghlResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'Version': '2021-07-28'
  }
});`
    },
    {
      name: 'With Error Handling',
      code: `
// Option 2: With comprehensive error handling
async function getUserInfo(accessToken) {
  try {
    const ghlResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    });
    
    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error('GHL User API Error:', ghlResponse.status, errorText);
      throw new Error(\`GHL API returned \${ghlResponse.status}: \${errorText}\`);
    }
    
    const userData = await ghlResponse.json();
    return userData;
    
  } catch (error) {
    console.error('User info retrieval failed:', error);
    throw error;
  }
}`
    }
  ];
  
  implementations.forEach((impl, index) => {
    log(`\n${impl.name}:`, colors.green);
    log(impl.code);
  });
}

async function main() {
  try {
    log('🚀 GoHighLevel User API Specification Analysis', colors.cyan);
    
    await testGoHighLevelUserAPI();
    await analyzeAPIRequirements();
    await generateCorrectedImplementation();
    
    log('\n📋 NEXT STEPS:', colors.cyan);
    log('1. Identify correct endpoint from API documentation');
    log('2. Update Railway backend implementation');
    log('3. Test with real access token');
    log('4. Deploy corrected implementation');
    
    log('\n✅ API specification analysis complete!', colors.green);
    
  } catch (error) {
    log('❌ Analysis failed:', colors.red);
    console.error(error);
  }
}

main();