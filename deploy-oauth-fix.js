import { Octokit } from '@octokit/rest';
import fs from 'fs';

async function deployOAuthFix() {
  console.log('=== Deploying OAuth Fix to Railway Backend ===\n');
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'EngageAutomations';
  const REPO_NAME = 'oauth-backend';
  
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  try {
    // Read the fixed backend code
    const fixedBackendCode = fs.readFileSync('railway-backend-oauth-fix.js', 'utf8');
    
    // Get current file content to get SHA
    let currentSHA;
    try {
      const currentFile = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'index.js'
      });
      currentSHA = currentFile.data.sha;
    } catch (error) {
      console.log('File does not exist, will create new file');
    }
    
    // Update the main backend file
    const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js',
      message: 'Fix OAuth token handling - capture and store access tokens properly',
      content: Buffer.from(fixedBackendCode).toString('base64'),
      sha: currentSHA
    });
    
    console.log('✓ OAuth fix deployed to GitHub');
    console.log(`Commit SHA: ${updateResponse.data.commit.sha}`);
    
    // Update package.json to include node-cron dependency
    const packageJson = {
      "name": "oauth-backend",
      "version": "5.4.2-oauth-fixed",
      "description": "GoHighLevel OAuth Backend with Fixed Token Handling",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "axios": "^1.4.0",
        "cors": "^2.8.5",
        "multer": "^1.4.5-lts.1",
        "form-data": "^4.0.0",
        "node-cron": "^3.0.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    // Get current package.json SHA
    let packageSHA;
    try {
      const currentPackage = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'package.json'
      });
      packageSHA = currentPackage.data.sha;
    } catch (error) {
      console.log('package.json does not exist, will create new file');
    }
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'package.json',
      message: 'Update package.json with node-cron dependency for token refresh',
      content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
      sha: packageSHA
    });
    
    console.log('✓ package.json updated with dependencies');
    
    // Wait for Railway deployment
    console.log('\nWaiting for Railway deployment...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test the deployment
    console.log('Testing deployed backend...');
    
    const testResponse = await fetch('https://dir.engageautomations.com/');
    const testData = await testResponse.json();
    
    console.log(`✓ Backend deployed: ${testData.version}`);
    console.log(`Status: ${testData.status}`);
    
    if (testData.version === '5.4.2-oauth-fixed') {
      console.log('\n🎉 OAuth fix successfully deployed!');
      console.log('The backend now properly captures and stores OAuth tokens');
      console.log('New OAuth installations will work correctly');
      
      return {
        success: true,
        version: testData.version,
        commitSHA: updateResponse.data.commit.sha
      };
    } else {
      throw new Error('Deployment verification failed - version mismatch');
    }
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

deployOAuthFix();