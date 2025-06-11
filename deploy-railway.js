#!/usr/bin/env node

/**
 * Railway Deployment Script for OAuth Backend
 * Automates the deployment of the OAuth backend to Railway
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAILWAY_BACKEND_DIR = path.join(__dirname, 'railway-backend');
const TEMP_REPO_DIR = path.join(__dirname, 'temp-railway-repo');

// Environment variables for Railway deployment
const ENV_VARS = {
  GHL_CLIENT_ID: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
  GHL_CLIENT_SECRET: process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  GHL_REDIRECT_URI: 'https://dir.engageautomations.com/api/oauth/callback',
  NODE_ENV: 'production'
};

console.log('🚀 Starting Railway deployment process...\n');

function executeCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Executing: ${command}`);
    const result = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return result.trim();
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(`Error: ${error.message}`);
    if (error.stdout) console.error(`Stdout: ${error.stdout}`);
    if (error.stderr) console.error(`Stderr: ${error.stderr}`);
    return null;
  }
}

function createTempRepo() {
  console.log('📁 Creating temporary repository...');
  
  // Clean up any existing temp directory
  if (fs.existsSync(TEMP_REPO_DIR)) {
    fs.rmSync(TEMP_REPO_DIR, { recursive: true, force: true });
  }
  
  // Create new temp directory
  fs.mkdirSync(TEMP_REPO_DIR, { recursive: true });
  
  // Initialize git repository
  executeCommand('git init', TEMP_REPO_DIR);
  executeCommand('git config user.email "deploy@engageautomations.com"', TEMP_REPO_DIR);
  executeCommand('git config user.name "Railway Deployment"', TEMP_REPO_DIR);
  
  console.log('✅ Temporary repository created');
}

function copyBackendFiles() {
  console.log('📋 Copying backend files...');
  
  const filesToCopy = [
    'server/index.ts',
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'README.md'
  ];
  
  filesToCopy.forEach(file => {
    const srcPath = path.join(RAILWAY_BACKEND_DIR, file);
    const destPath = path.join(TEMP_REPO_DIR, file);
    
    if (fs.existsSync(srcPath)) {
      // Create directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ Copied ${file}`);
    } else {
      console.log(`  ⚠ File not found: ${file}`);
    }
  });
  
  console.log('✅ Backend files copied');
}

function createDeploymentFiles() {
  console.log('⚙️ Creating deployment configuration...');
  
  // Create railway.json for Railway-specific configuration
  const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS"
    },
    "deploy": {
      "startCommand": "npm start",
      "healthcheckPath": "/health"
    }
  };
  
  fs.writeFileSync(
    path.join(TEMP_REPO_DIR, 'railway.json'), 
    JSON.stringify(railwayConfig, null, 2)
  );
  
  // Create Dockerfile as backup deployment method
  const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]`;

  fs.writeFileSync(path.join(TEMP_REPO_DIR, 'Dockerfile'), dockerfile);
  
  // Create .env.example for documentation
  const envExample = Object.keys(ENV_VARS)
    .map(key => `${key}=your_value_here`)
    .join('\n');
  
  fs.writeFileSync(path.join(TEMP_REPO_DIR, '.env.example'), envExample);
  
  console.log('✅ Deployment configuration created');
}

function commitFiles() {
  console.log('📤 Committing files to repository...');
  
  executeCommand('git add .', TEMP_REPO_DIR);
  executeCommand('git commit -m "Initial OAuth backend deployment"', TEMP_REPO_DIR);
  
  console.log('✅ Files committed');
}

function deployToRailway() {
  console.log('🚂 Deploying to Railway...');
  
  // Check if Railway CLI is installed
  const railwayVersion = executeCommand('railway --version');
  if (!railwayVersion) {
    console.log('Installing Railway CLI...');
    executeCommand('npm install -g @railway/cli');
  }
  
  // Login to Railway (this will open browser for authentication)
  console.log('Please authenticate with Railway in your browser...');
  executeCommand('railway login', TEMP_REPO_DIR);
  
  // Create new Railway project
  console.log('Creating Railway project...');
  executeCommand('railway project new oauth-backend', TEMP_REPO_DIR);
  
  // Set environment variables
  console.log('Setting environment variables...');
  Object.entries(ENV_VARS).forEach(([key, value]) => {
    executeCommand(`railway variables set ${key}="${value}"`, TEMP_REPO_DIR);
  });
  
  // Deploy the application
  console.log('Deploying application...');
  const deployResult = executeCommand('railway up --detach', TEMP_REPO_DIR);
  
  if (deployResult) {
    console.log('✅ Deployment successful!');
    
    // Get the deployment URL
    const domain = executeCommand('railway domain', TEMP_REPO_DIR);
    if (domain) {
      console.log(`🌐 Application URL: ${domain}`);
      
      // Test the deployment
      setTimeout(() => {
        testDeployment(domain);
      }, 30000); // Wait 30 seconds for deployment to be ready
    }
  }
}

function testDeployment(url) {
  console.log('🧪 Testing deployment...');
  
  try {
    const response = executeCommand(`curl -s "${url}/health"`);
    if (response && response.includes('OAuth Backend')) {
      console.log('✅ Health check passed');
      console.log('✅ OAuth backend deployment complete!');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Update your GoHighLevel redirect URI to use the Railway URL');
      console.log('2. Test the OAuth flow with your GoHighLevel app');
      console.log('3. Monitor Railway logs for any issues');
      
    } else {
      console.log('⚠ Health check failed - deployment may still be starting');
    }
  } catch (error) {
    console.log('⚠ Could not test deployment automatically');
  }
}

function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  if (fs.existsSync(TEMP_REPO_DIR)) {
    fs.rmSync(TEMP_REPO_DIR, { recursive: true, force: true });
  }
  
  console.log('✅ Cleanup complete');
}

// Main deployment process
async function main() {
  try {
    createTempRepo();
    copyBackendFiles();
    createDeploymentFiles();
    commitFiles();
    deployToRailway();
    
    console.log('\n🎉 Railway deployment process completed!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    cleanup();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Deployment cancelled by user');
  cleanup();
  process.exit(0);
});

// Run the deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, ENV_VARS };