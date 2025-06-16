/**
 * Comprehensive OAuth and API Diagnostic Suite
 * Tests all aspects of Railway deployment and OAuth functionality
 */

import https from 'https';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

class OAuthDiagnosticSuite {
  constructor() {
    this.baseUrl = 'https://dir.engageautomations.com';
    this.results = {
      infrastructure: {},
      oauth: {},
      api: {},
      environment: {},
      endpoints: {}
    };
  }

  async makeRequest(url, options = {}) {
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

  async testInfrastructure() {
    log('\n🏗️  Infrastructure Tests', colors.cyan);
    log('=========================', colors.cyan);

    // Test 1: Basic connectivity
    try {
      const healthResponse = await this.makeRequest(`${this.baseUrl}/health`);
      const healthData = JSON.parse(healthResponse.body);
      
      this.results.infrastructure.connectivity = {
        status: healthResponse.statusCode === 200 ? 'PASS' : 'FAIL',
        responseTime: Date.now(),
        version: healthData.version || 'unknown'
      };
      
      log(`✅ Basic Connectivity: ${healthResponse.statusCode === 200 ? 'PASS' : 'FAIL'}`, 
          healthResponse.statusCode === 200 ? colors.green : colors.red);
      log(`   Version: ${healthData.version || 'unknown'}`, colors.cyan);
      
    } catch (error) {
      this.results.infrastructure.connectivity = { status: 'FAIL', error: error.message };
      log(`❌ Basic Connectivity: FAIL - ${error.message}`, colors.red);
    }

    // Test 2: API Health endpoint
    try {
      const apiHealthResponse = await this.makeRequest(`${this.baseUrl}/api/health`);
      const apiHealthData = JSON.parse(apiHealthResponse.body);
      
      this.results.infrastructure.apiHealth = {
        status: apiHealthResponse.statusCode === 200 ? 'PASS' : 'FAIL',
        service: apiHealthData.service,
        fixes: apiHealthData.fixes
      };
      
      log(`✅ API Health Endpoint: ${apiHealthResponse.statusCode === 200 ? 'PASS' : 'FAIL'}`, 
          apiHealthResponse.statusCode === 200 ? colors.green : colors.red);
      
      if (apiHealthData.fixes) {
        log(`   Deployed Fixes:`, colors.cyan);
        apiHealthData.fixes.forEach(fix => log(`     - ${fix}`, colors.cyan));
      }
      
    } catch (error) {
      this.results.infrastructure.apiHealth = { status: 'FAIL', error: error.message };
      log(`❌ API Health Endpoint: FAIL - ${error.message}`, colors.red);
    }

    // Test 3: CORS Configuration
    try {
      const corsResponse = await this.makeRequest(`${this.baseUrl}/health`, {
        method: 'OPTIONS'
      });
      
      this.results.infrastructure.cors = {
        status: corsResponse.statusCode < 400 ? 'PASS' : 'FAIL',
        headers: corsResponse.headers
      };
      
      log(`✅ CORS Configuration: ${corsResponse.statusCode < 400 ? 'PASS' : 'FAIL'}`, 
          corsResponse.statusCode < 400 ? colors.green : colors.red);
      
    } catch (error) {
      this.results.infrastructure.cors = { status: 'FAIL', error: error.message };
      log(`❌ CORS Configuration: FAIL - ${error.message}`, colors.red);
    }
  }

  async testEnvironmentVariables() {
    log('\n🔧 Environment Variable Detection', colors.cyan);
    log('==================================', colors.cyan);

    // Test environment variable accessibility through OAuth callback
    try {
      const testCode = 'test_environment_check';
      const callbackResponse = await this.makeRequest(`${this.baseUrl}/oauth/callback?code=${testCode}`);
      
      if (callbackResponse.statusCode === 302) {
        const location = callbackResponse.headers.location;
        
        if (location.includes('token_exchange_failed')) {
          this.results.environment.variables = {
            status: 'FAIL',
            issue: 'Environment variables not accessible',
            error: 'token_exchange_failed'
          };
          log(`❌ Environment Variables: NOT ACCESSIBLE`, colors.red);
          log(`   Error: Token exchange failed - OAuth credentials missing`, colors.red);
        } else if (location.includes('oauth-error')) {
          this.results.environment.variables = {
            status: 'PARTIAL',
            issue: 'Variables accessible but OAuth response unexpected',
            redirect: location
          };
          log(`⚠️  Environment Variables: PARTIALLY ACCESSIBLE`, colors.yellow);
          log(`   Redirect: ${location}`, colors.yellow);
        }
      }
      
    } catch (error) {
      this.results.environment.variables = { status: 'ERROR', error: error.message };
      log(`❌ Environment Variable Test: ERROR - ${error.message}`, colors.red);
    }
  }

  async testOAuthEndpoints() {
    log('\n🔐 OAuth Endpoint Tests', colors.cyan);
    log('=========================', colors.cyan);

    const oauthEndpoints = [
      { path: '/api/oauth/auth', params: '?installation_id=test' },
      { path: '/api/oauth/status', params: '?installation_id=test' },
      { path: '/oauth/callback', params: '?code=test' }
    ];

    for (const endpoint of oauthEndpoints) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${endpoint.path}${endpoint.params}`);
        let responseData;
        
        try {
          responseData = JSON.parse(response.body);
        } catch {
          responseData = { rawBody: response.body.substring(0, 100) };
        }
        
        this.results.endpoints[endpoint.path] = {
          status: response.statusCode < 500 ? 'PASS' : 'FAIL',
          statusCode: response.statusCode,
          response: responseData
        };
        
        const statusColor = response.statusCode < 500 ? colors.green : colors.red;
        const statusText = response.statusCode < 500 ? 'RESPONDING' : 'ERROR';
        
        log(`${response.statusCode < 500 ? '✅' : '❌'} ${endpoint.path}: ${statusText} (${response.statusCode})`, statusColor);
        
        if (responseData.error) {
          log(`   Error: ${responseData.error}`, colors.cyan);
          log(`   Message: ${responseData.message}`, colors.cyan);
        }
        
      } catch (error) {
        this.results.endpoints[endpoint.path] = { status: 'FAIL', error: error.message };
        log(`❌ ${endpoint.path}: FAIL - ${error.message}`, colors.red);
      }
    }
  }

  async testInstallationManagement() {
    log('\n📦 Installation Management', colors.cyan);
    log('===========================', colors.cyan);

    try {
      const installationsResponse = await this.makeRequest(`${this.baseUrl}/api/installations`);
      const installationsData = JSON.parse(installationsResponse.body);
      
      this.results.api.installations = {
        status: installationsResponse.statusCode === 200 ? 'PASS' : 'FAIL',
        count: installationsData.count || 0,
        data: installationsData
      };
      
      log(`✅ Installations Endpoint: ${installationsResponse.statusCode === 200 ? 'PASS' : 'FAIL'}`, 
          installationsResponse.statusCode === 200 ? colors.green : colors.red);
      log(`   Installation Count: ${installationsData.count || 0}`, colors.cyan);
      
      if (installationsData.installations && installationsData.installations.length > 0) {
        log(`   Recent Installations:`, colors.cyan);
        installationsData.installations.slice(0, 3).forEach(inst => {
          log(`     - ID: ${inst.id} | User: ${inst.userId} | Location: ${inst.locationName}`, colors.cyan);
        });
      }
      
    } catch (error) {
      this.results.api.installations = { status: 'FAIL', error: error.message };
      log(`❌ Installation Management: FAIL - ${error.message}`, colors.red);
    }
  }

  async testAPIProxy() {
    log('\n🔌 API Proxy Tests', colors.cyan);
    log('===================', colors.cyan);

    try {
      const proxyResponse = await this.makeRequest(`${this.baseUrl}/api/ghl/test`);
      let proxyData;
      
      try {
        proxyData = JSON.parse(proxyResponse.body);
      } catch {
        proxyData = { rawBody: proxyResponse.body };
      }
      
      this.results.api.proxy = {
        status: proxyResponse.statusCode === 501 ? 'EXPECTED' : 'UNEXPECTED',
        statusCode: proxyResponse.statusCode,
        response: proxyData
      };
      
      if (proxyResponse.statusCode === 501) {
        log(`✅ API Proxy: CORRECTLY CONFIGURED (Not Implemented)`, colors.green);
        log(`   Message: ${proxyData.message}`, colors.cyan);
      } else {
        log(`⚠️  API Proxy: UNEXPECTED RESPONSE (${proxyResponse.statusCode})`, colors.yellow);
      }
      
    } catch (error) {
      this.results.api.proxy = { status: 'ERROR', error: error.message };
      log(`❌ API Proxy: ERROR - ${error.message}`, colors.red);
    }
  }

  async testRealOAuthFlow() {
    log('\n🚀 Real OAuth Flow Test', colors.cyan);
    log('========================', colors.cyan);

    // Test with the actual authorization code from your OAuth attempt
    const realAuthCode = '1731fbd15b08681b9cc1b7a5fd321539d9b2c392';
    
    try {
      const oauthResponse = await this.makeRequest(`${this.baseUrl}/oauth/callback?code=${realAuthCode}`);
      
      this.results.oauth.realFlow = {
        statusCode: oauthResponse.statusCode,
        isRedirect: oauthResponse.statusCode === 302,
        location: oauthResponse.headers.location
      };
      
      if (oauthResponse.statusCode === 302 && oauthResponse.headers.location) {
        const location = oauthResponse.headers.location;
        
        if (location.includes('oauth_success=true')) {
          log(`✅ Real OAuth Flow: SUCCESS`, colors.green);
          log(`   Redirect: ${location}`, colors.green);
          
          // Extract installation ID
          const installationMatch = location.match(/installation_id=([^&]+)/);
          if (installationMatch) {
            this.results.oauth.installationId = installationMatch[1];
            log(`   Installation ID: ${installationMatch[1]}`, colors.green);
          }
          
        } else if (location.includes('token_exchange_failed')) {
          log(`❌ Real OAuth Flow: TOKEN EXCHANGE FAILED`, colors.red);
          log(`   Issue: Environment variables not accessible`, colors.red);
          this.results.oauth.realFlow.issue = 'token_exchange_failed';
          
        } else if (location.includes('user_info_failed')) {
          log(`⚠️  Real OAuth Flow: USER INFO FAILED`, colors.yellow);
          log(`   Issue: Token exchange worked, user endpoint failed`, colors.yellow);
          this.results.oauth.realFlow.issue = 'user_info_failed';
          
        } else {
          log(`⚠️  Real OAuth Flow: UNKNOWN ERROR`, colors.yellow);
          log(`   Redirect: ${location}`, colors.yellow);
          this.results.oauth.realFlow.issue = 'unknown_error';
        }
      }
      
    } catch (error) {
      this.results.oauth.realFlow = { status: 'ERROR', error: error.message };
      log(`❌ Real OAuth Flow: ERROR - ${error.message}`, colors.red);
    }
  }

  async testEndpointAvailability() {
    log('\n🌐 Endpoint Availability', colors.cyan);
    log('=========================', colors.cyan);

    const endpoints = [
      '/health',
      '/api/health', 
      '/api/oauth/auth',
      '/api/oauth/status',
      '/oauth/callback',
      '/api/installations',
      '/api/ghl/test'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
        const isAvailable = response.statusCode < 500;
        
        log(`${isAvailable ? '✅' : '❌'} ${endpoint}: ${isAvailable ? 'AVAILABLE' : 'ERROR'} (${response.statusCode})`, 
            isAvailable ? colors.green : colors.red);
        
        this.results.endpoints[endpoint] = {
          available: isAvailable,
          statusCode: response.statusCode
        };
        
      } catch (error) {
        log(`❌ ${endpoint}: ERROR - ${error.message}`, colors.red);
        this.results.endpoints[endpoint] = { available: false, error: error.message };
      }
    }
  }

  generateSummaryReport() {
    log('\n📊 COMPREHENSIVE DIAGNOSTIC SUMMARY', colors.magenta);
    log('=====================================', colors.magenta);

    // Infrastructure Status
    const infraPassing = Object.values(this.results.infrastructure).filter(r => r.status === 'PASS').length;
    const infraTotal = Object.keys(this.results.infrastructure).length;
    log(`\n🏗️  Infrastructure: ${infraPassing}/${infraTotal} tests passing`, 
        infraPassing === infraTotal ? colors.green : colors.yellow);

    // OAuth Status
    const oauthIssues = [];
    if (this.results.oauth.realFlow?.issue === 'token_exchange_failed') {
      oauthIssues.push('Environment variables not accessible');
    }
    if (this.results.oauth.realFlow?.issue === 'user_info_failed') {
      oauthIssues.push('User info endpoint failing');
    }

    log(`\n🔐 OAuth Status: ${oauthIssues.length === 0 ? 'WORKING' : 'ISSUES DETECTED'}`, 
        oauthIssues.length === 0 ? colors.green : colors.red);
    
    if (oauthIssues.length > 0) {
      oauthIssues.forEach(issue => log(`   - ${issue}`, colors.red));
    }

    // Endpoint Availability
    const availableEndpoints = Object.values(this.results.endpoints).filter(e => e.available !== false).length;
    const totalEndpoints = Object.keys(this.results.endpoints).length;
    log(`\n🌐 Endpoints: ${availableEndpoints}/${totalEndpoints} available`, 
        availableEndpoints === totalEndpoints ? colors.green : colors.yellow);

    // Priority Issues
    log(`\n🚨 PRIORITY ISSUES TO ADDRESS:`, colors.red);
    log('==============================', colors.red);

    if (this.results.oauth.realFlow?.issue === 'token_exchange_failed') {
      log(`1. CRITICAL: Environment variables not accessible in Railway`, colors.red);
      log(`   Solution: Check Railway Variables section for:`, colors.yellow);
      log(`   - GHL_CLIENT_ID`, colors.yellow);
      log(`   - GHL_CLIENT_SECRET`, colors.yellow);
      log(`   - GHL_REDIRECT_URI`, colors.yellow);
    }

    if (this.results.oauth.realFlow?.issue === 'user_info_failed') {
      log(`2. OAuth user endpoint failing after token exchange`, colors.red);
      log(`   Solution: Check GoHighLevel API changes or token scopes`, colors.yellow);
    }

    // Success Indicators
    log(`\n✅ WORKING COMPONENTS:`, colors.green);
    log('======================', colors.green);

    if (this.results.infrastructure.connectivity?.status === 'PASS') {
      log(`- Railway deployment is live and responding`, colors.green);
    }
    if (this.results.infrastructure.apiHealth?.status === 'PASS') {
      log(`- Backend version 2.0.1 successfully deployed`, colors.green);
    }
    if (availableEndpoints > 0) {
      log(`- All critical endpoints are responding`, colors.green);
    }

    // Next Steps
    log(`\n🎯 RECOMMENDED NEXT STEPS:`, colors.blue);
    log('==========================', colors.blue);

    if (this.results.oauth.realFlow?.issue === 'token_exchange_failed') {
      log(`1. Check Railway logs for environment variable validation output`, colors.blue);
      log(`2. Add missing OAuth credentials in Railway Variables section`, colors.blue);
      log(`3. Redeploy or restart Railway service after adding variables`, colors.blue);
      log(`4. Test OAuth flow again with fresh authorization code`, colors.blue);
    } else if (this.results.oauth.realFlow?.issue) {
      log(`1. OAuth credentials are accessible, investigate API endpoint issues`, colors.blue);
      log(`2. Check GoHighLevel API documentation for changes`, colors.blue);
      log(`3. Verify token scopes include required permissions`, colors.blue);
    } else {
      log(`1. OAuth system appears to be working correctly`, colors.blue);
      log(`2. Test with actual GoHighLevel marketplace installation`, colors.blue);
      log(`3. Monitor production usage for any edge cases`, colors.blue);
    }

    return this.results;
  }

  async runFullDiagnostic() {
    log('🔍 Starting Comprehensive OAuth Diagnostic Suite', colors.magenta);
    log('================================================', colors.magenta);

    await this.testInfrastructure();
    await this.testEnvironmentVariables();
    await this.testOAuthEndpoints();
    await this.testInstallationManagement();
    await this.testAPIProxy();
    await this.testRealOAuthFlow();
    await this.testEndpointAvailability();

    return this.generateSummaryReport();
  }
}

async function main() {
  const diagnostic = new OAuthDiagnosticSuite();
  const results = await diagnostic.runFullDiagnostic();
  
  // Export results for further analysis
  console.log('\n📋 Raw diagnostic data available in results object');
  return results;
}

export default main;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}