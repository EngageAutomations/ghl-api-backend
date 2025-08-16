const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Database setup
const dbPath = process.env.DATABASE_PATH || './oauth_installations.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database:', dbPath);
});

// Initialize database schema
db.serialize(() => {
  // Installations table
  db.run(`CREATE TABLE IF NOT EXISTS installations (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    company_name TEXT,
    location_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    timezone TEXT,
    business_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // OAuth tokens table
  db.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    installation_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_in INTEGER,
    expires_at DATETIME,
    scope TEXT,
    location_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (installation_id) REFERENCES installations (id)
  )`);

  // Activity log table
  db.run(`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    installation_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (installation_id) REFERENCES installations (id)
  )`);

  // Shared user profiles table
  db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ghl_user_id TEXT UNIQUE NOT NULL,
    location_id TEXT,
    company_id TEXT,
    email TEXT,
    name TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    apps_used TEXT, -- JSON array of app IDs
    app_data TEXT   -- JSON object with app-specific data
  )`);

  // Create indexes for user profiles
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_ghl_id ON user_profiles(ghl_user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_email ON user_profiles(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_location ON user_profiles(location_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_user_updated ON user_profiles(updated_at)`);

  console.log('✅ Database schema initialized (including shared user profiles)');
});

// Database helper functions
const dbHelpers = {
  // Save installation
  saveInstallation: (data) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT OR REPLACE INTO installations 
        (id, location_id, company_name, location_name, address, city, state, postal_code, country, phone, email, website, timezone, business_type, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
      
      stmt.run([
        data.id, data.location_id, data.company_name, data.location_name,
        data.address, data.city, data.state, data.postal_code, data.country,
        data.phone, data.email, data.website, data.timezone, data.business_type
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  },

  // Save OAuth token
  saveToken: (data) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT OR REPLACE INTO oauth_tokens 
        (installation_id, access_token, refresh_token, token_type, expires_in, expires_at, scope, location_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      stmt.run([
        data.installation_id, data.access_token, data.refresh_token,
        data.token_type, data.expires_in, data.expires_at, data.scope, data.location_id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  },

  // Get installation by ID
  getInstallation: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT i.*, t.access_token, t.expires_at, t.scope
              FROM installations i
              LEFT JOIN oauth_tokens t ON i.id = t.installation_id
              WHERE i.id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get all installations
  getAllInstallations: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT i.*, t.access_token IS NOT NULL as has_token, t.expires_at
              FROM installations i
              LEFT JOIN oauth_tokens t ON i.id = t.installation_id
              ORDER BY i.created_at DESC`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Log activity
  logActivity: (installation_id, action, details) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO activity_log (installation_id, action, details) VALUES (?, ?, ?)`);
      stmt.run([installation_id, action, JSON.stringify(details)], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  },

  // Token refresh helpers
  getTokensExpiringSoon: (minutesAhead = 30) => {
    return new Promise((resolve, reject) => {
      const futureTime = new Date(Date.now() + minutesAhead * 60 * 1000).toISOString();
      db.all(`SELECT i.*, t.* FROM installations i
              JOIN oauth_tokens t ON i.id = t.installation_id
              WHERE t.expires_at <= ? AND t.expires_at > datetime('now')
              ORDER BY t.expires_at ASC`, [futureTime], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getExpiredTokens: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT i.*, t.* FROM installations i
              JOIN oauth_tokens t ON i.id = t.installation_id
              WHERE t.expires_at <= datetime('now')
              ORDER BY t.expires_at ASC`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  updateTokenAfterRefresh: (installationId, tokenData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`UPDATE oauth_tokens 
        SET access_token = ?, refresh_token = ?, expires_in = ?, expires_at = ?, 
            token_type = ?, scope = ?, created_at = CURRENT_TIMESTAMP
        WHERE installation_id = ?`);
      
      stmt.run([
        tokenData.access_token, tokenData.refresh_token, tokenData.expires_in,
        tokenData.expires_at, tokenData.token_type || 'Bearer', 
        tokenData.scope, installationId
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
      stmt.finalize();
    });
  },

  getTokenStats: () => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT 
        COUNT(*) as total_tokens,
        COUNT(CASE WHEN expires_at > datetime('now') THEN 1 END) as valid_tokens,
        COUNT(CASE WHEN expires_at <= datetime('now') THEN 1 END) as expired_tokens,
        COUNT(CASE WHEN expires_at <= datetime('now', '+30 minutes') AND expires_at > datetime('now') THEN 1 END) as expiring_soon,
        COUNT(CASE WHEN refresh_token IS NOT NULL THEN 1 END) as refreshable_tokens
        FROM oauth_tokens`, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // User profile helpers
  saveUserProfile: (data) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT OR REPLACE INTO user_profiles 
        (ghl_user_id, location_id, company_id, email, name, phone, created_at, updated_at, apps_used, app_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      stmt.run([
        data.ghl_user_id, data.location_id, data.company_id, data.email,
        data.name, data.phone, data.created_at, data.updated_at,
        JSON.stringify(data.apps_used || []), JSON.stringify(data.app_data || {})
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  },

  getUserProfile: (ghlUserId) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM user_profiles WHERE ghl_user_id = ?`, [ghlUserId], (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            row.apps_used = JSON.parse(row.apps_used || '[]');
            row.app_data = JSON.parse(row.app_data || '{}');
          }
          resolve(row);
        }
      });
    });
  },

  getUserProfileByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM user_profiles WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            row.apps_used = JSON.parse(row.apps_used || '[]');
            row.app_data = JSON.parse(row.app_data || '{}');
          }
          resolve(row);
        }
      });
    });
  },

  updateUserProfile: (ghlUserId, data) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`UPDATE user_profiles SET
        location_id = ?, company_id = ?, email = ?, name = ?, phone = ?,
        updated_at = ?, apps_used = ?, app_data = ?
        WHERE ghl_user_id = ?`);
      
      stmt.run([
        data.location_id, data.company_id, data.email, data.name, data.phone,
        data.updated_at, JSON.stringify(data.apps_used || []), JSON.stringify(data.app_data || {}),
        ghlUserId
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
      stmt.finalize();
    });
  },

  searchUserProfiles: (criteria) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM user_profiles WHERE 1=1';
      const params = [];

      if (criteria.email) {
        query += ' AND email LIKE ?';
        params.push(`%${criteria.email}%`);
      }
      if (criteria.name) {
        query += ' AND name LIKE ?';
        params.push(`%${criteria.name}%`);
      }
      if (criteria.location_id) {
        query += ' AND location_id = ?';
        params.push(criteria.location_id);
      }
      if (criteria.company_id) {
        query += ' AND company_id = ?';
        params.push(criteria.company_id);
      }

      query += ' ORDER BY updated_at DESC LIMIT 100';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const profiles = rows.map(row => {
            row.apps_used = JSON.parse(row.apps_used || '[]');
            row.app_data = JSON.parse(row.app_data || '{}');
            return row;
          });
          resolve(profiles);
        }
      });
    });
  },

  getUserStats: () => {
    return new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM user_profiles', (err, totalResult) => {
        if (err) reject(err);
        else {
          db.get(`SELECT COUNT(*) as recent_users FROM user_profiles 
                  WHERE updated_at >= datetime('now', '-30 days')`, (err, recentResult) => {
            if (err) reject(err);
            else {
              resolve({
                total_users: totalResult.total,
                recent_activity: recentResult.recent_users
              });
            }
          });
        }
      });
    });
  }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GoHighLevel OAuth Database Service with Shared User Profiles',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: 'connected',
    features: [
      'OAuth Installation Management',
      'Token Storage & Management',
      'Shared User Profiles',
      'Cross-App User Tracking',
      'Activity Logging'
    ],
    endpoints: {
      installations: [
        'POST /api/installations',
        'GET /api/installations',
        'GET /api/installations/:id',
        'PUT /api/installations/:id',
        'DELETE /api/installations/:id'
      ],
      tokens: [
        'POST /api/tokens'
      ],
      user_profiles: [
        'POST /api/user-profiles',
        'GET /api/user-profiles/:ghlUserId',
        'PUT /api/user-profiles/:ghlUserId',
        'GET /api/user-profiles/by-email/:email',
        'GET /api/user-profiles/by-app/:appId',
        'POST /api/user-profiles/search',
        'GET /api/user-profiles/stats',
        'DELETE /api/user-profiles/:ghlUserId'
      ],
      utility: [
        'GET /health',
        'GET /api/export',
        'GET /api/activity/:installation_id'
      ]
    }
  });
});

// Save installation
app.post('/api/installations', async (req, res) => {
  try {
    const result = await dbHelpers.saveInstallation(req.body);
    await dbHelpers.logActivity(req.body.id, 'installation_created', req.body);
    
    res.status(201).json({
      success: true,
      message: 'Installation saved successfully',
      id: req.body.id
    });
  } catch (error) {
    console.error('Save installation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save installation',
      details: error.message
    });
  }
});

// Get installation by ID
app.get('/api/installations/:id', async (req, res) => {
  try {
    const installation = await dbHelpers.getInstallation(req.params.id);
    
    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found'
      });
    }

    res.json({
      success: true,
      data: installation
    });
  } catch (error) {
    console.error('Get installation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve installation',
      details: error.message
    });
  }
});

// Get all installations
app.get('/api/installations', async (req, res) => {
  try {
    const installations = await dbHelpers.getAllInstallations();
    
    res.json({
      success: true,
      count: installations.length,
      data: installations
    });
  } catch (error) {
    console.error('Get installations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve installations',
      details: error.message
    });
  }
});

// Save OAuth token
app.post('/api/tokens', async (req, res) => {
  try {
    const result = await dbHelpers.saveToken(req.body);
    await dbHelpers.logActivity(req.body.installation_id, 'token_saved', {
      token_type: req.body.token_type,
      expires_in: req.body.expires_in
    });
    
    res.status(201).json({
      success: true,
      message: 'Token saved successfully',
      id: result
    });
  } catch (error) {
    console.error('Save token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save token',
      details: error.message
    });
  }
});

// Update installation
app.put('/api/installations/:id', async (req, res) => {
  try {
    const data = { ...req.body, id: req.params.id };
    await dbHelpers.saveInstallation(data);
    await dbHelpers.logActivity(req.params.id, 'installation_updated', req.body);
    
    res.json({
      success: true,
      message: 'Installation updated successfully'
    });
  } catch (error) {
    console.error('Update installation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update installation',
      details: error.message
    });
  }
});

// Delete installation
app.delete('/api/installations/:id', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM oauth_tokens WHERE installation_id = ?', [req.params.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM installations WHERE id = ?', [req.params.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await dbHelpers.logActivity(req.params.id, 'installation_deleted', {});
    
    res.json({
      success: true,
      message: 'Installation deleted successfully'
    });
  } catch (error) {
    console.error('Delete installation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete installation',
      details: error.message
    });
  }
});

// Export data
app.get('/api/export', async (req, res) => {
  try {
    const installations = await dbHelpers.getAllInstallations();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=oauth_installations_export.json');
    
    res.json({
      export_date: new Date().toISOString(),
      total_installations: installations.length,
      installations: installations
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      details: error.message
    });
  }
});

// Activity log
app.get('/api/activity/:installation_id', async (req, res) => {
  try {
    const activities = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM activity_log WHERE installation_id = ? ORDER BY timestamp DESC LIMIT 100', 
        [req.params.installation_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activity log',
      details: error.message
    });
  }
});

// ===== SHARED USER PROFILE ENDPOINTS =====

// Create or update user profile
app.post('/api/user-profiles', async (req, res) => {
  try {
    const {
      ghl_user_id,
      location_id,
      company_id,
      email,
      name,
      phone,
      created_at,
      updated_at,
      apps_used,
      app_data
    } = req.body;

    // Validate required fields
    if (!ghl_user_id) {
      return res.status(400).json({
        success: false,
        error: 'ghl_user_id is required'
      });
    }

    const result = await dbHelpers.saveUserProfile({
      ghl_user_id,
      location_id,
      company_id,
      email,
      name,
      phone,
      created_at: created_at || new Date().toISOString(),
      updated_at: updated_at || new Date().toISOString(),
      apps_used,
      app_data
    });

    console.log(`[USER-PROFILES] ✅ Created/updated profile for user: ${ghl_user_id}`);

    res.json({
      success: true,
      data: {
        id: result,
        ghl_user_id,
        location_id,
        company_id,
        email,
        name,
        phone,
        created_at,
        updated_at,
        apps_used,
        app_data
      }
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to create user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user profile',
      details: error.message
    });
  }
});

// Get user profile by GHL user ID
app.get('/api/user-profiles/:ghlUserId', async (req, res) => {
  try {
    const { ghlUserId } = req.params;
    const profile = await dbHelpers.getUserProfile(ghlUserId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      details: error.message
    });
  }
});

// Update user profile
app.put('/api/user-profiles/:ghlUserId', async (req, res) => {
  try {
    const { ghlUserId } = req.params;
    const {
      location_id,
      company_id,
      email,
      name,
      phone,
      updated_at,
      apps_used,
      app_data
    } = req.body;

    const changes = await dbHelpers.updateUserProfile(ghlUserId, {
      location_id,
      company_id,
      email,
      name,
      phone,
      updated_at: updated_at || new Date().toISOString(),
      apps_used,
      app_data
    });

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    console.log(`[USER-PROFILES] ✅ Updated profile for user: ${ghlUserId}`);

    res.json({
      success: true,
      data: {
        ghl_user_id: ghlUserId,
        location_id,
        company_id,
        email,
        name,
        phone,
        updated_at,
        apps_used,
        app_data
      }
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to update user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: error.message
    });
  }
});

// Get user profile by email
app.get('/api/user-profiles/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await dbHelpers.getUserProfileByEmail(decodeURIComponent(email));

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to get user profile by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile by email',
      details: error.message
    });
  }
});

// Get users for a specific app
app.get('/api/user-profiles/by-app/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    
    // Search for users that have this app in their apps_used array
    const profiles = await dbHelpers.searchUserProfiles({});
    const appUsers = profiles.filter(profile => 
      profile.apps_used && profile.apps_used.includes(appId)
    );

    res.json({
      success: true,
      data: appUsers,
      count: appUsers.length
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to get users for app:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users for app',
      details: error.message
    });
  }
});

// Search users
app.post('/api/user-profiles/search', async (req, res) => {
  try {
    const searchCriteria = req.body;
    const profiles = await dbHelpers.searchUserProfiles(searchCriteria);

    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to search users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      details: error.message
    });
  }
});

// Get user statistics
app.get('/api/user-profiles/stats', async (req, res) => {
  try {
    const stats = await dbHelpers.getUserStats();

    res.json({
      success: true,
      data: {
        ...stats,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to get user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
      details: error.message
    });
  }
});

// Delete user profile (optional - use with caution)
app.delete('/api/user-profiles/:ghlUserId', async (req, res) => {
  try {
    const { ghlUserId } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run('DELETE FROM user_profiles WHERE ghl_user_id = ?', [ghlUserId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    if (result === 0) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    console.log(`[USER-PROFILES] ⚠️ Deleted profile for user: ${ghlUserId}`);

    res.json({
      success: true,
      message: 'User profile deleted successfully'
    });

  } catch (error) {
    console.error('[USER-PROFILES] ❌ Failed to delete user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user profile',
      details: error.message
    });
  }
});

// ===== TOKEN REFRESH SYSTEM =====

// Token refresh functionality
const axios = require('axios');

async function refreshTokenWithGHL(refreshToken, clientId, clientSecret) {
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      user_type: 'Location'
    });

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('[TOKEN-REFRESH] ❌ GHL refresh failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// TOKEN REFRESH ENDPOINT
app.post('/api/token-refresh/:installationId', async (req, res) => {
  const { installationId } = req.params;
  
  try {
    console.log(`[TOKEN-REFRESH] Refresh requested for ${installationId}`);
    
    // Get installation and token data
    const installation = await dbHelpers.getInstallation(installationId);
    
    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found',
        installation_id: installationId
      });
    }

    if (!installation.refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'No refresh token available',
        installation_id: installationId
      });
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GHL_CLIENT_ID;
    const clientSecret = process.env.GHL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        error: 'OAuth credentials not configured',
        installation_id: installationId
      });
    }

    // Refresh the token
    const refreshResult = await refreshTokenWithGHL(installation.refresh_token, clientId, clientSecret);
    
    if (!refreshResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        details: refreshResult.error,
        installation_id: installationId
      });
    }

    // Update token in database
    const tokenData = {
      access_token: refreshResult.data.access_token,
      refresh_token: refreshResult.data.refresh_token,
      expires_in: refreshResult.data.expires_in,
      expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString(),
      token_type: refreshResult.data.token_type || 'Bearer',
      scope: refreshResult.data.scope
    };

    await dbHelpers.updateTokenAfterRefresh(installationId, tokenData);

    console.log(`[TOKEN-REFRESH] ✅ Token refreshed successfully for ${installationId}`);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: {
        ...tokenData,
        installation_id: installationId
      },
      refreshed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[TOKEN-REFRESH] ❌ Refresh failed for ${installationId}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message,
      installation_id: installationId
    });
  }
});

// BULK TOKEN REFRESH ENDPOINT
app.post('/api/tokens/bulk-refresh', async (req, res) => {
  const { installation_ids } = req.body;
  
  if (!Array.isArray(installation_ids)) {
    return res.status(400).json({
      success: false,
      error: 'installation_ids must be an array'
    });
  }

  try {
    console.log(`[BULK-REFRESH] Bulk refresh requested for ${installation_ids.length} installations`);
    
    const results = [];
    const clientId = process.env.GHL_CLIENT_ID;
    const clientSecret = process.env.GHL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        error: 'OAuth credentials not configured'
      });
    }
    
    for (const installationId of installation_ids) {
      try {
        const installation = await dbHelpers.getInstallation(installationId);
        
        if (!installation || !installation.refresh_token) {
          results.push({
            installation_id: installationId,
            success: false,
            status: 'no_refresh_token'
          });
          continue;
        }

        const refreshResult = await refreshTokenWithGHL(installation.refresh_token, clientId, clientSecret);
        
        if (refreshResult.success) {
          const tokenData = {
            access_token: refreshResult.data.access_token,
            refresh_token: refreshResult.data.refresh_token,
            expires_in: refreshResult.data.expires_in,
            expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString(),
            token_type: refreshResult.data.token_type || 'Bearer',
            scope: refreshResult.data.scope
          };

          await dbHelpers.updateTokenAfterRefresh(installationId, tokenData);
          
          results.push({
            installation_id: installationId,
            success: true,
            status: 'refreshed'
          });
        } else {
          results.push({
            installation_id: installationId,
            success: false,
            status: 'refresh_failed',
            error: refreshResult.error
          });
        }
        
      } catch (error) {
        results.push({
          installation_id: installationId,
          success: false,
          status: 'error',
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[BULK-REFRESH] ✅ Completed: ${successCount}/${installation_ids.length} successful`);
    
    res.json({
      success: true,
      message: `Bulk token refresh completed`,
      total: installation_ids.length,
      successful: successCount,
      failed: installation_ids.length - successCount,
      results: results,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[BULK-REFRESH] ❌ Bulk refresh failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Bulk token refresh failed',
      details: error.message
    });
  }
});

// TOKEN VALIDATION ENDPOINT
app.get('/api/token-validate/:installationId', async (req, res) => {
  const { installationId } = req.params;
  
  try {
    console.log(`[TOKEN-VALIDATE] Validation requested for ${installationId}`);
    
    const installation = await dbHelpers.getInstallation(installationId);
    
    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found',
        installation_id: installationId
      });
    }

    const expiresAt = installation.expires_at ? new Date(installation.expires_at).getTime() : null;
    const now = Date.now();
    
    // Check token status
    let tokenStatus = 'unknown';
    let expiresInMinutes = null;
    
    if (installation.access_token && expiresAt) {
      expiresInMinutes = Math.floor((expiresAt - now) / (1000 * 60));
      
      if (expiresAt <= now) {
        tokenStatus = 'expired';
      } else if (expiresAt <= now + (10 * 60 * 1000)) { // 10 minutes buffer
        tokenStatus = 'expiring_soon';
      } else {
        tokenStatus = 'valid';
      }
    } else {
      tokenStatus = 'no_token';
    }
    
    res.json({
      success: true,
      installation_id: installationId,
      token_status: tokenStatus,
      expires_in_minutes: expiresInMinutes,
      has_access_token: !!installation.access_token,
      has_refresh_token: !!installation.refresh_token,
      location_id: installation.location_id,
      validated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[TOKEN-VALIDATE] ❌ Validation failed for ${installationId}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Token validation failed',
      details: error.message,
      installation_id: installationId
    });
  }
});

// GET TOKENS EXPIRING SOON
app.get('/api/tokens/expiring', async (req, res) => {
  try {
    const minutesAhead = parseInt(req.query.minutes) || 30;
    const tokens = await dbHelpers.getTokensExpiringSoon(minutesAhead);
    
    res.json({
      success: true,
      data: tokens,
      count: tokens.length,
      criteria: `Expiring within ${minutesAhead} minutes`,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TOKENS-EXPIRING] ❌ Failed to get expiring tokens:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get expiring tokens',
      details: error.message
    });
  }
});

// GET EXPIRED TOKENS
app.get('/api/tokens/expired', async (req, res) => {
  try {
    const tokens = await dbHelpers.getExpiredTokens();
    
    res.json({
      success: true,
      data: tokens,
      count: tokens.length,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TOKENS-EXPIRED] ❌ Failed to get expired tokens:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get expired tokens',
      details: error.message
    });
  }
});

// TOKEN STATISTICS ENDPOINT
app.get('/api/tokens/stats', async (req, res) => {
  try {
    const stats = await dbHelpers.getTokenStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        health_percentage: stats.total_tokens > 0 ? 
          Math.round((stats.valid_tokens / stats.total_tokens) * 100) : 0,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[TOKEN-STATS] ❌ Failed to get token stats:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get token stats',
      details: error.message
    });
  }
});

