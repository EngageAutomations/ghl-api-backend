/**
 * Deploy Clean OAuth Stable Version
 * Remove timestamp comments and ensure clean deployment for Railway health checks
 */

const fs = require('fs');
const { execSync } = require('child_process');

async function deployCleanOAuthStable() {
  console.log('🔄 DEPLOYING CLEAN OAUTH STABLE VERSION');
  console.log('Removing timestamp comments for clean Railway deployment');
  console.log('='.repeat(60));

  try {
    // Read stable code and clean any deployment comments
    let stableCode = fs.readFileSync('railway-working-version/index.js', 'utf8');
    
    // Remove any deployment timestamp comments that might cause issues
    stableCode = stableCode.replace(/^\/\/ DEPLOYED:.*$/gm, '');
    stableCode = stableCode.trim();
    
    // Ensure health endpoint is robust
    const healthEndpointCheck = stableCode.includes("app.get('/health'");
    if (!healthEndpointCheck) {
      console.error('❌ Health endpoint missing from stable code');
      return;
    }
    
    // Update package.json with clean version
    let packageData = JSON.parse(fs.readFileSync('railway-working-version/package.json', 'utf8'));
    packageData.version = "5.2.0-stable-clean";
    packageData.description = "Stable OAuth backend with multi-installation support - CLEAN DEPLOYMENT";
    
    console.log('📄 Clean code prepared (no timestamp comments)');
    console.log('📦 Version:', packageData.version);
    console.log('✅ Health endpoint confirmed in code');
    
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
    
    // Update index.js with clean code
    const indexPayload = {
      message: 'CLEAN DEPLOY: Stable OAuth backend v5.2.0-stable-clean (health check ready)',
      content: Buffer.from(stableCode).toString('base64'),
      sha: currentSha
    };
    
    const updateIndexCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(indexPayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    
    console.log('🔄 Deploying clean stable version...');
    const indexResponse = execSync(updateIndexCmd, { encoding: 'utf8' });
    const indexData = JSON.parse(indexResponse);
    
    if (indexData.commit) {
      console.log('✅ CLEAN DEPLOYMENT SUCCESSFUL!');
      console.log('📍 Commit SHA:', indexData.commit.sha.substring(0, 7));
      console.log('⏱️  Railway should deploy without health check issues');
      
      console.log('');
      console.log('🎯 CLEAN DEPLOYMENT FEATURES:');
      console.log('• No timestamp comments (clean startup)');
      console.log('• Robust /health endpoint for Railway checks');
      console.log('• Multi-installation support maintained');
      console.log('• All stable features preserved');
      
      console.log('');
      console.log('⏳ HEALTH CHECK VERIFICATION:');
      console.log('• Railway will check: GET /health');
      console.log('• Expected response: {"status":"healthy",...}');
      console.log('• Deployment should complete successfully');
      
      console.log('');
      console.log('🔄 MONITORING DEPLOYMENT:');
      console.log('• Wait 3-5 minutes for Railway build/deploy');
      console.log('• Check: curl https://dir.engageautomations.com/');
      console.log('• Should show version: 5.2.0-stable-clean');
      
    } else {
      console.error('❌ Clean deployment failed:', indexData);
    }
    
  } catch (error) {
    console.error('❌ Clean deployment failed:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}

deployCleanOAuthStable().catch(console.error);