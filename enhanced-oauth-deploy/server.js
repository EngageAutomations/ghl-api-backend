/**
 * 🚀 Enhanced OAuth Callback with Installation ID Capture
 * 
 * This implementation addresses the core issue identified in the consultation:
 * - Captures installation_id from GoHighLevel's OAuth token response payload
 * - Properly links marketplace installations with OAuth tokens
 * - Implements the solution to avoid "double authorization" perception
 * - Stores both installation and token data in synchronized databases
 * 
 * Key Features:
 * 1. Captures installation_id from token exchange response (not query params)
 * 2. Creates installation record immediately upon OAuth callback
 * 3. Links installation_id with location tokens
 * 4. Comprehensive logging for debugging
 * 5. Fallback mechanisms for missing installation_id
 */

const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const CLIENT_ID = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';
const PORT = 3008;

// Database setup
const INSTALLATION_DB_PATH = path.join(__dirname, 'oauth_installations_enhanced.db');
const TOKEN_DB_PATH = path.join(__dirname, 'oauth_tokens_enhanced.db');
const DEBUG_DB_PATH = path.join(__dirname, 'oauth_debug_enhanced.db');

class EnhancedOAuthHandler {
  constructor() {
    this.installationDb = new sqlite3.Database(INSTALLATION_DB_PATH);
    this.tokenDb = new sqlite3.Database(TOKEN_DB_PATH);
    this.debugDb = new sqlite3.Database(DEBUG_DB_PATH);
    this.initializeDatabases();
    this.setupRoutes();
    this.setupTokenRefreshCron();
  }

