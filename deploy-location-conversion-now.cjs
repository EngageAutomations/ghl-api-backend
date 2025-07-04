/**
 * Deploy Location Token Conversion Backend
 * Updates the OAuth backend with location token conversion capability
 */

const fs = require('fs');
const { execSync } = require('child_process');

async function deployLocationConversionBackend() {
  console.log('🚀 DEPLOYING LOCATION TOKEN CONVERSION BACKEND');
  console.log('Target: GitHub oauth-backend repository');
  console.log('Version: v10.0.0-location-conversion');
  console.log('='.repeat(60));

  try {
    // Read the enhanced backend code
    const enhancedCode = fs.readFileSync('enhanced-oauth-backend-with-location-conversion.js', 'utf8');
    
    console.log('📄 Enhanced backend loaded:', enhancedCode.length, 'characters');
    
    // Create a temporary deployment payload
    const deploymentPayload = {
      message: 'Deploy location token conversion v10.0.0-location-conversion',
      content: Buffer.from(enhancedCode).toString('base64'),
      version: '10.0.0-location-conversion'
    };

    // Write payload to file for GitHub deployment
    fs.writeFileSync('deployment-payload.json', JSON.stringify(deploymentPayload, null, 2));
    
    console.log('📦 Deployment payload created');
    
    // Use curl to deploy via GitHub API
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }
    
    console.log('🔄 Deploying to GitHub...');
    
    // Get current file SHA
    const getShaCmd = `curl -s -H "Authorization: token ${githubToken}" https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    const shaResponse = execSync(getShaCmd, { encoding: 'utf8' });
    const shaData = JSON.parse(shaResponse);
    const currentSha = shaData.sha;
    
    console.log('📋 Current SHA:', currentSha);
    
    // Update the file
    const updatePayload = {
      message: 'Deploy enhanced OAuth backend with location token conversion v10.0.0',
      content: deploymentPayload.content,
      sha: currentSha
    };
    
    const updateCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(updatePayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    
    const updateResponse = execSync(updateCmd, { encoding: 'utf8' });
    const updateData = JSON.parse(updateResponse);
    
    if (updateData.commit) {
      console.log('✅ DEPLOYMENT SUCCESSFUL!');
      console.log('📍 Commit SHA:', updateData.commit.sha);
      console.log('🔄 Railway will automatically deploy the changes');
      
      // Wait for Railway deployment
      console.log('');
      console.log('⏳ Waiting for Railway deployment...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second wait
      
      // Test the new endpoints
      console.log('🧪 Testing new endpoints...');
      
      try {
        const testCmd = 'node test-location-token-media-upload.cjs';
        const testResult = execSync(testCmd, { encoding: 'utf8' });
        console.log('📊 Test Results:');
        console.log(testResult);
      } catch (testError) {
        console.log('⚠️  Test execution failed, but deployment was successful');
        console.log('Run manually: node test-location-token-media-upload.cjs');
      }
      
    } else {
      console.error('❌ Deployment failed:', updateData);
    }
    
    // Clean up
    fs.unlinkSync('deployment-payload.json');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployLocationConversionBackend().catch(console.error);