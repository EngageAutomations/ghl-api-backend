/**
 * Find Running Commit - Locate the exact commit Railway is using
 * Search through commits to find the one with version 9.0.0-correct-location
 */

const { execSync } = require('child_process');

async function findRunningCommit() {
  console.log('🔍 FINDING RUNNING COMMIT');
  console.log('Looking for commit with version: 9.0.0-correct-location');
  console.log('='.repeat(60));

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    // Get all commits from the repository
    const commitsCmd = `curl -s -H "Authorization: token ${githubToken}" "https://api.github.com/repos/EngageAutomations/oauth-backend/commits?per_page=100"`;
    const commitsResponse = execSync(commitsCmd, { encoding: 'utf8' });
    const commits = JSON.parse(commitsResponse);

    console.log(`📋 Found ${commits.length} commits to check`);

    // Check each commit for the correct version
    for (let i = 0; i < Math.min(commits.length, 20); i++) {
      const commit = commits[i];
      const sha = commit.sha;
      const shortSha = sha.substring(0, 7);
      const message = commit.commit.message;
      
      console.log(`\n🔍 Checking commit ${shortSha}: ${message.substring(0, 60)}...`);
      
      try {
        // Get package.json for this commit
        const packageCmd = `curl -s -H "Authorization: token ${githubToken}" "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json?ref=${sha}"`;
        const packageResponse = execSync(packageCmd, { encoding: 'utf8' });
        const packageData = JSON.parse(packageResponse);
        
        if (packageData.content) {
          const packageContent = Buffer.from(packageData.content, 'base64').toString('utf8');
          const packageJson = JSON.parse(packageContent);
          
          console.log(`   📦 Version: ${packageJson.version}`);
          
          // Check if this version matches what's running
          if (packageJson.version === '9.0.0-correct-location') {
            console.log('✅ FOUND MATCHING COMMIT!');
            console.log(`📍 SHA: ${sha}`);
            console.log(`📦 Version: ${packageJson.version}`);
            console.log(`📝 Message: ${message}`);
            
            // Get the index.js content from this commit
            const indexCmd = `curl -s -H "Authorization: token ${githubToken}" "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js?ref=${sha}"`;
            const indexResponse = execSync(indexCmd, { encoding: 'utf8' });
            const indexData = JSON.parse(indexResponse);
            
            const indexContent = Buffer.from(indexData.content, 'base64').toString('utf8');
            
            // Save this content to copy it as the latest commit
            require('fs').writeFileSync('running-version-index.js', indexContent);
            require('fs').writeFileSync('running-version-package.json', packageContent);
            
            console.log('💾 Saved running version files');
            console.log('📄 running-version-index.js');
            console.log('📄 running-version-package.json');
            
            return {
              sha,
              version: packageJson.version,
              message,
              indexContent,
              packageContent
            };
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking commit ${shortSha}: ${error.message}`);
      }
    }
    
    console.log('❌ Could not find commit with version 9.0.0-correct-location in recent commits');
    
    // Alternative: Check if the version is in index.js instead of package.json
    console.log('\n🔄 Checking index.js files for version strings...');
    
    for (let i = 0; i < Math.min(commits.length, 10); i++) {
      const commit = commits[i];
      const sha = commit.sha;
      const shortSha = sha.substring(0, 7);
      
      try {
        const indexCmd = `curl -s -H "Authorization: token ${githubToken}" "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/index.js?ref=${sha}"`;
        const indexResponse = execSync(indexCmd, { encoding: 'utf8' });
        const indexData = JSON.parse(indexResponse);
        
        if (indexData.content) {
          const indexContent = Buffer.from(indexData.content, 'base64').toString('utf8');
          
          if (indexContent.includes('9.0.0-correct-location')) {
            console.log(`✅ FOUND VERSION IN INDEX.JS: ${shortSha}`);
            
            require('fs').writeFileSync('running-version-index.js', indexContent);
            
            // Get package.json for this commit too
            const packageCmd = `curl -s -H "Authorization: token ${githubToken}" "https://api.github.com/repos/EngageAutomations/oauth-backend/contents/package.json?ref=${sha}"`;
            const packageResponse = execSync(packageCmd, { encoding: 'utf8' });
            const packageData = JSON.parse(packageResponse);
            const packageContent = Buffer.from(packageData.content, 'base64').toString('utf8');
            
            require('fs').writeFileSync('running-version-package.json', packageContent);
            
            return {
              sha,
              version: '9.0.0-correct-location',
              message: commit.commit.message,
              indexContent,
              packageContent
            };
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking index.js ${shortSha}: ${error.message}`);
      }
    }
    
    console.log('❌ Version 9.0.0-correct-location not found in recent commits');
    
  } catch (error) {
    console.error('❌ Find running commit failed:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
  }
}

findRunningCommit().catch(console.error);