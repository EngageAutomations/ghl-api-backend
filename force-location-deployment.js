/**
 * Force Location-Level Authentication Deployment
 * Ensures Railway picks up the location auth changes
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

async function forceLocationDeployment() {
  console.log('🎯 FORCING LOCATION AUTH DEPLOYMENT');
  console.log('Adding deployment trigger for location-level authentication');
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
    
    console.log('1. Reading location auth backend...');
    const locationAuthBackend = fs.readFileSync('fix-location-auth-class.js', 'utf8');
    
    // Add deployment trigger for location auth
    const deploymentTrigger = `// LOCATION AUTH DEPLOYMENT: ${new Date().toISOString()}\n// Force rebuild with user_type: location for media upload\n\n`;
    const triggeredBackend = deploymentTrigger + locationAuthBackend;
    
    console.log('2. Adding location auth deployment trigger...');
    
    // Update index.js with deployment trigger
    await updateFile(octokit, owner, repo, 'index.js', triggeredBackend, 
      'Force Location Auth Deployment - Enable Media Upload v8.5.7');
    
    console.log('✅ Location auth deployment trigger added successfully!');
    console.log('');
    console.log('🎯 LOCATION AUTH DEPLOYMENT:');
    console.log('• Forces Railway to rebuild with location-level authentication');
    console.log('• Adds user_type: "location" to OAuth token exchange');
    console.log('• Enables authClass: "Location" instead of "Company"');
    console.log('• Should resolve media upload IAM restrictions');
    console.log('• Version: 8.5.7-location-auth');
    console.log('');
    console.log('⏳ Railway should redeploy within 2-3 minutes...');
    console.log('Fresh OAuth installation will be required after deployment');
    
  } catch (error) {
    console.error('❌ Location auth deployment failed:', error.message);
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

forceLocationDeployment().catch(console.error);