#!/usr/bin/env node
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

async function deployPersistentBackend() {
  console.log('Deploying Persistent Modular Backend\n');
  
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = 'EngageAutomations';
  const repo = 'oauth-backend';
  const sourceDir = 'railway-backend-persistent';
  
  try {
    // Get current main branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner, repo, ref: 'heads/main'
    });
    
    console.log('Current main SHA:', ref.object.sha);
    
    // Read all files from persistent backend
    const files = [
      { path: 'index.js', content: fs.readFileSync(`${sourceDir}/index.js`, 'utf8') },
      { path: 'package.json', content: fs.readFileSync(`${sourceDir}/package.json`, 'utf8') },
      { path: 'config/database.js', content: fs.readFileSync(`${sourceDir}/config/database.js`, 'utf8') },
      { path: 'config/schema.js', content: fs.readFileSync(`${sourceDir}/config/schema.js`, 'utf8') },
      { path: 'routes/oauth.js', content: fs.readFileSync(`${sourceDir}/routes/oauth.js`, 'utf8') },
      { path: 'routes/products.js', content: fs.readFileSync(`${sourceDir}/routes/products.js`, 'utf8') },
      { path: 'routes/media.js', content: fs.readFileSync(`${sourceDir}/routes/media.js`, 'utf8') },
      { path: 'routes/pricing.js', content: fs.readFileSync(`${sourceDir}/routes/pricing.js`, 'utf8') },
      { path: 'middleware/auth.js', content: fs.readFileSync(`${sourceDir}/middleware/auth.js`, 'utf8') },
      { path: 'utils/ghl-client.js', content: fs.readFileSync(`${sourceDir}/utils/ghl-client.js`, 'utf8') }
    ];
    
    // Create blobs for all files
    const blobs = await Promise.all(files.map(async (file) => {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner, repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      });
      return { path: file.path, sha: blob.sha };
    }));
    
    console.log(`Created ${blobs.length} file blobs`);
    
    // Create new tree with modular structure
    const { data: newTree } = await octokit.rest.git.createTree({
      owner, repo,
      base_tree: ref.object.sha,
      tree: blobs.map(blob => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      }))
    });
    
    console.log('Created modular tree structure');
    
    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
      owner, repo,
      message: 'Deploy persistent modular backend - installations survive deployments',
      tree: newTree.sha,
      parents: [ref.object.sha]
    });
    
    console.log('Created deployment commit:', commit.sha);
    
    // Update main branch
    await octokit.rest.git.updateRef({
      owner, repo,
      ref: 'heads/main',
      sha: commit.sha
    });
    
    console.log('✅ Persistent modular backend deployed');
    console.log('🔄 Railway deployment triggered');
    
    console.log('\nNew Architecture Benefits:');
    console.log('✓ OAuth installations persist through deployments');
    console.log('✓ Database storage with memory fallback');
    console.log('✓ Modular structure - add APIs without risk');
    console.log('✓ OAuth functionality isolated from API changes');
    
    console.log('\nNext Steps:');
    console.log('1. Wait 2-3 minutes for Railway deployment');
    console.log('2. Test OAuth installation - should persist');
    console.log('3. Add new APIs by creating route files only');
    
    return true;
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    return false;
  }
}

deployPersistentBackend().catch(console.error);