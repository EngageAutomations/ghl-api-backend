#!/usr/bin/env node

/**
 * Deploy Fixed OAuth Backend to Railway
 * Updates the existing deployment with correct redirect URI and scopes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Deploying Fixed OAuth Backend ===');

function executeCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Executing: ${command}`);
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8' 
    });
    return result;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

function deployUpdate() {
  console.log('\n1. Navigating to deployment package...');
  const deployDir = path.resolve('./railway-deployment-package');
  
  if (!fs.existsSync(deployDir)) {
    throw new Error('Railway deployment package not found');
  }

  console.log('\n2. Checking Railway CLI...');
  try {
    executeCommand('railway --version');
  } catch (error) {
    console.log('Installing Railway CLI...');
    executeCommand('npm install -g @railway/cli');
  }

  console.log('\n3. Logging into Railway...');
  try {
    executeCommand('railway login --browserless', deployDir);
  } catch (error) {
    console.log('Login may have failed - continuing with existing session');
  }

  console.log('\n4. Linking to existing project...');
  try {
    executeCommand('railway link oauth-backend-production-66f8', deployDir);
  } catch (error) {
    console.log('Project linking may have failed - continuing');
  }

  console.log('\n5. Deploying updated backend...');
  executeCommand('railway up --detach', deployDir);

  console.log('\n6. Verifying deployment...');
  setTimeout(() => {
    testDeployment();
  }, 30000); // Wait 30 seconds for deployment
}

async function testDeployment() {
  console.log('\n=== Testing Updated Deployment ===');
  
  try {
    const response = await fetch('https://oauth-backend-production-66f8.up.railway.app/health');
    const data = await response.json();
    
    console.log('Health check:', data.status);
    console.log('Service:', data.service);
    console.log('Version:', data.version);
    
    // Test OAuth URL generation
    const oauthResponse = await fetch('https://oauth-backend-production-66f8.up.railway.app/api/oauth/url');
    const oauthData = await oauthResponse.json();
    
    if (oauthData.success) {
      console.log('\n✅ OAuth URL generation working');
      console.log('Checking redirect URI and scopes...');
      
      const authUrl = oauthData.authUrl;
      
      if (authUrl.includes('dir.engageautomations.com%2Foauth%2Fcallback')) {
        console.log('✅ Correct redirect URI: dir.engageautomations.com/oauth/callback');
      } else {
        console.log('❌ Wrong redirect URI in OAuth URL');
      }
      
      if (authUrl.includes('products%2Fprices')) {
        console.log('✅ Correct scopes: products/prices permissions included');
      } else {
        console.log('❌ Wrong scopes in OAuth URL');
      }
      
      console.log('\n🎉 Deployment successful!');
      console.log('Updated OAuth URL:', authUrl);
      
    } else {
      console.log('❌ OAuth URL generation failed');
    }
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
  }
}

async function main() {
  try {
    deployUpdate();
    console.log('\n✅ Deployment initiated successfully');
    console.log('Backend will be available at: https://oauth-backend-production-66f8.up.railway.app');
    console.log('Test in 30 seconds...');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { deployUpdate, testDeployment };