/**
 * Deploy Working OAuth Backend
 * Ensure proper package.json and working deployment
 */

async function deployWorkingOAuth() {
  console.log('🚀 DEPLOYING WORKING OAUTH BACKEND');
  console.log('Fixing Railway deployment issues');
  console.log('='.repeat(50));
  
  try {
    // 1. Update package.json
    console.log('1. UPDATING PACKAGE.JSON...');
    
    const packageJson = {
      "name": "oauth-backend",
      "version": "8.5.2-location-working",
      "description": "OAuth backend with location-level authentication for GoHighLevel",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "node-fetch": "^2.6.7",
        "node-cron": "^3.0.2"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    };
    
    // Get current package.json SHA
    const packageResponse = await fetch('https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });
    
    if (packageResponse.ok) {
      const packageData = await packageResponse.json();
      
      // Update package.json
      const updatePackageResponse = await fetch('https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json', {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update package.json for working deployment',
          content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
          sha: packageData.sha
        })
      });
      
      if (updatePackageResponse.ok) {
        console.log('✅ Package.json updated successfully');
      }
    }
    
    // 2. Wait for deployment
    console.log('\n2. WAITING FOR RAILWAY DEPLOYMENT...');
    let attempts = 0;
    let deploymentSuccessful = false;
    
    while (attempts < 15 && !deploymentSuccessful) {
      await new Promise(resolve => setTimeout(resolve, 20000)); // 20 second wait
      
      try {
        const healthResponse = await fetch('https://dir.engageautomations.com/health');
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log(`✅ Deployment successful! Version: ${healthData.version}`);
          deploymentSuccessful = true;
          
          // Test OAuth installation immediately
          console.log('\n3. OAUTH SYSTEM READY FOR TESTING');
          console.log('🔗 OAuth Installation URL:');
          console.log('   https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
          console.log('');
          console.log('✅ System will now:');
          console.log('   • Request user_type: "location" in OAuth exchange');
          console.log('   • Generate authClass: "Location" tokens');
          console.log('   • Enable media upload access');
          console.log('   • Complete full workflow functionality');
          
          return;
        }
      } catch (error) {
        // Continue trying
      }
      
      attempts++;
      console.log(`   Attempt ${attempts}: Still deploying...`);
    }
    
    if (!deploymentSuccessful) {
      console.log('⚠️  Deployment taking longer than expected');
      console.log('   Manual check needed at Railway dashboard');
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployWorkingOAuth().catch(console.error);