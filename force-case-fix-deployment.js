/**
 * Force Case-Sensitive Location Fix Deployment
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

async function forceCaseFixDeployment() {
  console.log('🎯 FORCING CASE-SENSITIVE LOCATION DEPLOYMENT');
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
    
    console.log('1. Reading case-sensitive fix...');
    const caseSensitiveBackend = fs.readFileSync('fix-location-case-sensitive.js', 'utf8');
    
    // Add deployment trigger for case fix
    const deploymentTrigger = `// CASE-SENSITIVE LOCATION FIX: ${new Date().toISOString()}\n// user_type: "Location" (capital L) for enum validation\n\n`;
    const triggeredBackend = deploymentTrigger + caseSensitiveBackend;
    
    console.log('2. Adding case-sensitive deployment trigger...');
    
    await updateFile(octokit, owner, repo, 'index.js', triggeredBackend, 
      'Force Case-Sensitive Location Fix - Capital L for enum validation v8.5.8');
    
    console.log('✅ Case-sensitive Location fix deployment triggered!');
    console.log('');
    console.log('🎯 CASE FIX DEPLOYMENT:');
    console.log('• user_type: "Location" (capital L) instead of "location"');
    console.log('• Should resolve 422 enum validation error');
    console.log('• Enables proper Location-level authentication');
    console.log('• Version: 8.5.8-location-case-fix');
    console.log('');
    console.log('⏳ Railway should redeploy within 2-3 minutes...');
    
  } catch (error) {
    console.error('❌ Case fix deployment failed:', error.message);
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

forceCaseFixDeployment().catch(console.error);