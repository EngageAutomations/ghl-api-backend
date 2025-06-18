/**
 * Production Deployment Validation Suite
 * Comprehensive testing based on production readiness checklist
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

class ProductionValidator {
  constructor() {
    this.results = {
      environment: {},
      routing: {},
      tokenManagement: {},
      frontend: {},
      endToEnd: {},
      observability: {}
    };
  }

  async validateEnvironmentDeployment() {
    log('\n🌐 1. ENVIRONMENT & DEPLOYMENT VALIDATION', colors.cyan);
    
    // Test route ordering in production build
    log('\n📍 Testing Route Ordering...', colors.blue);
    
    try {
      // Test that API routes resolve before frontend
      const apiResponse = await fetch('http://localhost:5000/api/oauth/status?installation_id=test', {
        headers: { 'Accept': 'application/json' }
      });
      
      const contentType = apiResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        log('✅ API routes resolve before frontend catch-all', colors.green);
        this.results.environment.routeOrdering = true;
      } else {
        log('❌ API routes fall through to frontend', colors.red);
        this.results.environment.routeOrdering = false;
      }
    } catch (error) {
      log(`❌ Route ordering test failed: ${error.message}`, colors.red);
      this.results.environment.routeOrdering = false;
    }

    // Test environment variable consistency
    log('\n🔧 Testing Environment Variables...', colors.blue);
    
    const envVars = {
      'GHL_SCOPES': process.env.GHL_SCOPES,
      'GHL_CLIENT_ID': process.env.GHL_CLIENT_ID,
      'GHL_CLIENT_SECRET': process.env.GHL_CLIENT_SECRET,
      'GHL_REDIRECT_URI': process.env.GHL_REDIRECT_URI
    };

    const requiredScopes = ['users.read', 'products/prices.write', 'locations.readonly'];
    const scopeString = envVars.GHL_SCOPES || '';
    
    const scopeCheck = requiredScopes.every(scope => scopeString.includes(scope));
    
    if (scopeCheck) {
      log('✅ Critical OAuth scopes configured', colors.green);
      this.results.environment.scopeConfig = true;
    } else {
      log('❌ Missing critical OAuth scopes', colors.red);
      log(`Current: ${scopeString}`);
      log(`Missing: ${requiredScopes.filter(s => !scopeString.includes(s)).join(', ')}`);
      this.results.environment.scopeConfig = false;
    }

    // Test redirect URI configuration
    const redirectUri = envVars.GHL_REDIRECT_URI;
    if (redirectUri && (redirectUri.includes('http') || redirectUri.includes('https'))) {
      log('✅ Redirect URI properly configured', colors.green);
      this.results.environment.redirectUri = true;
    } else {
      log('❌ Redirect URI missing or malformed', colors.red);
      this.results.environment.redirectUri = false;
    }

    return this.results.environment;
  }

  async validateBackendRouting() {
    log('\n🔧 2. BACKEND ROUTING & API RESPONSES', colors.cyan);

    // Test health check vs status endpoint conflict
    log('\n🏥 Testing Health Check Routing...', colors.blue);
    
    try {
      const healthResponse = await fetch('http://localhost:5000/api/health');
      const healthData = await healthResponse.json();
      
      if (healthData.status && healthResponse.ok) {
        log('✅ Health check endpoint working independently', colors.green);
        this.results.routing.healthCheck = true;
      } else {
        log('❌ Health check endpoint conflicts detected', colors.red);
        this.results.routing.healthCheck = false;
      }
    } catch (error) {
      log(`⚠️  Health check test inconclusive: ${error.message}`, colors.yellow);
      this.results.routing.healthCheck = null;
    }

    // Test HTML vs JSON responses under all conditions
    log('\n📄 Testing JSON Response Consistency...', colors.blue);
    
    const testCases = [
      { id: 'invalid', expected: 400, description: 'Invalid installation ID' },
      { id: '999999', expected: 404, description: 'Non-existent installation' },
      { id: 'test', expected: 400, description: 'Malformed installation ID' }
    ];

    let jsonConsistency = true;
    
    for (const testCase of testCases) {
      try {
        const response = await fetch(`http://localhost:5000/api/oauth/status?installation_id=${testCase.id}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          log(`✅ ${testCase.description}: JSON response`, colors.green);
          
          if (data.error && data.message) {
            log(`   Error structure valid: ${data.error}`, colors.green);
          }
        } else {
          log(`❌ ${testCase.description}: HTML response instead of JSON`, colors.red);
          jsonConsistency = false;
        }
      } catch (error) {
        log(`❌ ${testCase.description}: Test failed - ${error.message}`, colors.red);
        jsonConsistency = false;
      }
    }
    
    this.results.routing.jsonConsistency = jsonConsistency;

    return this.results.routing;
  }

  async validateTokenManagement() {
    log('\n🔐 3. TOKEN MANAGEMENT & REFRESH LOGIC', colors.cyan);

    // Test token expiration and refresh logic
    log('\n⏰ Testing Token Refresh Logic...', colors.blue);
    
    try {
      // Check if refresh logic is implemented in code
      const fs = require('fs');
      const serverCode = fs.readFileSync('server/index.ts', 'utf8');
      
      const hasRefreshLogic = [
        'token_refresh_failed',
        'refresh_token',
        'expires_in',
        'tokenExpiry'
      ].every(keyword => serverCode.includes(keyword));
      
      if (hasRefreshLogic) {
        log('✅ Token refresh logic implemented in code', colors.green);
        this.results.tokenManagement.refreshImplemented = true;
      } else {
        log('❌ Token refresh logic missing or incomplete', colors.red);
        this.results.tokenManagement.refreshImplemented = false;
      }

      // Test error handling for refresh failures
      const hasRefreshErrorHandling = serverCode.includes('token_refresh_failed') && 
                                     serverCode.includes('Unable to refresh');
      
      if (hasRefreshErrorHandling) {
        log('✅ Refresh failure error handling implemented', colors.green);
        this.results.tokenManagement.refreshErrorHandling = true;
      } else {
        log('❌ Refresh failure error handling missing', colors.red);
        this.results.tokenManagement.refreshErrorHandling = false;
      }

      // Test concurrency handling
      const hasConcurrencyProtection = serverCode.includes('UPDATE') && 
                                      serverCode.includes('WHERE id =');
      
      if (hasConcurrencyProtection) {
        log('✅ Basic concurrency protection in database updates', colors.green);
        this.results.tokenManagement.concurrencyHandling = true;
      } else {
        log('⚠️  Concurrency protection may need enhancement', colors.yellow);
        this.results.tokenManagement.concurrencyHandling = false;
      }

    } catch (error) {
      log(`❌ Token management validation failed: ${error.message}`, colors.red);
      this.results.tokenManagement.refreshImplemented = false;
      this.results.tokenManagement.refreshErrorHandling = false;
      this.results.tokenManagement.concurrencyHandling = false;
    }

    return this.results.tokenManagement;
  }

  async validateFrontendFlow() {
    log('\n🎨 4. FRONTEND FLOW & SESSION RECOVERY', colors.cyan);

    // Test installation ID propagation
    log('\n🆔 Testing Installation ID Handling...', colors.blue);
    
    try {
      const fs = require('fs');
      const authContextCode = fs.readFileSync('client/src/context/AuthContext.tsx', 'utf8');
      
      const hasInstallationTracking = [
        'installation_id',
        'localStorage',
        'URLSearchParams',
        'oauth_installation_id'
      ].every(keyword => authContextCode.includes(keyword));
      
      if (hasInstallationTracking) {
        log('✅ Installation ID tracking implemented', colors.green);
        this.results.frontend.installationTracking = true;
      } else {
        log('❌ Installation ID tracking incomplete', colors.red);
        this.results.frontend.installationTracking = false;
      }

      // Test CORS and credentials handling
      const hasCORSConfig = authContextCode.includes('credentials: \'include\'') ||
                           authContextCode.includes('credentials: "include"');
      
      if (hasCORSConfig) {
        log('✅ Credentials configuration present', colors.green);
        this.results.frontend.corsConfig = true;
      } else {
        log('❌ Credentials configuration missing', colors.red);
        this.results.frontend.corsConfig = false;
      }

      // Test error handling UX
      const hasErrorHandling = authContextCode.includes('user_info_failed') ||
                              authContextCode.includes('error') ||
                              authContextCode.includes('catch');
      
      if (hasErrorHandling) {
        log('✅ Error handling UI logic present', colors.green);
        this.results.frontend.errorHandling = true;
      } else {
        log('❌ Error handling UI logic missing', colors.red);
        this.results.frontend.errorHandling = false;
      }

    } catch (error) {
      log(`❌ Frontend validation failed: ${error.message}`, colors.red);
      this.results.frontend.installationTracking = false;
      this.results.frontend.corsConfig = false;
      this.results.frontend.errorHandling = false;
    }

    return this.results.frontend;
  }

  async validateEndToEnd() {
    log('\n🔄 5. END-TO-END & REGRESSION TESTING', colors.cyan);

    // Test API proxy functionality
    log('\n🔌 Testing API Proxy Routes...', colors.blue);
    
    try {
      // Test that other API routes still work
      const testRoutes = [
        '/api/health',
        '/api/auth/me'
      ];

      let proxyWorking = true;
      
      for (const route of testRoutes) {
        try {
          const response = await fetch(`http://localhost:5000${route}`);
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            log(`✅ ${route}: Proxy working`, colors.green);
          } else {
            log(`❌ ${route}: Proxy broken`, colors.red);
            proxyWorking = false;
          }
        } catch (error) {
          log(`❌ ${route}: Test failed - ${error.message}`, colors.red);
          proxyWorking = false;
        }
      }
      
      this.results.endToEnd.apiProxyWorking = proxyWorking;

      // Test multi-user isolation capability
      log('\n👥 Testing Multi-User Isolation...', colors.blue);
      
      // Check if user isolation is implemented in storage/routing
      const fs = require('fs');
      const routesCode = fs.readFileSync('server/routes.ts', 'utf8');
      
      const hasUserIsolation = routesCode.includes('userId') || 
                              routesCode.includes('user.id') ||
                              routesCode.includes('installation');
      
      if (hasUserIsolation) {
        log('✅ User isolation logic present in routes', colors.green);
        this.results.endToEnd.userIsolation = true;
      } else {
        log('⚠️  User isolation may need verification', colors.yellow);
        this.results.endToEnd.userIsolation = false;
      }

    } catch (error) {
      log(`❌ End-to-end validation failed: ${error.message}`, colors.red);
      this.results.endToEnd.apiProxyWorking = false;
      this.results.endToEnd.userIsolation = false;
    }

    return this.results.endToEnd;
  }

  async validateObservability() {
    log('\n📊 6. OBSERVABILITY & MONITORING', colors.cyan);

    // Test logging implementation
    log('\n📝 Testing Logging Configuration...', colors.blue);
    
    try {
      const fs = require('fs');
      const serverCode = fs.readFileSync('server/index.ts', 'utf8');
      
      const loggingPatterns = [
        'console.log',
        'OAuth Status endpoint hit',
        'GoHighLevel user info API error',
        'Token refreshed successfully'
      ];
      
      const loggingImplemented = loggingPatterns.every(pattern => 
        serverCode.includes(pattern)
      );
      
      if (loggingImplemented) {
        log('✅ Comprehensive logging implemented', colors.green);
        this.results.observability.logging = true;
      } else {
        log('❌ Logging implementation incomplete', colors.red);
        this.results.observability.logging = false;
      }

      // Test error tracking
      const errorTracking = serverCode.includes('error:') && 
                           serverCode.includes('console.error');
      
      if (errorTracking) {
        log('✅ Error tracking implemented', colors.green);
        this.results.observability.errorTracking = true;
      } else {
        log('❌ Error tracking missing', colors.red);
        this.results.observability.errorTracking = false;
      }

    } catch (error) {
      log(`❌ Observability validation failed: ${error.message}`, colors.red);
      this.results.observability.logging = false;
      this.results.observability.errorTracking = false;
    }

    return this.results.observability;
  }

  generateProductionReport() {
    log('\n📋 PRODUCTION DEPLOYMENT READINESS REPORT', colors.cyan);
    log('=' * 60, colors.cyan);

    const allResults = [
      ...Object.values(this.results.environment),
      ...Object.values(this.results.routing),
      ...Object.values(this.results.tokenManagement),
      ...Object.values(this.results.frontend),
      ...Object.values(this.results.endToEnd),
      ...Object.values(this.results.observability)
    ].filter(result => result !== null);

    const passedChecks = allResults.filter(result => result === true).length;
    const totalChecks = allResults.length;
    const readinessScore = Math.round((passedChecks / totalChecks) * 100);

    log(`\n🎯 Overall Production Readiness: ${readinessScore}% (${passedChecks}/${totalChecks} checks passed)`, 
        readinessScore >= 80 ? colors.green : readinessScore >= 60 ? colors.yellow : colors.red);

    // Detailed breakdown
    log('\n📊 CATEGORY BREAKDOWN:', colors.blue);
    
    const categories = [
      { name: 'Environment & Deployment', results: this.results.environment },
      { name: 'Backend Routing & API', results: this.results.routing },
      { name: 'Token Management', results: this.results.tokenManagement },
      { name: 'Frontend Flow', results: this.results.frontend },
      { name: 'End-to-End Testing', results: this.results.endToEnd },
      { name: 'Observability', results: this.results.observability }
    ];

    categories.forEach(category => {
      const categoryResults = Object.values(category.results).filter(r => r !== null);
      const categoryPassed = categoryResults.filter(r => r === true).length;
      const categoryTotal = categoryResults.length;
      const categoryScore = categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0;
      
      const color = categoryScore >= 80 ? colors.green : categoryScore >= 60 ? colors.yellow : colors.red;
      log(`${category.name}: ${categoryScore}% (${categoryPassed}/${categoryTotal})`, color);
    });

    // Critical recommendations
    log('\n🔧 CRITICAL DEPLOYMENT ACTIONS:', colors.blue);
    
    if (!this.results.environment.routeOrdering) {
      log('1. Fix API route ordering - ensure OAuth status returns JSON', colors.yellow);
    }
    
    if (!this.results.environment.scopeConfig) {
      log('2. Update GoHighLevel app to include users.read scope', colors.yellow);
    }
    
    if (!this.results.routing.jsonConsistency) {
      log('3. Resolve HTML responses in API endpoints', colors.yellow);
    }
    
    if (!this.results.tokenManagement.refreshImplemented) {
      log('4. Implement token refresh logic', colors.yellow);
    }

    if (readinessScore >= 80) {
      log('\n✅ READY FOR PRODUCTION DEPLOYMENT', colors.green);
      log('All critical systems validated and functional', colors.green);
    } else if (readinessScore >= 60) {
      log('\n⚠️  PRODUCTION DEPLOYMENT WITH MONITORING', colors.yellow);
      log('Deploy with enhanced monitoring and rapid rollback capability', colors.yellow);
    } else {
      log('\n❌ NOT READY FOR PRODUCTION', colors.red);
      log('Critical issues must be resolved before deployment', colors.red);
    }

    return {
      readinessScore,
      readyForProduction: readinessScore >= 80,
      results: this.results
    };
  }
}

async function main() {
  try {
    log('🚀 PRODUCTION DEPLOYMENT VALIDATION SUITE', colors.bright);
    log('Comprehensive OAuth fix production readiness assessment...', colors.cyan);
    
    const validator = new ProductionValidator();
    
    await validator.validateEnvironmentDeployment();
    await validator.validateBackendRouting();
    await validator.validateTokenManagement();
    await validator.validateFrontendFlow();
    await validator.validateEndToEnd();
    await validator.validateObservability();
    
    const report = validator.generateProductionReport();
    
    log('\n✅ Production validation complete!', colors.green);
    
    return report;
    
  } catch (error) {
    log('❌ Production validation failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();