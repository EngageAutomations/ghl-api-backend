/**
 * Verify Railway Deployment Status
 * Tests if the fixed OAuth backend is actually deployed
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

async function verifyDeployment() {
  log('🔍 Verifying Railway Deployment Status', colors.cyan);
  
  const baseUrl = 'https://dir.engageautomations.com';
  
  // Test critical endpoints
  const tests = [
    {
      name: 'Health Check',
      endpoint: '/health',
      expectedStatus: 200,
      shouldContain: 'healthy'
    },
    {
      name: 'Health Check (API path)',
      endpoint: '/api/health',
      expectedStatus: 200,
      shouldContain: 'healthy'
    },
    {
      name: 'OAuth Auth Endpoint (CRITICAL FIX)',
      endpoint: '/api/oauth/auth?installation_id=test',
      expectedStatus: [400, 404],
      shouldNotContain: 'Not found'
    },
    {
      name: 'OAuth Status Endpoint',
      endpoint: '/api/oauth/status?installation_id=test',
      expectedStatus: [400, 404],
      shouldNotContain: 'Not found'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${baseUrl}${test.endpoint}`);
      const responseText = await response.text();
      
      let passed = false;
      let reason = '';
      
      // Check status code
      if (Array.isArray(test.expectedStatus)) {
        passed = test.expectedStatus.includes(response.status);
        if (!passed) reason = `Expected ${test.expectedStatus.join(' or ')}, got ${response.status}`;
      } else {
        passed = response.status === test.expectedStatus;
        if (!passed) reason = `Expected ${test.expectedStatus}, got ${response.status}`;
      }
      
      // Check content if status is correct
      if (passed && test.shouldContain) {
        passed = responseText.includes(test.shouldContain);
        if (!passed) reason = `Response missing "${test.shouldContain}"`;
      }
      
      if (passed && test.shouldNotContain) {
        passed = !responseText.includes(test.shouldNotContain);
        if (!passed) reason = `Response contains "${test.shouldNotContain}"`;
      }
      
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        status: response.status,
        passed,
        reason: reason || 'OK',
        response: responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
      });
      
      log(`${passed ? '✅' : '❌'} ${test.name}: ${response.status} - ${reason || 'OK'}`, 
          passed ? colors.green : colors.red);
      
    } catch (error) {
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        passed: false,
        reason: `Error: ${error.message}`,
        response: null
      });
      
      log(`❌ ${test.name}: Error - ${error.message}`, colors.red);
    }
  }
  
  return results;
}

async function analyzeDeploymentIssue(results) {
  log('\n🔬 Deployment Analysis', colors.cyan);
  
  const criticalEndpoint = results.find(r => r.name.includes('OAuth Auth Endpoint'));
  
  if (criticalEndpoint && !criticalEndpoint.passed) {
    if (criticalEndpoint.response && criticalEndpoint.response.includes('Not found')) {
      log('❌ CRITICAL: Fixed backend not deployed', colors.red);
      log('   The /api/oauth/auth endpoint is still missing', colors.red);
      log('   This means Railway is still running the old version', colors.red);
      
      return {
        status: 'deployment_failed',
        issue: 'old_version_running',
        solution: 'force_redeploy'
      };
    }
  }
  
  const healthCheck = results.find(r => r.name === 'Health Check');
  if (healthCheck && healthCheck.passed) {
    log('✅ Basic health check working', colors.green);
  }
  
  return {
    status: 'needs_investigation',
    issue: 'mixed_results'
  };
}

async function generateSolution(analysis) {
  log('\n🔧 Solution Steps', colors.cyan);
  
  if (analysis.status === 'deployment_failed') {
    log('Railway deployment cache issue detected. Try these steps:', colors.yellow);
    log('');
    log('1. In Railway dashboard, go to your OAuth service');
    log('2. Click "Settings" → "General"');
    log('3. Click "Redeploy" button to force fresh deployment');
    log('4. Or delete and recreate the service completely');
    log('');
    log('Alternative: Create new Railway service with fixed code', colors.yellow);
    log('');
  }
  
  log('Expected behavior after fix:', colors.green);
  log('- /api/oauth/auth should return 400 (bad request) instead of 404');
  log('- Frontend retry mechanism should work');
  log('- OAuth flow should complete without "user_info_failed" error');
}

async function main() {
  try {
    const results = await verifyDeployment();
    const analysis = await analyzeDeploymentIssue(results);
    await generateSolution(analysis);
    
    log('\n📊 Summary:', colors.cyan);
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    log(`${passed}/${total} tests passed`);
    
    if (passed < total) {
      log('⚠️  Deployment verification failed - Railway needs redeployment', colors.yellow);
    } else {
      log('✅ All tests passed - OAuth should be working', colors.green);
    }
    
  } catch (error) {
    log('❌ Verification failed:', colors.red);
    console.error(error);
  }
}

main();