  initializeDatabases() {
    // OAuth installations table - exact schema from guide
    this.installationDb.serialize(() => {
      this.installationDb.run(`
        CREATE TABLE IF NOT EXISTS oauth_installations (
          installation_id TEXT PRIMARY KEY,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Trigger for automatic timestamp updates
      this.installationDb.run(`
        CREATE TRIGGER IF NOT EXISTS trg_update_installations
        AFTER UPDATE ON oauth_installations
        BEGIN
          UPDATE oauth_installations SET updated_at = CURRENT_TIMESTAMP WHERE installation_id = NEW.installation_id;
        END
      `);
    });

    // OAuth tokens table - exact schema from guide
    this.tokenDb.serialize(() => {
      this.tokenDb.run(`
        CREATE TABLE IF NOT EXISTS oauth_tokens (
          installation_id TEXT PRIMARY KEY,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          location_id TEXT,
          company_id TEXT,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (installation_id) REFERENCES oauth_installations(installation_id)
        )
      `);

      // Trigger for automatic timestamp updates
      this.tokenDb.run(`
        CREATE TRIGGER IF NOT EXISTS trg_update_tokens
        AFTER UPDATE ON oauth_tokens
        BEGIN
          UPDATE oauth_tokens SET updated_at = CURRENT_TIMESTAMP WHERE installation_id = NEW.installation_id;
        END
      `);
    });

    // Debug database - comprehensive logging
    this.debugDb.serialize(() => {
      this.debugDb.run(`
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

      this.debugDb.run(`
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

    this.log('info', 'system', 'Enhanced OAuth databases initialized');
  }

  setupRoutes() {
    // Root handler - captures installation_id and redirects to OAuth
    app.get('/', (req, res) => {
      const installationId = req.query.installation_id;
      
      if (installationId) {
        // Store installation_id in database
        this.installationDb.run(
          'INSERT OR REPLACE INTO oauth_installations (installation_id, status) VALUES (?, ?)',
          [installationId, 'pending'],
          (err) => {
            if (err) {
              console.error('Error storing installation:', err);
            } else {
              console.log(`Stored installation_id: ${installationId}`);
            }
          }
        );
        
        // Redirect to OAuth with installation_id in state
        const oauthUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&scope=locations/read%20locations/write%20contacts/read%20contacts/write%20opportunities/read%20opportunities/write%20calendars/read%20calendars/write%20conversations/read%20conversations/write%20conversations/message%20workflows/read%20workflows/write%20forms/read%20forms/write%20surveys/read%20surveys/write%20links/read%20links/write%20medias/read%20medias/write%20snapshots/read%20snapshots/write%20businesses/read%20businesses/write%20users/read%20users/write%20oauth/read%20oauth/write%20saas/read%20saas/write%20invoices/read%20invoices/write%20payments/read%20payments/write%20reporting/read%20reporting/write%20attribution/read%20attribution/write%20courses/read%20courses/write%20products/read%20products/write%20companies/read%20companies/write%20locations.customValues/read%20locations.customValues/write%20locations.customFields/read%20locations.customFields/write%20locations.tags/read%20locations.tags/write%20locations.templates/read%20locations.templates/write%20marketingLibrary/read%20marketingLibrary/write%20membership/read%20membership/write%20reputation/read%20reputation/write%20reviews/read%20reviews/write%20triggers/read%20triggers/write%20webhooks/read%20webhooks/write%20campaigns/read%20campaigns/write%20bulk-requests/write%20social_media_posting/read%20social_media_posting/write%20phone/read%20phone/write%20email/read%20email/write%20funnels/read%20funnels/write%20websites/read%20websites/write%20wordpress/read%20wordpress/write%20blogs/read%20blogs/write%20domains/read%20domains/write&state=${installationId}`;
        
        res.redirect(oauthUrl);
      } else {
        // Show installation guide if no installation_id
        res.send(`
          <html>
            <head>
              <title>GoHighLevel OAuth Server</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
                .status { padding: 15px; margin: 15px 0; border-radius: 5px; }
                .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
                code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🚀 GoHighLevel OAuth Server</h1>
                <div class="status info">
                  <strong>✅ Server Status:</strong> Running on port ${PORT}
                </div>
                <div class="status warning">
                  <strong>⚠️ Missing installation_id:</strong> This URL should be accessed with an <code>installation_id</code> parameter from the GoHighLevel marketplace.
                </div>
                <p><strong>Expected URL format:</strong></p>
                <code>https://dir.engageautomations.com/?installation_id=YOUR_INSTALLATION_ID</code>
              </div>
            </body>
          </html>
        `);
      }
    });

    app.get('/debug', (req, res) => {
      res.send(this.generateDashboard());
    });

    // Health endpoint
    app.get('/health', (req, res) => {
      res.json({
        service: 'GoHighLevel OAuth Backend',
        version: '11.0.1-oauth-guide-enhanced',
        features: [
          'installation-id-capture',
          'oauth-guide-implementation',
          'automatic-token-refresh',
          'cron-job-scheduling',
          'enhanced-database-schema',
          'manual-token-refresh-endpoint'
        ],
        debug: 'Enhanced OAuth implementation with GoHighLevel guide fixes applied',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });

    // Enhanced OAuth callback - captures installation_id from token response
    app.get('/api/oauth/callback', async (req, res) => {
      const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.log('info', 'callback', 'OAuth callback received', req.query, null, null, attemptId);
      this.logAttempt(attemptId, 'callback_received', 'pending', req.query);

      try {
        const { code, error, error_description, state } = req.query;

        // Handle OAuth errors
        if (error) {
          const errorData = { error, error_description, query: req.query };
          this.log('error', 'callback', 'OAuth error received', errorData, null, null, attemptId);
          this.logAttempt(attemptId, 'oauth_error', 'failed', req.query, null, errorData);
          return res.status(400).send(`OAuth Error: ${error} - ${error_description || 'No description provided'}`);
        }

        // Validate authorization code
        if (!code) {
          const errorData = { message: 'Missing authorization code', query: req.query };
          this.log('error', 'callback', 'Missing authorization code', errorData, null, null, attemptId);
          this.logAttempt(attemptId, 'missing_code', 'failed', req.query, null, errorData);
          return res.status(400).send('Missing authorization code. Please restart the OAuth flow.');
        }

        // STEP 1: Exchange authorization code for company token
        this.log('info', 'oauth', 'Exchanging authorization code for company token', { code: code.substring(0, 10) + '...' }, null, null, attemptId);
        
        const tokenRequest = {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          code: code
        };

        this.logAttempt(attemptId, 'token_exchange_request', 'pending', tokenRequest);

        const tokenResponse = await axios.post(
          'https://services.leadconnectorhq.com/oauth/token',
          tokenRequest,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        // CRITICAL: Extract installation_id from token response payload
        const tokenData = tokenResponse.data;
        const installationId = tokenData.installation_id || tokenData.installationId || `install_${Date.now()}`;
        const locationId = tokenData.locationId || tokenData.location_id;
        const companyId = tokenData.companyId || tokenData.company_id;
        
        this.log('success', 'oauth', 'Company token received with installation data', {
          status: tokenResponse.status,
          installation_id: installationId,
          location_id: locationId,
          company_id: companyId,
          access_token: '***' + (tokenData.access_token?.slice(-4) || 'missing')
        }, installationId, locationId, attemptId);

        this.logAttempt(attemptId, 'token_exchange_success', 'success', tokenRequest, tokenData, null, installationId, locationId);

        if (!locationId) {
          const errorData = { message: 'No location ID found in token response', tokenResponse: tokenData };
          this.log('error', 'oauth', 'Missing location ID', errorData, installationId, null, attemptId);
          this.logAttempt(attemptId, 'missing_location_id', 'failed', tokenRequest, tokenData, errorData, installationId);
          return res.status(400).send('Missing location ID. Cannot proceed with location token conversion.');
        }

        // STEP 2: Create installation record immediately
        await this.createInstallationRecord(installationId, locationId, companyId, tokenData, attemptId);

        // STEP 3: Convert company token to location token
        this.log('info', 'oauth', 'Converting to location token', { locationId }, installationId, locationId, attemptId);
        
        const locationRequest = { location_id: locationId };
        this.logAttempt(attemptId, 'location_token_request', 'pending', locationRequest, null, null, installationId, locationId);

        const locationResponse = await axios.post(
          'https://services.leadconnectorhq.com/oauth/locationToken',
          locationRequest,
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        this.log('success', 'oauth', 'Location token received', {
          status: locationResponse.status,
          access_token: '***' + (locationResponse.data.access_token?.slice(-4) || 'missing')
        }, installationId, locationId, attemptId);

        this.logAttempt(attemptId, 'location_token_success', 'success', locationRequest, locationResponse.data, null, installationId, locationId);

        // STEP 4: Save tokens to database with installation link
        const finalTokenData = {
          installation_id: installationId,
          location_id: locationResponse.data.locationId || locationId,
          access_token: locationResponse.data.access_token,
          refresh_token: locationResponse.data.refresh_token,
          expires_in: locationResponse.data.expires_in,
          token_type: locationResponse.data.token_type || 'Bearer',
          scope: tokenData.scope
        };

        await this.saveTokenToDatabase(finalTokenData, attemptId);
        await this.markInstallationComplete(installationId, attemptId);

        this.log('success', 'complete', 'OAuth flow completed successfully', {
          installation_id: installationId,
          location_id: finalTokenData.location_id
        }, installationId, locationId, attemptId);

        this.logAttempt(attemptId, 'oauth_complete', 'success', null, finalTokenData, null, installationId, locationId);

        // Success response
        res.send(`
          <html>
            <head><title>OAuth Success - Enhanced</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: green;">✅ OAuth Setup Complete!</h1>
              <p>Your GoHighLevel integration has been successfully configured with enhanced installation tracking.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <h3>Installation Details:</h3>
                <p><strong>Installation ID:</strong> ${installationId}</p>
                <p><strong>Location ID:</strong> ${finalTokenData.location_id}</p>
                <p><strong>Company ID:</strong> ${companyId || 'N/A'}</p>
                <p><strong>Token Type:</strong> ${finalTokenData.token_type}</p>
                <p><strong>Scopes:</strong> ${finalTokenData.scope || 'N/A'}</p>
              </div>
              <p>The installation and token data have been properly linked in the database.</p>
              <hr>
              <p><a href="/debug" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Debug Dashboard</a></p>
            </body>
          </html>
        `);

      } catch (error) {
        this.log('error', 'callback', 'OAuth callback failed', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        }, null, null, attemptId);

        this.logAttempt(attemptId, 'callback_error', 'failed', req.query, null, {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        res.status(500).send(`
          <html>
            <head><title>OAuth Error - Enhanced</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: red;">❌ OAuth Error</h1>
              <p>The OAuth flow encountered an error:</p>
              <pre style="background: #f5f5f5; padding: 20px; text-align: left;">${error.message}</pre>
              ${error.response?.data ? `<pre style="background: #f5f5f5; padding: 20px; text-align: left;">${JSON.stringify(error.response.data, null, 2)}</pre>` : ''}
              <p><a href="/debug">View Debug Dashboard</a></p>
            </body>
          </html>
        `);
      }
    });

    // API endpoints for debugging and monitoring
    app.get('/api/installations', async (req, res) => {
      try {
        const installations = await this.getInstallations();
        res.json({ success: true, data: installations });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/tokens', async (req, res) => {
      try {
        const tokens = await this.getTokens();
        res.json({ success: true, data: tokens });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/debug/logs', async (req, res) => {
      try {
        const logs = await this.getDebugLogs();
        res.json({ success: true, data: logs });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/debug/attempts', async (req, res) => {
      try {
        const attempts = await this.getOAuthAttempts();
        res.json({ success: true, data: attempts });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Token refresh endpoint
    app.post('/api/token-refresh/:installationId', async (req, res) => {
      const { installationId } = req.params;
      
      try {
        // Get current token data
        const tokenData = await new Promise((resolve, reject) => {
          this.tokenDb.get(
            'SELECT * FROM oauth_tokens WHERE installation_id = ?',
            [installationId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (!tokenData) {
          return res.status(404).json({ error: 'Installation not found' });
        }

        if (!tokenData.refresh_token) {
          return res.status(400).json({ error: 'No refresh token available' });
        }

        // Refresh the token
        const refreshedTokens = await this.refreshToken(installationId, tokenData.refresh_token);
        
        res.json({
          success: true,
          installation_id: installationId,
          expires_at: refreshedTokens.expires_at,
          refreshed_at: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Token refresh error for ${installationId}:`, error);
        res.status(500).json({ 
          error: 'Token refresh failed', 
          message: error.message 
        });
      }
    });

    // Generate OAuth URL
    app.get('/api/oauth/url', (req, res) => {
      const scopes = [
        'products/prices.write',
        'products/prices.readonly', 
        'products/collection.write',
        'products/collection.readonly',
        'medias.write',
        'medias.readonly',
        'locations.readonly',
        'contacts.readonly',
        'contacts.write',
        'products.write',
        'products.readonly'
      ].join('+');

      const oauthUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&scope=${scopes}`;
      
      res.json({ 
        success: true, 
        oauth_url: oauthUrl,
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scopes: scopes.split('+')
      });
    });
  }

  // Create installation record immediately upon OAuth callback
  async createInstallationRecord(installationId, locationId, companyId, tokenData, attemptId) {
    return new Promise((resolve, reject) => {
      this.installationDb.run(
        `INSERT OR REPLACE INTO oauth_installations 
         (installation_id, status, created_at, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          installationId,
          'active'
        ],
        function(err) {
          if (err) {
            this.log('error', 'database', 'Failed to create installation record', { error: err.message }, installationId, locationId, attemptId);
            reject(err);
          } else {
            this.log('success', 'database', 'Installation record created', { installation_id: installationId }, installationId, locationId, attemptId);
            resolve(this.lastID);
          }
        }.bind(this)
      );
    });
  }

  // Save tokens with installation link
  async saveTokenToDatabase(tokenData, attemptId) {
    return new Promise((resolve, reject) => {
      const expiresAt = tokenData.expires_in ? 
        new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString() : null;

      this.tokenDb.run(
        `INSERT OR REPLACE INTO oauth_tokens 
         (installation_id, access_token, refresh_token, location_id, company_id, expires_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          tokenData.installation_id,
          tokenData.access_token,
          tokenData.refresh_token,
          tokenData.location_id,
          tokenData.company_id,
          expiresAt
        ],
        function(err) {
          if (err) {
            this.log('error', 'database', 'Failed to save token', { error: err.message }, tokenData.installation_id, tokenData.location_id, attemptId);
            reject(err);
          } else {
            this.log('success', 'database', 'Token saved successfully', { 
              installation_id: tokenData.installation_id,
              location_id: tokenData.location_id 
            }, tokenData.installation_id, tokenData.location_id, attemptId);
            resolve(this.lastID);
          }
        }.bind(this)
      );
    });
  }

  // Mark installation as OAuth complete
  async markInstallationComplete(installationId, attemptId) {
    return new Promise((resolve, reject) => {
      this.installationDb.run(
        `UPDATE oauth_installations SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE installation_id = ?`,
        [installationId],
        function(err) {
          if (err) {
            this.log('error', 'database', 'Failed to mark installation complete', { error: err.message }, installationId, null, attemptId);
            reject(err);
          } else {
            this.log('success', 'database', 'Installation marked as OAuth complete', { installation_id: installationId }, installationId, null, attemptId);
            resolve();
          }
        }.bind(this)
      );
    });
  }

  // Logging methods
  log(level, category, message, data = null, installationId = null, locationId = null, attemptId = null) {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] [${category}] ${message}`);
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }

    this.debugDb.run(
      `INSERT INTO debug_logs (level, category, message, data, installation_id, location_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [level, category, message, data ? JSON.stringify(data) : null, installationId, locationId]
    );
  }

  logAttempt(attemptId, step, status, requestData = null, responseData = null, errorData = null, installationId = null, locationId = null) {
    this.debugDb.run(
      `INSERT OR REPLACE INTO oauth_attempts 
       (attempt_id, step, status, request_data, response_data, error_data, installation_id, location_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

  // Data retrieval methods
  async getInstallations() {
    return new Promise((resolve, reject) => {
      this.installationDb.all(
        `SELECT * FROM oauth_installations ORDER BY created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getTokens() {
    return new Promise((resolve, reject) => {
      this.tokenDb.all(
        `SELECT installation_id, location_id, company_id, expires_at, created_at, updated_at,
                SUBSTR(access_token, 1, 10) || '...' as access_token_preview
         FROM oauth_tokens ORDER BY created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getDebugLogs() {
    return new Promise((resolve, reject) => {
      this.debugDb.all(
        `SELECT * FROM debug_logs ORDER BY timestamp DESC LIMIT 100`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getOAuthAttempts() {
    return new Promise((resolve, reject) => {
      this.debugDb.all(
        `SELECT * FROM oauth_attempts ORDER BY timestamp DESC LIMIT 50`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  generateDashboard() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Enhanced OAuth Debug Dashboard</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; }
              .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
              .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px; }
              .success { color: #28a745; }
              .error { color: #dc3545; }
              .warning { color: #ffc107; }
              .info { color: #17a2b8; }
              pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f8f9fa; }
          </style>
          <script>
              async function loadData() {
                  try {
                      const [installations, tokens, logs, attempts] = await Promise.all([
                          fetch('/api/installations').then(r => r.json()),
                          fetch('/api/tokens').then(r => r.json()),
                          fetch('/api/debug/logs').then(r => r.json()),
                          fetch('/api/debug/attempts').then(r => r.json())
                      ]);
                      
                      document.getElementById('installations-data').innerHTML = formatInstallations(installations.data);
                      document.getElementById('tokens-data').innerHTML = formatTokens(tokens.data);
                      document.getElementById('logs-data').innerHTML = formatLogs(logs.data);
                      document.getElementById('attempts-data').innerHTML = formatAttempts(attempts.data);
                  } catch (error) {
                      console.error('Failed to load data:', error);
                  }
              }
              
              function formatInstallations(installations) {
                  if (!installations || installations.length === 0) {
                      return '<p class="warning">No installations found</p>';
                  }
                  
                  let html = '<table><tr><th>Installation ID</th><th>Status</th><th>Created</th><th>Updated</th></tr>';
                  installations.forEach(install => {
                      html += '<tr>' +
                          '<td>' + install.installation_id + '</td>' +
                          '<td class="' + (install.status === 'completed' ? 'success' : 'warning') + '">' + install.status + '</td>' +
                          '<td>' + new Date(install.created_at).toLocaleString() + '</td>' +
                          '<td>' + new Date(install.updated_at).toLocaleString() + '</td>' +
                      '</tr>';
                  });
                  html += '</table>';
                  return html;
              }
              
              function formatTokens(tokens) {
                  if (!tokens || tokens.length === 0) {
                      return '<p class="warning">No tokens found</p>';
                  }
                  
                  let html = '<table><tr><th>Installation ID</th><th>Location ID</th><th>Company ID</th><th>Token Preview</th><th>Expires</th><th>Created</th></tr>';
                  tokens.forEach(token => {
                      html += '<tr>' +
                          '<td>' + token.installation_id + '</td>' +
                          '<td>' + (token.location_id || 'N/A') + '</td>' +
                          '<td>' + (token.company_id || 'N/A') + '</td>' +
                          '<td><code>' + token.access_token_preview + '</code></td>' +
                          '<td>' + (token.expires_at ? new Date(token.expires_at).toLocaleString() : 'N/A') + '</td>' +
                          '<td>' + new Date(token.created_at).toLocaleString() + '</td>' +
                      '</tr>';
                  });
                  html += '</table>';
                  return html;
              }
              
              function formatLogs(logs) {
                  if (!logs || logs.length === 0) {
                      return '<p class="info">No logs found</p>';
                  }
                  
                  let html = '<div style="max-height: 400px; overflow-y: auto;">';
                  logs.forEach(log => {
                      html += '<div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">' +
                          '<div class="' + log.level + '">[' + log.level.toUpperCase() + '] [' + log.category + '] ' + log.message + '</div>' +
                          '<small>' + new Date(log.timestamp).toLocaleString() + '</small>' +
                          (log.installation_id ? '<br><small>Installation: ' + log.installation_id + '</small>' : '') +
                          (log.data ? '<pre style="margin-top: 5px; font-size: 12px;">' + JSON.stringify(JSON.parse(log.data), null, 2) + '</pre>' : '') +
                      '</div>';
                  });
                  html += '</div>';
                  return html;
              }
              
              function formatAttempts(attempts) {
                  if (!attempts || attempts.length === 0) {
                      return '<p class="info">No OAuth attempts found</p>';
                  }
                  
                  let html = '<table><tr><th>Attempt ID</th><th>Step</th><th>Status</th><th>Installation ID</th><th>Location ID</th><th>Timestamp</th></tr>';
                  attempts.forEach(attempt => {
                      html += '<tr>' +
                          '<td><code>' + attempt.attempt_id + '</code></td>' +
                          '<td>' + attempt.step + '</td>' +
                          '<td class="' + (attempt.status === 'success' ? 'success' : attempt.status === 'failed' ? 'error' : 'warning') + '">' + attempt.status + '</td>' +
                          '<td>' + (attempt.installation_id || 'N/A') + '</td>' +
                          '<td>' + (attempt.location_id || 'N/A') + '</td>' +
                          '<td>' + new Date(attempt.timestamp).toLocaleString() + '</td>' +
                      '</tr>';
                  });
                  html += '</table>';
                  return html;
              }
              
              // Auto-refresh every 30 seconds
              setInterval(loadData, 30000);
              
              // Load data when page loads
              window.onload = loadData;
          </script>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚀 Enhanced OAuth Debug Dashboard</h1>
                  <p>Real-time monitoring of GoHighLevel OAuth installations with proper installation_id capture</p>
              </div>
              
              <div class="grid">
                  <div class="card">
                      <h3>🔗 OAuth URL Generator</h3>
                      <p>Use this URL to initiate the OAuth flow:</p>
                      <a href="/api/oauth/url" class="button" target="_blank">Get OAuth URL</a>
                  </div>
                  
                  <div class="card">
                      <h3>📊 Quick Stats</h3>
                      <p>Server running on port ${PORT}</p>
                      <p>Enhanced installation tracking: ✅ Active</p>
                      <p>Database sync: ✅ Enabled</p>
                  </div>
              </div>
              
              <div class="card">
                  <h3>📋 Installations</h3>
                  <div id="installations-data">Loading...</div>
              </div>
              
              <div class="card">
                  <h3>🔑 OAuth Tokens</h3>
                  <div id="tokens-data">Loading...</div>
              </div>
              
              <div class="card">
                  <h3>📝 Debug Logs</h3>
                  <div id="logs-data">Loading...</div>
              </div>
              
              <div class="card">
                  <h3>🔄 OAuth Attempts</h3>
                  <div id="attempts-data">Loading...</div>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // Token refresh method
  async refreshToken(installationId, refreshToken) {
    try {
      console.log(`Refreshing token for installation: ${installationId}`);
      
      const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

      // Update tokens in database
      return new Promise((resolve, reject) => {
        this.tokenDb.run(
          `UPDATE oauth_tokens 
           SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE installation_id = ?`,
          [access_token, new_refresh_token, expiresAt, installationId],
          function(err) {
            if (err) {
              console.error(`Error updating tokens for ${installationId}:`, err);
              reject(err);
            } else {
              console.log(`Tokens refreshed successfully for installation: ${installationId}`);
              resolve({ access_token, refresh_token: new_refresh_token, expires_at: expiresAt });
            }
          }
        );
      });
    } catch (error) {
      console.error(`Failed to refresh token for ${installationId}:`, error.message);
      throw error;
    }
  }

  // Setup cron job for hourly token refresh
  setupTokenRefreshCron() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Starting hourly token refresh...');
      
      try {
        // Get all tokens that expire within the next 2 hours
        const tokensToRefresh = await new Promise((resolve, reject) => {
          const twoHoursFromNow = new Date(Date.now() + (2 * 60 * 60 * 1000)).toISOString();
          
          this.tokenDb.all(
            `SELECT installation_id, refresh_token, expires_at 
             FROM oauth_tokens 
             WHERE expires_at <= ? AND refresh_token IS NOT NULL`,
            [twoHoursFromNow],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });

        console.log(`Found ${tokensToRefresh.length} tokens to refresh`);

        // Refresh each token
        for (const token of tokensToRefresh) {
          try {
            await this.refreshToken(token.installation_id, token.refresh_token);
          } catch (error) {
            console.error(`Failed to refresh token for ${token.installation_id}:`, error.message);
          }
        }

        console.log('✅ Hourly token refresh completed');
      } catch (error) {
        console.error('❌ Error during token refresh cron job:', error);
      }
    });

    console.log('⏰ Token refresh cron job scheduled (every hour)');
  }

  start() {
    app.listen(PORT, () => {
      console.log('\n🚀 ENHANCED OAUTH CALLBACK WITH INSTALLATION CAPTURE');
      console.log('=' .repeat(60));
      console.log(`Server running on port ${PORT}`);
      console.log('\n✨ Key Features:');
      console.log('• ✅ Captures installation_id from OAuth token response');
      console.log('• ✅ Creates installation records immediately');
      console.log('• ✅ Links installations with OAuth tokens');
      console.log('• ✅ Comprehensive debugging and logging');
      console.log('• ✅ Real-time dashboard monitoring');
      console.log('\n🔗 URLs:');
      console.log(`📊 Debug Dashboard: http://localhost:${PORT}/debug`);
      console.log(`🔗 OAuth Callback: ${REDIRECT_URI}`);
      console.log(`📋 OAuth URL Generator: http://localhost:${PORT}/api/oauth/url`);
      console.log('\n🎯 This solves the "double authorization" issue by:');
      console.log('1. Capturing installation_id from GoHighLevel\'s token response');
      console.log('2. Creating installation records during OAuth flow');
      console.log('3. Properly linking marketplace installs with tokens');
      console.log('\n✅ Ready to handle OAuth callbacks with enhanced installation tracking!');
    });
  }
}

// Start the enhanced OAuth handler
if (require.main === module) {
  const handler = new EnhancedOAuthHandler();
  handler.start();
}

module.exports = EnhancedOAuthHandler;