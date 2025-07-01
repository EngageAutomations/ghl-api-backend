/**
 * Quick Emergency Restore - Deploy Working Backend
 */

async function quickRestore() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Minimal working backend
    const workingBackend = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const installations = new Map();

// Basic status endpoint
app.get('/', (req, res) => {
  res.json({
    service: "GoHighLevel OAuth Backend",
    version: "5.4.3-emergency-restore",
    status: "operational",
    features: ["oauth", "basic-api"],
    restored: new Date().toISOString()
  });
});

// OAuth callback
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    });

    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const id = \`install_\${Date.now()}\`;
    installations.set(id, {
      id,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
      expiresAt: Date.now() + tokenResponse.data.expires_in * 1000,
      locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      installationId: id,
      message: 'OAuth installation successful'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'OAuth callback failed',
      details: error.response?.data || error.message
    });
  }
});

// Installations endpoint
app.get('/installations', (req, res) => {
  const installationsArray = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt
  }));
  
  res.json({
    installations: installationsArray,
    count: installationsArray.length
  });
});

app.listen(port, () => {
  console.log(\`Emergency OAuth Backend restored on port \${port}\`);
});`;

    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'EMERGENCY: Deploy minimal working backend to restore service',
      content: Buffer.from(workingBackend).toString('base64'),
      sha: currentFile.sha
    });

    console.log('Emergency restore deployed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Emergency restore failed:', error.message);
    return { success: false, error: error.message };
  }
}

quickRestore();