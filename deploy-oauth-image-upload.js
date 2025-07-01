/**
 * Deploy Image Upload Endpoint to OAuth Backend
 * Adds image upload functionality to the OAuth backend where tokens are stored
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';

async function deployOAuthImageUpload() {
  console.log('=== Deploying Image Upload to OAuth Backend ===');
  
  try {
    // Check environment
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN environment variable not found');
      console.log('Please provide your GitHub personal access token for deployment');
      return;
    }
    
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    // Repository details
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    const branch = 'main';
    
    console.log('1. Fetching current OAuth backend content...');
    
    // Get current index.js from OAuth backend
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    const currentContent = Buffer.from(currentFile.content, 'base64').toString();
    console.log('✅ Current OAuth backend content fetched');
    console.log('   File size:', currentContent.length, 'characters');
    
    // Enhanced OAuth backend with image upload endpoint
    const enhancedBackend = `/**
 * Enhanced OAuth Backend v5.9.0-image-upload
 * Adds GoHighLevel image upload functionality with proper token management
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration  
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Enhanced in-memory installation storage with token management
const installations = new Map();

// Token refresh utility
async function ensureFreshToken(installation) {
  console.log(\`Checking token freshness for \${installation.id}\`);
  
  const now = Date.now();
  const timeUntilExpiry = installation.expiresAt - now;
  const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
  
  console.log(\`Token expires in \${hoursUntilExpiry.toFixed(2)} hours\`);
  
  // Refresh if expiring within 2 hours
  if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
    console.log('Token expiring soon, refreshing...');
    
    try {
      const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.GHL_CLIENT_ID,
          client_secret: process.env.GHL_CLIENT_SECRET,
          refresh_token: installation.refreshToken
        })
      });

      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        installation.accessToken = tokenData.access_token;
        installation.expiresAt = now + (tokenData.expires_in * 1000);
        installation.tokenStatus = 'valid';
        
        console.log('✅ Token refreshed successfully');
        return installation.accessToken;
      } else {
        console.error('❌ Token refresh failed:', refreshResponse.status);
        installation.tokenStatus = 'expired';
        return null;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      installation.tokenStatus = 'error';
      return null;
    }
  }
  
  return installation.accessToken;
}

// OAuth callback endpoint
app.get('/oauth/callback', async (req, res) => {
  console.log('=== OAuth Callback Hit ===');
  const { code, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(\`https://listings.engageautomations.com/?error=\${encodeURIComponent(error)}\`);
  }
  
  if (!code) {
    console.log('No code parameter - test endpoint');
    return res.send('OAuth callback endpoint is working!');
  }
  
  try {
    console.log('🔄 Exchanging authorization code for access token...');
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code: String(code),
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(\`Token exchange failed: \${tokenResponse.status}\`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Fetch user and location information
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': \`Bearer \${tokenData.access_token}\`,
        'Version': '2021-07-28'
      }
    });

    const userData = await userResponse.json();
    
    // Get location data
    const locationResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': \`Bearer \${tokenData.access_token}\`,
        'Version': '2021-07-28'
      }
    });

    let locationData = null;
    if (locationResponse.ok) {
      const locationResult = await locationResponse.json();
      if (locationResult.locations && locationResult.locations.length > 0) {
        locationData = locationResult.locations[0];
      }
    }

    // Store installation data
    const installationId = \`install_\${Date.now()}\`;
    const expiryTime = Date.now() + (tokenData.expires_in * 1000);
    
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiryTime,
      tokenStatus: 'valid',
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.name || \`\${userData.firstName || ''} \${userData.lastName || ''}\`.trim(),
      locationId: locationData?.id || '',
      locationName: locationData?.name || '',
      scopes: tokenData.scope || '',
      createdAt: new Date().toISOString()
    };
    
    installations.set(installationId, installation);
    
    console.log('✅ Installation stored:', installationId);
    console.log('   Location ID:', installation.locationId);
    console.log('   User:', installation.userName);
    
    // Redirect to frontend with success
    const redirectUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`;
    console.log('🎉 Redirecting to frontend:', redirectUrl);
    return res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    const errorUrl = \`https://listings.engageautomations.com/?error=oauth_failed&message=\${encodeURIComponent(error.message)}\`;
    return res.redirect(errorUrl);
  }
});

// Image Upload API Endpoint
app.post('/api/images/upload', upload.single('file'), async (req, res) => {
  console.log('=== Image Upload Request ===');
  
  try {
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
    
    // Get installation
    const installation = installations.get(installation_id);
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Installation not found',
        available_installations: Array.from(installations.keys())
      });
    }
    
    console.log(\`Using installation \${installation_id} with location \${installation.locationId}\`);
    
    // Ensure fresh token
    const accessToken = await ensureFreshToken(installation);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'OAuth token invalid or expired',
        tokenStatus: installation.tokenStatus
      });
    }
    
    // Create form data for GoHighLevel API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    console.log('🚀 Uploading to GoHighLevel media library...');
    
    // Upload to GoHighLevel using the correct API endpoint
    const uploadResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('✅ Image uploaded to GoHighLevel successfully!');
    console.log('Media response:', uploadResponse.data);
    
    res.json({
      success: true,
      media: uploadResponse.data,
      installation: {
        id: installation_id,
        locationId: installation.locationId,
        tokenStatus: installation.tokenStatus
      },
      message: 'Image uploaded to GoHighLevel media library successfully'
    });
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'GoHighLevel API error',
        details: error.response.data,
        ghl_status: error.response.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Image upload failed',
        details: error.message
      });
    }
  }
});

// List Media Files API
app.get('/api/images/list', async (req, res) => {
  try {
    const { installation_id, limit = 20, offset = 0 } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    const installation = installations.get(installation_id);
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }
    
    // Ensure fresh token
    const accessToken = await ensureFreshToken(installation);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'OAuth token invalid or expired'
      });
    }
    
    // Get media files from GoHighLevel
    const mediaResponse = await axios.get('https://services.leadconnectorhq.com/medias/', {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Version': '2021-07-28'
      },
      params: { limit, offset }
    });
    
    res.json({
      success: true,
      media: mediaResponse.data.medias || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: mediaResponse.data.total || 0
      }
    });
    
  } catch (error) {
    console.error('Media list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list media files'
    });
  }
});

// Installations endpoint
app.get('/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    locationName: inst.locationName,
    userName: inst.userName,
    userEmail: inst.userEmail,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    timeUntilExpiry: inst.expiresAt - Date.now()
  }));
  
  res.json({
    installations: installationList,
    count: installationList.length,
    frontend: 'https://listings.engageautomations.com',
    note: 'OAuth backend with image upload functionality'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '5.9.0-image-upload',
    features: ['oauth', 'token-refresh', 'image-upload', 'media-listing'],
    installations: installations.size,
    timestamp: Date.now()
  });
});

// Start server
app.listen(port, () => {
  console.log(\`OAuth Backend v5.9.0-image-upload running on port \${port}\`);
  console.log('Features: OAuth + Token Refresh + Image Upload');
  console.log('Image upload endpoint: POST /api/images/upload');
  console.log('Media listing endpoint: GET /api/images/list');
});`;
    
    console.log('2. Deploying enhanced OAuth backend...');
    
    // Deploy the enhanced backend
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'Deploy v5.9.0-image-upload: Add GoHighLevel image upload functionality',
      content: Buffer.from(enhancedBackend).toString('base64'),
      sha: currentFile.sha,
      branch
    });
    
    console.log('✅ Enhanced OAuth backend deployed successfully!');
    console.log('');
    console.log('🚀 Deployment Summary:');
    console.log('   Version: v5.9.0-image-upload');
    console.log('   Repository: https://github.com/EngageAutomations/oauth-backend');
    console.log('   Features Added:');
    console.log('   - POST /api/images/upload (with multer file handling)');
    console.log('   - GET /api/images/list (media library listing)');
    console.log('   - Enhanced token refresh before GoHighLevel API calls');
    console.log('   - Proper error handling and detailed logging');
    console.log('');
    console.log('⏱️ Railway deployment will begin automatically...');
    console.log('🔗 OAuth Backend: https://dir.engageautomations.com/');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Wait 2-3 minutes for Railway deployment');
    console.log('2. Test image upload with existing installation');
    console.log('3. Verify media library integration');
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run deployment
deployOAuthImageUpload();