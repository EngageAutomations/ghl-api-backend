/**
 * Deploy Image Upload API to Railway Backend
 * Add media upload functionality with proper multipart handling
 */

async function deployImageUploadAPI() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Deploying Image Upload API ===');
    
    // Update package.json to include multer dependency
    const packageJson = {
      "name": "ghl-oauth-backend",
      "version": "5.9.0",
      "description": "GoHighLevel OAuth Backend with Image Upload API",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5", 
        "axios": "^1.6.0",
        "multer": "^1.4.5",
        "form-data": "^4.0.0"
      },
      "engines": {
        "node": ">=16"
      }
    };

    // Update package.json with multer dependency
    const { data: currentPackage } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'package.json'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'package.json',
      message: 'Add multer and form-data dependencies for image upload API',
      content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
      sha: currentPackage.sha
    });

    console.log('✅ Package.json updated with image upload dependencies');

    // Deploy the enhanced backend with image upload API
    const backendCode = `const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

const installations = new Map();

// OAUTH CALLBACK - Process and redirect to frontend
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH CALLBACK ===');
  const { code, error, state } = req.query;
  
  if (error) {
    console.error('OAuth error received:', error);
    const errorUrl = \`https://listings.engageautomations.com/oauth-error?error=\${encodeURIComponent(error)}\`;
    return res.redirect(302, errorUrl);
  }
  
  if (!code) {
    console.error('No authorization code provided');
    return res.redirect(302, 'https://listings.engageautomations.com/oauth-error?error=missing_code');
  }

  try {
    console.log('Processing OAuth code:', code.substring(0, 8) + '...');
    
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    });

    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    const installationId = \`install_\${Date.now()}\`;
    const installationData = {
      id: installationId,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
      expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000),
      locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenResponse.data.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    };
    
    installations.set(installationId, installationData);
    console.log(\`[INSTALL] ✅ \${installationId} created successfully\`);
    
    const frontendUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`;
    res.redirect(302, frontendUrl);

  } catch (error) {
    console.error('OAuth processing error:', error.response?.data || error.message);
    const errorParams = new URLSearchParams({
      error: 'oauth_processing_failed',
      details: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    res.redirect(302, \`https://listings.engageautomations.com/oauth-error?\${errorParams}\`);
  }
});

// TOKEN MANAGEMENT FUNCTIONS
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
    inst.expiresAt = Date.now() + (data.expires_in * 1000);
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
  if (timeUntilExpiry < 5 * 60 * 1000) {
    await refreshAccessToken(id);
  }
  
  if (inst.tokenStatus !== 'valid') throw new Error('Token invalid');
  return inst;
}

// AUTO-RETRY API WRAPPER
async function makeGHLAPICall(installationId, requestConfig, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const installation = await ensureFreshToken(installationId);
      
      const config = {
        ...requestConfig,
        headers: {
          'Authorization': \`Bearer \${installation.accessToken}\`,
          'Version': '2021-07-28',
          ...requestConfig.headers
        },
        timeout: 30000
      };
      
      const response = await axios(config);
      console.log(\`[API] Success on attempt \${attempt}\`);
      return response;
      
    } catch (error) {
      console.log(\`[API] Attempt \${attempt} failed:\`, error.response?.status, error.response?.data?.message || error.message);
      
      if (error.response?.status === 401 && attempt < maxRetries) {
        console.log(\`[RETRY] Token expired, refreshing and retrying...\`);
        await refreshAccessToken(installationId);
        continue;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

// IMAGE UPLOAD API ENDPOINT
app.post('/api/images/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('=== IMAGE UPLOAD REQUEST ===');
    
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    const installation = await ensureFreshToken(installation_id);
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    formData.append('locationId', installation.locationId);
    
    console.log(\`[UPLOAD] Uploading \${req.file.originalname} (\${req.file.size} bytes) to GoHighLevel...\`);
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/medias/upload-file',
      data: formData,
      headers: {
        ...formData.getHeaders(),
        'Content-Type': \`multipart/form-data; boundary=\${formData.getBoundary()}\`
      }
    });
    
    console.log('[UPLOAD] ✅ Upload successful:', response.data);
    
    res.json({
      success: true,
      media: response.data,
      message: 'Image uploaded successfully to GoHighLevel media library'
    });
    
  } catch (error) {
    console.error('[UPLOAD] Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to upload image to GoHighLevel'
    });
  }
});

// GET MEDIA FILES
app.get('/api/images/list', async (req, res) => {
  try {
    const { installation_id, limit = 20, offset = 0 } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    const installation = await ensureFreshToken(installation_id);
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'GET',
      url: \`https://services.leadconnectorhq.com/medias/?locationId=\${installation.locationId}&limit=\${limit}&offset=\${offset}\`
    });
    
    res.json({
      success: true,
      media: response.data,
      message: 'Media files retrieved successfully'
    });
    
  } catch (error) {
    console.error('[MEDIA LIST] Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to retrieve media files'
    });
  }
});

// HEALTH CHECK
app.get('/', (req, res) => {
  const html = \`
<!DOCTYPE html>
<html>
<head>
    <title>GoHighLevel OAuth Backend</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .status { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .feature { display: inline-block; background: #e7f3ff; padding: 8px 16px; margin: 5px; border-radius: 20px; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 GoHighLevel OAuth Backend</h1>
        <p>Version 5.9.0-image-upload | Status: Operational</p>
    </div>
    
    <div class="status">
        <h3>System Status</h3>
        <p><strong>Installations:</strong> \${installations.size}</p>
        <p><strong>Authenticated:</strong> \${Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length}</p>
        <p><strong>Frontend:</strong> <a href="https://listings.engageautomations.com">listings.engageautomations.com</a></p>
        <p><strong>Last Updated:</strong> \${new Date().toISOString()}</p>
    </div>
    
    <h3>🚀 Features</h3>
    <div class="feature">OAuth Processing</div>
    <div class="feature">Frontend Redirect</div>
    <div class="feature">Image Upload</div>
    <div class="feature">Auto-Retry System</div>
    
    <h3>📡 API Endpoints</h3>
    <div class="endpoint"><strong>POST</strong> /api/images/upload - Upload images to media library (multipart/form-data)</div>
    <div class="endpoint"><strong>GET</strong> /api/images/list - List media files with pagination</div>
    <div class="endpoint"><strong>POST</strong> /api/products/create - Create products with auto-retry</div>
    <div class="endpoint"><strong>GET</strong> /installations - View installations</div>
</body>
</html>
\`;
  
  res.send(html);
});

// INSTALLATIONS ENDPOINT
app.get('/installations', (req, res) => {
  const installationsArray = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    timeUntilExpiry: Math.max(0, Math.round((inst.expiresAt - Date.now()) / 1000))
  }));
  
  res.json({
    installations: installationsArray,
    count: installationsArray.length,
    frontend: 'https://listings.engageautomations.com'
  });
});

// PRODUCT CREATION WITH AUTO-RETRY
app.post('/api/products/create', async (req, res) => {
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    const installation = await ensureFreshToken(installation_id);
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'DIGITAL',
      locationId: installation.locationId,
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productData,
      headers: { 'Content-Type': 'application/json' }
    });
    
    res.json({
      success: true,
      product: response.data.product || response.data,
      message: 'Product created successfully with auto-retry protection'
    });
    
  } catch (error) {
    console.error('[PRODUCT] Creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product after retries'
    });
  }
});

app.listen(port, () => {
  console.log(\`✅ OAuth Backend v5.9.0-image-upload running on port \${port}\`);
  console.log(\`🔗 OAuth processing with frontend redirect\`);
  console.log(\`📷 Image upload API with multipart form support\`);
  console.log(\`🔄 Auto-retry system with 3 attempts\`);
});`;

    // Deploy the enhanced backend with image upload
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'v5.9.0-image-upload: Add image upload API with multer support',
      content: Buffer.from(backendCode).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ Image upload API deployed to Railway backend');
    console.log('📷 Added multipart file upload support with multer');
    console.log('🔄 Enhanced with auto-retry protection for media uploads');
    
    return { success: true, version: '5.9.0-image-upload' };
    
  } catch (error) {
    console.error('❌ Image upload API deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

deployImageUploadAPI();