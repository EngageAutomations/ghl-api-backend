/**
 * Force Railway Deployment - Trigger rebuild with minimal change
 */

import { Octokit } from '@octokit/rest';

async function forceRailwayDeployment() {
  console.log('🚀 FORCING RAILWAY DEPLOYMENT');
  console.log('='.repeat(40));
  
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found');
      return;
    }

    const octokit = new Octokit({ auth: githubToken });
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    
    // Get current file content
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    const currentContent = Buffer.from(currentFile.content, 'base64').toString();
    
    // Add a timestamp comment to force rebuild
    const timestamp = new Date().toISOString();
    const forceContent = currentContent.replace(
      '// Version: 8.9.0-location-only',
      `// Version: 8.9.0-location-only\n// Force deploy: ${timestamp}`
    );
    
    console.log('1. Adding timestamp to force Railway rebuild...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: `Force Railway deployment - ${timestamp}`,
      content: Buffer.from(forceContent).toString('base64'),
      sha: currentFile.sha
    });
    
    console.log('✅ Minimal change committed to trigger Railway deployment');
    console.log('⏳ Railway should redeploy within 2-3 minutes...');
    console.log('');
    console.log('📄 What will happen:');
    console.log('• GitHub webhook triggers Railway rebuild');
    console.log('• Railway deploys Location-only OAuth backend v8.9.0');
    console.log('• Backend includes proper GoHighLevel scopes for media upload');
    console.log('• Fresh OAuth installation should generate Location-level tokens');
    
  } catch (error) {
    console.error('❌ Force deployment failed:', error.message);
  }
}

forceRailwayDeployment().catch(console.error);