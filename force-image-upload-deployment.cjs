/**
 * Force Image Upload Deployment
 * Push multiple commits to ensure Railway picks up the deployment
 */

async function forceImageUploadDeployment() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Forcing Image Upload Deployment ===');
    
    // Create a deployment trigger file
    const timestamp = new Date().toISOString();
    const deploymentTrigger = `# Railway Deployment Trigger
Timestamp: ${timestamp}
Version: 5.9.0-image-upload
Features: Image upload with multer, auto-retry system, frontend redirect
Status: Force deployment to ensure Railway picks up changes
`;

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'DEPLOYMENT_TRIGGER.md',
      message: 'Force deployment trigger for image upload API v5.9.0',
      content: Buffer.from(deploymentTrigger).toString('base64')
    });

    console.log('✅ Deployment trigger created');
    
    // Wait and then check deployment status
    console.log('⏳ Waiting 60 seconds for Railway deployment...');
    
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Check if deployment is live
    const healthCheck = await fetch('https://dir.engageautomations.com/');
    const healthText = await healthCheck.text();
    
    if (healthText.includes('5.9.0-image-upload')) {
      console.log('✅ Image upload deployment is live!');
      return { success: true, deployed: true };
    } else {
      console.log('⏳ Deployment still in progress...');
      return { success: true, deployed: false, message: 'Deployment triggered, still propagating' };
    }
    
  } catch (error) {
    console.error('❌ Force deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

forceImageUploadDeployment();