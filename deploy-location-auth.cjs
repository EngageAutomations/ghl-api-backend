/**
 * Deploy OAuth Backend with Location-Level Authentication
 * Uses user_type: "location" to enable media upload access
 */

const fs = require('fs');

async function deployLocationAuth() {
  const { Octokit } = await import("@octokit/rest");
  
  console.log('🎯 DEPLOYING LOCATION-LEVEL AUTHENTICATION');
  console.log('Adding user_type: "location" for media upload access');
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
    
    console.log('1. Reading OAuth backend with location-level auth...');
    const locationAuthBackend = fs.readFileSync('fix-location-auth-class.js', 'utf8');
    
    console.log('2. Deploying location-level authentication...');
    
    // Update index.js with location-level auth
    await updateFile(octokit, owner, repo, 'index.js', locationAuthBackend, 
      'Fix Location Auth Class - Enable Location-Level Authentication v8.5.7');
    
    console.log('✅ OAuth Backend with location-level authentication deployed!');
    console.log('');
    console.log('🎯 LOCATION AUTH DETAILS:');
    console.log('• user_type: "location" added to token exchange');
    console.log('• Auth Class: Location (instead of Company)');
    console.log('• Media Upload: Should now work with location-level token');
    console.log('• Product Creation: Still works as before');
    console.log('• Token Refresh: Maintains location-level auth');
    console.log('');
    console.log('⏳ Railway will redeploy automatically...');
    console.log('Fresh OAuth installation required to get location-level token');
    
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

deployLocationAuth().catch(console.error);