/**
 * Deploy Stable OAuth Backend
 * Fixes crash issues with comprehensive error handling
 */

const fs = require('fs');

async function deployStableOAuth() {
  const { Octokit } = await import("@octokit/rest");
  
  console.log('🔧 DEPLOYING STABLE OAUTH BACKEND');
  console.log('Fixing crash issues with enhanced error handling');
  console.log('='.repeat(50));
  
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found');
      return;
    }

    const octokit = new Octokit({ auth: githubToken });
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    
    console.log('1. Reading stable OAuth backend...');
    const stableBackend = fs.readFileSync('stable-oauth-backend.js', 'utf8');
    
    console.log('2. Deploying crash-resistant version...');
    
    // Update index.js with stable version
    await updateFile(octokit, owner, repo, 'index.js', stableBackend, 
      'Deploy Stable OAuth Backend - Crash Protection v8.5.4');
    
    console.log('✅ Stable OAuth Backend deployed successfully!');
    console.log('');
    console.log('🛡️ CRASH PROTECTION FEATURES:');
    console.log('• Comprehensive error handling for all endpoints');
    console.log('• Process-level exception catching');
    console.log('• Request timeout protection');
    console.log('• Memory usage monitoring');
    console.log('• Safe token refresh scheduling');
    console.log('');
    console.log('⏳ Railway will redeploy automatically...');
    console.log('Backend should be stable and crash-resistant now');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

async function updateFile(octokit, owner, repo, path, content, message) {
  try {
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
    }
    
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

deployStableOAuth().catch(console.error);