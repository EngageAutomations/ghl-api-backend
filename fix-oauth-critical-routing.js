/**
 * Fix OAuth Critical Routing Issues
 * Addresses API route ordering and scope configuration for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function testRouteOrdering() {
  log('\n🔧 Testing Critical Route Ordering Fix...', colors.cyan);
  
  try {
    // Test OAuth status endpoint specifically
    const response = await fetch('http://localhost:5000/api/oauth/status?installation_id=test', {
      headers: { 'Accept': 'application/json' }
    });
    
    const contentType = response.headers.get('content-type');
    log(`Response Status: ${response.status}`);
    log(`Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      log('✅ OAuth status endpoint now returns JSON', colors.green);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      log('❌ OAuth status endpoint still returns HTML', colors.red);
      const text = await response.text();
      log(`HTML Preview: ${text.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    log(`❌ Route testing failed: ${error.message}`, colors.red);
    return false;
  }
}

async function updateEnvironmentConfig() {
  log('\n🌍 Updating Environment Configuration...', colors.cyan);
  
  // Update OAuth scopes in the OAuth class
  try {
    const ghlOAuthPath = path.join(__dirname, 'server', 'ghl-oauth.ts');
    let ghlOAuthContent = fs.readFileSync(ghlOAuthPath, 'utf8');
    
    // Check current scope configuration
    const currentScopeMatch = ghlOAuthContent.match(/this\.scopes = \(process\.env\.GHL_SCOPES \|\| '([^']+)'\)/);
    
    if (currentScopeMatch) {
      const currentScopes = currentScopeMatch[1];
      log(`Current scopes: ${currentScopes}`);
      
      // Ensure users.read is included
      if (!currentScopes.includes('users.read')) {
        const updatedScopes = `users.read ${currentScopes}`;
        ghlOAuthContent = ghlOAuthContent.replace(
          /this\.scopes = \(process\.env\.GHL_SCOPES \|\| '[^']+'\)/,
          `this.scopes = (process.env.GHL_SCOPES || '${updatedScopes}')`
        );
        
        fs.writeFileSync(ghlOAuthPath, ghlOAuthContent);
        log('✅ Updated OAuth scopes to include users.read', colors.green);
        return true;
      } else {
        log('✅ OAuth scopes already include users.read', colors.green);
        return true;
      }
    } else {
      log('❌ Could not find scope configuration in OAuth file', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Environment configuration update failed: ${error.message}`, colors.red);
    return false;
  }
}

async function validateGoHighLevelEndpoint() {
  log('\n🔗 Validating GoHighLevel Endpoint Configuration...', colors.cyan);
  
  try {
    const ghlOAuthPath = path.join(__dirname, 'server', 'ghl-oauth.ts');
    const ghlOAuthContent = fs.readFileSync(ghlOAuthPath, 'utf8');
    
    // Check if using correct v1/users/me endpoint
    if (ghlOAuthContent.includes('/v1/users/me')) {
      log('✅ Correct GoHighLevel API endpoint configured', colors.green);
      return true;
    } else {
      log('❌ GoHighLevel API endpoint needs updating to /v1/users/me', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Endpoint validation failed: ${error.message}`, colors.red);
    return false;
  }
}

async function createTestScript() {
  log('\n📝 Creating Production Readiness Test Script...', colors.cyan);
  
  const testScript = `#!/bin/bash
# OAuth Production Readiness Test Script

echo "🧪 OAuth Production Readiness Testing"
echo "======================================"

# Test 1: OAuth Status Endpoint JSON Response
echo "1. Testing OAuth Status JSON Response..."
RESPONSE=$(curl -s -H "Accept: application/json" "http://localhost:5000/api/oauth/status?installation_id=test")
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "✅ OAuth status returns JSON"
else
  echo "❌ OAuth status returns HTML"
fi

# Test 2: Health Check Endpoint
echo "2. Testing Health Check Endpoint..."
HEALTH=$(curl -s "http://localhost:5000/api/health")
if echo "$HEALTH" | grep -q '"status"'; then
  echo "✅ Health check working"
else
  echo "❌ Health check failed"
fi

# Test 3: API Route Protection
echo "3. Testing API Route Protection..."
API_404=$(curl -s "http://localhost:5000/api/nonexistent")
if echo "$API_404" | grep -q '"error"'; then
  echo "✅ API 404 handling working"
else
  echo "❌ API 404 handling broken"
fi

echo "======================================"
echo "Test Complete"
`;

  fs.writeFileSync('production-readiness-test.sh', testScript);
  fs.chmodSync('production-readiness-test.sh', '755');
  log('✅ Created production readiness test script', colors.green);
}

async function generateDeploymentChecklist() {
  log('\n📋 Generating Deployment Checklist...', colors.cyan);
  
  const checklist = `# OAuth Fix Deployment Checklist

## Pre-Deployment Verification
- [ ] OAuth scopes include users.read
- [ ] API routes return JSON (not HTML)
- [ ] GoHighLevel endpoint uses /v1/users/me
- [ ] Token refresh logic implemented
- [ ] Error handling returns structured JSON

## GoHighLevel App Configuration
- [ ] Update app scopes to include users.read
- [ ] Verify redirect URIs for production domains
- [ ] Test marketplace installation flow
- [ ] Confirm scope permissions in developer console

## Environment Variables (Railway/Production)
\`\`\`
GHL_SCOPES=users.read products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write
GHL_CLIENT_ID=[your_client_id]
GHL_CLIENT_SECRET=[your_client_secret]
GHL_REDIRECT_URI=[production_callback_url]
\`\`\`

## Testing Commands
\`\`\`bash
# Test OAuth status endpoint
curl -H "Accept: application/json" "https://your-domain.com/api/oauth/status?installation_id=test"

# Test health check
curl "https://your-domain.com/api/health"

# Test direct GoHighLevel API (with real token)
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     -H "Version: 2021-07-28" \\
     "https://services.leadconnectorhq.com/v1/users/me"
\`\`\`

## Post-Deployment Verification
- [ ] OAuth flow completes successfully
- [ ] User info retrieval works
- [ ] Token refresh triggers automatically
- [ ] Error messages are user-friendly
- [ ] Multi-user isolation working
- [ ] Logging captures OAuth events

## Rollback Plan
If deployment fails:
1. Revert server routing changes
2. Restore previous OAuth scope configuration
3. Monitor error rates and user reports
4. Apply fixes and redeploy
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  log('✅ Created deployment checklist', colors.green);
}

async function main() {
  try {
    log('🚀 OAuth Critical Routing Fix', colors.cyan);
    log('Addressing production deployment blockers...', colors.blue);
    
    const results = {
      routeOrdering: await testRouteOrdering(),
      environmentConfig: await updateEnvironmentConfig(),
      endpointValidation: await validateGoHighLevelEndpoint()
    };
    
    await createTestScript();
    await generateDeploymentChecklist();
    
    const passedChecks = Object.values(results).filter(Boolean).length;
    const totalChecks = Object.keys(results).length;
    const successRate = Math.round((passedChecks / totalChecks) * 100);
    
    log(`\n📊 Fix Success Rate: ${successRate}% (${passedChecks}/${totalChecks})`, 
        successRate >= 80 ? colors.green : colors.yellow);
    
    if (results.routeOrdering) {
      log('✅ Critical routing issue resolved', colors.green);
    } else {
      log('❌ Routing issue persists - may need server restart', colors.red);
    }
    
    if (results.environmentConfig && results.endpointValidation) {
      log('✅ OAuth configuration validated', colors.green);
    }
    
    log('\n🎯 Next Steps:', colors.blue);
    log('1. Run production-readiness-test.sh script');
    log('2. Update GoHighLevel app scopes in developer console');
    log('3. Deploy to Railway with updated environment variables');
    log('4. Test end-to-end OAuth flow in production');
    
    return results;
    
  } catch (error) {
    log('❌ Critical fix failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();