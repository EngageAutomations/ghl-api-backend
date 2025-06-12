#!/usr/bin/env node

/**
 * Fixed Railway Deployment Script
 * Deploys the corrected OAuth backend that handles complete token exchange
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command, cwd = process.cwd()) {
  console.log(`\n🔧 Executing: ${command}`);
  try {
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    throw error;
  }
}

function createRailwayDeployment() {
  console.log('\n📦 Creating Railway deployment package...');
  
  // Create temporary deployment directory
  const deployDir = path.join(process.cwd(), 'railway-deploy-temp');
  
  if (fs.existsSync(deployDir)) {
    console.log('🧹 Cleaning existing deployment directory...');
    executeCommand(`rm -rf ${deployDir}`);
  }
  
  fs.mkdirSync(deployDir);
  
  // Copy Railway backend files
  console.log('📋 Copying backend files...');
  executeCommand(`cp -r railway-backend/* ${deployDir}/`);
  
  // Ensure package.json exists with correct dependencies
  const packageJson = {
    "name": "ghl-oauth-backend",
    "version": "1.0.0",
    "description": "GoHighLevel OAuth Backend for Railway",
    "main": "server/index.js",
    "scripts": {
      "start": "node server/index.js",
      "build": "tsc server/index.ts --outDir . --target es2018 --module commonjs --esModuleInterop --allowSyntheticDefaultImports",
      "deploy": "npm run build && npm start"
    },
    "dependencies": {
      "express": "^4.18.2",
      "axios": "^1.6.0",
      "cookie-parser": "^1.4.6",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1"
    },
    "engines": {
      "node": ">=18.0.0"
    }
  };
  
  fs.writeFileSync(
    path.join(deployDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Convert TypeScript to JavaScript for Railway deployment
  console.log('🔄 Converting TypeScript to JavaScript...');
  
  const tsContent = fs.readFileSync(path.join(deployDir, 'server/index.ts'), 'utf8');
  
  // Simple TS to JS conversion for deployment
  const jsContent = tsContent
    .replace(/import\s+(.+?)\s+from\s+['"](.+?)['"];?/g, 'const $1 = require(\'$2\');')
    .replace(/export\s+/g, '')
    .replace(/:\s*express\.Request/g, '')
    .replace(/:\s*express\.Response/g, '')
    .replace(/:\s*any/g, '')
    .replace(/:\s*string/g, '')
    .replace(/:\s*number/g, '');
  
  fs.writeFileSync(path.join(deployDir, 'server/index.js'), jsContent);
  
  return deployDir;
}

function deployToRailway(deployDir) {
  console.log('\n🚀 Deploying to Railway...');
  
  // Initialize git if needed
  const gitDir = path.join(deployDir, '.git');
  if (!fs.existsSync(gitDir)) {
    executeCommand('git init', deployDir);
    executeCommand('git remote add origin https://github.com/your-username/oauth-backend.git', deployDir);
  }
  
  // Stage all files
  executeCommand('git add .', deployDir);
  executeCommand('git commit -m "Deploy fixed OAuth backend with complete token exchange"', deployDir);
  
  // Deploy to Railway (assumes Railway CLI is configured)
  try {
    executeCommand('railway up', deployDir);
    console.log('✅ Railway deployment initiated successfully!');
  } catch (error) {
    console.log('⚠️  Railway CLI not available, manual deployment required');
    console.log(`📁 Deployment files ready in: ${deployDir}`);
    console.log('\nManual deployment steps:');
    console.log('1. Connect your Railway project to this repository');
    console.log('2. Push the code to trigger automatic deployment');
    console.log('3. Ensure environment variables are set in Railway dashboard');
  }
}

function testDeployment() {
  console.log('\n🧪 Testing deployment...');
  
  const testUrls = [
    'https://oauth-backend-production-68c5.up.railway.app/health',
    'https://oauth-backend-production-68c5.up.railway.app/api/oauth/url'
  ];
  
  testUrls.forEach(url => {
    try {
      executeCommand(`curl -s "${url}" | head -5`);
    } catch (error) {
      console.log(`⚠️  Could not test ${url} - may take a few minutes to deploy`);
    }
  });
}

async function main() {
  console.log('🎯 Railway OAuth Backend Deployment');
  console.log('=====================================');
  
  try {
    const deployDir = createRailwayDeployment();
    deployToRailway(deployDir);
    
    console.log('\n⏱️  Waiting for deployment to complete...');
    setTimeout(() => {
      testDeployment();
    }, 30000);
    
    console.log('\n✅ Deployment process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify Railway deployment at: https://oauth-backend-production-68c5.up.railway.app/health');
    console.log('2. Test OAuth URL generation: https://oauth-backend-production-68c5.up.railway.app/api/oauth/url');
    console.log('3. Update OAuth interface to use Railway backend');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}