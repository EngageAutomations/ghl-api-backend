/**
 * Complete OAuth Installation Test
 * Tests the real account data capture when users install the app
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testOAuthInstallation() {
  log('=== OAuth Real Data Capture Test ===', colors.blue);
  
  try {
    // Test 1: Check OAuth callback endpoint
    log('\n1. Testing OAuth callback endpoint...', colors.yellow);
    const callbackResponse = await fetch('http://localhost:5000/oauth/callback');
    log(`Callback endpoint status: ${callbackResponse.status}`, callbackResponse.ok ? colors.green : colors.red);
    
    // Test 2: Generate OAuth URL
    log('\n2. Generating OAuth installation URL...', colors.yellow);
    const urlResponse = await fetch('http://localhost:5000/oauth/callback?action=generate-url');
    const urlData = await urlResponse.json();
    
    if (urlData.success) {
      log('OAuth URL generated successfully', colors.green);
      log(`Client ID: ${urlData.clientId}`, colors.blue);
      log(`Redirect URI: ${urlData.redirectUri}`, colors.blue);
      log(`Auth URL: ${urlData.authUrl.substring(0, 100)}...`, colors.blue);
    } else {
      log(`URL generation failed: ${urlData.error}`, colors.red);
      return;
    }
    
    // Test 3: Check current database state
    log('\n3. Checking current database state...', colors.yellow);
    const usersResponse = await fetch('http://localhost:5000/api/oauth/users');
    const usersData = await usersResponse.json();
    
    if (usersData.success && usersData.users) {
      log(`Found ${usersData.users.length} OAuth users in database`, colors.green);
      
      const realUsers = usersData.users.filter(user => 
        user.ghl_user_id && 
        user.ghl_access_token && 
        !user.ghl_user_id.includes('demo') &&
        !user.ghl_access_token.includes('demo') &&
        !user.email?.includes('demo')
      );
      
      if (realUsers.length > 0) {
        log(`Found ${realUsers.length} real account installations`, colors.green);
        log('Real account data:', colors.blue);
        realUsers.forEach(user => {
          log(`- User: ${user.email} (${user.ghl_user_id})`, colors.blue);
          log(`- Location: ${user.ghl_location_name} (${user.ghl_location_id})`, colors.blue);
          log(`- Has access token: ${!!user.ghl_access_token}`, colors.blue);
        });
        
        // Test 4: Test API call with real data
        log('\n4. Testing API call with real account data...', colors.yellow);
        const realUser = realUsers[0];
        
        try {
          const apiResponse = await fetch(`http://localhost:5000/api/ghl/medias?locationId=${realUser.ghl_location_id}&limit=3`, {
            headers: {
              'X-Installation-Id': realUser.id.toString()
            }
          });
          
          const apiData = await apiResponse.json();
          
          if (apiData.success) {
            log('API call with real data successful!', colors.green);
            log(`Response data: ${JSON.stringify(apiData.data, null, 2)}`, colors.blue);
          } else {
            log(`API call failed: ${apiData.error}`, colors.red);
          }
        } catch (apiError) {
          log(`API test error: ${apiError.message}`, colors.red);
        }
        
      } else {
        log('No real account data found - only demo/placeholder data', colors.yellow);
        log('Install the app from GoHighLevel marketplace to capture real data', colors.blue);
      }
    }
    
    // Test 5: Provide installation instructions
    log('\n5. Installation Instructions:', colors.yellow);
    log('To capture real account data:', colors.blue);
    log('1. Open your GoHighLevel account', colors.blue);
    log('2. Navigate to the marketplace or app installation area', colors.blue);
    log(`3. Install the app using this OAuth URL:`, colors.blue);
    log(`   ${urlData.authUrl}`, colors.green);
    log('4. Complete the OAuth authorization process', colors.blue);
    log('5. The callback will capture and store your real account data', colors.blue);
    log('6. Run this test again to verify real data capture', colors.blue);
    
    log('\n=== Test Complete ===', colors.blue);
    
  } catch (error) {
    log(`Test failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the test
testOAuthInstallation().catch(console.error);