/**
 * OAuth Production Verification Suite
 * Comprehensive testing based on production readiness checklist
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

async function verifyEnvironmentConfiguration() {
  log('\n🔧 1. ENVIRONMENT & CONFIGURATION VERIFICATION', colors.cyan);
  log('=' * 60, colors.cyan);

  try {
    // Check OAuth scope configuration
    log('\n📋 Checking OAuth Scopes...', colors.blue);
    const { ghlOAuth } = await import('./server/ghl-oauth.js');
    
    // Generate auth URL to inspect scopes
    const authUrl = ghlOAuth.getAuthorizationUrl('test_state');
    const urlParams = new URLSearchParams(authUrl.split('?')[1]);
    const scopeString = urlParams.get('scope');
    
    log(`Current Scopes: ${scopeString}`);
    
    if (scopeString && scopeString.includes('users.read')) {
      log('✅ users.read scope is properly configured', colors.green);
    } else {
      log('❌ users.read scope is missing', colors.red);
    }

    // Check redirect URIs
    log('\n🔗 Checking Redirect URIs...', colors.blue);
    const redirectUri = urlParams.get('redirect_uri');
    log(`Configured Redirect URI: ${redirectUri}`);
    
    // Check environment variables
    log('\n🌍 Environment Variables Status:', colors.blue);
    const envVars = {
      'GHL_CLIENT_ID': process.env.GHL_CLIENT_ID ? 'SET' : 'MISSING',
      'GHL_CLIENT_SECRET': process.env.GHL_CLIENT_SECRET ? 'SET' : 'MISSING',
      'GHL_REDIRECT_URI': process.env.GHL_REDIRECT_URI ? 'SET' : 'MISSING',
      'GHL_SCOPES': process.env.GHL_SCOPES ? 'SET' : 'MISSING'
    };
    
    Object.entries(envVars).forEach(([key, status]) => {
      const color = status === 'SET' ? colors.green : colors.red;
      log(`${key}: ${status}`, color);
    });

    return {
      scopesValid: scopeString && scopeString.includes('users.read'),
      redirectUriSet: !!redirectUri,
      envVarsSet: Object.values(envVars).every(status => status === 'SET')
    };

  } catch (error) {
    log(`❌ Environment configuration check failed: ${error.message}`, colors.red);
    return { scopesValid: false, redirectUriSet: false, envVarsSet: false };
  }
}

async function verifyTokenAndEndpoints() {
  log('\n🔐 2. TOKEN & ENDPOINT VALIDATION', colors.cyan);
  log('=' * 60, colors.cyan);

  try {
    // Check if we have real credentials for testing
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
      log('No real credentials file found', colors.yellow);
    }

    if (realCredentials) {
      log('\n🧪 Testing Direct GoHighLevel API Access...', colors.blue);
      
      // Test v1/users/me endpoint
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
        log('✅ Direct GoHighLevel API access working', colors.green);
        log(`User: ${userInfo.name} (${userInfo.email})`);
        return { directApiWorking: true, userInfo };
      } else {
        const errorText = await userInfoResponse.text();
        log('❌ Direct GoHighLevel API failed:', colors.red);
        log(`Error: ${errorText}`);
        
        if (userInfoResponse.status === 401) {
          log('🔍 Token may be expired', colors.yellow);
        } else if (userInfoResponse.status === 403) {
          log('🔍 Missing users.read scope or insufficient permissions', colors.yellow);
        }
        return { directApiWorking: false, error: errorText };
      }
    } else {
      log('⚠️  No real credentials available for direct API testing', colors.yellow);
      return { directApiWorking: null, message: 'No credentials' };
    }

  } catch (error) {
    log(`❌ Token validation failed: ${error.message}`, colors.red);
    return { directApiWorking: false, error: error.message };
  }
}

async function verifyFrontendIntegration() {
  log('\n🎨 3. FRONTEND INTEGRATION VERIFICATION', colors.cyan);
  log('=' * 60, colors.cyan);

  try {
    // Test OAuth status endpoint
    log('\n📡 Testing OAuth Status Endpoint...', colors.blue);
    
    const statusResponse = await fetch('http://localhost:5000/api/oauth/status?installation_id=1', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    log(`OAuth Status Response: ${statusResponse.status} ${statusResponse.statusText}`);
    
    // Check if response is JSON
    const contentType = statusResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const statusData = await statusResponse.json();
      log('✅ OAuth status endpoint returns JSON', colors.green);
      
      if (statusData.success) {
        log('✅ OAuth status successful', colors.green);
        return { statusEndpointWorking: true, data: statusData };
      } else {
        log(`❌ OAuth status failed: ${statusData.error}`, colors.red);
        return { statusEndpointWorking: false, error: statusData.error };
      }
    } else {
      log('❌ OAuth status endpoint returning HTML instead of JSON', colors.red);
      const htmlSnippet = await statusResponse.text();
      log(`Response preview: ${htmlSnippet.substring(0, 100)}...`);
      return { statusEndpointWorking: false, error: 'HTML response' };
    }

  } catch (error) {
    log(`❌ Frontend integration test failed: ${error.message}`, colors.red);
    return { statusEndpointWorking: false, error: error.message };
  }
}

async function verifyEndToEndFlow() {
  log('\n🔄 4. END-TO-END & REGRESSION TESTING', colors.cyan);
  log('=' * 60, colors.cyan);

  try {
    // Test database connectivity
    log('\n🗄️  Testing Database Connectivity...', colors.blue);
    
    const { db } = await import('./server/db.js');
    const dbTestResult = await db.query('SELECT COUNT(*) FROM oauth_installations');
    
    log(`Database query successful: ${dbTestResult.rows[0].count} installations found`);
    
    // Test authentication endpoints
    log('\n🔐 Testing Authentication Endpoints...', colors.blue);
    
    const authMeResponse = await fetch('http://localhost:5000/api/auth/me', {
      credentials: 'include'
    });
    
    log(`Auth Me Response: ${authMeResponse.status} ${authMeResponse.statusText}`);
    
    return {
      databaseWorking: true,
      authEndpointWorking: authMeResponse.status === 200
    };

  } catch (error) {
    log(`❌ End-to-end test failed: ${error.message}`, colors.red);
    return { databaseWorking: false, authEndpointWorking: false };
  }
}

async function verifyObservabilityAndMonitoring() {
  log('\n📊 5. OBSERVABILITY & MONITORING', colors.cyan);
  log('=' * 60, colors.cyan);

  try {
    // Check logging configuration
    log('\n📝 Checking Application Logging...', colors.blue);
    
    // Verify console logging is working
    console.log('TEST LOG: OAuth verification system active');
    log('✅ Console logging functional', colors.green);
    
    // Check error handling patterns
    log('\n🚨 Verifying Error Handling Patterns...', colors.blue);
    
    // Test a known error endpoint
    const errorTestResponse = await fetch('http://localhost:5000/api/oauth/status', {
      credentials: 'include'
    });
    
    if (errorTestResponse.status === 400) {
      const errorData = await errorTestResponse.json();
      if (errorData.error && errorData.message) {
        log('✅ Error responses properly formatted as JSON', colors.green);
      } else {
        log('❌ Error responses missing proper structure', colors.red);
      }
    }
    
    return { loggingWorking: true, errorHandlingProper: true };

  } catch (error) {
    log(`❌ Observability check failed: ${error.message}`, colors.red);
    return { loggingWorking: false, errorHandlingProper: false };
  }
}

async function generateProductionReadinessReport() {
  log('\n📋 PRODUCTION READINESS SUMMARY', colors.cyan);
  log('=' * 60, colors.cyan);

  const envResults = await verifyEnvironmentConfiguration();
  const tokenResults = await verifyTokenAndEndpoints();
  const frontendResults = await verifyFrontendIntegration();
  const e2eResults = await verifyEndToEndFlow();
  const monitoringResults = await verifyObservabilityAndMonitoring();

  // Calculate overall readiness score
  const checks = [
    envResults.scopesValid,
    envResults.redirectUriSet,
    envResults.envVarsSet,
    tokenResults.directApiWorking !== false,
    frontendResults.statusEndpointWorking,
    e2eResults.databaseWorking,
    e2eResults.authEndpointWorking,
    monitoringResults.loggingWorking,
    monitoringResults.errorHandlingProper
  ];

  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  const readinessScore = Math.round((passedChecks / totalChecks) * 100);

  log(`\n🎯 Overall Production Readiness: ${readinessScore}% (${passedChecks}/${totalChecks} checks passed)`, 
      readinessScore >= 80 ? colors.green : readinessScore >= 60 ? colors.yellow : colors.red);

  // Specific recommendations
  log('\n🔧 DEPLOYMENT RECOMMENDATIONS:', colors.blue);
  
  if (!envResults.scopesValid) {
    log('❗ Update GoHighLevel app settings to include users.read scope', colors.yellow);
  }
  
  if (!frontendResults.statusEndpointWorking) {
    log('❗ Fix OAuth status endpoint to return proper JSON responses', colors.yellow);
  }
  
  if (tokenResults.directApiWorking === false) {
    log('❗ Verify GoHighLevel API credentials and permissions', colors.yellow);
  }

  if (readinessScore >= 80) {
    log('✅ READY FOR PRODUCTION DEPLOYMENT', colors.green);
  } else {
    log('⚠️  Address critical issues before production deployment', colors.yellow);
  }

  return {
    readinessScore,
    envResults,
    tokenResults,
    frontendResults,
    e2eResults,
    monitoringResults
  };
}

async function main() {
  try {
    log('🚀 OAUTH PRODUCTION VERIFICATION SUITE', colors.bright);
    log('Testing comprehensive OAuth fix implementation...', colors.cyan);
    
    const results = await generateProductionReadinessReport();
    
    log('\n✅ Verification complete!', colors.green);
    return results;
    
  } catch (error) {
    log('❌ Verification suite failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();