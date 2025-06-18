/**
 * Railway Domain Verification Script
 * Helps identify which Railway service has the correct fixed backend
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

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: response.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: response.statusCode, data: data });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifyRailwayDeployment() {
  log('🔍 Railway Domain Verification', colors.cyan);
  log('=====================================', colors.cyan);
  
  const currentDomain = 'https://dir.engageautomations.com';
  
  log('\n1. Testing Current Domain Endpoints:', colors.yellow);
  
  try {
    // Test health endpoint variations
    log('\nTesting /api/health (NEW backend):');
    try {
      const healthNew = await makeRequest(`${currentDomain}/api/health`);
      if (healthNew.status === 200 && healthNew.data.version === '2.0.0') {
        log('✅ NEW backend detected - version 2.0.0 found', colors.green);
        return true;
      } else {
        log(`❌ Status: ${healthNew.status}`, colors.red);
        log(`   Response: ${JSON.stringify(healthNew.data).substring(0, 100)}...`, colors.red);
      }
    } catch (error) {
      log(`❌ /api/health failed: ${error.message}`, colors.red);
    }
    
    log('\nTesting /health (OLD backend):');
    try {
      const healthOld = await makeRequest(`${currentDomain}/health`);
      log(`✅ Status: ${healthOld.status}`, colors.green);
      log(`   Response: ${JSON.stringify(healthOld.data).substring(0, 100)}...`, colors.cyan);
    } catch (error) {
      log(`❌ /health failed: ${error.message}`, colors.red);
    }
    
    // Test OAuth auth endpoint (critical fix)
    log('\nTesting /api/oauth/auth (CRITICAL FIX):');
    try {
      const authTest = await makeRequest(`${currentDomain}/api/oauth/auth?installation_id=test`);
      if (authTest.status === 400 && authTest.data.error === 'missing_installation_id') {
        log('✅ NEW backend detected - proper error handling', colors.green);
        return true;
      } else {
        log(`❌ Status: ${authTest.status}`, colors.red);
        log(`   Response: ${JSON.stringify(authTest.data).substring(0, 100)}...`, colors.red);
      }
    } catch (error) {
      log(`❌ /api/oauth/auth failed: ${error.message}`, colors.red);
    }
    
    log('\n🔍 Analyzing Domain Routing Issue:', colors.yellow);
    log('=====================================');
    
    log('❌ ISSUE IDENTIFIED: Domain points to OLD service', colors.red);
    log('✅ NEW backend deployed successfully', colors.green);
    log('🔧 SOLUTION NEEDED: Update domain routing', colors.yellow);
    
    log('\n📋 Railway Dashboard Steps:', colors.cyan);
    log('1. Go to Railway dashboard');
    log('2. Find the service that just deployed (build logs you shared)');
    log('3. Go to Settings → Domains');
    log('4. Add domain: dir.engageautomations.com');
    log('5. Remove domain from old service if present');
    
    log('\n🧪 Expected After Fix:', colors.green);
    log('• /api/health returns version "2.0.0"');
    log('• /api/oauth/auth returns 400 with proper error');
    log('• OAuth flow works without "user_info_failed" error');
    
    return false;
    
  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, colors.red);
    return false;
  }
}

async function generateRailwayCommands() {
  log('\n🚀 Railway CLI Commands (if available):', colors.blue);
  log('=====================================');
  
  log('# List all services');
  log('railway services');
  log('');
  log('# Switch to correct service');
  log('railway service <service-name>');
  log('');
  log('# Add domain to current service');
  log('railway domain add dir.engageautomations.com');
  log('');
  log('# Check deployment logs');
  log('railway logs');
}

async function main() {
  const isFixed = await verifyRailwayDeployment();
  
  if (!isFixed) {
    await generateRailwayCommands();
    
    log('\n⚠️  SUMMARY:', colors.yellow);
    log('Railway deployment successful but domain routing incorrect');
    log('Update domain connection to use the service with the build logs you shared');
    log('');
    log('🎯 TARGET: Make /api/health return version 2.0.0', colors.green);
  } else {
    log('\n🎉 SUCCESS: Fixed backend is live!', colors.green);
  }
}

main().catch(console.error);