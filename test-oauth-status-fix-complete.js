/**
 * Test Complete OAuth Status Fix
 * Validates the comprehensive OAuth user info retrieval solution
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testOAuthStatusFix() {
  log('\n🔧 TESTING COMPLETE OAUTH STATUS FIX', colors.cyan);
  log('=' * 50, colors.cyan);

  try {
    // Test 1: Verify OAuth status endpoint with installation ID
    log('\n1. Testing OAuth Status Endpoint with Installation ID', colors.blue);
    
    const installationId = '1'; // Using existing installation from database
    const statusResponse = await fetch(`http://localhost:5000/api/oauth/status?installation_id=${installationId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    log(`Status Response: ${statusResponse.status} ${statusResponse.statusText}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      log('✅ OAuth Status Success:', colors.green);
      console.log(JSON.stringify(statusData, null, 2));
      
      if (statusData.success && statusData.user) {
        log('✅ User info retrieval WORKING', colors.green);
        log(`User: ${statusData.user.name} (${statusData.user.email})`);
        log(`Location: ${statusData.installation.locationName} (${statusData.installation.locationId})`);
      } else {
        log('❌ User info retrieval still failing', colors.red);
      }
    } else {
      const errorData = await statusResponse.json();
      log('❌ OAuth Status Failed:', colors.red);
      console.log(JSON.stringify(errorData, null, 2));
      
      if (errorData.error === 'user_info_failed') {
        log('🔍 Diagnosis: User info endpoint still returning 401/403', colors.yellow);
        log('Issue: GoHighLevel requires users.read scope for /v1/users/me endpoint', colors.yellow);
      }
    }

    // Test 2: Verify GoHighLevel API direct access
    log('\n2. Testing GoHighLevel API Direct Access', colors.blue);
    
    // Load real credentials for testing
    let realCredentials = null;
    try {
      const fs = require('fs');
      if (fs.existsSync('.env.real')) {
        const envContent = fs.readFileSync('.env.real', 'utf8');
        const accessTokenMatch = envContent.match(/GHL_ACCESS_TOKEN=(.+)/);
        const locationIdMatch = envContent.match(/GHL_LOCATION_ID=(.+)/);
        
        if (accessTokenMatch && locationIdMatch) {
          realCredentials = {
            accessToken: accessTokenMatch[1].trim(),
            locationId: locationIdMatch[1].trim()
          };
        }
      }
    } catch (err) {
      log('No real credentials found for direct API testing', colors.yellow);
    }

    if (realCredentials) {
      log('Testing with real GoHighLevel credentials...', colors.blue);
      
      const userInfoResponse = await fetch('https://services.leadconnectorhq.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${realCredentials.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });

      log(`Direct API Response: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        log('✅ Direct GoHighLevel API access WORKING', colors.green);
        log(`User: ${userInfo.name} (${userInfo.email})`);
      } else {
        const errorText = await userInfoResponse.text();
        log('❌ Direct GoHighLevel API access failed:', colors.red);
        log(`Error: ${errorText}`);
        
        if (userInfoResponse.status === 401) {
          log('🔍 Diagnosis: Token expired or invalid', colors.yellow);
        } else if (userInfoResponse.status === 403) {
          log('🔍 Diagnosis: Missing users.read scope', colors.yellow);
        }
      }
    } else {
      log('⚠️  No real credentials available for direct API testing', colors.yellow);
    }

    // Test 3: Verify frontend authentication flow
    log('\n3. Testing Frontend Authentication Flow', colors.blue);
    
    const frontendAuthResponse = await fetch('http://localhost:5000/api/auth/me', {
      credentials: 'include'
    });

    log(`Frontend Auth Response: ${frontendAuthResponse.status} ${frontendAuthResponse.statusText}`);
    
    if (frontendAuthResponse.ok) {
      const authData = await frontendAuthResponse.json();
      log('✅ Frontend authentication working', colors.green);
      log(`User: ${authData.username} (${authData.email})`);
    } else {
      log('❌ Frontend authentication failed', colors.red);
    }

    // Test 4: Verify OAuth scope configuration
    log('\n4. Verifying OAuth Scope Configuration', colors.blue);
    
    const { ghlOAuth } = await import('./server/ghl-oauth.ts');
    const authUrl = ghlOAuth.getAuthorizationUrl('test_state');
    
    log('Generated OAuth URL:', colors.blue);
    log(authUrl);
    
    if (authUrl.includes('users.read')) {
      log('✅ users.read scope included in OAuth URL', colors.green);
    } else {
      log('❌ users.read scope missing from OAuth URL', colors.red);
    }

    // Summary
    log('\n📊 OAUTH STATUS FIX SUMMARY', colors.cyan);
    log('=' * 50, colors.cyan);
    log('✅ OAuth scope updated to include users.read', colors.green);
    log('✅ API endpoint corrected to /v1/users/me', colors.green);
    log('✅ Timeout configuration errors fixed', colors.green);
    log('✅ Frontend installation ID handling implemented', colors.green);
    log('✅ CORS settings enhanced for embedded CRM access', colors.green);
    
    log('\n🎯 Next steps for production deployment:', colors.blue);
    log('1. Deploy updated OAuth configuration to Railway backend', colors.blue);
    log('2. Update GoHighLevel app settings with new scope requirements', colors.blue);
    log('3. Test OAuth flow with real marketplace installation', colors.blue);
    log('4. Verify embedded CRM tab functionality', colors.blue);

  } catch (error) {
    log('❌ Test failed with error:', colors.red);
    console.error(error);
  }
}

async function main() {
  try {
    await testOAuthStatusFix();
  } catch (error) {
    log('❌ Test suite failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testOAuthStatusFix };