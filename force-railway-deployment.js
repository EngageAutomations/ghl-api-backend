/**
 * Force Railway Deployment by Adding Deployment Trigger
 * This will force Railway to recognize the changes and redeploy
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

async function forceRailwayDeployment() {
  
  console.log('🚀 FORCING RAILWAY DEPLOYMENT');
  console.log('Adding deployment trigger to force rebuild');
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
    
    console.log('1. Reading current OAuth backend...');
    const currentBackend = fs.readFileSync('fix-oauth-credentials.js', 'utf8');
    
    // Add deployment trigger comment
    const deploymentTrigger = `// DEPLOYMENT TRIGGER: ${new Date().toISOString()}\n// Force rebuild with correct credentials\n\n`;
    const triggeredBackend = deploymentTrigger + currentBackend;
    
    console.log('2. Adding deployment trigger...');
    
    // Update index.js with deployment trigger
    await updateFile(octokit, owner, repo, 'index.js', triggeredBackend, 
      'Force Deployment - OAuth Backend with Correct Credentials v8.5.6');
    
    console.log('✅ Deployment trigger added successfully!');
    console.log('');
    console.log('🚀 DEPLOYMENT DETAILS:');
    console.log('• Forced Railway to recognize changes');
    console.log('• OAuth backend should rebuild with correct credentials');
    console.log('• Client ID: 68474924a586bce22a6e64f7-mbpkmyu4');
    console.log('• Version: 8.5.6-correct-credentials');
    console.log('');
    console.log('⏳ Railway should redeploy within 2-3 minutes...');
    
  } catch (error) {
    console.error('❌ Deployment trigger failed:', error.message);
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

forceRailwayDeployment().catch(console.error);