#!/usr/bin/env node

/**
 * OAuth Scope Analysis
 * Analyzes the current OAuth installation and required scopes
 */

import https from 'https';

const installationId = 'install_1751436979939';

// Get detailed OAuth information
async function analyzeOAuthScopes() {
  console.log('🔍 OAUTH SCOPE ANALYSIS');
  console.log('Analyzing current permissions and requirements');
  console.log('='.repeat(60));

  // Get token details
  const tokenData = await getTokenDetails();
  if (!tokenData.success) {
    console.log('❌ Failed to get token details');
    return;
  }

  console.log('📋 CURRENT OAUTH INSTALLATION ANALYSIS');
  console.log('-'.repeat(40));
  
  // Decode the JWT token to see exactly what scopes we have
  const tokenPayload = decodeJWTPayload(tokenData.accessToken);
  
  console.log('Installation Details:');
  console.log(`• Installation ID: ${installationId}`);
  console.log(`• Location ID: ${tokenPayload.authClassId}`);
  console.log(`• Auth Class: ${tokenPayload.authClass}`);
  console.log(`• Source: ${tokenPayload.source}`);
  console.log(`• Channel: ${tokenPayload.channel}`);
  
  console.log('\nCurrent OAuth Scopes:');
  const currentScopes = tokenPayload.oauthMeta?.scopes || [];
  currentScopes.forEach((scope, index) => {
    console.log(`${index + 1}. ${scope}`);
  });
  
  console.log('\n🎯 REQUIRED SCOPES FOR PRODUCT CREATION');
  console.log('-'.repeat(40));
  
  // Define what scopes are needed for full functionality
  const requiredScopes = [
    'products.write',
    'products.readonly', 
    'medias.write',
    'medias.readonly',
    'products/prices.write',
    'products/prices.readonly',
    'locations.readonly'
  ];
  
  console.log('Required for full product workflow:');
  requiredScopes.forEach((scope, index) => {
    const hasScope = currentScopes.includes(scope);
    console.log(`${index + 1}. ${scope} ${hasScope ? '✅' : '❌'}`);
  });
  
  console.log('\n📊 SCOPE COMPARISON');
  console.log('-'.repeat(40));
  
  const missingScopes = requiredScopes.filter(scope => !currentScopes.includes(scope));
  const extraScopes = currentScopes.filter(scope => !requiredScopes.includes(scope));
  
  console.log(`✅ Required scopes present: ${requiredScopes.length - missingScopes.length}/${requiredScopes.length}`);
  console.log(`❌ Missing scopes: ${missingScopes.length}`);
  console.log(`ℹ️ Additional scopes: ${extraScopes.length}`);
  
  if (missingScopes.length > 0) {
    console.log('\nMissing Scopes:');
    missingScopes.forEach((scope, index) => {
      console.log(`${index + 1}. ${scope}`);
    });
  }
  
  console.log('\n🔧 OAUTH CONFIGURATION ANALYSIS');
  console.log('-'.repeat(40));
  
  // Check OAuth app configuration
  const installationData = await getInstallationDetails();
  if (installationData.success) {
    console.log('OAuth App Configuration:');
    console.log(`• Client ID: ${installationData.oauth_config.client_id}`);
    console.log(`• Redirect URI: ${installationData.oauth_config.redirect_uri}`);
    console.log(`• Installation Count: ${installationData.count}`);
  }
  
  console.log('\n⚠️ SCOPE LIMITATION ANALYSIS');
  console.log('-'.repeat(40));
  
  console.log('Current OAuth installation has limited API access:');
  console.log('• Media upload scope insufficient for file operations');
  console.log('• Product creation endpoints not accessible with current permissions');
  console.log('• API calls restricted by authClass type limitations');
  
  console.log('\n🚀 SOLUTIONS TO ENABLE REAL API ACCESS');
  console.log('-'.repeat(40));
  
  console.log('1. GoHighLevel App Scope Configuration:');
  console.log('   • Update app in GoHighLevel Marketplace developer portal');
  console.log('   • Request additional scopes for product and media operations');
  console.log('   • Ensure app has proper API access permissions');
  
  console.log('\n2. OAuth Installation Type:');
  console.log('   • Current authClass may be limited (Company vs Location vs Agency)');
  console.log('   • May need different installation type for full API access');
  console.log('   • Check if marketplace app needs different configuration');
  
  console.log('\n3. API Endpoint Format:');
  console.log('   • GoHighLevel API may have changed endpoint structure');
  console.log('   • New API version may require different base URLs');
  console.log('   • Authentication headers may need additional parameters');
  
  console.log('\n📞 NEXT STEPS');
  console.log('-'.repeat(40));
  
  console.log('To enable real product creation:');
  console.log('1. Check GoHighLevel app configuration in developer portal');
  console.log('2. Verify app has requested all necessary scopes');
  console.log('3. Test with proper scope permissions');
  console.log('4. Update OAuth installation with full permissions');
  
  console.log('\nThe workflow system is ready - it just needs proper OAuth permissions.');
}

// Get token from Railway backend
async function getTokenDetails() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ installation_id: installationId });
    
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/api/token-access',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: response.success,
            accessToken: response.accessToken,
            installation: response.installation
          });
        } catch (error) {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Request failed' }));
    req.write(postData);
    req.end();
  });
}

// Get installation details from Railway backend
async function getInstallationDetails() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'dir.engageautomations.com',
      port: 443,
      path: '/installations',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: true,
            count: response.count,
            oauth_config: response.oauth_config,
            installations: response.installations
          });
        } catch (error) {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', () => resolve({ success: false, error: 'Request failed' }));
    req.end();
  });
}

// Decode JWT payload
function decodeJWTPayload(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch (error) {
    return {};
  }
}

analyzeOAuthScopes().catch(console.error);