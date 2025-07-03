/**
 * Deploy OAuth Backend with Case-Sensitive Location Fix
 * Uses user_type: "Location" (capital L) to fix enum validation
 */

const fs = require('fs');

async function deployCaseSensitiveLocation() {
  const { Octokit } = await import("@octokit/rest");
  
  console.log('🎯 DEPLOYING CASE-SENSITIVE LOCATION FIX');
  console.log('Using user_type: "Location" (capital L) to fix enum validation');
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
    
    console.log('1. Reading OAuth backend with case-sensitive Location fix...');
    const caseSensitiveBackend = fs.readFileSync('fix-location-case-sensitive.js', 'utf8');
    
    console.log('2. Deploying case-sensitive Location authentication...');
    
    // Update index.js with case-sensitive Location fix
    await updateFile(octokit, owner, repo, 'index.js', caseSensitiveBackend, 
      'Fix Location Case Sensitivity - Use Capital L for Location Auth v8.5.8');
    
    console.log('✅ OAuth Backend with case-sensitive Location fix deployed!');
    console.log('');
    console.log('🎯 CASE-SENSITIVE FIX DETAILS:');
    console.log('• Changed user_type: "location" → "Location" (capital L)');
    console.log('• Should resolve 422 "user_type must be a valid enum value" error');
    console.log('• Enables Location-level authentication for media upload');
    console.log('• Maintains case-sensitive enum on token refresh');
    console.log('• Version: 8.5.8-location-case-fix');
    console.log('');
    console.log('⏳ Railway will redeploy automatically...');
    console.log('OAuth installation should now work with Location-level token');
    
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

deployCaseSensitiveLocation().catch(console.error);