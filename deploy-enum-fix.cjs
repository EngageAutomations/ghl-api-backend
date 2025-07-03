/**
 * Deploy OAuth Enum Fix
 * Removes invalid user_type parameter causing 422 error
 */

const fs = require('fs');

async function deployEnumFix() {
  const { Octokit } = await import("@octokit/rest");
  
  console.log('🔧 DEPLOYING OAUTH ENUM FIX');
  console.log('Removing invalid user_type parameter');
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
    
    console.log('1. Reading fixed OAuth backend...');
    const fixedBackend = fs.readFileSync('fix-oauth-enum-error.js', 'utf8');
    
    console.log('2. Deploying enum fix...');
    
    // Update index.js with fixed version
    await updateFile(octokit, owner, repo, 'index.js', fixedBackend, 
      'Fix OAuth Enum Error - Remove Invalid user_type Parameter v8.5.5');
    
    console.log('✅ OAuth Enum Fix deployed successfully!');
    console.log('');
    console.log('🔧 ENUM FIX DETAILS:');
    console.log('• Removed invalid user_type: "location" parameter');
    console.log('• Using standard OAuth token exchange');
    console.log('• Should resolve 422 "Unprocessable Entity" error');
    console.log('• Token exchange will now succeed');
    console.log('');
    console.log('⏳ Railway will redeploy automatically...');
    console.log('OAuth installation should work correctly now');
    
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

deployEnumFix().catch(console.error);