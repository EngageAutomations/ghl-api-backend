#!/usr/bin/env node

/**
 * Deploy API Backend with Single Backend Format
 * Updates the Railway API backend to use the exact single backend request format
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'EngageAutomations';
const REPO_NAME = 'ghl-api-backend';

async function deployAPIBackendSingleFormat() {
  console.log('🚀 DEPLOYING API BACKEND WITH SINGLE BACKEND FORMAT');
  console.log('Updating Railway API backend to replicate single backend requests');
  console.log('='.repeat(70));

  if (!GITHUB_TOKEN) {
    console.log('❌ GITHUB_TOKEN environment variable not found');
    console.log('Please provide GitHub token for deployment');
    return;
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Step 1: Get current SHA of the file we need to update
    console.log('\n1️⃣ Getting current file SHA from GitHub...');
    
    const currentFile = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'utils/ghl-client.js'
    });
    
    const currentSHA = currentFile.data.sha;
    console.log('✅ Current SHA retrieved:', currentSHA.substring(0, 8));

    // Step 2: Read the updated local file
    console.log('\n2️⃣ Reading updated local file...');
    
    const updatedContent = fs.readFileSync('ghl-api-backend/utils/ghl-client.js', 'utf8');
    console.log('✅ Local file read successfully');
    console.log('File size:', updatedContent.length, 'characters');
    
    // Verify it contains the single backend format
    if (updatedContent.includes('makeGHLAPICallLikeSingleBackend') && 
        updatedContent.includes('single backend format that was working')) {
      console.log('✅ Confirmed: File contains single backend format updates');
    } else {
      console.log('❌ Warning: File may not contain expected updates');
    }

    // Step 3: Update the file on GitHub
    console.log('\n3️⃣ Deploying to GitHub (Railway will auto-deploy)...');
    
    const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'utils/ghl-client.js',
      message: 'Update API backend to use single backend request format\n\n- Replicate exact makeGHLAPICall format from working single backend\n- Add automatic retry system with same header structure\n- Use simplified payload format that was working yesterday\n- Match single backend authentication and request pattern',
      content: Buffer.from(updatedContent).toString('base64'),
      sha: currentSHA
    });

    console.log('✅ File updated successfully!');
    console.log('Commit SHA:', updateResponse.data.commit.sha.substring(0, 8));
    console.log('Commit URL:', updateResponse.data.commit.html_url);

    // Step 4: Monitor deployment
    console.log('\n4️⃣ Railway Auto-Deployment Triggered');
    console.log('Railway will automatically detect the GitHub change and deploy');
    console.log('API Backend URL: https://api.engageautomations.com');
    
    console.log('\n🔄 Changes Deployed:');
    console.log('- API backend now uses exact single backend request format');
    console.log('- makeGHLAPICall retry system replicated');
    console.log('- Same header structure (Authorization + Version + Accept)');
    console.log('- Simplified payload format matching yesterday\'s working version');
    console.log('- Location ID injection matching single backend pattern');
    
    console.log('\n⏱️  Deployment Timeline:');
    console.log('- GitHub: Updated immediately ✅');
    console.log('- Railway: Auto-deploy in 1-2 minutes 🔄');
    console.log('- API ready for testing once Railway deployment completes');
    
    console.log('\n🧪 Next Steps:');
    console.log('1. Wait 1-2 minutes for Railway deployment');
    console.log('2. Test API backend with single backend format');
    console.log('3. Compare results with previous dual backend format');
    
    return {
      success: true,
      commitSHA: updateResponse.data.commit.sha,
      commitURL: updateResponse.data.commit.html_url
    };

  } catch (error) {
    console.log('\n❌ Deployment failed:');
    console.log('Error:', error.message);
    
    if (error.status === 401) {
      console.log('🔍 Authentication failed - check GitHub token');
    } else if (error.status === 404) {
      console.log('🔍 Repository or file not found');
    } else if (error.status === 422) {
      console.log('🔍 Validation failed - check file content');
    }
    
    return { success: false, error: error.message };
  }
}

// Run deployment
deployAPIBackendSingleFormat()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
      console.log('API backend updated with single backend format');
    } else {
      console.log('\n❌ DEPLOYMENT FAILED');
      console.log('Error:', result.error);
    }
  })
  .catch(console.error);