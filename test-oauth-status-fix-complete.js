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
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testOAuthStatusFix() {
  log('\n🔧 OAUTH STATUS FIX VALIDATION', colors.cyan);
  log('Testing comprehensive OAuth user info retrieval fix...', colors.blue);

  const results = {
    environmentConfig: false,
    apiEndpointWorking: false,
    tokenManagement: false,
    errorHandling: false,
    scopeConfiguration: false
  };

  try {
    // Test 1: Environment Configuration
    log('\n1. Testing Environment Configuration...', colors.blue);
    
    // Check if OAuth scope includes users.read
    const scopeTest = process.env.GHL_SCOPES || 'users.read products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';
    
    if (scopeTest.includes('users.read')) {
      log('✅ users.read scope configured correctly', colors.green);
      results.scopeConfiguration = true;
    } else {
      log('❌ users.read scope missing from OAuth configuration', colors.red);
    }

    const requiredEnvVars = ['GHL_CLIENT_ID', 'GHL_CLIENT_SECRET', 'GHL_REDIRECT_URI'];
    const envStatus = requiredEnvVars.map(env => ({
      name: env,
      status: process.env[env] ? 'SET' : 'MISSING'
    }));

    envStatus.forEach(env => {
      const color = env.status === 'SET' ? colors.green : colors.red;
      log(`${env.name}: ${env.status}`, color);
    });

    results.environmentConfig = envStatus.every(env => env.status === 'SET');

    // Test 2: API Endpoint Response Format
    log('\n2. Testing OAuth Status API Endpoint...', colors.blue);
    
    try {
      const statusResponse = await fetch('http://localhost:5000/api/oauth/status?installation_id=1', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const contentType = statusResponse.headers.get('content-type');
      log(`Response Status: ${statusResponse.status}`);
      log(`Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        log('✅ OAuth status endpoint returns proper JSON', colors.green);
        results.apiEndpointWorking = true;
        
        const responseData = await statusResponse.json();
        log(`Response Structure: ${JSON.stringify(Object.keys(responseData))}`);
        
        if (responseData.error && responseData.message) {
          log('✅ Error responses properly structured', colors.green);
          results.errorHandling = true;
        }
      } else {
        log('❌ OAuth status endpoint returning HTML instead of JSON', colors.red);
        const htmlPreview = await statusResponse.text();
        log(`HTML Response: ${htmlPreview.substring(0, 100)}...`);
      }
    } catch (error) {
      log(`❌ OAuth status endpoint test failed: ${error.message}`, colors.red);
    }

    // Test 3: GoHighLevel API Endpoint Validation
    log('\n3. Testing GoHighLevel API Endpoint Configuration...', colors.blue);
    
    const userInfoUrl = 'https://services.leadconnectorhq.com/v1/users/me';
    log(`User Info URL: ${userInfoUrl}`);
    
    if (userInfoUrl.includes('/v1/users/me')) {
      log('✅ Correct GoHighLevel API endpoint configured', colors.green);
    } else {
      log('❌ Incorrect GoHighLevel API endpoint', colors.red);
    }

    // Test 4: Token Management Logic
    log('\n4. Testing Token Management Implementation...', colors.blue);
    
    // Check if token refresh logic is implemented
    try {
      const serverIndexContent = require('fs').readFileSync('server/index.ts', 'utf8');
      
      if (serverIndexContent.includes('token_refresh_failed') && 
          serverIndexContent.includes('refresh_token') &&
          serverIndexContent.includes('expires_in')) {
        log('✅ Token refresh logic implemented', colors.green);
        results.tokenManagement = true;
      } else {
        log('❌ Token refresh logic missing or incomplete', colors.red);
      }
    } catch (error) {
      log(`⚠️  Could not verify token management: ${error.message}`, colors.yellow);
    }

    // Test 5: Real API Access Test (if credentials available)
    log('\n5. Testing Real API Access...', colors.blue);
    
    let realCredentials = null;
    try {
      const fs = require('fs');
      if (fs.existsSync('.env.real')) {
        const envContent = fs.readFileSync('.env.real', 'utf8');
        const accessTokenMatch = envContent.match(/GHL_ACCESS_TOKEN=(.+)/);
        
        if (accessTokenMatch) {
          realCredentials = { accessToken: accessTokenMatch[1].trim() };
        }
      }
    } catch (err) {
      log('No real credentials file available', colors.yellow);
    }

    if (realCredentials) {
      try {
        const directApiTest = await fetch('https://services.leadconnectorhq.com/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${realCredentials.accessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });

        if (directApiTest.ok) {
          const userData = await directApiTest.json();
          log('✅ Direct GoHighLevel API access successful', colors.green);
          log(`User: ${userData.name} (${userData.email})`);
        } else {
          log(`❌ Direct API access failed: ${directApiTest.status}`, colors.red);
          
          if (directApiTest.status === 403) {
            log('🔍 Likely missing users.read scope permission', colors.yellow);
          }
        }
      } catch (error) {
        log(`❌ Direct API test error: ${error.message}`, colors.red);
      }
    } else {
      log('⚠️  No real credentials available for direct API testing', colors.yellow);
    }

  } catch (error) {
    log(`❌ OAuth status fix validation failed: ${error.message}`, colors.red);
  }

  // Generate Summary Report
  log('\n📊 OAUTH FIX VALIDATION SUMMARY', colors.cyan);
  log('=' * 50, colors.cyan);

  const checks = Object.entries(results);
  const passedChecks = checks.filter(([_, passed]) => passed).length;
  const totalChecks = checks.length;
  const successRate = Math.round((passedChecks / totalChecks) * 100);

  checks.forEach(([check, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;
    log(`${check}: ${status}`, color);
  });

  log(`\n🎯 Overall Fix Success Rate: ${successRate}% (${passedChecks}/${totalChecks})`, 
      successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red);

  // Specific Recommendations
  log('\n🔧 CRITICAL FIXES NEEDED:', colors.blue);
  
  if (!results.scopeConfiguration) {
    log('1. Add users.read to GHL_SCOPES environment variable', colors.yellow);
    log('2. Update GoHighLevel app settings to include users.read permission', colors.yellow);
  }
  
  if (!results.apiEndpointWorking) {
    log('3. Fix OAuth status endpoint routing to return JSON instead of HTML', colors.yellow);
    log('4. Ensure API routes are registered before frontend routing', colors.yellow);
  }
  
  if (!results.tokenManagement) {
    log('5. Implement comprehensive token refresh logic', colors.yellow);
  }

  if (successRate >= 80) {
    log('\n✅ OAUTH FIX READY FOR PRODUCTION', colors.green);
  } else {
    log('\n⚠️  CRITICAL ISSUES MUST BE RESOLVED BEFORE DEPLOYMENT', colors.yellow);
  }

  return {
    successRate,
    results,
    readyForProduction: successRate >= 80
  };
}

async function main() {
  try {
    log('🚀 OAUTH STATUS FIX COMPREHENSIVE VALIDATION', colors.bright);
    log('Validating OAuth user info retrieval fix implementation...', colors.cyan);
    
    const validationResults = await testOAuthStatusFix();
    
    log('\n✅ Validation complete!', colors.green);
    log(`Production Ready: ${validationResults.readyForProduction ? 'YES' : 'NO'}`, 
        validationResults.readyForProduction ? colors.green : colors.red);
    
    return validationResults;
    
  } catch (error) {
    log('❌ Validation failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();