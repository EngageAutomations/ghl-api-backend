#!/usr/bin/env node

/**
 * Revert to Single Backend Implementation
 * Deploy the working single backend to Railway OAuth backend
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'EngageAutomations';
const REPO_NAME = 'oauth-backend';

async function revertToSingleBackend() {
  console.log('🔄 REVERTING TO SINGLE BACKEND IMPLEMENTATION');
  console.log('Deploying working single backend from railway-working-version');
  console.log('='.repeat(70));

  if (!GITHUB_TOKEN) {
    console.log('❌ GITHUB_TOKEN environment variable not found');
    return;
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Step 1: Get current SHA of index.js
    console.log('\n1️⃣ Getting current file SHA from GitHub...');
    
    const currentFile = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js'
    });
    
    const currentSHA = currentFile.data.sha;
    console.log('✅ Current SHA retrieved:', currentSHA.substring(0, 8));

    // Step 2: Read the working single backend file
    console.log('\n2️⃣ Reading working single backend file...');
    
    const singleBackendContent = fs.readFileSync('railway-working-version/index.js', 'utf8');
    console.log('✅ Single backend file read successfully');
    console.log('File size:', singleBackendContent.length, 'characters');
    
    // Verify it contains the working implementation
    if (singleBackendContent.includes('makeGHLAPICall') && 
        singleBackendContent.includes('OAuth Backend')) {
      console.log('✅ Confirmed: File contains working single backend implementation');
    } else {
      console.log('❌ Warning: File may not contain expected working implementation');
    }

    // Step 3: Update the file on GitHub
    console.log('\n3️⃣ Deploying single backend to Railway...');
    
    const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js',
      message: 'Revert to single backend implementation for troubleshooting\n\n- Restore working single backend from railway-working-version\n- OAuth + API endpoints in single backend\n- Direct GoHighLevel API calls with automatic retry\n- Troubleshoot 403 issue with working implementation',
      content: Buffer.from(singleBackendContent).toString('base64'),
      sha: currentSHA
    });

    console.log('✅ File updated successfully!');
    console.log('Commit SHA:', updateResponse.data.commit.sha.substring(0, 8));
    console.log('Commit URL:', updateResponse.data.commit.html_url);

    // Step 4: Update package.json if needed
    console.log('\n4️⃣ Checking package.json...');
    
    try {
      const packageFile = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'package.json'
      });
      
      const packageContent = fs.readFileSync('railway-working-version/package.json', 'utf8');
      
      const packageUpdateResponse = await octokit.rest.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'package.json',
        message: 'Update package.json for single backend implementation',
        content: Buffer.from(packageContent).toString('base64'),
        sha: packageFile.data.sha
      });
      
      console.log('✅ package.json updated successfully');
    } catch (error) {
      console.log('⚠️ package.json update skipped:', error.message);
    }

    // Step 5: Monitor deployment
    console.log('\n5️⃣ Railway Auto-Deployment Triggered');
    console.log('Railway will automatically detect the GitHub change and deploy');
    console.log('OAuth Backend URL: https://dir.engageautomations.com');
    
    console.log('\n🔄 Changes Deployed:');
    console.log('- Single backend implementation restored');
    console.log('- OAuth + API endpoints in single backend');
    console.log('- Direct GoHighLevel API calls');
    console.log('- Automatic retry system included');
    console.log('- Product creation, media upload, pricing endpoints');
    
    console.log('\n⏱️  Deployment Timeline:');
    console.log('- GitHub: Updated immediately ✅');
    console.log('- Railway: Auto-deploy in 1-2 minutes 🔄');
    console.log('- Single backend ready for troubleshooting');
    
    console.log('\n🧪 Next Steps for Troubleshooting:');
    console.log('1. Wait 1-2 minutes for Railway deployment');
    console.log('2. Test OAuth installation and token retrieval');
    console.log('3. Test direct API calls from single backend');
    console.log('4. Compare with dual backend results');
    console.log('5. Analyze any differences in behavior');
    
    return {
      success: true,
      commitSHA: updateResponse.data.commit.sha,
      commitURL: updateResponse.data.commit.html_url
    };

  } catch (error) {
    console.log('\n❌ Revert failed:');
    console.log('Error:', error.message);
    
    return { success: false, error: error.message };
  }
}

// Run revert
revertToSingleBackend()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 REVERT SUCCESSFUL!');
      console.log('Single backend implementation deployed for troubleshooting');
    } else {
      console.log('\n❌ REVERT FAILED');
      console.log('Error:', result.error);
    }
  })
  .catch(console.error);