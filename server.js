const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced security and middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://marketplace.gohighlevel.com',
    'https://app.gohighlevel.com',
    'http://localhost:3000',
    'http://localhost:3008'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Enhanced database setup with multiple databases
const installationsDbPath = process.env.INSTALLATIONS_DB_PATH || './oauth_installations_enhanced.db';
const tokensDbPath = process.env.TOKENS_DB_PATH || './oauth_tokens_enhanced.db';
const debugDbPath = process.env.DEBUG_DB_PATH || './oauth_debug_enhanced.db';

const installationsDb = new sqlite3.Database(installationsDbPath, (err) => {
  if (err) {
    console.error('❌ Installations database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to installations database:', installationsDbPath);
});

const tokensDb = new sqlite3.Database(tokensDbPath, (err) => {
  if (err) {
    console.error('❌ Tokens database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to tokens database:', tokensDbPath);
});

const debugDb = new sqlite3.Database(debugDbPath, (err) => {
  if (err) {
    console.error('❌ Debug database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to debug database:', debugDbPath);
});

// Initialize enhanced database schemas
installationsDb.serialize(() => {
  installationsDb.run(`
    CREATE TABLE IF NOT EXISTS installations (
      id TEXT PRIMARY KEY,
      installation_id TEXT UNIQUE,
      location_id TEXT,
      company_id TEXT,
      company_name TEXT,
      location_name TEXT,
      status TEXT DEFAULT 'active',
      oauth_completed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

tokensDb.serialize(() => {
  tokensDb.run(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      installation_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT DEFAULT 'Bearer',
      expires_in INTEGER,
      expires_at DATETIME,
      scope TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

debugDb.serialize(() => {
  debugDb.run(`
    CREATE TABLE IF NOT EXISTS debug_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      installation_id TEXT,
      location_id TEXT
    )
  `);

  debugDb.run(`
    CREATE TABLE IF NOT EXISTS oauth_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id TEXT UNIQUE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      step TEXT NOT NULL,
      status TEXT NOT NULL,
      request_data TEXT,
      response_data TEXT,
      error_data TEXT,
      installation_id TEXT,
      location_id TEXT
    )
  `);
});

// Logging functions
function log(level, category, message, data = null, installationId = null, locationId = null, attemptId = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data: data ? JSON.stringify(data) : null,
    installation_id: installationId,
    location_id: locationId,
    attempt_id: attemptId
  };

  console.log(`[${level.toUpperCase()}] ${category}: ${message}`, data || '');
  
  debugDb.run(
    `INSERT INTO debug_logs (level, category, message, data, installation_id, location_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [level, category, message, logEntry.data, installationId, locationId]
  );
}

function logAttempt(attemptId, step, status, requestData = null, responseData = null, errorData = null, installationId = null, locationId = null) {
  debugDb.run(
    `INSERT OR REPLACE INTO oauth_attempts (attempt_id, step, status, request_data, response_data, error_data, installation_id, location_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attemptId,
      step,
      status,
      requestData ? JSON.stringify(requestData) : null,
      responseData ? JSON.stringify(responseData) : null,
      errorData ? JSON.stringify(errorData) : null,
      installationId,
      locationId
    ]
  );
}

// Main dashboard
app.get('/', (req, res) => {
  res.send(generateDashboard());
});

app.get('/debug', (req, res) => {
  res.send(generateDashboard());
});

// Enhanced OAuth callback - captures installation_id from token response
app.get('/api/oauth/callback', async (req, res) => {
  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  log('info', 'callback', 'OAuth callback received', req.query, null, null, attemptId);
  logAttempt(attemptId, 'callback_received', 'pending', req.query);

  try {
    const { code, error, error_description, state } = req.query;

    // Handle OAuth errors
    if (error) {
      const errorData = { error, error_description, query: req.query };
      log('error', 'callback', 'OAuth error received', errorData, null, null, attemptId);
      logAttempt(attemptId, 'oauth_error', 'failed', req.query, null, errorData);
      return res.status(400).send(`OAuth Error: ${error} - ${error_description || 'No description provided'}`);
    }

    // Validate authorization code
    if (!code) {
      const errorData = { message: 'Missing authorization code', query: req.query };
      log('error', 'callback', 'Missing authorization code', errorData, null, null, attemptId);
      logAttempt(attemptId, 'missing_code', 'failed', req.query, null, errorData);
      return res.status(400).send('Missing authorization code');
    }

    log('info', 'callback', 'Exchanging code for tokens', { code: code.substring(0, 10) + '...' }, null, null, attemptId);
    logAttempt(attemptId, 'token_exchange_start', 'pending', { code: 'hidden' });

    // Exchange code for company token
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokenData = tokenResponse.data;
    log('info', 'callback', 'Token exchange successful', { 
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    }, null, null, attemptId);
    logAttempt(attemptId, 'token_exchange_success', 'completed', null, { token_received: true });

    // CRITICAL: Extract installation_id, location_id, and company_id from token response
    const installationId = tokenData.installation_id || tokenData.installationId;
    const locationId = tokenData.location_id || tokenData.locationId;
    const companyId = tokenData.company_id || tokenData.companyId;

    log('info', 'callback', 'Extracted IDs from token', {
      installation_id: installationId,
      location_id: locationId,
      company_id: companyId
    }, installationId, locationId, attemptId);

    if (!installationId) {
      log('warning', 'callback', 'No installation_id found in token response', tokenData, null, locationId, attemptId);
    }

    // Create installation record immediately
    const installationData = {
      id: installationId || `manual_${Date.now()}`,
      installation_id: installationId,
      location_id: locationId,
      company_id: companyId,
      status: 'active',
      oauth_completed: false
    };

    log('info', 'installation', 'Creating installation record', installationData, installationId, locationId, attemptId);
    logAttempt(attemptId, 'installation_create', 'pending', installationData);

    await new Promise((resolve, reject) => {
      installationsDb.run(
        `INSERT OR REPLACE INTO installations (id, installation_id, location_id, company_id, status, oauth_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [installationData.id, installationId, locationId, companyId, 'active', false],
        function(err) {
          if (err) {
            log('error', 'installation', 'Failed to create installation', err, installationId, locationId, attemptId);
            reject(err);
          } else {
            log('info', 'installation', 'Installation record created', { id: installationData.id }, installationId, locationId, attemptId);
            resolve();
          }
        }
      );
    });

    logAttempt(attemptId, 'installation_created', 'completed', null, { installation_id: installationData.id });

    // Convert company token to location token if we have location_id
    let finalTokenData = tokenData;
    if (locationId && tokenData.access_token) {
      try {
        log('info', 'token', 'Converting company token to location token', { location_id: locationId }, installationId, locationId, attemptId);
        logAttempt(attemptId, 'location_token_start', 'pending', { location_id: locationId });

        const locationTokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
          client_id: process.env.GHL_CLIENT_ID,
          client_secret: process.env.GHL_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.GHL_REDIRECT_URI,
          location_id: locationId
        });

        finalTokenData = locationTokenResponse.data;
        log('info', 'token', 'Location token obtained', { location_id: locationId }, installationId, locationId, attemptId);
        logAttempt(attemptId, 'location_token_success', 'completed', null, { location_token: true });
      } catch (locationTokenError) {
        log('warning', 'token', 'Failed to get location token, using company token', locationTokenError.response?.data || locationTokenError.message, installationId, locationId, attemptId);
        logAttempt(attemptId, 'location_token_failed', 'warning', null, null, locationTokenError.response?.data);
      }
    }

    // Save tokens to database linked with installation
    const expiresAt = finalTokenData.expires_in ? 
      new Date(Date.now() + (finalTokenData.expires_in * 1000)).toISOString() : null;

    log('info', 'token', 'Saving tokens to database', {
      installation_id: installationId,
      location_id: locationId,
      expires_at: expiresAt
    }, installationId, locationId, attemptId);
    logAttempt(attemptId, 'token_save_start', 'pending', { installation_id: installationId });

    await new Promise((resolve, reject) => {
      tokensDb.run(
        `INSERT INTO oauth_tokens (installation_id, location_id, access_token, refresh_token, token_type, expires_in, expires_at, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          installationId || 'unknown',
          locationId || 'unknown',
          finalTokenData.access_token,
          finalTokenData.refresh_token || null,
          finalTokenData.token_type || 'Bearer',
          finalTokenData.expires_in || null,
          expiresAt,
          finalTokenData.scope || null
        ],
        function(err) {
          if (err) {
            log('error', 'token', 'Failed to save tokens', err, installationId, locationId, attemptId);
            reject(err);
          } else {
            log('info', 'token', 'Tokens saved successfully', { token_id: this.lastID }, installationId, locationId, attemptId);
            resolve();
          }
        }
      );
    });

    logAttempt(attemptId, 'token_saved', 'completed', null, { token_saved: true });

    // Mark installation as complete
    await new Promise((resolve, reject) => {
      installationsDb.run(
        `UPDATE installations SET oauth_completed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [installationData.id],
        function(err) {
          if (err) {
            log('error', 'installation', 'Failed to mark installation complete', err, installationId, locationId, attemptId);
            reject(err);
          } else {
            log('info', 'installation', 'Installation marked as complete', { id: installationData.id }, installationId, locationId, attemptId);
            resolve();
          }
        }
      );
    });

    logAttempt(attemptId, 'installation_completed', 'completed', null, { oauth_completed: true });
    log('info', 'callback', 'OAuth flow completed successfully', {
      installation_id: installationId,
      location_id: locationId,
      attempt_id: attemptId
    }, installationId, locationId, attemptId);

    // Success response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Success</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .success { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
          .checkmark { color: #28a745; font-size: 48px; margin-bottom: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }
          .detail-item { margin: 5px 0; }
          .label { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="success">
          <div class="checkmark">✅</div>
          <h1>OAuth Authorization Successful!</h1>
          <p>Your GoHighLevel integration has been successfully configured.</p>
          <div class="details">
            <div class="detail-item"><span class="label">Installation ID:</span> ${installationId || 'Not provided'}</div>
            <div class="detail-item"><span class="label">Location ID:</span> ${locationId || 'Not provided'}</div>
            <div class="detail-item"><span class="label">Company ID:</span> ${companyId || 'Not provided'}</div>
            <div class="detail-item"><span class="label">Status:</span> Active</div>
            <div class="detail-item"><span class="label">Timestamp:</span> ${new Date().toISOString()}</div>
          </div>
          <p><small>You can now close this window and return to the application.</small></p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    log('error', 'callback', 'OAuth callback error', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    }, null, null, attemptId);
    logAttempt(attemptId, 'callback_error', 'failed', null, null, {
      message: error.message,
      response: error.response?.data
    });

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .error { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
          .error-icon { color: #dc3545; font-size: 48px; margin-bottom: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          .error-details { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">
          <div class="error-icon">❌</div>
          <h1>OAuth Authorization Failed</h1>
          <p>There was an error during the authorization process.</p>
          <div class="error-details">
            <strong>Error:</strong> ${error.message}<br>
            <strong>Attempt ID:</strong> ${attemptId}
          </div>
          <p><small>Please try again or contact support if the problem persists.</small></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Debug API endpoints
app.get('/api/debug/installations', (req, res) => {
  installationsDb.all('SELECT * FROM installations ORDER BY created_at DESC LIMIT 50', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ installations: rows, count: rows.length });
  });
});

app.get('/api/debug/tokens', (req, res) => {
  tokensDb.all('SELECT id, installation_id, location_id, token_type, expires_in, expires_at, scope, created_at FROM oauth_tokens ORDER BY created_at DESC LIMIT 50', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ tokens: rows, count: rows.length });
  });
});

