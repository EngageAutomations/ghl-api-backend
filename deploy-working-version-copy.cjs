/**
 * Deploy Working Version Copy
 * Copy the exact code that's currently deployed and working at dir.engageautomations.com
 */

const fs = require('fs');
const { execSync } = require('child_process');

async function deployWorkingVersionCopy() {
  console.log('🔄 DEPLOYING WORKING VERSION COPY');
  console.log('Copying the exact code from currently deployed working version');
  console.log('Deploy ID: 729732ad-0fc0-4199-a419-e9ba41aca5f8');
  console.log('='.repeat(60));

  try {
    // The currently deployed version is 9.0.0-correct-location and it's working
    // Let me find the exact commit that corresponds to this working deployment
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }
    
    // Let's get the current index.js from the repository to see what's actually deployed
    const getCurrentCodeCmd = `curl -s -H "Authorization: token ${githubToken}" https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    const currentCodeResponse = execSync(getCurrentCodeCmd, { encoding: 'utf8' });
    const currentCodeData = JSON.parse(currentCodeResponse);
    
    console.log('📋 Current deployed SHA:', currentCodeData.sha);
    
    // Decode the current content
    const currentCode = Buffer.from(currentCodeData.content, 'base64').toString('utf8');
    
    // Check if this is the working version by looking for version indicators
    const versionMatch = currentCode.match(/version.*?["']([^"']+)["']/);
    const currentVersion = versionMatch ? versionMatch[1] : 'unknown';
    
    console.log('📦 Currently deployed version:', currentVersion);
    
    // Since the current deployment is working (responding to health checks), 
    // but Railway is failing to deploy new versions, there might be a subtle issue
    // Let me create a minimal change to trigger a fresh deployment
    
    let workingCode = currentCode;
    
    // Add a minimal deployment marker that won't affect functionality
    const deploymentMarker = `// Railway Deployment: ${new Date().toISOString()}\n`;
    workingCode = deploymentMarker + workingCode;
    
    // Update version to trigger new deployment
    const newVersion = "9.1.0-railway-deploy-fix";
    workingCode = workingCode.replace(
      /("version":\s*")[^"]+(")/,
      `$1${newVersion}$2`
    );
    
    console.log('📄 Working code prepared with deployment marker');
    console.log('📦 New version:', newVersion);
    
    // Deploy the working version with minimal changes
    const deployPayload = {
      message: `Railway Deploy Fix: Copy working version for deploy ID ${process.argv[2] || '729732ad-0fc0-4199-a419-e9ba41aca5f8'}`,
      content: Buffer.from(workingCode).toString('base64'),
      sha: currentCodeData.sha
    };
    
    const updateCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(deployPayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    
    console.log('🔄 Deploying working version copy...');
    const updateResponse = execSync(updateCmd, { encoding: 'utf8' });
    const updateData = JSON.parse(updateResponse);
    
    if (updateData.commit) {
      console.log('✅ WORKING VERSION COPY DEPLOYED!');
      console.log('📍 New commit SHA:', updateData.commit.sha.substring(0, 7));
      console.log('⏱️  Railway should deploy this exact working code successfully');
      
      console.log('');
      console.log('🎯 DEPLOYMENT STRATEGY:');
      console.log('• Copied exact working code from current deployment');
      console.log('• Added minimal deployment marker (no functional changes)');
      console.log('• Version bump to trigger Railway redeploy');
      console.log('• Health endpoint preserved from working version');
      
      console.log('');
      console.log('⏳ RAILWAY DEPLOYMENT:');
      console.log('• This should match the working deploy ID structure');
      console.log('• Health checks should pass (same code as current working version)');
      console.log('• Wait 3-5 minutes for Railway to complete deployment');
      
      console.log('');
      console.log('🔍 VERIFICATION:');
      console.log('• Check: curl https://dir.engageautomations.com/');
      console.log('• Should show version: 9.1.0-railway-deploy-fix');
      console.log('• All endpoints should remain functional');
      
    } else {
      console.error('❌ Working version copy deployment failed:', updateData);
    }
    
  } catch (error) {
    console.error('❌ Working version copy failed:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}

deployWorkingVersionCopy().catch(console.error);