/**
 * Force Railway Deployment by Adding Deployment Trigger
 * This will force Railway to recognize the changes and redeploy
 */

import { Octokit } from '@octokit/rest';

async function forceRailwayDeployment() {
  console.log('🎯 FORCING RAILWAY DEPLOYMENT');
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
    
    // Add a tiny deployment trigger to package.json to force Railway redeploy
    console.log('1. Adding deployment trigger to force Railway redeploy...');
    
    const packageJson = {
      "name": "oauth-backend",
      "version": "8.6.0-location-only",
      "description": "GoHighLevel OAuth Backend with Location-level authentication",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    await updateFile(octokit, owner, repo, 'package.json', JSON.stringify(packageJson, null, 2), 
      'Force Railway Deployment - Update package.json version');
    
    console.log('✅ Railway deployment trigger added!');
    console.log('');
    console.log('🎯 DEPLOYMENT TRIGGER:');
    console.log('• Updated package.json with version 8.6.0-location-only');
    console.log('• Railway should detect changes and redeploy automatically');
    console.log('• Location-only OAuth backend will be active after redeploy');
    console.log('');
    console.log('⏳ Railway should redeploy within 2-3 minutes...');
    console.log('Check: https://dir.engageautomations.com/ for version update');
    
  } catch (error) {
    console.error('❌ Railway deployment trigger failed:', error.message);
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