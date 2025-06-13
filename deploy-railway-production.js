#!/usr/bin/env node

/**
 * Production Railway Deployment Script
 * Deploys the complete OAuth backend with database functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function executeCommand(command, cwd = process.cwd()) {
  try {
    log(`Executing: ${command}`, colors.blue);
    const result = execSync(command, { cwd, stdio: 'inherit' });
    return result;
  } catch (error) {
    log(`Command failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function deployProductionBackend() {
  log('=== DEPLOYING PRODUCTION OAUTH BACKEND ===', colors.blue);
  
  try {
    // 1. Check if Railway CLI is available
    log('\n1. Checking Railway CLI...', colors.yellow);
    try {
      executeCommand('railway --version');
      log('✅ Railway CLI is available', colors.green);
    } catch (error) {
      log('❌ Railway CLI not found. Please install it first:', colors.red);
      log('npm install -g @railway/cli', colors.yellow);
      return;
    }

    // 2. Navigate to railway-backend directory
    const railwayDir = path.join(process.cwd(), 'railway-backend');
    if (!fs.existsSync(railwayDir)) {
      log('❌ Railway backend directory not found', colors.red);
      return;
    }

    log('\n2. Deploying to Railway...', colors.yellow);
    
    // 3. Deploy the backend
    executeCommand('railway up', railwayDir);
    
    log('✅ Railway deployment completed', colors.green);

    // 4. Get the Railway URL
    log('\n3. Getting Railway deployment URL...', colors.yellow);
    try {
      const url = execSync('railway status --json', { cwd: railwayDir, encoding: 'utf8' });
      const statusData = JSON.parse(url);
      const deploymentUrl = statusData.deployments?.[0]?.url;
      
      if (deploymentUrl) {
        log(`✅ Railway URL: ${deploymentUrl}`, colors.green);
        
        // 5. Test the deployment
        log('\n4. Testing deployment...', colors.yellow);
        await testDeployment(deploymentUrl);
      } else {
        log('⚠️ Could not retrieve deployment URL', colors.yellow);
      }
    } catch (error) {
      log('⚠️ Could not get deployment status', colors.yellow);
    }

    // 6. Next steps
    log('\n=== NEXT STEPS ===', colors.blue);
    log('1. Point your domain (dir.engageautomations.com) to your Railway app', colors.yellow);
    log('2. Update GoHighLevel redirect URI to: https://dir.engageautomations.com/api/oauth/callback', colors.yellow);
    log('3. Set environment variables in Railway dashboard:', colors.yellow);
    log('   - GHL_CLIENT_ID', colors.yellow);
    log('   - GHL_CLIENT_SECRET', colors.yellow);
    log('   - GHL_REDIRECT_URI', colors.yellow);
    log('   - DATABASE_URL (if using external DB)', colors.yellow);
    
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, colors.red);
  }
}

async function testDeployment(url) {
  try {
    
    // Test health endpoint
    log('Testing health endpoint...', colors.blue);
    const healthResponse = await fetch(`${url}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      log(`✅ Health check passed: ${healthData.service}`, colors.green);
    } else {
      log('⚠️ Health check failed', colors.yellow);
    }

    // Test OAuth URL generation
    log('Testing OAuth URL generation...', colors.blue);
    const oauthResponse = await fetch(`${url}/api/oauth/url`);
    
    if (oauthResponse.ok) {
      const oauthData = await oauthResponse.json();
      log('✅ OAuth URL generation working', colors.green);
      log(`OAuth URL: ${oauthData.authUrl.substring(0, 80)}...`, colors.blue);
    } else {
      log('⚠️ OAuth URL generation failed', colors.yellow);
    }

    // Test debug endpoint
    log('Testing debug installations endpoint...', colors.blue);
    const debugResponse = await fetch(`${url}/api/debug/installations`);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      log(`✅ Debug endpoint working - ${debugData.count} installations found`, colors.green);
    } else {
      log('⚠️ Debug endpoint failed', colors.yellow);
    }

  } catch (error) {
    log(`⚠️ Test failed: ${error.message}`, colors.yellow);
  }
}

// Run the deployment
deployProductionBackend();