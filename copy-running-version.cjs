/**
 * Copy Running Version - Make the exact running code the latest commit
 * This will align GitHub with the currently deployed Railway version
 */

const fs = require('fs');
const { execSync } = require('child_process');

async function copyRunningVersion() {
  console.log('📋 COPYING RUNNING VERSION TO LATEST COMMIT');
  console.log('Making commit 0cf6deb (9.0.0-correct-location) the current HEAD');
  console.log('='.repeat(60));

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    // Read the saved running version files
    const indexContent = fs.readFileSync('running-version-index.js', 'utf8');
    const packageContent = fs.readFileSync('running-version-package.json', 'utf8');
    
    console.log('📄 Loaded running version files');
    console.log('📦 Version in package.json:', JSON.parse(packageContent).version);
    
    // Update package.json to match the version in index.js
    const packageObj = JSON.parse(packageContent);
    packageObj.version = '9.0.0-correct-location';
    const updatedPackageContent = JSON.stringify(packageObj, null, 2);
    
    console.log('📦 Updated package.json version to match index.js');

    // Get current file SHAs for updating
    const getCurrentSHA = (file) => {
      const cmd = `curl -s -H "Authorization: token ${githubToken}" "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/${file}"`;
      const response = execSync(cmd, { encoding: 'utf8' });
      return JSON.parse(response).sha;
    };

    const currentIndexSHA = getCurrentSHA('index.js');
    const currentPackageSHA = getCurrentSHA('package.json');

    console.log('📍 Current file SHAs obtained');

    // Deploy index.js
    const indexPayload = {
      message: 'SYNC: Copy running Railway version 9.0.0-correct-location to GitHub HEAD',
      content: Buffer.from(indexContent).toString('base64'),
      sha: currentIndexSHA
    };

    console.log('🔄 Deploying index.js...');
    const updateIndexCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(indexPayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js`;
    const indexResponse = execSync(updateIndexCmd, { encoding: 'utf8' });
    const indexData = JSON.parse(indexResponse);

    if (indexData.commit) {
      console.log('✅ index.js deployed successfully');
      console.log('📍 New commit SHA:', indexData.commit.sha.substring(0, 7));

      // Deploy package.json
      const packagePayload = {
        message: 'SYNC: Update package.json to match running version 9.0.0-correct-location',
        content: Buffer.from(updatedPackageContent).toString('base64'),
        sha: currentPackageSHA
      };

      console.log('🔄 Deploying package.json...');
      const updatePackageCmd = `curl -X PUT -H "Authorization: token ${githubToken}" -H "Content-Type: application/json" -d '${JSON.stringify(packagePayload)}' https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json`;
      const packageResponse = execSync(updatePackageCmd, { encoding: 'utf8' });
      const packageData = JSON.parse(packageResponse);

      if (packageData.commit) {
        console.log('✅ package.json deployed successfully');
        console.log('📍 Final commit SHA:', packageData.commit.sha.substring(0, 7));

        console.log('');
        console.log('🎯 SYNCHRONIZATION COMPLETE!');
        console.log('• GitHub HEAD now matches running Railway deployment');
        console.log('• Version: 9.0.0-correct-location');
        console.log('• Railway will redeploy the same code (should be seamless)');
        console.log('• No functional changes - just alignment between GitHub and Railway');

        console.log('');
        console.log('⏳ RAILWAY DEPLOYMENT:');
        console.log('• Railway will detect the new commit and trigger deployment');
        console.log('• Since it\'s the same code already running, deployment should be instant');
        console.log('• Health checks will pass immediately');
        console.log('• No downtime expected');

        console.log('');
        console.log('🔍 VERIFICATION (in 2-3 minutes):');
        console.log('• Check: curl https://dir.engageautomations.com/');
        console.log('• Should show same version: 9.0.0-correct-location');
        console.log('• GitHub and Railway will be perfectly synchronized');

      } else {
        console.error('❌ Package.json deployment failed:', packageData);
      }
    } else {
      console.error('❌ Index.js deployment failed:', indexData);
    }

  } catch (error) {
    console.error('❌ Copy running version failed:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}

copyRunningVersion().catch(console.error);