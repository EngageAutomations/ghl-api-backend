/**
 * Trigger OAuth Server Redeploy
 * Make a meaningful change to force Railway to pick up the stable version
 */

const fs = require('fs');
const { execSync } = require('child_process');

async function triggerRedeploy() {
  console.log('🔄 TRIGGERING OAUTH SERVER REDEPLOY');
  console.log('Method: Add timestamp comment to force change detection');
  console.log('='.repeat(60));

  try {
    // Read stable code and add timestamp comment
    let stableCode = fs.readFileSync('railway-working-version/index.js', 'utf8');
    
    // Add timestamp comment at the top to force change
    const timestamp = new Date().toISOString();
    const deployComment = `// DEPLOYED: ${timestamp} - Stable version v5.1.2-stable-revert\n`;
    stableCode = deployComment + stableCode;
    
    // Update package.json with new timestamp
    let packageData = JSON.parse(fs.readFileSync('railway-working-version/package.json', 'utf8'));
    packageData.version = "5.1.3-stable-deploy";
    packageData.description = `Stable OAuth backend with multi-installation support - DEPLOYED ${timestamp}`;
    
    console.log('📄 Code updated with timestamp:', timestamp);
    console.log('📦 Version updated to:', packageData.version);
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }
    
    // Get current SHA for index.js
    const getShaCmd = `curl -s -H "Authorization: token ${githubToken}" https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    const shaResponse = execSync(getShaCmd, { encoding: 'utf8' });
    const shaData = JSON.parse(shaResponse);
    const currentSha = shaData.sha;
    
    console.log('📋 Current SHA:', currentSha);
    
    // Update index.js with timestamp
    const indexPayload = {
      message: `FORCE DEPLOY: Stable OAuth backend with timestamp ${timestamp}`,
      content: Buffer.from(stableCode).toString('base64'),
      sha: currentSha
    };
    
    const updateIndexCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(indexPayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    
    console.log('🔄 Deploying with timestamp...');
    const indexResponse = execSync(updateIndexCmd, { encoding: 'utf8' });
    const indexData = JSON.parse(indexResponse);
    
    if (indexData.commit) {
      console.log('✅ REDEPLOY TRIGGERED SUCCESSFULLY!');
      console.log('📍 New commit SHA:', indexData.commit.sha.substring(0, 7));
      console.log('⏱️  Railway should detect this change and redeploy');
      
      console.log('');
      console.log('🎯 CHANGES MADE:');
      console.log('• Added timestamp comment to force change detection');
      console.log('• Updated version to 5.1.3-stable-deploy');
      console.log('• Railway will rebuild and redeploy automatically');
      
      console.log('');
      console.log('⏳ VERIFICATION (in 2-3 minutes):');
      console.log('• curl https://dir.engageautomations.com/');
      console.log('• Should show version: 5.1.3-stable-deploy');
      console.log('• Should have all stable features working');
      
    } else {
      console.error('❌ Redeploy trigger failed:', indexData);
    }
    
  } catch (error) {
    console.error('❌ Redeploy failed:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}

triggerRedeploy().catch(console.error);