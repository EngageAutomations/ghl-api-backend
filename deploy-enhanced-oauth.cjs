/**
 * Deploy Enhanced OAuth Backend
 * Updates the OAuth repository with location-level authentication fix
 */

const fs = require('fs');

async function deployEnhancedOAuth() {
  const { Octokit } = await import("@octokit/rest");
  console.log('🚀 DEPLOYING ENHANCED OAUTH BACKEND');
  console.log('Repository: oauth-backend (NOT api-backend)');
  console.log('='.repeat(50));
  
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found');
      return;
    }

    const octokit = new Octokit({ auth: githubToken });
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';  // Specifically the OAuth repo, not API repo
    
    console.log('1. Reading enhanced OAuth backend...');
    const enhancedBackend = fs.readFileSync('minimal-oauth-backend.js', 'utf8');
    
    console.log('2. Preparing deployment files...');
    
    // Package.json for OAuth backend
    const packageJson = {
      "name": "oauth-backend",
      "version": "8.5.2-location-working",
      "description": "Enhanced OAuth Backend with Location-Level Authentication",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "axios": "^1.4.0"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };

    // Railway.toml for deployment
    const railwayToml = `[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10`;

    console.log('3. Updating OAuth repository files...');
    
    // Update index.js with enhanced OAuth backend
    await updateFile(octokit, owner, repo, 'index.js', enhancedBackend, 
      'Deploy Enhanced OAuth Backend - Location-Level Authentication Fix');
    
    // Update package.json
    await updateFile(octokit, owner, repo, 'package.json', JSON.stringify(packageJson, null, 2),
      'Update package.json for enhanced OAuth backend');
    
    // Update railway.toml
    await updateFile(octokit, owner, repo, 'railway.toml', railwayToml,
      'Update Railway configuration for enhanced deployment');
    
    console.log('✅ OAuth Backend deployed successfully!');
    console.log('');
    console.log('🔧 DEPLOYMENT SUMMARY:');
    console.log('Repository: https://github.com/EngageAutomations/oauth-backend');
    console.log('Version: 8.5.2-location-working');
    console.log('Key Fix: Location-level token authentication (user_type: "location")');
    console.log('Backend URL: https://dir.engageautomations.com');
    console.log('');
    console.log('⏳ Railway will auto-deploy in 2-3 minutes...');
    console.log('');
    console.log('🚀 READY FOR TESTING:');
    console.log('Installation URL: https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    console.log('');
    console.log('✅ FIXES IMPLEMENTED:');
    console.log('• Enhanced token exchange with location-level access');
    console.log('• Proper OAuth callback error handling');
    console.log('• Automatic token refresh scheduling');
    console.log('• Complete installations endpoint');
    console.log('• Ready for media upload with proper IAM scope');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

async function updateFile(octokit, owner, repo, path, content, message) {
  try {
    // Get current file SHA if it exists
    let sha;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
      // File doesn't exist, no SHA needed
    }
    
    // Update or create file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha
    });
    
    console.log(`✅ Updated ${path}`);
    
  } catch (error) {
    console.error(`❌ Failed to update ${path}:`, error.message);
    throw error;
  }
}

deployEnhancedOAuth().catch(console.error);