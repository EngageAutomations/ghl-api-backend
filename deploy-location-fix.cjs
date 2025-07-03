/**
 * Deploy Location Fix to OAuth Backend
 * Use location_id from OAuth response instead of JWT extraction
 */

const fs = require('fs');

async function deployLocationFix() {
  console.log('🚀 DEPLOYING LOCATION FIX TO OAUTH BACKEND');
  console.log('Using location_id directly from GoHighLevel OAuth response');
  console.log('='.repeat(60));
  
  const enhancedOAuthBackend = `
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for installations
const installations = new Map();

// OAuth credentials
const CLIENT_ID = '68474924a586bce22a6e64f7';
const CLIENT_SECRET = 'mbpkmyu4';
const CLIENT_KEY = '68474924a586bce22a6e64f7-mbpkmyu4';

// OAuth callback - ENHANCED to capture location_id from response
app.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    console.error('❌ No authorization code provided');
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    console.log('🔄 Exchanging authorization code for tokens...');
    
    // Token exchange request
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        user_type: 'location',
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return res.status(400).json({ error: 'Token exchange failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');
    console.log('📊 Response fields:', Object.keys(tokenData));
    
    // CRITICAL: Extract location_id directly from response
    const locationId = tokenData.location_id;
    console.log('🎯 LOCATION ID FROM RESPONSE:', locationId);
    
    if (!locationId) {
      console.error('❌ No location_id in OAuth response');
      console.log('📋 Full response:', JSON.stringify(tokenData, null, 2));
    }

    // Create installation with correct location_id
    const installationId = \`install_\${Date.now()}\`;
    const installation = {
      id: installationId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      location_id: locationId, // ✅ Use location_id from response, not JWT
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    };

    installations.set(installationId, installation);
    
    console.log('💾 Installation stored:', installationId);
    console.log('📍 Location ID:', locationId);
    console.log('⏰ Expires at:', installation.expires_at);

    // Redirect to frontend with installation ID
    const frontendUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`;
    console.log('🚀 Redirecting to:', frontendUrl);
    
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed', details: error.message });
  }
});

// Get installation by ID
app.get('/api/installation/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  // Return installation without sensitive tokens for frontend
  res.json({
    id: installation.id,
    location_id: installation.location_id,
    created_at: installation.created_at,
    expires_at: installation.expires_at,
    active: new Date() < new Date(installation.expires_at)
  });
});

// Get access token for API calls (for API backend)
app.get('/api/token-access/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  // Check if token is still valid
  if (new Date() >= new Date(installation.expires_at)) {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.json({
    access_token: installation.access_token,
    location_id: installation.location_id,
    expires_at: installation.expires_at
  });
});

// List all installations
app.get('/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    location_id: inst.location_id,
    created_at: inst.created_at,
    expires_at: inst.expires_at,
    active: new Date() < new Date(inst.expires_at)
  }));
  
  res.json({
    count: installationList.length,
    installations: installationList
  });
});

// Token refresh system
async function refreshAccessToken(installationId) {
  const installation = installations.get(installationId);
  if (!installation) return;

  try {
    console.log(\`🔄 Refreshing token for \${installationId}\`);
    
    const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: installation.refresh_token,
        user_type: 'location'
      }).toString()
    });

    if (refreshResponse.ok) {
      const newTokenData = await refreshResponse.json();
      
      // Update installation with new tokens and location_id
      installation.access_token = newTokenData.access_token;
      installation.expires_in = newTokenData.expires_in;
      installation.expires_at = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();
      
      // Update location_id from refresh response if provided
      if (newTokenData.location_id) {
        installation.location_id = newTokenData.location_id;
        console.log('📍 Updated location ID from refresh:', newTokenData.location_id);
      }
      
      if (newTokenData.refresh_token) {
        installation.refresh_token = newTokenData.refresh_token;
      }
      
      installations.set(installationId, installation);
      console.log(\`✅ Token refreshed for \${installationId}\`);
    } else {
      console.error(\`❌ Token refresh failed for \${installationId}\`);
    }
  } catch (error) {
    console.error(\`❌ Token refresh error for \${installationId}:\`, error);
  }
}

// Background token refresh
cron.schedule('*/10 * * * *', () => {
  console.log('🔄 Checking tokens for refresh...');
  const now = new Date();
  
  for (const [id, installation] of installations) {
    const expiryTime = new Date(installation.expires_at);
    const timeUntilExpiry = expiryTime - now;
    const tenMinutes = 10 * 60 * 1000;
    
    if (timeUntilExpiry < tenMinutes && timeUntilExpiry > 0) {
      console.log(\`⏰ Token expiring soon for \${id}, refreshing...\`);
      refreshAccessToken(id);
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '8.4.0-location-fix',
    installations: installations.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 OAuth backend running on port \${PORT}\`);
  console.log('📍 Version: 8.4.0-location-fix');
  console.log('✅ Now capturing location_id from OAuth response');
});
`;

  // Write to Railway OAuth directory
  fs.writeFileSync('railway-backend/index.js', enhancedOAuthBackend);
  
  console.log('✅ Enhanced OAuth backend written to railway-backend/index.js');
  
  // Now push to GitHub to trigger Railway deployment
  console.log('\n🔄 PUSHING TO GITHUB TO DEPLOY...');
  
  const { execSync } = require('child_process');
  
  try {
    // Navigate to OAuth backend directory
    process.chdir('railway-backend');
    
    // Add and commit the changes
    execSync('git add index.js', { stdio: 'inherit' });
    execSync('git commit -m "v8.4.0-location-fix: Use location_id from OAuth response instead of JWT extraction"', { stdio: 'inherit' });
    
    // Push to trigger Railway deployment
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Successfully pushed to GitHub');
    console.log('⚡ Railway auto-deployment triggered');
    
  } catch (error) {
    console.error('❌ Git push failed:', error.message);
    console.log('📝 Manual deployment required - copy index.js to OAuth backend repository');
  }
  
  console.log('\n🔧 KEY CHANGES DEPLOYED:');
  console.log('1. Extract location_id directly from tokenData.location_id');
  console.log('2. Store location_id alongside access_token and refresh_token');
  console.log('3. Use response location_id instead of JWT authClassId');
  console.log('4. Enhanced logging to track location_id capture');
  console.log('5. Updated token refresh to also capture location_id');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Wait for Railway deployment to complete (~2 minutes)');
  console.log('2. Test fresh OAuth installation');
  console.log('3. Verify location_id is captured correctly from response');
  console.log('4. Test API calls with the new location_id');
  console.log('');
  console.log('🎯 EXPECTED OUTCOME:');
  console.log('OAuth response should provide valid location_id that works for API calls');
  console.log('No more SGtYHkPbOl2WJV08GOpg invalid location errors!');
}

deployLocationFix().catch(console.error);