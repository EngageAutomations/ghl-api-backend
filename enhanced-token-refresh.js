/**
 * Enhanced Token Refresh System for Production
 * Handles early token expiry and automatic renewal
 */

// Enhanced refresh system with early expiry detection
async function enhancedRefreshAccessToken(id) {
  const inst = installations.get(id);
  
  if (!inst) {
    console.log(`[REFRESH] Installation ${id} not found`);
    return false;
  }

  if (!inst.refreshToken) {
    console.log(`[REFRESH] No refresh token for ${id} - OAuth reinstall required`);
    inst.tokenStatus = 'refresh_required';
    return false;
  }

  try {
    console.log(`[REFRESH] Attempting token refresh for ${id}`);
    
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: inst.refreshToken
    });

    const { data } = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      body,
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
        timeout: 15000 
      }
    );

    // Update installation with new tokens
    inst.accessToken = data.access_token;
    inst.refreshToken = data.refresh_token || inst.refreshToken; // Keep old if new not provided
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + data.expires_in * 1000;
    inst.tokenStatus = 'valid';
    inst.lastRefresh = new Date().toISOString();
    
    console.log(`[REFRESH] ✅ Token refreshed successfully for ${id}`);
    console.log(`[REFRESH] New expiry: ${new Date(inst.expiresAt).toISOString()}`);
    
    // Schedule next refresh
    scheduleRefresh(id);
    
    return true;
    
  } catch (error) {
    console.error(`[REFRESH] ❌ Failed for ${id}:`, error.response?.data || error.message);
    
    if (error.response?.data?.error === 'invalid_grant') {
      console.log(`[REFRESH] Refresh token expired for ${id} - OAuth reinstall required`);
      inst.tokenStatus = 'refresh_expired';
    } else {
      inst.tokenStatus = 'refresh_failed';
    }
    
    return false;
  }
}

// Smart token validation with automatic refresh
async function ensureFreshTokenSmart(id) {
  const inst = installations.get(id);
  
  if (!inst) {
    throw new Error(`Installation ${id} not found`);
  }

  // Check if token is expired or will expire soon
  const timeUntilExpiry = inst.expiresAt - Date.now();
  const needsRefresh = timeUntilExpiry < (10 * 60 * 1000); // 10 minutes padding
  
  console.log(`[TOKEN] ${id} expires in ${Math.round(timeUntilExpiry / 60000)} minutes`);
  
  if (needsRefresh) {
    console.log(`[TOKEN] ${id} needs refresh - attempting automatic renewal`);
    
    const refreshSuccess = await enhancedRefreshAccessToken(id);
    
    if (!refreshSuccess) {
      throw new Error(`Token refresh failed for ${id} - OAuth reinstallation required`);
    }
  }

  // Test token validity with a lightweight API call
  try {
    await axios.get(`https://services.leadconnectorhq.com/locations/${inst.locationId}`, {
      headers: {
        'Authorization': `Bearer ${inst.accessToken}`,
        'Version': '2021-07-28'
      },
      timeout: 5000
    });
    
    console.log(`[TOKEN] ✅ ${id} token validated successfully`);
    inst.tokenStatus = 'valid';
    return true;
    
  } catch (validationError) {
    console.log(`[TOKEN] ❌ ${id} token validation failed:`, validationError.response?.data?.message || validationError.message);
    
    if (validationError.response?.status === 401) {
      console.log(`[TOKEN] ${id} token expired early - attempting refresh`);
      
      const refreshSuccess = await enhancedRefreshAccessToken(id);
      
      if (!refreshSuccess) {
        inst.tokenStatus = 'invalid';
        throw new Error(`Token invalid and refresh failed for ${id} - OAuth reinstallation required`);
      }
      
      return true;
    }
    
    throw validationError;
  }
}

// Enhanced refresh scheduling with shorter intervals
function scheduleRefreshSmart(id) {
  const inst = installations.get(id);
  if (!inst) return;

  // Clear existing refresh timer
  if (refreshers.has(id)) {
    clearTimeout(refreshers.get(id));
  }

  // Calculate time until refresh needed (refresh at 80% of token lifetime)
  const timeUntilExpiry = inst.expiresAt - Date.now();
  const refreshTime = Math.max(timeUntilExpiry * 0.8, 5 * 60 * 1000); // Minimum 5 minutes
  
  console.log(`[SCHEDULE] ${id} refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);

  const timer = setTimeout(async () => {
    console.log(`[SCHEDULE] Executing scheduled refresh for ${id}`);
    await enhancedRefreshAccessToken(id);
  }, refreshTime);

  refreshers.set(id, timer);
}

// Production-ready middleware for API calls
function requireValidToken(req, res, next) {
  const installationId = req.method === 'GET' ? req.query.installation_id : req.body.installation_id;
  
  if (!installationId) {
    return res.status(400).json({ 
      success: false, 
      error: 'installation_id required',
      action: 'complete_oauth_installation'
    });
  }

  const inst = installations.get(installationId);
  
  if (!inst) {
    return res.status(404).json({ 
      success: false, 
      error: `Installation ${installationId} not found`,
      action: 'complete_oauth_installation'
    });
  }

  // Enhanced token validation
  ensureFreshTokenSmart(installationId)
    .then(() => {
      req.installation = inst;
      next();
    })
    .catch(error => {
      console.error(`[MIDDLEWARE] Token validation failed for ${installationId}:`, error.message);
      
      res.status(401).json({
        success: false,
        error: 'Token validation failed',
        details: error.message,
        action: 'complete_oauth_installation',
        installation_id: installationId
      });
    });
}

// Health check endpoint for token status
app.get('/api/token-health/:id', async (req, res) => {
  const { id } = req.params;
  const inst = installations.get(id);
  
  if (!inst) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  const timeUntilExpiry = inst.expiresAt - Date.now();
  
  res.json({
    installation_id: id,
    token_status: inst.tokenStatus,
    expires_at: inst.expiresAt,
    expires_in_minutes: Math.round(timeUntilExpiry / 60000),
    has_refresh_token: !!inst.refreshToken,
    last_refresh: inst.lastRefresh || 'never',
    needs_refresh: timeUntilExpiry < (10 * 60 * 1000),
    health: timeUntilExpiry > 0 ? 'healthy' : 'expired'
  });
});

// Manual refresh endpoint for emergencies
app.post('/api/refresh-token/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await enhancedRefreshAccessToken(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        installation_id: id,
        expires_at: installations.get(id).expiresAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Refresh failed - OAuth reinstallation required',
        installation_id: id
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Refresh attempt failed',
      details: error.message
    });
  }
});

module.exports = {
  enhancedRefreshAccessToken,
  ensureFreshTokenSmart,
  scheduleRefreshSmart,
  requireValidToken
};