app.get('/api/debug/logs', (req, res) => {
  debugDb.all('SELECT * FROM debug_logs ORDER BY timestamp DESC LIMIT 100', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ logs: rows, count: rows.length });
  });
});

app.get('/api/debug/attempts', (req, res) => {
  debugDb.all('SELECT * FROM oauth_attempts ORDER BY timestamp DESC LIMIT 50', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ attempts: rows, count: rows.length });
  });
});

// OAuth URL generator
app.get('/api/oauth/url', (req, res) => {
  const scopes = req.query.scopes || 'locations/read locations/write contacts/read contacts/write opportunities/read opportunities/write';
  const state = req.query.state || `state_${Date.now()}`;
  
  const oauthUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(process.env.GHL_REDIRECT_URI)}&client_id=${process.env.GHL_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  
  log('info', 'oauth_url', 'OAuth URL generated', { scopes, state });
  
  res.json({
    oauth_url: oauthUrl,
    scopes: scopes,
    state: state,
    redirect_uri: process.env.GHL_REDIRECT_URI,
    client_id: process.env.GHL_CLIENT_ID
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0-enhanced-installation-capture',
    databases: {
      installations: installationsDbPath,
      tokens: tokensDbPath,
      debug: debugDbPath
    }
  });
});

// Dashboard generator
function generateDashboard() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Enhanced OAuth Callback Server - Installation Capture</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .status { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 3px; font-family: monospace; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Enhanced OAuth Callback Server</h1>
          <div class="status">✅ Server Running - Installation Capture Enabled</div>
          <p><strong>Version:</strong> 2.0.0-enhanced-installation-capture</p>
          <p><strong>Port:</strong> ${PORT}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>

        <div class="grid">
          <div class="card">
            <h3>🎯 Key Features</h3>
            <div class="feature">✅ Automatic installation_id capture from marketplace OAuth</div>
            <div class="feature">✅ Enhanced database schema with installation tracking</div>
            <div class="feature">✅ Comprehensive logging and debugging</div>
            <div class="feature">✅ Company to location token conversion</div>
            <div class="feature">✅ Real-time installation monitoring</div>
          </div>

          <div class="card">
            <h3>🔗 API Endpoints</h3>
            <div class="endpoint">GET /api/oauth/callback - OAuth callback handler</div>
            <div class="endpoint">GET /api/oauth/url - Generate OAuth URL</div>
            <div class="endpoint">GET /api/debug/installations - View installations</div>
            <div class="endpoint">GET /api/debug/tokens - View tokens</div>
            <div class="endpoint">GET /api/debug/logs - View debug logs</div>
            <div class="endpoint">GET /api/debug/attempts - View OAuth attempts</div>
            <div class="endpoint">GET /health - Health check</div>
          </div>

          <div class="card">
            <h3>🗄️ Database Status</h3>
            <div class="feature">📊 Installations: ${installationsDbPath}</div>
            <div class="feature">🔑 Tokens: ${tokensDbPath}</div>
            <div class="feature">🐛 Debug: ${debugDbPath}</div>
          </div>

          <div class="card">
            <h3>🚀 Quick Actions</h3>
            <a href="/api/debug/installations" class="btn">View Installations</a>
            <a href="/api/debug/tokens" class="btn">View Tokens</a>
            <a href="/api/debug/logs" class="btn">View Logs</a>
            <a href="/api/oauth/url" class="btn">Generate OAuth URL</a>
          </div>
        </div>

        <div class="highlight">
          <h4>🔄 Marketplace Installation Flow:</h4>
          <p>1. User installs app from GoHighLevel Marketplace</p>
          <p>2. OAuth callback automatically captures installation_id</p>
          <p>3. Installation record created with linked tokens</p>
          <p>4. Ready for API operations with captured account data</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced OAuth Callback Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/debug`);
  console.log(`🔗 OAuth Callback: ${process.env.GHL_REDIRECT_URI || `http://localhost:${PORT}/api/oauth/callback`}`);
  console.log(`✨ Installation capture enabled for marketplace OAuth flow`);
  log('info', 'server', 'Enhanced OAuth server started', {
    port: PORT,
    version: '2.0.0-enhanced-installation-capture',
    callback_url: process.env.GHL_REDIRECT_URI
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Enhanced OAuth Callback Server...');
  log('info', 'server', 'Server shutdown initiated');
  
  installationsDb.close((err) => {
    if (err) console.error('Error closing installations database:', err);
    else console.log('✅ Installations database closed');
  });
  
  tokensDb.close((err) => {
    if (err) console.error('Error closing tokens database:', err);
    else console.log('✅ Tokens database closed');
  });
  
  debugDb.close((err) => {
    if (err) console.error('Error closing debug database:', err);
    else console.log('✅ Debug database closed');
  });
  
  process.exit(0);
});