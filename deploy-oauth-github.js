/**
 * Deploy OAuth Location Fix to GitHub Repository
 * Updates the OAuth backend repository with enhanced location handling
 */

import fs from 'fs';

async function deployToGitHubOAuth() {
  console.log('🚀 DEPLOYING OAUTH LOCATION FIX TO GITHUB');
  console.log('Repository: EngageAutomations/oauth-backend');
  console.log('Version: 7.0.0-location-fix');
  console.log('='.repeat(60));
  
  // Read the enhanced OAuth backend code
  const enhancedCode = fs.readFileSync('oauth-location-fix.js', 'utf8');
  
  try {
    // Get current file info from GitHub
    console.log('📋 Getting current file info...');
    const currentFileResponse = await fetch('https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OAuth-Location-Fix-Deploy'
      }
    });
    
    if (!currentFileResponse.ok) {
      throw new Error(`Failed to get current file: ${currentFileResponse.status}`);
    }
    
    const currentFile = await currentFileResponse.json();
    console.log('✅ Current file SHA obtained');
    
    // Update the file
    console.log('📤 Updating OAuth backend...');
    const updateResponse = await fetch('https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js', {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'OAuth-Location-Fix-Deploy'
      },
      body: JSON.stringify({
        message: 'Deploy OAuth v7.0.0-location-fix: Enhanced location detection and validation\n\nFeatures:\n- Smart location ID extraction from JWT tokens\n- Account location discovery via GoHighLevel API\n- Enhanced bridge communication endpoints\n- Token health monitoring\n- Fallback location handling',
        content: Buffer.from(enhancedCode).toString('base64'),
        sha: currentFile.sha
      })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub update failed: ${updateResponse.status} - ${errorData.message}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('✅ OAuth backend updated successfully');
    console.log(`Commit SHA: ${updateData.commit.sha}`);
    
    // Wait for Railway auto-deployment
    console.log('\n⏳ Waiting for Railway auto-deployment...');
    await new Promise(resolve => setTimeout(resolve, 45000)); // 45 seconds
    
    // Test the deployed backend
    console.log('\n🧪 Testing deployed OAuth backend...');
    await testDeployedBackend();
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return false;
  }
}

async function testDeployedBackend() {
  const tests = [
    { name: 'Root Endpoint', url: 'https://dir.engageautomations.com/' },
    { name: 'Enhanced Token Access', url: 'https://dir.engageautomations.com/api/token-access/install_1751436979939' },
    { name: 'Installation Status', url: 'https://dir.engageautomations.com/api/installation-status/install_1751436979939' },
    { name: 'Token Health', url: 'https://dir.engageautomations.com/api/token-health/install_1751436979939' }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(test.url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        results[test.name] = { status: 'success', data };
        console.log(`   ✅ ${test.name}: Working`);
        
        // Log key information
        if (test.name === 'Enhanced Token Access') {
          console.log(`   Location Status: ${data.location_status || 'N/A'}`);
          console.log(`   Locations Found: ${data.total_locations || 0}`);
          console.log(`   Recommended Location: ${data.location_id || 'N/A'}`);
        }
      } else {
        results[test.name] = { status: 'failed', code: response.status };
        console.log(`   ❌ ${test.name}: ${response.status}`);
      }
    } catch (error) {
      results[test.name] = { status: 'error', error: error.message };
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 DEPLOYMENT TEST SUMMARY:');
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const totalTests = Object.keys(results).length;
  
  console.log(`Tests Passed: ${successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('🎉 OAuth backend deployment successful!');
    console.log('Enhanced location handling is now operational');
    console.log('Ready for API workflow testing');
  } else {
    console.log('⚠️ Some tests failed - deployment may need troubleshooting');
  }
  
  return results;
}

// Check for GitHub token
if (!process.env.GITHUB_TOKEN) {
  console.log('❌ GITHUB_TOKEN environment variable is required');
  console.log('Please set your GitHub personal access token');
  process.exit(1);
}

// Run deployment
deployToGitHubOAuth()
  .then(success => {
    if (success) {
      console.log('\n✅ OAuth backend upgrade completed successfully!');
      console.log('The enhanced OAuth server is now ready for API workflow testing');
    } else {
      console.log('\n❌ Deployment failed - please check the errors above');
    }
  })
  .catch(error => {
    console.error('Deployment error:', error);
  });