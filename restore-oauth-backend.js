/**
 * Restore OAuth Backend to Last Working Version
 * Uses the proven working version from railway-working-version directory
 */

import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';

async function restoreOAuthBackend() {
  console.log('=== Restoring OAuth Backend to Working Version ===');
  
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN environment variable not found');
      return;
    }
    
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    const branch = 'main';
    
    console.log('1. Loading working OAuth backend files...');
    
    // Load working files from railway-working-version
    const indexJs = readFileSync('./railway-working-version/index.js', 'utf8');
    const packageJson = readFileSync('./railway-working-version/package.json', 'utf8');
    const railwayToml = readFileSync('./railway-working-version/railway.toml', 'utf8');
    
    console.log('✅ Working files loaded');
    
    console.log('2. Getting current file SHAs...');
    
    // Get current file SHAs
    const { data: currentIndex } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    const { data: currentPackage } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'package.json'
    });
    
    const { data: currentRailway } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'railway.toml'
    });
    
    console.log('✅ Current SHAs retrieved');
    
    console.log('3. Restoring index.js...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'Restore OAuth backend to working version with all endpoints',
      content: Buffer.from(indexJs).toString('base64'),
      sha: currentIndex.sha,
      branch
    });
    
    console.log('4. Restoring package.json...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'package.json',
      message: 'Restore package.json with required dependencies',
      content: Buffer.from(packageJson).toString('base64'),
      sha: currentPackage.sha,
      branch
    });
    
    console.log('5. Restoring railway.toml...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'railway.toml',
      message: 'Restore railway.toml configuration',
      content: Buffer.from(railwayToml).toString('base64'),
      sha: currentRailway.sha,
      branch
    });
    
    console.log('✅ OAuth Backend restored successfully!');
    console.log('');
    console.log('🚀 Restoration Summary:');
    console.log('   Repository: https://github.com/EngageAutomations/oauth-backend');
    console.log('   Files Restored: index.js, package.json, railway.toml');
    console.log('   Version: Working version with all OAuth functionality');
    console.log('   Features: OAuth callback, token management, installations tracking');
    console.log('   Dependencies: All required packages restored');
    console.log('');
    console.log('⏱️ Railway deployment starting automatically...');
    console.log('🔗 OAuth Backend: https://dir.engageautomations.com/');
    console.log('');
    console.log('📋 OAuth Backend Endpoints Restored:');
    console.log('   - GET / (status)');
    console.log('   - GET /api/oauth/callback (OAuth callback)');
    console.log('   - POST /api/token-access (token retrieval for API backend)');
    console.log('   - GET /installations (installation tracking)');
    console.log('   - POST /api/products/create (product creation)');
    console.log('   - POST /api/images/upload (image upload)');
    console.log('   - GET /health (health check)');
    console.log('');
    console.log('✅ Ready for OAuth installations once deployment completes');
    
  } catch (error) {
    console.error('❌ Restoration error:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message);
    }
  }
}

restoreOAuthBackend();