// BACKGROUND TOKEN MONITORING (Optional - can be enabled via environment variable)
if (process.env.ENABLE_AUTO_REFRESH === 'true') {
  const AUTO_REFRESH_INTERVAL = parseInt(process.env.AUTO_REFRESH_INTERVAL_MINUTES) || 15;
  
  console.log(`🔄 Auto-refresh enabled: checking every ${AUTO_REFRESH_INTERVAL} minutes`);
  
  setInterval(async () => {
    try {
      console.log('[AUTO-REFRESH] 🔍 Checking for tokens expiring soon...');
      
      const expiringTokens = await dbHelpers.getTokensExpiringSoon(30); // 30 minutes ahead
      
      if (expiringTokens.length > 0) {
        console.log(`[AUTO-REFRESH] 🔄 Found ${expiringTokens.length} tokens expiring soon, refreshing...`);
        
        const clientId = process.env.GHL_CLIENT_ID;
        const clientSecret = process.env.GHL_CLIENT_SECRET;
        
        if (clientId && clientSecret) {
          let refreshed = 0;
          
          for (const token of expiringTokens) {
            try {
              const refreshResult = await refreshTokenWithGHL(token.refresh_token, clientId, clientSecret);
              
              if (refreshResult.success) {
                const tokenData = {
                  access_token: refreshResult.data.access_token,
                  refresh_token: refreshResult.data.refresh_token,
                  expires_in: refreshResult.data.expires_in,
                  expires_at: new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString(),
                  token_type: refreshResult.data.token_type || 'Bearer',
                  scope: refreshResult.data.scope
                };

                await dbHelpers.updateTokenAfterRefresh(token.installation_id, tokenData);
                refreshed++;
              }
            } catch (error) {
              console.error(`[AUTO-REFRESH] ❌ Failed to refresh ${token.installation_id}:`, error.message);
            }
          }
          
          console.log(`[AUTO-REFRESH] ✅ Auto-refreshed ${refreshed}/${expiringTokens.length} tokens`);
        } else {
          console.log('[AUTO-REFRESH] ⚠️ OAuth credentials not configured for auto-refresh');
        }
      } else {
        console.log('[AUTO-REFRESH] ✅ No tokens expiring soon');
      }
      
    } catch (error) {
      console.error('[AUTO-REFRESH] ❌ Auto-refresh check failed:', error.message);
    }
  }, AUTO_REFRESH_INTERVAL * 60 * 1000);
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('❌ Database close error:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Database Service with Token Refresh System running on port ${PORT}`);
  console.log('✅ Ready to handle OAuth installation data, shared user profiles, and token management');
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('');
  console.log('🔧 Installation Management:');
  console.log('• GET /health - Health check');
  console.log('• POST /api/installations - Save installation');
  console.log('• GET /api/installations - Get all installations');
  console.log('• GET /api/installations/:id - Get specific installation');
  console.log('• PUT /api/installations/:id - Update installation');
  console.log('• DELETE /api/installations/:id - Delete installation');
  console.log('• POST /api/tokens - Save OAuth token');
  console.log('• GET /api/export - Export all data');
  console.log('• GET /api/activity/:id - Get activity log');
  console.log('');
  console.log('🔄 Token Refresh System:');
  console.log('• POST /api/token-refresh/:installationId - Refresh specific token');
  console.log('• POST /api/tokens/bulk-refresh - Bulk refresh multiple tokens');
  console.log('• GET /api/token-validate/:installationId - Validate token status');
  console.log('• GET /api/tokens/expiring?minutes=30 - Get tokens expiring soon');
  console.log('• GET /api/tokens/expired - Get expired tokens');
  console.log('• GET /api/tokens/stats - Get token statistics');
  console.log('');
  console.log('👥 Shared User Profiles:');
  console.log('• POST /api/user-profiles - Create/update user profile');
  console.log('• GET /api/user-profiles/:ghlUserId - Get user profile');
  console.log('• PUT /api/user-profiles/:ghlUserId - Update user profile');
  console.log('• GET /api/user-profiles/by-email/:email - Get user by email');
  console.log('• GET /api/user-profiles/by-app/:appId - Get users for app');
  console.log('• POST /api/user-profiles/search - Search users');
  console.log('• GET /api/user-profiles/stats - Get user statistics');
  console.log('• DELETE /api/user-profiles/:ghlUserId - Delete user profile');
  console.log('');
  console.log('🔗 Quick Links:');
  console.log('• Health check: http://localhost:' + PORT + '/health');
  console.log('• Token stats: http://localhost:' + PORT + '/api/tokens/stats');
  console.log('• User stats: http://localhost:' + PORT + '/api/user-profiles/stats');
  console.log('• Expiring tokens: http://localhost:' + PORT + '/api/tokens/expiring');
  console.log('');
  
  // Auto-refresh status
  if (process.env.ENABLE_AUTO_REFRESH === 'true') {
    const interval = parseInt(process.env.AUTO_REFRESH_INTERVAL_MINUTES) || 15;
    console.log(`🤖 Auto-refresh: ENABLED (checking every ${interval} minutes)`);
  } else {
    console.log('🤖 Auto-refresh: DISABLED (set ENABLE_AUTO_REFRESH=true to enable)');
  }
  
  console.log('');
  console.log('🔑 OAuth credentials required for token refresh:');
  console.log('• GHL_CLIENT_ID:', process.env.GHL_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('• GHL_CLIENT_SECRET:', process.env.GHL_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
});