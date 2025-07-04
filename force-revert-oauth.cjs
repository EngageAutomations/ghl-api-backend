/**
 * Force Revert OAuth Server to Stable Version
 * Direct deployment with version bump to ensure Railway picks up changes
 */

const fs = require('fs');
const { execSync } = require('child_process');

async function forceRevertOAuth() {
  console.log('🔄 FORCE REVERTING OAUTH SERVER');
  console.log('Target: Stable v5.1.1-fixed with multi-installation support');
  console.log('Method: Version bump to force Railway redeploy');
  console.log('='.repeat(60));

  try {
    // Read stable code
    const stableCode = fs.readFileSync('railway-working-version/index.js', 'utf8');
    let stablePackage = JSON.parse(fs.readFileSync('railway-working-version/package.json', 'utf8'));
    
    // Bump version to force Railway redeploy
    stablePackage.version = "5.1.2-stable-revert";
    stablePackage.description = "Stable OAuth backend with multi-installation support - REVERTED";
    
    console.log('📄 Stable code loaded:', stableCode.length, 'characters');
    console.log('📦 Version bumped to:', stablePackage.version);
    
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
    
    // Update index.js
    const indexPayload = {
      message: 'FORCE REVERT: Stable OAuth backend v5.1.2-stable-revert with multi-installation support',
      content: Buffer.from(stableCode).toString('base64'),
      sha: currentSha
    };
    
    const updateIndexCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(indexPayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    
    console.log('🔄 Updating index.js...');
    const indexResponse = execSync(updateIndexCmd, { encoding: 'utf8' });
    const indexData = JSON.parse(indexResponse);
    
    if (indexData.commit) {
      console.log('✅ Index.js updated successfully');
      
      // Get SHA for package.json
      const getPackageShaCmd = `curl -s -H "Authorization: token ${githubToken}" https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json`;
      const packageShaResponse = execSync(getPackageShaCmd, { encoding: 'utf8' });
      const packageShaData = JSON.parse(packageShaResponse);
      const packageSha = packageShaData.sha;
      
      // Update package.json
      const packagePayload = {
        message: 'Update package.json to v5.1.2-stable-revert',
        content: Buffer.from(JSON.stringify(stablePackage, null, 2)).toString('base64'),
        sha: packageSha
      };
      
      const updatePackageCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(packagePayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json`;
      
      console.log('🔄 Updating package.json...');
      const packageResponse = execSync(updatePackageCmd, { encoding: 'utf8' });
      const packageData = JSON.parse(packageResponse);
      
      if (packageData.commit) {
        console.log('✅ FORCE REVERT SUCCESSFUL!');
        console.log('📍 Index.js commit:', indexData.commit.sha.substring(0, 7));
        console.log('📍 Package.json commit:', packageData.commit.sha.substring(0, 7));
        console.log('⏱️  Railway deployment typically takes 2-3 minutes');
        
        console.log('');
        console.log('✅ REVERTED TO STABLE FEATURES:');
        console.log('• Multiple installation support (Map storage)');
        console.log('• Individual token management per installation');
        console.log('• Automatic token refresh with scheduling');
        console.log('• Auto-retry API system');
        console.log('• Media upload endpoints');
        console.log('• Customer support system');
        console.log('• Installation tracking (/installations endpoint)');
        
        console.log('');
        console.log('🎯 VERIFICATION:');
        console.log('1. Wait 2-3 minutes for Railway deployment');
        console.log('2. Check: curl https://dir.engageautomations.com/');
        console.log('3. Should show version: 5.1.2-stable-revert');
        console.log('4. Should have /installations endpoint working');
        
      } else {
        console.error('❌ Package.json update failed:', packageData);
      }
    } else {
      console.error('❌ Index.js update failed:', indexData);
    }
    
  } catch (error) {
    console.error('❌ Force revert failed:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}

forceRevertOAuth().catch(console.error);