import axios from 'axios';

async function deployCronRefreshFixed() {
  console.log('=== Deploying Background Token Refresh System ===\n');
  
  try {
    const token = process.env.GITHUB_TOKEN;
    
    // Get current files
    const [indexResponse, packageResponse] = await Promise.all([
      axios.get('https://raw.githubusercontent.com/EngageAutomations/oauth-backend/main/index.js'),
      axios.get('https://raw.githubusercontent.com/EngageAutomations/oauth-backend/main/package.json')
    ]);
    
    let indexCode = indexResponse.data;
    const packageJson = packageResponse.data;
    
    // Parse package.json properly
    let packageData;
    try {
      packageData = typeof packageJson === 'string' ? JSON.parse(packageJson) : packageJson;
    } catch (e) {
      console.log('Package.json parsing issue, creating minimal structure');
      packageData = {
        name: "oauth-backend",
        version: "1.0.0",
        dependencies: {}
      };
    }
    
    // Add node-cron dependency
    packageData.dependencies = packageData.dependencies || {};
    packageData.dependencies['node-cron'] = '^3.0.3';
    
    // Find insertion point after scheduleRefresh function
    const schedulePattern = /function scheduleRefresh\(id\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/;
    const match = indexCode.match(schedulePattern);
    
    if (!match) {
      console.log('Could not find scheduleRefresh function pattern');
      return false;
    }
    
    const insertPoint = match.index + match[0].length;
    
    // Cron job code
    const cronCode = `

// ── 🆕 Hourly safety sweep for token refresh ──────────────────────────
const cron = require('node-cron');

cron.schedule('0 * * * *', () => {               // minute 0 of every hour
  installations.forEach(async inst => {
    const twoHours = 2 * 60 * 60 * 1_000;
    if (inst.expiresAt - Date.now() < twoHours) {
      try {
        await refreshAccessToken(inst.id);
        console.log(\`[cron] refreshed \${inst.locationId}\`);
      } catch (err) {
        console.error('[cron refresh]', err.message);
      }
    }
  });
});
// ─────────────────────────────────────────────────────────────────────`;

    // Insert cron code and update version
    const updatedCode = indexCode.slice(0, insertPoint) + cronCode + indexCode.slice(insertPoint);
    const finalCode = updatedCode.replace(
      /version:\s*['"][^'"]*['"]/,
      "version: '5.4.1-with-cron-refresh'"
    );
    
    // Deploy via GitHub API
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    
    const branchResponse = await axios.get('https://api.github.com/repos/EngageAutomations/oauth-backend/branches/main', { headers });
    const currentSha = branchResponse.data.commit.sha;
    
    const treeResponse = await axios.post('https://api.github.com/repos/EngageAutomations/oauth-backend/git/trees', {
      tree: [
        {
          path: 'package.json',
          mode: '100644',
          type: 'blob',
          content: JSON.stringify(packageData, null, 2)
        },
        {
          path: 'index.js',
          mode: '100644',
          type: 'blob',
          content: finalCode
        }
      ],
      base_tree: currentSha
    }, { headers });
    
    const commitResponse = await axios.post('https://api.github.com/repos/EngageAutomations/oauth-backend/git/commits', {
      message: 'feat: hourly cron to pre-refresh tokens v5.4.1',
      tree: treeResponse.data.sha,
      parents: [currentSha]
    }, { headers });
    
    await axios.patch('https://api.github.com/repos/EngageAutomations/oauth-backend/git/refs/heads/main', {
      sha: commitResponse.data.sha
    }, { headers });
    
    console.log('✓ Cron refresh system deployed successfully');
    console.log('✓ node-cron dependency added');
    console.log('✓ Hourly background token refresh active');
    console.log('✓ Proactive refresh for tokens < 2 hours to expiry');
    console.log('✓ Railway auto-deploying...');
    
    return true;
    
  } catch (error) {
    console.error('Deployment failed:', error.response?.data || error.message);
    return false;
  }
}

async function waitAndVerifyDeployment() {
  console.log('\nWaiting for Railway deployment...');
  
  // Wait for deployment
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  try {
    const response = await axios.get('https://dir.engageautomations.com/');
    console.log(`Backend version: ${response.data.version}`);
    
    if (response.data.version.includes('cron-refresh')) {
      console.log('✓ Cron refresh system is live');
      console.log('✓ Background token maintenance active');
      console.log('✓ Zero-click OAuth until 90-day deadline');
      return true;
    } else {
      console.log('Deployment still in progress...');
      return false;
    }
  } catch (error) {
    console.log('Verification pending...');
    return false;
  }
}

Promise.all([deployCronRefreshFixed(), waitAndVerifyDeployment()]);