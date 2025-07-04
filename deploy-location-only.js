/**
 * Deploy Location-Only OAuth Backend
 * Direct deployment of the Location-only authentication backend
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

async function deployLocationOnly() {
  console.log('🎯 DEPLOYING LOCATION-ONLY OAUTH BACKEND');
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
    
    console.log('1. Reading Location-only backend...');
    const locationOnlyBackend = fs.readFileSync('location-only-backend.js', 'utf8');
    
    console.log('2. Deploying Location-only OAuth backend...');
    
    await updateFile(octokit, owner, repo, 'index.js', locationOnlyBackend, 
      'Deploy Location-Only OAuth Backend v8.6.0 - Force Location-level tokens');
    
    console.log('✅ Location-only OAuth backend deployed!');
    console.log('');
    console.log('🎯 LOCATION-ONLY FEATURES:');
    console.log('• Forces user_type: "Location" in all token exchanges');
    console.log('• Only creates Location-level installations');
    console.log('• Should generate tokens with authClass: "Location"');
    console.log('• Includes locationId in JWT payload');
    console.log('• Version: 8.6.0-location-only');
    console.log('');
    console.log('⚠️  FRESH OAUTH INSTALLATION REQUIRED');
    console.log('Previous Company-level installation must be replaced');
    console.log('Install URL: https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    console.log('');
    console.log('⏳ Railway should redeploy within 2-3 minutes...');
    
  } catch (error) {
    console.error('❌ Location-only deployment failed:', error.message);
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

deployLocationOnly().catch(console.error);