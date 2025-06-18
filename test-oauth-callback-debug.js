/**
 * Test OAuth Callback Debug
 * Simulates the OAuth callback process to identify the exact failure point
 */

import https from 'https';

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

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      request.write(options.body);
    }
    
    request.end();
  });
}

async function testOAuthCallbackDebug() {
  log('🔍 OAuth Callback Debug Analysis', colors.cyan);
  log('=====================================', colors.cyan);
  
  const authCode = '1731fbd15b08681b9cc1b7a5fd321539d9b2c392';
  
  log('\n1. Testing OAuth Callback with Actual Code:', colors.yellow);
  
  try {
    const callbackResponse = await makeRequest(`https://dir.engageautomations.com/oauth/callback?code=${authCode}`);
    
    log(`Status: ${callbackResponse.statusCode}`, colors.cyan);
    log(`Headers:`, colors.cyan);
    console.log(JSON.stringify(callbackResponse.headers, null, 2));
    log(`Body: ${callbackResponse.body.substring(0, 200)}...`, colors.cyan);
    
    // Check if it's a redirect
    if (callbackResponse.statusCode === 302) {
      const location = callbackResponse.headers.location;
      log(`\n🔄 Redirect detected to: ${location}`, colors.yellow);
      
      if (location.includes('oauth-error')) {
        const errorMatch = location.match(/error=([^&]+)/);
        const error = errorMatch ? errorMatch[1] : 'unknown';
        log(`❌ OAuth Error: ${error}`, colors.red);
        
        // Analyze the specific error
        switch (error) {
          case 'token_exchange_failed':
            log('\n💡 Analysis: Token exchange with GoHighLevel failed', colors.yellow);
            log('  - Check GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_REDIRECT_URI environment variables');
            log('  - Verify OAuth app configuration in GoHighLevel marketplace');
            break;
          case 'user_info_failed':
            log('\n💡 Analysis: User info retrieval failed', colors.yellow);
            log('  - Token exchange succeeded but user endpoint failed');
            log('  - This should be fixed with /users/me endpoint correction');
            break;
          case 'callback_failed':
            log('\n💡 Analysis: General callback failure', colors.yellow);
            log('  - Network or server error during OAuth process');
            break;
          default:
            log(`\n💡 Analysis: Unknown error - ${error}`, colors.yellow);
        }
      }
    }
    
    log('\n2. Testing Environment Variables Detection:', colors.yellow);
    
    // Test if we can detect environment variable issues
    const healthResponse = await makeRequest('https://dir.engageautomations.com/api/health');
    const healthData = JSON.parse(healthResponse.body);
    
    log(`Backend Version: ${healthData.version}`, colors.green);
    log(`Service Status: ${healthData.status}`, colors.green);
    
    log('\n3. Recommendations:', colors.blue);
    log('=====================================');
    
    if (callbackResponse.headers.location?.includes('user_info_failed')) {
      log('❌ The OAuth callback is failing at user info retrieval');
      log('🔧 Solutions:');
      log('  1. Check Railway environment variables:');
      log('     - GHL_CLIENT_ID');
      log('     - GHL_CLIENT_SECRET'); 
      log('     - GHL_REDIRECT_URI');
      log('  2. Verify OAuth app scopes include "users.read"');
      log('  3. Check GoHighLevel marketplace app configuration');
    }
    
    if (callbackResponse.headers.location?.includes('token_exchange_failed')) {
      log('❌ The OAuth callback is failing at token exchange');
      log('🔧 Solutions:');
      log('  1. Environment variables missing or incorrect');
      log('  2. OAuth app configuration mismatch');
      log('  3. Redirect URI must exactly match Railway configuration');
    }
    
  } catch (error) {
    log(`❌ Debug test failed: ${error.message}`, colors.red);
  }
}

async function generateSolutionSteps() {
  log('\n🛠️  OAuth Fix Action Plan:', colors.green);
  log('=====================================');
  
  log('1. Verify Railway Environment Variables:');
  log('   Go to Railway → Your Service → Variables');
  log('   Ensure these are set:');
  log('   - GHL_CLIENT_ID (from GoHighLevel marketplace app)');
  log('   - GHL_CLIENT_SECRET (from GoHighLevel marketplace app)');
  log('   - GHL_REDIRECT_URI (should be https://dir.engageautomations.com/oauth/callback)');
  log('');
  log('2. Check GoHighLevel App Configuration:');
  log('   - Redirect URI matches exactly');
  log('   - Scopes include "users.read"');
  log('   - App is approved and active');
  log('');
  log('3. Test with Fresh OAuth Flow:');
  log('   - Clear browser cookies');
  log('   - Initiate new OAuth from GoHighLevel marketplace');
  log('   - Monitor Railway logs for detailed error messages');
}

async function main() {
  await testOAuthCallbackDebug();
  await generateSolutionSteps();
}

main().catch(console.error);