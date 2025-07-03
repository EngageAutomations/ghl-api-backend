/**
 * Deploy OAuth Backend with Correct Credentials
 * Uses the correct client ID and secret from Client Key file
 */

const fs = require('fs');

async function deployCorrectCredentials() {
  const { Octokit } = await import("@octokit/rest");
  
  console.log('🔑 DEPLOYING CORRECT OAUTH CREDENTIALS');
  console.log('Client ID: 68474924a586bce22a6e64f7-mbpkmyu4');
  console.log('Client Secret: b5a7a120-7df7-4d23-8796-4863cbd08f94');
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
    
    console.log('1. Reading OAuth backend with correct credentials...');
    const fixedBackend = fs.readFileSync('fix-oauth-credentials.js', 'utf8');
    
    console.log('2. Deploying correct credentials...');
    
    // Update index.js with correct credentials
    await updateFile(octokit, owner, repo, 'index.js', fixedBackend, 
      'Fix OAuth Credentials - Use Correct Client ID and Secret v8.5.6');
    
    console.log('✅ OAuth Backend with correct credentials deployed!');
    console.log('');
    console.log('🔑 CREDENTIAL DETAILS:');
    console.log('• Client ID: 68474924a586bce22a6e64f7-mbpkmyu4');
    console.log('• Client Secret: b5a7a120-7df7-4d23-8796-4863cbd08f94');
    console.log('• Redirect URI: https://dir.engageautomations.com/api/oauth/callback');
    console.log('• Should resolve "Invalid client credentials" error');
    console.log('');
    console.log('⏳ Railway will redeploy automatically...');
    console.log('OAuth installation should work correctly now with proper credentials');
    
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

deployCorrectCredentials().catch(console.error);