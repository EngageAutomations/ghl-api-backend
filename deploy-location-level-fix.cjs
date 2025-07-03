/**
 * Deploy Location-Level Authentication Fix to Railway
 * Push the OAuth backend fix to GitHub for automatic Railway deployment
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');

async function deployLocationLevelFix() {
  console.log('🚀 DEPLOYING LOCATION-LEVEL AUTHENTICATION FIX');
  console.log('Pushing OAuth backend fix to Railway via GitHub');
  console.log('='.repeat(60));
  
  try {
    // Initialize GitHub client
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    
    // Read the fixed OAuth backend
    const fixedBackendContent = fs.readFileSync('railway-backend/index.js', 'utf8');
    
    // Get current file SHA
    console.log('1. Getting current file information...');
    const currentFile = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    console.log(`✅ Current file SHA: ${currentFile.data.sha}`);
    
    // Update index.js with location-level fix
    console.log('2. Updating OAuth backend with location-level authentication...');
    
    const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'CRITICAL FIX: Use location-level authentication (user_type: location) for media upload access\n\n- Changed OAuth token exchange to explicitly request user_type: "location"\n- Added JWT verification to confirm authClass: "Location"\n- Enhanced logging for location-level authentication tracking\n- Updated token refresh to maintain location-level context\n- Added auth_level tracking to installation records\n\nFixes: Media upload 401 IAM error due to Company-level token restriction',
      content: Buffer.from(fixedBackendContent).toString('base64'),
      sha: currentFile.data.sha
    });
    
    console.log('✅ OAuth backend updated successfully');
    console.log(`   Commit SHA: ${updateResponse.data.commit.sha}`);
    console.log(`   Commit URL: ${updateResponse.data.commit.html_url}`);
    
    // Also update package.json version
    console.log('3. Updating package.json version...');
    
    const packageFile = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'package.json'
    });
    
    const packageContent = JSON.parse(
      Buffer.from(packageFile.data.content, 'base64').toString()
    );
    
    packageContent.version = '8.5.0-location-level-fix';
    packageContent.description = 'OAuth backend with location-level authentication for media upload access';
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'package.json',
      message: 'Update version to 8.5.0-location-level-fix',
      content: Buffer.from(JSON.stringify(packageContent, null, 2)).toString('base64'),
      sha: packageFile.data.sha
    });
    
    console.log('✅ Package.json version updated');
    
    console.log('');
    console.log('🎯 DEPLOYMENT SUMMARY:');
    console.log('✅ OAuth backend updated with location-level authentication');
    console.log('✅ Version bumped to 8.5.0-location-level-fix');
    console.log('✅ Railway will automatically deploy within 2-3 minutes');
    console.log('');
    console.log('🔧 KEY CHANGES DEPLOYED:');
    console.log('• user_type: "location" in OAuth token exchange');
    console.log('• JWT verification for authClass confirmation');
    console.log('• Enhanced logging for authentication tracking');
    console.log('• Location-level context maintained in token refresh');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Wait 2-3 minutes for Railway deployment');
    console.log('2. Perform fresh OAuth installation');
    console.log('3. Verify JWT shows authClass: "Location"');
    console.log('4. Test media upload with location-level token');
    console.log('');
    console.log('🌐 OAUTH BACKEND URL: https://dir.engageautomations.com');
    console.log('📊 HEALTH CHECK: https://dir.engageautomations.com/health');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.response && error.response.data) {
      console.error('   GitHub API Error:', error.response.data.message);
    }
  }
}

deployLocationLevelFix().catch(console.error);