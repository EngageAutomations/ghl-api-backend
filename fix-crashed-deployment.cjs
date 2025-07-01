/**
 * Fix Crashed Railway Deployment
 * Rollback to stable version and identify issue
 */

const fs = require('fs');

async function fixCrashedDeployment() {
  try {
    console.log('=== Fixing Crashed Railway Deployment ===');
    
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // First, let's check what's in the current deployed file
    console.log('🔍 Analyzing deployed code for issues...');
    
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });
    
    const deployedContent = Buffer.from(currentFile.content, 'base64').toString();
    
    // Check for common issues that cause crashes
    const issues = [];
    
    if (!deployedContent.includes('app.listen(port')) {
      issues.push('Missing app.listen() call');
    }
    
    if (!deployedContent.includes('const express = require')) {
      issues.push('Missing express import');
    }
    
    if (deployedContent.includes('scheduleRefreshSmart') && !deployedContent.includes('function scheduleRefreshSmart')) {
      issues.push('Function scheduleRefreshSmart called but not defined');
    }
    
    if (deployedContent.includes('ensureFreshTokenSmart') && !deployedContent.includes('function ensureFreshTokenSmart')) {
      issues.push('Function ensureFreshTokenSmart called but not defined');
    }
    
    if (deployedContent.includes('makeGHLAPICall') && !deployedContent.includes('async function makeGHLAPICall')) {
      issues.push('Function makeGHLAPICall called but not defined');
    }
    
    console.log('🔍 Issues found:', issues.length > 0 ? issues : 'None detected');
    
    if (issues.length > 0) {
      console.log('⚠️ Code issues detected, deploying fixed version...');
      
      // Read the working Railway version (known good)
      const workingContent = fs.readFileSync('railway-working-version/index.js', 'utf8');
      
      // Deploy the fixed version
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'EngageAutomations',
        repo: 'oauth-backend',
        path: 'index.js',
        message: 'HOTFIX: Fix deployment crash - restore working enhanced backend',
        content: Buffer.from(workingContent).toString('base64'),
        sha: currentFile.sha
      });
      
      console.log('✅ Fixed version deployed to GitHub');
      
      // Wait for Railway deployment
      console.log('⏳ Waiting for Railway recovery...');
      await new Promise(resolve => setTimeout(resolve, 45000)); // 45 seconds
      
      // Test recovery
      const axios = require('axios');
      
      try {
        const testResponse = await axios.get('https://dir.engageautomations.com/', { timeout: 10000 });
        
        if (testResponse.data.status === 'operational') {
          console.log('🎉 DEPLOYMENT RECOVERY SUCCESSFUL!');
          console.log('📊 Backend Status:', testResponse.data.status);
          console.log('🔧 Features:', testResponse.data.features);
          
          return {
            success: true,
            recovery: 'complete',
            backend_status: 'operational',
            issues_fixed: issues
          };
        }
        
      } catch (testError) {
        console.log('⚠️ Backend still recovering, may need more time');
      }
    }
    
    // If no obvious issues, try rollback to last known working version
    console.log('🔄 Attempting rollback to last stable version...');
    
    // Get commit history to find last working version
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      per_page: 10
    });
    
    // Find a commit before the crash
    const workingCommit = commits.find(commit => 
      commit.commit.message.includes('5.4.2') || 
      commit.commit.message.includes('working') ||
      !commit.commit.message.includes('7.0.0')
    );
    
    if (workingCommit) {
      console.log(`🔄 Rolling back to: ${workingCommit.commit.message}`);
      
      // Get the working file
      const { data: workingFile } = await octokit.rest.repos.getContent({
        owner: 'EngageAutomations',
        repo: 'oauth-backend',
        path: 'index.js',
        ref: workingCommit.sha
      });
      
      // Deploy the rollback
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'EngageAutomations',
        repo: 'oauth-backend',
        path: 'index.js',
        message: 'EMERGENCY ROLLBACK: Restore stable backend after crash',
        content: workingFile.content,
        sha: currentFile.sha
      });
      
      console.log('✅ Emergency rollback deployed');
      
      return {
        success: true,
        action: 'emergency_rollback',
        rolled_back_to: workingCommit.commit.message,
        next_steps: 'Test enhanced features locally before redeployment'
      };
    }
    
    return {
      success: false,
      issue: 'cannot_identify_crash_cause',
      action: 'manual_intervention_needed'
    };
    
  } catch (error) {
    console.error('❌ Fix attempt failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

fixCrashedDeployment().then(result => {
  console.log('\n=== DEPLOYMENT FIX RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});