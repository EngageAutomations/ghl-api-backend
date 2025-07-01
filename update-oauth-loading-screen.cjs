/**
 * Update OAuth Backend Loading Screen
 * Adds a loading screen to the OAuth backend root route
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');

async function updateOAuthLoadingScreen() {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('📋 Reading current OAuth backend...');
    
    // Get current file
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    let content = Buffer.from(fileData.content, 'base64').toString();
    
    // Add loading screen route after the health check endpoint
    const loadingScreenRoute = `
// Root route - Loading screen
app.get('/', (req, res) => {
  const html = \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Requesting Access Token</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            font-family: 'Courier New', monospace; 
            height: 100vh; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            overflow: hidden;
        }
        
        .loading-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
            animation: fadeInOut 2s ease-in-out infinite;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid transparent;
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes fadeInOut {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading-text">Requesting Access Token</div>
    <div class="spinner"></div>
</body>
</html>\`;
  
  res.send(html);
});

`;

    // Find the health endpoint and add loading screen before it
    const healthEndpointIndex = content.indexOf('// Health check endpoint');
    if (healthEndpointIndex !== -1) {
      content = content.slice(0, healthEndpointIndex) + loadingScreenRoute + content.slice(healthEndpointIndex);
    } else {
      // If health endpoint not found, add before app.listen
      const listenIndex = content.indexOf('app.listen(');
      if (listenIndex !== -1) {
        content = content.slice(0, listenIndex) + loadingScreenRoute + '\n' + content.slice(listenIndex);
      }
    }

    console.log('🚀 Deploying loading screen to OAuth backend...');

    // Update the file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'Add loading screen to root route',
      content: Buffer.from(content).toString('base64'),
      sha: fileData.sha
    });

    console.log('✅ OAuth backend updated with loading screen');
    console.log('🔄 Railway will automatically deploy the changes...');
    
    // Wait for deployment
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test the deployment
    console.log('🧪 Testing loading screen...');
    const response = await fetch('https://dir.engageautomations.com/');
    const html = await response.text();
    
    if (html.includes('Requesting Access Token')) {
      console.log('✅ Loading screen deployed successfully!');
      console.log('🌐 Visit: https://dir.engageautomations.com/');
    } else {
      console.log('⚠️  Loading screen may still be deploying...');
    }

  } catch (error) {
    console.error('❌ Failed to update OAuth backend:', error.message);
    
    if (error.status === 422) {
      console.log('💡 File update conflict - trying to force update...');
      // Could implement retry logic here
    }
  }
}

updateOAuthLoadingScreen();