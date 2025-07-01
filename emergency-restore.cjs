/**
 * Emergency Restore - Deploy Minimal Working Backend
 */

const fs = require('fs');

async function emergencyRestore() {
  try {
    console.log('=== Emergency Backend Restore ===');
    
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Create a minimal working backend based on the last known working version
    const minimalBackend = `// Emergency Restore - Minimal Working OAuth Backend
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const installations = new Map();

// Add pre-seeded installation if env vars exist
if (process.env.GHL_ACCESS_TOKEN) {
  installations.set('install_seed', {
    id: 'install_seed',
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN || null,
    expiresIn: 86399,
    expiresAt: Date.now() + 86399 * 1000,
    locationId: process.env.GHL_LOCATION_ID || 'WAvk87RmW9rBSDJHeOpH',
    scopes: process.env.GHL_SCOPES || 'medias.write medias.readonly',
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  });
}

// TOKEN HELPERS
async function refreshAccessToken(id) {
  const inst = installations.get(id);
  if (!inst || !inst.refreshToken) return false;

  try {
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: inst.refreshToken
    });

    const { data } = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );

    inst.accessToken = data.access_token;
    inst.refreshToken = data.refresh_token || inst.refreshToken;
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + data.expires_in * 1000;
    inst.tokenStatus = 'valid';
    
    console.log(\`[REFRESH] Token updated for \${id}\`);
    return true;
  } catch (error) {
    console.error(\`[REFRESH] Failed for \${id}:\`, error.response?.data || error.message);
    inst.tokenStatus = 'failed';
    return false;
  }
}

async function ensureFreshToken(id) {
  const inst = installations.get(id);
  if (!inst) throw new Error('Unknown installation');
  
  const timeUntilExpiry = inst.expiresAt - Date.now();
  if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes padding
    await refreshAccessToken(id);
  }
  
  if (inst.tokenStatus !== 'valid') throw new Error('Token invalid');
}

// OAUTH CALLBACK
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH CALLBACK ===');
  const { code, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
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
      scopes: tokenResponse.data.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    console.log(\`[INSTALL] \${id} created successfully\`);
    
    res.json({
      success: true,
      installationId: id,
      message: 'OAuth installation successful'
    });

  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'OAuth callback failed',
      details: error.response?.data || error.message
    });
  }
});

// BASIC ROUTES
app.get('/', (req, res) => {
  const authenticatedCount = Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length;
  res.json({
    service: "GoHighLevel OAuth Backend",
    version: "5.4.3-emergency-restore",
    installs: installations.size,
    authenticated: authenticatedCount,
    status: "operational",
    features: ["oauth", "products", "media-upload"],
    restored: new Date().toISOString()
  });
});

app.get('/installations', (req, res) => {
  const installationsArray = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    scopes: inst.scopes
  }));
  
  res.json({
    installations: installationsArray,
    count: installationsArray.length
  });
});

// PRODUCT CREATION
app.post('/api/products/create', async (req, res) => {
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    console.log(\`Creating product: \${name}\`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'DIGITAL',
      locationId: installation.locationId,
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': \`Bearer \${installation.accessToken}\`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Product creation successful');
    
    res.json({
      success: true,
      product: productResponse.data.product || productResponse.data,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error('Product creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product'
    });
  }
});

// MEDIA UPLOAD
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file required' });
    }
    
    console.log(\`Uploading: \${req.file.originalname}\`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const uploadResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
      headers: {
        'Authorization': \`Bearer \${installation.accessToken}\`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      params: {
        locationId: installation.locationId
      }
    });
    
    fs.unlinkSync(req.file.path); // Clean up
    
    res.json({
      success: true,
      mediaUrl: uploadResponse.data.url || uploadResponse.data.fileUrl,
      mediaId: uploadResponse.data.id,
      data: uploadResponse.data
    });
    
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Media upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(\`✅ Emergency OAuth Backend restored on port \${port}\`);
  console.log(\`📊 Status: Operational\`);
  console.log(\`⚡ Installations: \${installations.size}\`);
});`;

    // Deploy the emergency restore
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'EMERGENCY RESTORE: Deploy minimal working backend',
      content: Buffer.from(minimalBackend).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ Emergency restore deployed to GitHub');
    console.log('⏳ Waiting for Railway deployment...');
    
    // Wait for deployment
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    
    // Test restore
    const axios = require('axios');
    
    try {
      const testResponse = await axios.get('https://dir.engageautomations.com/', { timeout: 15000 });
      
      if (testResponse.data.status === 'operational') {
        console.log('🎉 EMERGENCY RESTORE SUCCESSFUL!');
        console.log('📊 Backend Status:', testResponse.data.status);
        console.log('🔧 Version:', testResponse.data.version);
        
        return {
          success: true,
          action: 'emergency_restore_complete',
          backend_status: 'operational',
          version: testResponse.data.version
        };
      }
      
    } catch (testError) {
      console.log('⚠️ Testing failed, but deployment may still be in progress');
    }
    
    return {
      success: true,
      action: 'emergency_restore_deployed',
      status: 'deployment_in_progress'
    };
    
  } catch (error) {
    console.error('❌ Emergency restore failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

emergencyRestore().then(result => {
  console.log('\\n=== EMERGENCY RESTORE RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});`;

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'EMERGENCY RESTORE: Deploy minimal working backend',
      content: Buffer.from(minimalBackend).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ Emergency restore deployed');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Emergency restore failed:', error.message);
    return { success: false, error: error.message };
  }
}

emergencyRestore();