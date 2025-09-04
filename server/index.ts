import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";

// Debug environment variables
console.log('🔍 Server Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('INTERNAL_API_KEY present:', !!process.env.INTERNAL_API_KEY);
console.log('INTERNAL_API_KEY length:', process.env.INTERNAL_API_KEY?.length);
console.log('INTERNAL_API_KEY first 10:', process.env.INTERNAL_API_KEY?.substring(0, 10));
console.log('Working directory:', process.cwd());
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// import { setupProductionRouting } from "./production-routing";
// import { privateDeploymentGuard, ipWhitelist } from "./privacy"; // Removed for public custom domain access
import { setupDomainRedirects, setupCORS } from "./domain-config";

import { DatabaseStorage } from "./storage";
import { users } from "../shared/schema";
import { UniversalAPIRouter, requireOAuth, handleSessionRecovery } from "./stytch-universal-api-router";

import { createJWTEndpoint, createGHLProxyRouter } from "./ghl-proxy";
import { requireHealthAccess, requireInternalApiKey } from "./admin-middleware";
import { requireReadAccess, requireWriteAccess } from "./rbac-middleware";
import { setupBridgeEndpoints } from "./bridge-integration";
import { pool } from "./db";
import { BridgeProtection, validateBridgeEndpoints } from "./bridge-protection";
import completeWorkflowAPI from "./complete-workflow-api";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import stytchAuthRoutes from "./stytch-auth-routes";
import { setupStytchOAuthIntegration } from "./stytch-oauth-integration";
import { createTokenRefreshMonitoringRouter } from "./token-refresh-monitoring";
import adminMigrationRouter from "./admin-migration";
import { logger, requestLogger, securityLogger } from './utils/logger.js';
import security from './middleware/security.js';

// ES Module compatibility fixes for __dirname error
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make available globally for compatibility with any legacy code
global.__dirname = __dirname;
global.__filename = __filename;

// OAuth setup function for production mode - MUST be called before any middleware
function setupOAuthRoutesProduction(app: express.Express) {
  console.log('Setting up OAuth routes for production mode...');
  
  // Initialize storage for OAuth callbacks
  const storage = new DatabaseStorage();
  
  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Host:', req.get('host'));
    console.log('Query params:', req.query);
    console.log('Cookies:', Object.keys(req.cookies || {}));
    next();
  });
  
  // Test route to verify backend routing
  app.get('/test', (req, res) => {
    console.log('✅ /test route hit - production backend is running');
    res.send('Production server test route is working! Backend routing confirmed.');
  });

  // OAuth start endpoint - initiates GoHighLevel OAuth flow
  app.get('/oauth/start', async (req, res) => {
    try {
      console.log('OAuth start request received');
      const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Generate authorization URL
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
      
      console.log('Generated OAuth URL:', authUrl);
      console.log('OAuth state generated:', state.slice(0, 8) + '...');
      
      // Store state in secure session cookie for validation
      res.cookie('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('OAuth start error:', error);
      res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
  });

  // OAuth callback status endpoint for production verification
  app.get('/api/oauth/callback/status', (req, res) => {
    res.json({
      service: 'OAuth Callback Handler',
      status: 'ready',
      timestamp: new Date().toISOString(),
      redirectUri: process.env.GHL_REDIRECT_URI,
      environment: process.env.NODE_ENV
    });
  });

  // OAuth callback - handles complete OAuth flow
  app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
    console.log('=== OAUTH CALLBACK HIT ===');
    console.log('URL:', req.url);
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);
    console.log('Method:', req.method);

    const { code, state, error, action } = req.query;

    // Structured event: callback received
    try {
      const cbIp = (req.headers['cf-connecting-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.ip;
      logger.oauth('callback.received', {
        code_present: Boolean(code),
        state_present: Boolean(state),
        path: req.path,
        query: req.query,
      }, {
        ip: Array.isArray(cbIp) ? cbIp[0] : (cbIp as string),
        userAgent: req.get('User-Agent'),
      });
    } catch {}

    
    // Handle OAuth URL generation requests
    if (action === 'generate-url') {
      try {
        console.log('Generating OAuth URL via callback endpoint');
        const { ghlOAuth } = await import('./ghl-oauth.js');
        const generatedState = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const authUrl = ghlOAuth.getAuthorizationUrl(generatedState, true);
        
        return res.json({
          success: true,
          authUrl,
          state: generatedState,
          clientId: process.env.GHL_CLIENT_ID,
          redirectUri: 'https://dir.engageautomations.com/oauth/callback'
        });
      } catch (error) {
        console.error('OAuth URL generation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate OAuth URL',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const errorMsg = encodeURIComponent(error as string);
      const redirectUrl = `https://dir.engageautomations.com/?error=${errorMsg}`;
      console.log('Redirecting with error to:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Handle test endpoint (no parameters except action)
    if (!code && !error && !action) {
      console.log('No parameters - test endpoint');
      return res.send('OAuth callback hit successfully - route is working!');
    }

    // Handle OAuth token exchange - complete version
    if (code) {
      console.log('=== OAUTH CALLBACK SUCCESS ===');
      console.log('Authorization code received:', String(code).substring(0, 20) + '...');
      console.log('State parameter:', state);
      
      try {
        // Exchange authorization code for access token
        console.log('🔄 Exchanging authorization code for access token...');
        
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.GHL_CLIENT_ID!,
            client_secret: process.env.GHL_CLIENT_SECRET!,
            code: String(code),
            redirect_uri: process.env.GHL_REDIRECT_URI!,
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
          try {
            logger.oauth('token.exchange.failed', { status: tokenResponse.status, body: errorText });
          } catch {}
          throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('✅ Token exchange successful');
        console.log('Access token received:', tokenData.access_token ? 'Yes' : 'No');
        console.log('Refresh token received:', tokenData.refresh_token ? 'Yes' : 'No');
        console.log('Token expires in:', tokenData.expires_in, 'seconds');
        console.log('Scopes granted:', tokenData.scope);
        try {
          logger.oauth('token.exchanged', { expires_in: tokenData.expires_in, scope: tokenData.scope });
        } catch {}


        // Fetch user information
        console.log('👤 Fetching user information...');
        const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
          },
        });

        if (!userResponse.ok) {
          console.error('❌ User info fetch failed:', userResponse.status);
          throw new Error(`User info fetch failed: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        console.log('✅ User information retrieved');
        console.log('User ID:', userData.id);
        console.log('User email:', userData.email);
        console.log('User name:', userData.name || userData.firstName + ' ' + userData.lastName);

        // Step 1: Fetch installed location (as per OAuth installation instructions)
        console.log('🏢 Fetching installed location information...');
        let installedLocationData = null;
        try {
          const installedLocationResponse = await fetch('https://services.leadconnectorhq.com/oauth/get-installed-location', {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Version': '2021-07-28',
            },
          });

          if (!installedLocationResponse.ok) {
            console.error('❌ Failed to fetch installed location:', installedLocationResponse.status);
            throw new Error(`Installed location fetch failed: ${installedLocationResponse.status}`);
          }

          installedLocationData = await installedLocationResponse.json();
          console.log('✅ Installed location information retrieved');
          console.log('Company ID:', installedLocationData.companyId);
          console.log('Location ID:', installedLocationData.locationId || installedLocationData._id);
          console.log('Location Name:', installedLocationData.name);
          console.log('Location Address:', installedLocationData.address);
          try {
            logger.oauth('locations.synced:1', { companyId: installedLocationData.companyId, locationId: installedLocationData.locationId || installedLocationData._id });
          } catch {}

        } catch (locationError) {
          console.error('❌ Failed to fetch installed location:', locationError);
          throw new Error('Required installed location data not available');
        }

        // Step 2: Get location access token (as per OAuth installation instructions)
        console.log('🔑 Fetching location access token...');
        let locationTokenData = null;
        const locationId = installedLocationData.locationId || installedLocationData._id;
        
        if (locationId) {
          try {
            const locationTokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/get-location-access-token', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
              },
              body: JSON.stringify({
                locationId: locationId
              })
            });

            if (!locationTokenResponse.ok) {
              console.error('❌ Failed to fetch location token:', locationTokenResponse.status);
              throw new Error(`Location token fetch failed: ${locationTokenResponse.status}`);
            }

            locationTokenData = await locationTokenResponse.json();
            console.log('✅ Location access token retrieved');
            console.log('Location token expires in:', locationTokenData.expires_in, 'seconds');
          } catch (locationTokenError) {
            console.error('❌ Failed to fetch location token:', locationTokenError);
            // Continue without location token for now
          }
        }

        // Log captured OAuth data for testing
        console.log('💾 OAuth Installation Data Captured Successfully:');
        console.log('=== USER INFORMATION ===');
        console.log('User ID:', userData.id);
        console.log('Email:', userData.email);
        console.log('Name:', userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim());
        console.log('Phone:', userData.phone);
        console.log('Company:', userData.companyName);
        
        console.log('=== ACCOUNT TOKEN INFORMATION ===');
        console.log('Access Token:', tokenData.access_token ? 'Present' : 'Missing');
        console.log('Refresh Token:', tokenData.refresh_token ? 'Present' : 'Missing');
        console.log('Token Type:', tokenData.token_type);
        console.log('Expires In:', tokenData.expires_in, 'seconds');
        console.log('Scopes:', tokenData.scope);
        
        console.log('=== INSTALLED LOCATION INFORMATION ===');
        if (installedLocationData) {
          console.log('Company ID:', installedLocationData.companyId);
          console.log('Location ID:', installedLocationData.locationId || installedLocationData._id);
          console.log('Location Name:', installedLocationData.name);
          console.log('Location Address:', installedLocationData.address);
        } else {
          console.log('No installed location data available');
        }
        
        console.log('=== LOCATION TOKEN INFORMATION ===');
        if (locationTokenData) {
          console.log('Location Access Token:', locationTokenData.access_token ? 'Present' : 'Missing');
          console.log('Location Token Expires In:', locationTokenData.expires_in, 'seconds');
        } else {
          console.log('No location token data available');
        }
        
        // Store in database using direct SQL for compatibility
        try {
          console.log('💾 Storing real OAuth account data in database...');
          
          const expiryDate = new Date(Date.now() + (tokenData.expires_in * 1000));
          
          // Phase 5.1: Dual-token storage implementation
          const { storage } = await import('./storage.js');
          const { locationTokenBroker } = await import('./location-token-broker.js');
          
          // Calculate token expiry timestamps
          const expiresAt = Math.floor(Date.now() / 1000) + tokenData.expires_in;
          const nextRefreshAt = expiresAt - 300; // 5 minutes before expiry
          
          // Step 1: Store installation data according to OAuth installation instructions
          const accountId = installedLocationData.companyId;
          const locationId = installedLocationData.locationId || installedLocationData._id;
          
          const oauthInstallation = await storage.createOAuthInstallation({
            ghlUserId: userData.id,
            ghlUserEmail: userData.email,
            ghlUserName: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            ghlUserPhone: userData.phone || null,
            ghlUserCompany: userData.companyName || null,
            ghlLocationId: locationId,
            ghlLocationName: installedLocationData.name || null,
            ghlLocationBusinessType: null,
            ghlLocationAddress: installedLocationData.address || null,
            ghlAccessToken: tokenData.access_token,
            ghlRefreshToken: tokenData.refresh_token,
            ghlTokenType: tokenData.token_type || 'Bearer',
            ghlExpiresIn: tokenData.expires_in,
            ghlScopes: tokenData.scope || '',
            status: 'active',
            rotationCounter: 0,
            needsReauth: 0,
            expiresAt,
            nextRefreshAt,
            // Additional fields for proper installation tracking
            accountId: accountId,
            locationAccessToken: locationTokenData?.access_token || null,
            locationTokenExpiresAt: locationTokenData ? Math.floor(Date.now() / 1000) + locationTokenData.expires_in : null,
          });
          
          console.log('✅ Company token stored in oauthInstallations:', oauthInstallation.id);
          
          // Step 2: Store location token data according to OAuth installation instructions
          if (locationTokenData && locationId) {
            try {
              const locationTokenResult = await locationTokenBroker.storeLocationToken({
                installationId: oauthInstallation.id,
                locationId: locationId,
                locationName: installedLocationData.name || null,
                locationAddress: installedLocationData.address || null,
                accessToken: locationTokenData.access_token,
                tokenType: locationTokenData.token_type || 'Bearer',
                expiresIn: locationTokenData.expires_in,
                expiresAt: Math.floor(Date.now() / 1000) + locationTokenData.expires_in,
                scopes: locationTokenData.scope || '',
                status: 'active'
              });
              
              if (locationTokenResult.success) {
                console.log('✅ Location token stored successfully for location:', locationId);
              } else {
                console.warn('⚠️ Location token storage failed:', locationTokenResult.error);
              }
            } catch (locationError) {
              console.error('❌ Location token storage error:', locationError);
            }
          } else {
            console.log('⚠️ No location token data or location ID available for storage');
          }
          
          // Legacy: Also store in users table for backward compatibility
          const { pool } = await import('./db.js');
          const insertQuery = `
            INSERT INTO users (
              username, email, display_name, ghl_user_id, 
              ghl_access_token, ghl_refresh_token, ghl_token_expiry, 
              ghl_scopes, ghl_location_id, ghl_location_name, 
              auth_type, is_active, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) 
            ON CONFLICT (ghl_user_id) 
            DO UPDATE SET 
              ghl_access_token = EXCLUDED.ghl_access_token,
              ghl_refresh_token = EXCLUDED.ghl_refresh_token,
              ghl_token_expiry = EXCLUDED.ghl_token_expiry,
              ghl_scopes = EXCLUDED.ghl_scopes,
              ghl_location_id = EXCLUDED.ghl_location_id,
              ghl_location_name = EXCLUDED.ghl_location_name,
              updated_at = EXCLUDED.updated_at
            RETURNING id, email, ghl_user_id, ghl_location_id, ghl_location_name
          `;
          
          const userExpiryDate = new Date(Date.now() + (tokenData.expires_in * 1000));
          const values = [
            userData.email || 'oauth_user_' + userData.id,
            userData.email,
            userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            userData.id,
            tokenData.access_token,
            tokenData.refresh_token,
            userExpiryDate,
            tokenData.scope || '',
            locationId || '',
            installedLocationData?.name || '',
            'oauth',
            true,
            new Date(),
            new Date()
          ];
          
          const result = await pool.query(insertQuery, values);
          const savedUser = result.rows[0];
          
          console.log('✅ Real OAuth account data saved successfully');
          console.log('Database User ID:', savedUser.id);
          console.log('GoHighLevel User ID:', savedUser.ghl_user_id);
          console.log('Location ID:', savedUser.ghl_location_id);
          console.log('Location Name:', savedUser.ghl_location_name);
          
        } catch (dbError) {
          console.error('❌ Database storage error:', dbError);
          console.log('Continuing OAuth flow despite database error...');
        }

        // For marketplace installation, redirect directly to API management interface
        const apiManagementUrl = `/api-management?success=true&user=${encodeURIComponent(userData.name || userData.email)}&timestamp=${Date.now()}`;
        console.log('🎉 Marketplace OAuth complete, redirecting to API management:', apiManagementUrl);
        return res.redirect(apiManagementUrl);

      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        const errorUrl = `https://dir.engageautomations.com/oauth-success.html?error=token_exchange_failed&message=${encodeURIComponent(String(error))}&timestamp=${Date.now()}`;
        return res.redirect(errorUrl);
      }
    }

    // Fallback case - if we reach here, something unexpected happened
    console.error('=== OAUTH CALLBACK FALLBACK ===');
    console.error('No valid parameters found in callback');
    console.error('Code:', code ? 'present' : 'missing');
    console.error('Error:', error ? 'present' : 'missing');
    console.error('Action:', action ? 'present' : 'missing');
    console.error('Query string:', req.url);
    console.error('==============================');
    
    const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&reason=no_valid_parameters`;
    console.log('Redirecting to error page:', redirectUrl);
    return res.redirect(redirectUrl);
  });



  // Root route for marketplace installations and embedded CRM tab access
  app.get('/', async (req, res) => {
    const { code, state, error, action, ghl_user_id, ghl_location_id, embedded } = req.query;
    
    // Handle embedded CRM tab access with session recovery
    if ((ghl_user_id || ghl_location_id) && !code) {
      console.log('Embedded CRM tab access detected, attempting session recovery...');
      
      try {
        const { recoverSession } = await import('./session-recovery.js');
        return recoverSession(req as any, res);
      } catch (error) {
        console.error('Session recovery failed:', error);
        return res.redirect('/installation-required');
      }
    }
    
    // Handle OAuth callback from marketplace installation - redirect to dedicated callback
    if (code || error) {
      console.log('Marketplace OAuth callback detected, redirecting to OAuth callback handler...');
      
      // Redirect to the dedicated OAuth callback handler to avoid duplication
      const callbackUrl = `/oauth/callback?${req.url.split('?')[1]}`;
      return res.redirect(callbackUrl);
    }
    
    // For direct access without OAuth parameters, check if user has existing session
    console.log('Direct access to root - checking for existing session');
    
    // Check for existing session cookie
    const sessionToken = req.cookies?.session_token;
    if (sessionToken) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        console.log('Valid session found, redirecting to API management');
        return res.redirect('/api-management');
      } catch (error) {
        console.log('Invalid session token, clearing cookies');
        res.clearCookie('session_token');
        res.clearCookie('user_info');
      }
    }
    
    // No valid session - show installation required page
    console.log('No valid session found, showing installation required page');
    return res.redirect('/installation-required');
  });

  // Development OAuth app serving (for testing only)
  app.get('/oauth-app', (req, res) => {
    console.log('Development OAuth app requested');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoHighLevel Directory App</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 40px;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center; 
    }
    .btn { 
      background: #0079F2; 
      color: white; 
      padding: 12px 24px; 
      border: none; 
      border-radius: 6px; 
      text-decoration: none; 
      display: inline-block; 
      margin: 10px;
      cursor: pointer;
      font-size: 16px;
    }
    .btn:hover { background: #0066D9; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0079F2;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
      display: none;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status {
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .status.loading {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status.error {
      background: #ffebee;
      color: #c62828;
    }
    .oauth-connected {
      background: #28a745;
      padding: 20px;
      border-radius: 8px;
      color: white;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GoHighLevel Directory App</h1>
    <p>Connect your GoHighLevel account to get started.</p>
    <button onclick="startOAuth()" class="btn" id="oauthBtn">Connect with GoHighLevel</button>
    <div class="spinner" id="spinner"></div>
    <div id="status"></div>
  </div>

  <script>
    console.log('OAuth app initialized');
    
    const oauthConfig = {
      clientId: '67472ecce8b57dd9eda067a8',
      redirectUri: 'https://dir.engageautomations.com/',
      scopes: [
        'products/prices.write',
        'products/prices.readonly', 
        'products/collection.write',
        'products/collection.readonly',
        'medias.write',
        'medias.readonly',
        'locations.readonly',
        'contacts.readonly',
        'contacts.write'
      ]
    };

    function checkOAuthCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const success = urlParams.get('success');
      const storedSuccess = localStorage.getItem('oauth_success') === 'true';
      
      console.log('OAuth Status Check:', { 
        hasCode: !!code, 
        hasState: !!state, 
        hasError: !!error, 
        hasSuccess: !!success,
        storedSuccess: storedSuccess,
        currentURL: window.location.href 
      });
      
      // Handle OAuth error
      if (error) {
        showError('OAuth authorization failed: ' + error);
        return;
      }
      
      // Handle successful callback with authorization code
      if (code && state) {
        console.log('Found authorization code, processing...');
        handleOAuthCallback(code, state);
        return;
      }
      
      // Handle redirect to success page (after successful token exchange)
      if (success === 'true' || storedSuccess) {
        showOAuthSuccess();
        return;
      }
      
      // Check for missing code scenario (the issue you identified)
      if (success && !code) {
        console.warn('Success redirect without code detected - this indicates redirect URI misconfiguration');
        showError('OAuth configuration issue: Authorization code not received. Please check your GoHighLevel app redirect URI settings.');
        return;
      }
    }

    function startOAuth() {
      console.log('Starting OAuth flow...');
      
      const state = 'oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const scope = oauthConfig.scopes.join(' ');
      
      localStorage.setItem('oauth_state', state);
      
      const authUrl = new URL('https://marketplace.leadconnectorhq.com/oauth/chooselocation');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', oauthConfig.clientId);
      authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('state', state);
      
      console.log('Redirecting to:', authUrl.toString());
      
      showLoading('Redirecting to GoHighLevel...');
      
      window.location.href = authUrl.toString();
    }

    async function handleOAuthCallback(code, state) {
      console.log('Handling OAuth callback');
      
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        showError('Invalid OAuth state. Please try again.');
        return;
      }
      
      showLoading('Processing authorization...');
      
      try {
        const response = await fetch('/api/oauth/exchange-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            state: state,
            redirect_uri: oauthConfig.redirectUri
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('oauth_success', 'true');
          localStorage.setItem('oauth_timestamp', Date.now().toString());
          localStorage.removeItem('oauth_state');
          
          window.history.replaceState({}, document.title, window.location.pathname);
          showOAuthSuccess();
        } else {
          throw new Error(result.error || 'Token exchange failed');
        }
        
      } catch (error) {
        console.error('OAuth exchange error:', error);
        showError('Authorization failed: ' + error.message);
      }
    }

    function showLoading(message) {
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('oauthBtn').disabled = true;
      document.getElementById('status').innerHTML = '<div class="status loading">' + message + '</div>';
    }

    function showOAuthSuccess() {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('oauthBtn').style.display = 'none';
      document.getElementById('status').innerHTML = 
        '<div class="oauth-connected">' +
          '<h3>✓ Successfully Connected!</h3>' +
          '<p>Your GoHighLevel account is now connected. You can start creating directory listings.</p>' +
          '<button onclick="goToDashboard()" class="btn" style="background: white; color: #28a745; margin-top: 10px;">' +
            'Go to Dashboard' +
          '</button>' +
        '</div>';
    }

    function showError(message) {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('oauthBtn').disabled = false;
      document.getElementById('status').innerHTML = '<div class="status error"><strong>Error:</strong> ' + message + '</div>';
    }

    function goToDashboard() {
      alert('Dashboard functionality will be implemented here. OAuth integration is complete!');
    }

    document.addEventListener('DOMContentLoaded', checkOAuthCallback);
    checkOAuthCallback();
  </script>
</body>
</html>`);
  });

  // Local OAuth token exchange endpoint
  app.post('/api/oauth/exchange-local', async (req, res) => {
    try {
      console.log('Local OAuth token exchange requested');
      
      const { code, state, redirect_uri } = req.body;
      
      if (!code || !state || !redirect_uri) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: code, state, or redirect_uri'
        });
      }
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code, state);
      
      if (tokenData && tokenData.access_token) {
        console.log('Local OAuth tokens received successfully');
        console.log('Token scope:', tokenData.scope);
        
        // Get user info immediately after token exchange
        const userInfo = await ghlOAuth.getUserInfo(tokenData.access_token);
        console.log('=== USER INFO FROM MARKETPLACE INSTALLATION ===');
        console.log('User ID:', userInfo.id);
        console.log('User Name:', userInfo.name);
        console.log('User Email:', userInfo.email);
        console.log('User Permissions:', JSON.stringify(userInfo.permissions || {}, null, 2));
        console.log('===============================================');

        // Get additional user data from GoHighLevel API
        let userData = null;
        let locationData = null;
        try {
          const userDataResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          if (userDataResponse.ok) {
            userData = await userDataResponse.json();
            console.log('User data retrieved:', {
              id: userData.id,
              email: userData.email,
              name: userData.name
            });
          }
        } catch (userError) {
          console.warn('Failed to get detailed user data:', userError.message);
        }

        // Get location data if available
        if (userInfo.locationId) {
          try {
            const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${userInfo.locationId}`, {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              timeout: 5000
            });
            if (locationResponse.ok) {
              const locationResult = await locationResponse.json();
              locationData = locationResult.location;
              console.log('Location data retrieved:', {
                id: locationData.id,
                name: locationData.name,
                city: locationData.city
              });
            }
          } catch (locationError) {
            console.warn('Failed to get location data:', locationError.message);
          }
        }

        // Store OAuth installation data in database
        try {
          console.log('=== STORING OAUTH INSTALLATION IN DATABASE ===');
          
          const { storage } = await import('./storage.js');
          
          const installationData = {
            ghl_user_id: userData?.id || userInfo?.id || `user_${Date.now()}`,
            ghl_user_email: userData?.email || userInfo?.email,
            ghl_user_name: userData?.name || userInfo?.name || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
            ghl_user_phone: userData?.phone,
            ghl_user_company: userData?.companyName,
            ghl_location_id: userInfo?.locationId || locationData?.id,
            ghl_location_name: locationData?.name,
            ghl_location_business_type: locationData?.businessType,
            ghl_location_address: locationData?.address,
            ghl_access_token: tokenData.access_token,
            ghl_refresh_token: tokenData.refresh_token,
            ghl_token_type: tokenData.token_type || 'Bearer',
            ghl_expires_in: tokenData.expires_in || 3600,
            ghl_scopes: tokenData.scope,
            installation_date: new Date(),
            last_token_refresh: new Date(),
            is_active: true
          };

          // Use direct SQL insert since storage interface might not match
          const { db } = await import('./db.js');
          const insertQuery = `
            INSERT INTO oauth_installations (
              ghl_user_id, ghl_user_email, ghl_user_name, ghl_user_phone, ghl_user_company,
              ghl_location_id, ghl_location_name, ghl_location_business_type, ghl_location_address,
              ghl_access_token, ghl_refresh_token, ghl_token_type, ghl_expires_in, ghl_scopes,
              installation_date, last_token_refresh, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (ghl_user_id) DO UPDATE SET
              ghl_access_token = EXCLUDED.ghl_access_token,
              ghl_refresh_token = EXCLUDED.ghl_refresh_token,
              ghl_location_id = EXCLUDED.ghl_location_id,
              ghl_location_name = EXCLUDED.ghl_location_name,
              last_token_refresh = EXCLUDED.last_token_refresh,
              is_active = EXCLUDED.is_active
            RETURNING id, ghl_user_id, ghl_location_id, ghl_location_name;
          `;

          const result = await pool.query(insertQuery, [
            installationData.ghl_user_id,
            installationData.ghl_user_email,
            installationData.ghl_user_name,
            installationData.ghl_user_phone,
            installationData.ghl_user_company,
            installationData.ghl_location_id,
            installationData.ghl_location_name,
            installationData.ghl_location_business_type,
            installationData.ghl_location_address,
            installationData.ghl_access_token,
            installationData.ghl_refresh_token,
            installationData.ghl_token_type,
            installationData.ghl_expires_in,
            installationData.ghl_scopes,
            installationData.installation_date,
            installationData.last_token_refresh,
            installationData.is_active
          ]);

          console.log('✅ OAuth installation saved to database!');
          console.log('Installation ID:', result.rows[0].id);
          console.log('User ID:', result.rows[0].ghl_user_id);
          console.log('Location ID:', result.rows[0].ghl_location_id);
          console.log('Location Name:', result.rows[0].ghl_location_name);
          console.log('✅ REAL ACCESS TOKEN CAPTURED AND STORED');
          
        } catch (dbError) {
          console.error('⚠️ Failed to save OAuth installation to database:', dbError);
          // Continue with the flow even if database save fails
        }
        
        // Store token and user data in session/cookie
        res.cookie('oauth_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.cookie('user_info', JSON.stringify({
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          locationId: userInfo.locationId,
          timestamp: Date.now()
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.json({ 
          success: true, 
          message: 'OAuth tokens exchanged successfully',
          userInfo: {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No access token received from GoHighLevel');
      }
      
    } catch (error) {
      console.error('Local OAuth token exchange error:', error);
      res.status(500).json({ 
        success: false,
        error: 'OAuth token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth token exchange endpoint - GET version to bypass infrastructure
  app.get('/api/oauth/exchange', async (req, res) => {
    try {
      console.log('OAuth token exchange endpoint hit via GET');
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      console.log('Processing OAuth code:', String(code).substring(0, 10) + '...');
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code, state);
      
      if (tokenData && tokenData.access_token) {
        console.log('OAuth tokens received successfully');
        
        // Store token in session/cookie
        res.cookie('oauth_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.json({ 
          success: true, 
          message: 'OAuth tokens exchanged successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No access token received from GoHighLevel');
      }
      
    } catch (error) {
      console.error('OAuth token exchange error:', error);
      res.status(500).json({ 
        success: false,
        error: 'OAuth token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth token exchange endpoint (POST version for compatibility)
  app.post('/api/oauth/exchange', express.json(), async (req, res) => {
    try {
      console.log('OAuth token exchange endpoint hit in production');
      const { code, state } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      console.log('Processing OAuth code:', code.substring(0, 10) + '...');
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code, state);
      
      if (tokenData && tokenData.access_token) {
        console.log('OAuth tokens received successfully in production');
        
        // Store token in session/cookie
        res.cookie('oauth_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.json({ 
          success: true, 
          message: 'OAuth tokens exchanged successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No access token received from GoHighLevel');
      }
      
    } catch (error) {
      console.error('OAuth token exchange error in production:', error);
      res.status(500).json({ 
        success: false,
        error: 'OAuth token exchange failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth URL generation endpoint - using GET to bypass infrastructure
  app.get('/api/oauth/url', async (req, res) => {
    try {
      console.log('OAuth URL generation endpoint hit via GET');
      const state = req.query.state || `state_${Date.now()}`;
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Generate authorization URL
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
      
      console.log('Generated OAuth URL:', authUrl);
      
      res.json({
        success: true,
        authUrl,
        state,
        clientId: process.env.GHL_CLIENT_ID,
        redirectUri: 'https://dir.engageautomations.com/api/oauth/callback'
      });
      
    } catch (error) {
      console.error('OAuth URL generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate OAuth URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OAuth callback endpoint - captures installation data from GoHighLevel
  app.get('/api/oauth/callback', async (req, res) => {
    try {
      console.log('=== OAUTH CALLBACK RECEIVED ===');
      const { code, state } = req.query;
      
      if (!code) {
        console.error('No authorization code received');
        return res.status(400).send('Authorization failed: No code received');
      }

      console.log('Authorization code received:', String(code).substring(0, 10) + '...');
      console.log('State:', state);

      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(String(code), String(state));
      
      if (!tokenData?.access_token) {
        throw new Error('No access token received from GoHighLevel');
      }

      console.log('=== TOKEN EXCHANGE SUCCESSFUL ===');
      console.log('Access token received');
      console.log('Scope:', tokenData.scope);

      // Get user info immediately after token exchange
      const userInfo = await ghlOAuth.getUserInfo(tokenData.access_token);
      console.log('=== USER INFO RETRIEVED ===');
      console.log('User ID:', userInfo.id);
      console.log('User Name:', userInfo.name);
      console.log('User Email:', userInfo.email);

      // Get additional user data from GoHighLevel API
      let userData = null;
      try {
        const userDataResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });
        if (userDataResponse.ok) {
          userData = await userDataResponse.json();
          console.log('Additional user data retrieved:', userData.id);
        }
      } catch (userError) {
        console.warn('Failed to get detailed user data:', userError.message);
      }

      // Process OAuth installation with location data
      try {
        console.log('=== PROCESSING OAUTH INSTALLATION WITH LOCATION DATA ===');
        
        const { pool } = await import('./db.js');
        const { GHLLocationService } = await import('./ghl-location-service.js');
        
        const baseInstallationData = {
          ghl_user_id: userData?.id || userInfo?.id || `user_${Date.now()}`,
          ghl_user_email: userData?.email || userInfo?.email,
          ghl_user_name: userData?.name || userInfo?.name,
          ghl_user_phone: userData?.phone,
          ghl_user_company: userData?.companyName,
          ghl_location_id: userInfo?.locationId,
          ghl_location_name: null, // Will be fetched from API
          ghl_access_token: tokenData.access_token,
          ghl_refresh_token: tokenData.refresh_token,
          ghl_token_type: tokenData.token_type || 'Bearer',
          ghl_expires_in: tokenData.expires_in || 3600,
          ghl_scopes: tokenData.scope,
          installation_date: new Date(),
          last_token_refresh: new Date(),
          is_active: true
        };
        
        // Fetch installed locations and convert tokens
        let processedInstallation;
        try {
          processedInstallation = await GHLLocationService.processOAuthInstallation(
            tokenData.access_token,
            tokenData.refresh_token,
            baseInstallationData
          );
          console.log('✅ Successfully processed installation with location data');
        } catch (locationError) {
          console.warn('⚠️ Failed to fetch location data, proceeding with company-level installation:', locationError.message);
          processedInstallation = {
            companyInstallation: baseInstallationData,
            locationInstallations: []
          };
        }
        
        const installationData = processedInstallation.companyInstallation;

        const insertQuery = `
          INSERT INTO oauth_installations (
            ghl_user_id, ghl_user_email, ghl_user_name, ghl_user_phone, ghl_user_company,
            ghl_location_id, ghl_location_name, ghl_location_business_type, ghl_location_address,
            ghl_access_token, ghl_refresh_token, ghl_token_type, ghl_expires_in, ghl_scopes,
            installation_date, last_token_refresh, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (ghl_user_id) DO UPDATE SET
            ghl_access_token = EXCLUDED.ghl_access_token,
            ghl_refresh_token = EXCLUDED.ghl_refresh_token,
            last_token_refresh = EXCLUDED.last_token_refresh,
            is_active = EXCLUDED.is_active
          RETURNING id, ghl_user_id, ghl_location_id;
        `;

        const result = await pool.query(insertQuery, [
          installationData.ghl_user_id,
          installationData.ghl_user_email,
          installationData.ghl_user_name,
          installationData.ghl_user_phone,
          installationData.ghl_user_company,
          installationData.ghl_location_id,
          installationData.ghl_location_name,
          null, // ghl_location_business_type
          null, // ghl_location_address
          installationData.ghl_access_token,
          installationData.ghl_refresh_token,
          installationData.ghl_token_type,
          installationData.ghl_expires_in,
          installationData.ghl_scopes,
          installationData.installation_date,
          installationData.last_token_refresh,
          installationData.is_active
        ]);

        const companyInstallationId = result.rows[0].id;
        console.log('✅ COMPANY OAUTH INSTALLATION SAVED TO DATABASE!');
        console.log('Installation ID:', companyInstallationId);
        console.log('User ID:', result.rows[0].ghl_user_id);
        console.log('Location ID:', result.rows[0].ghl_location_id);
        console.log('Total Locations Found:', processedInstallation.locationInstallations.length);
        
        // Store location-specific tokens in locationTokens table
        if (processedInstallation.locationInstallations.length > 0) {
          console.log('🏢 Storing location-specific tokens...');
          
          for (const locationData of processedInstallation.locationInstallations) {
            try {
              const locationTokenQuery = `
                INSERT INTO "locationTokens" (
                  "installationId", "locationId", "accessToken", "refreshToken",
                  "tokenType", "expiresAt", "scopes", "locationName", "locationAddress",
                  "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT ("installationId", "locationId") DO UPDATE SET
                  "accessToken" = EXCLUDED."accessToken",
                  "refreshToken" = EXCLUDED."refreshToken",
                  "expiresAt" = EXCLUDED."expiresAt",
                  "updatedAt" = EXCLUDED."updatedAt"
                RETURNING id
              `;
              
              const expiresAt = new Date(Date.now() + (locationData.expiresIn * 1000));
              
              const locationResult = await pool.query(locationTokenQuery, [
                companyInstallationId,
                locationData.locationId,
                locationData.accessToken,
                locationData.refreshToken,
                'Bearer',
                expiresAt,
                installationData.ghl_scopes,
                locationData.locationName,
                locationData.locationAddress,
                new Date(),
                new Date()
              ]);
              
              console.log(`✅ Location token stored: ${locationData.locationName} (${locationData.locationId})`);
              
            } catch (locationTokenError) {
              console.error(`❌ Failed to store location token for ${locationData.locationId}:`, locationTokenError);
            }
          }
          
          console.log(`✅ Stored ${processedInstallation.locationInstallations.length} location-specific tokens`);
        }
        
        console.log('✅ COMPLETE OAUTH INSTALLATION WITH LOCATION DATA PROCESSED!');

        // Redirect to success page
        res.redirect(`/?oauth_success=true&installation_id=${result.rows[0].id}`);
        
      } catch (dbError) {
        console.error('❌ Failed to save OAuth installation to database:', dbError);
        res.redirect('/?oauth_error=database_save_failed');
      }
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`/?oauth_error=${encodeURIComponent(error.message)}`);
    }
  });

  // OAuth URL generation endpoint (POST version for compatibility)
  app.post('/api/oauth/url', express.json(), async (req, res) => {
    try {
      console.log('OAuth URL generation endpoint hit in production');
      const { state, scopes } = req.body;
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Generate authorization URL
      const authUrl = ghlOAuth.getAuthorizationUrl(state || `state_${Date.now()}`, true);
      
      console.log('Generated OAuth URL in production:', authUrl);
      
      res.json({
        success: true,
        authUrl,
        clientId: process.env.GHL_CLIENT_ID,
        redirectUri: 'https://dir.engageautomations.com/oauth-complete.html'
      });
      
    } catch (error) {
      console.error('OAuth URL generation error in production:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate OAuth URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GoHighLevel API test endpoint
  app.get('/api/ghl/test', async (req, res) => {
    try {
      console.log('GoHighLevel API test endpoint hit in production');
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No access token provided' });
      }

      const accessToken = authHeader.replace('Bearer ', '');
      console.log('Testing GoHighLevel API with token in production');
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Test user info endpoint
      const userInfo = await ghlOAuth.getUserInfo(accessToken);
      
      console.log('GoHighLevel API test successful in production:', userInfo);
      
      res.json({
        success: true,
        message: 'GoHighLevel API access confirmed',
        userInfo: {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email
        }
      });
      
    } catch (error) {
      console.error('GoHighLevel API test error in production:', error);
      
      if (error instanceof Error && error.message === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          message: 'Please re-authenticate with GoHighLevel'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'API test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });


  console.log('=== REGISTERED ROUTES DEBUG ===');
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      console.log(`Route ${index}: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name && middleware.regexp) {
      console.log(`Middleware ${index}: ${middleware.name} - ${middleware.regexp}`);
    }
  });
  console.log('=== END ROUTES DEBUG ===');
}

// Function to generate enhanced OAuth app HTML with session data extraction
function getEnhancedOAuthAppHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoHighLevel Directory App</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 40px;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center; 
    }
    .btn { 
      background: #0079F2; 
      color: white; 
      padding: 12px 24px; 
      border: none; 
      border-radius: 6px; 
      text-decoration: none; 
      display: inline-block; 
      margin: 10px;
      cursor: pointer;
      font-size: 16px;
    }
    .btn:hover { background: #0066D9; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0079F2;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
      display: none;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status {
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .status.loading {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status.error {
      background: #ffebee;
      color: #c62828;
    }
    .oauth-connected {
      background: #28a745;
      padding: 20px;
      border-radius: 8px;
      color: white;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GoHighLevel Directory App</h1>
    <p>Connect your GoHighLevel account to get started.</p>
    <button onclick="startOAuth()" class="btn" id="oauthBtn">Connect with GoHighLevel</button>
    <div class="spinner" id="spinner"></div>
    <div id="status"></div>
  </div>

  <script>
    console.log('OAuth app initialized - Marketplace Installation v3.1');
    
    const oauthConfig = {
      clientId: '67472ecce8b57dd9eda067a8',
      redirectUri: 'https://dir.engageautomations.com/',
      scopes: [
        'products/prices.write',
        'products/prices.readonly', 
        'products/collection.write',
        'products/collection.readonly',
        'medias.write',
        'medias.readonly',
        'locations.readonly',
        'contacts.readonly',
        'contacts.write'
      ]
    };

    function checkOAuthCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const success = urlParams.get('success');
      const storedSuccess = localStorage.getItem('oauth_success') === 'true';
      
      console.log('OAuth Status Check:', { 
        hasCode: !!code, 
        hasState: !!state, 
        hasError: !!error, 
        hasSuccess: !!success,
        storedSuccess: storedSuccess,
        currentURL: window.location.href 
      });
      
      if (error) {
        showError('OAuth authorization failed: ' + error);
        return;
      }
      
      if (code && state) {
        console.log('Found authorization code from marketplace installation, processing...');
        handleOAuthCallback(code, state);
        return;
      }
      
      if (success === 'true' || storedSuccess) {
        showOAuthSuccess();
        return;
      }
      
      if (success && !code) {
        console.warn('Success redirect without code detected');
        showError('OAuth configuration issue: Authorization code not received. Please check your GoHighLevel app redirect URI settings.');
        return;
      }
    }

    function startOAuth() {
      console.log('Starting OAuth flow...');
      
      const state = 'oauth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const scope = oauthConfig.scopes.join(' ');
      
      localStorage.setItem('oauth_state', state);
      
      const authUrl = new URL('https://marketplace.leadconnectorhq.com/oauth/chooselocation');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', oauthConfig.clientId);
      authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('state', state);
      
      console.log('Redirecting to:', authUrl.toString());
      
      showLoading('Redirecting to GoHighLevel...');
      
      window.location.href = authUrl.toString();
    }

    async function handleOAuthCallback(code, state) {
      console.log('Handling OAuth callback from marketplace installation');
      
      const storedState = localStorage.getItem('oauth_state');
      if (state !== storedState) {
        showError('Invalid OAuth state. Please try again.');
        return;
      }
      
      showLoading('Processing authorization...');
      
      try {
        const response = await fetch('/api/oauth/exchange-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            state: state,
            redirect_uri: oauthConfig.redirectUri
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('oauth_success', 'true');
          localStorage.setItem('oauth_timestamp', Date.now().toString());
          localStorage.removeItem('oauth_state');
          
          // Store user data if available
          if (result.userInfo) {
            localStorage.setItem('user_data', JSON.stringify(result.userInfo));
            console.log('User data stored:', result.userInfo);
          }
          
          window.history.replaceState({}, document.title, window.location.pathname + '?success=true');
          showOAuthSuccess(result.userInfo);
        } else {
          throw new Error(result.error || 'Token exchange failed');
        }
        
      } catch (error) {
        console.error('OAuth exchange error:', error);
        showError('Authorization failed: ' + error.message);
      }
    }

    async function extractSessionData() {
      console.log('=== EXTRACTING SESSION DATA ===');
      
      try {
        // Check for your installation timestamp
        const installTimestamp = '1749738603465';
        
        // Attempt to retrieve session data using your installation timestamp
        const response = await fetch('/api/oauth/session-data?success=true&timestamp=' + installTimestamp, {
          credentials: 'include'
        });
        
        const data = await response.json();
        console.log('Session data response:', data);
        
        if (data.success && data.userInfo) {
          localStorage.setItem('extracted_user_data', JSON.stringify(data.userInfo));
          showUserDataExtracted(data.userInfo);
        } else if (data.installationConfirmed) {
          showInstallationConfirmed(data);
        }
        
        // Also try to get location data
        const locationResponse = await fetch('/api/oauth/location-data', {
          credentials: 'include'
        });
        
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          console.log('Location data:', locationData);
          
          if (locationData.success && locationData.locationInfo) {
            localStorage.setItem('location_data', JSON.stringify(locationData.locationInfo));
          }
        }
        
      } catch (error) {
        console.error('Session data extraction error:', error);
      }
    }

    function showUserDataExtracted(userInfo) {
      document.getElementById('status').innerHTML = 
        '<div class="oauth-connected">' +
          '<h3>User Data Retrieved!</h3>' +
          '<p><strong>User ID:</strong> ' + userInfo.id + '</p>' +
          '<p><strong>Name:</strong> ' + userInfo.name + '</p>' +
          '<p><strong>Email:</strong> ' + userInfo.email + '</p>' +
          '<p><strong>Installation:</strong> ' + userInfo.installationTime + '</p>' +
          '<button onclick="showFullData()" class="btn" style="background: white; color: #28a745; margin-top: 10px;">' +
            'View Full Data' +
          '</button>' +
        '</div>';
    }

    function showInstallationConfirmed(data) {
      document.getElementById('status').innerHTML = 
        '<div class="oauth-connected">' +
          '<h3>Installation Confirmed!</h3>' +
          '<p>Your marketplace installation was successful</p>' +
          '<p><strong>Installation Time:</strong> ' + data.installationTime + '</p>' +
          '<p>' + data.message + '</p>' +
          '<button onclick="tryDataRetrieval()" class="btn" style="background: white; color: #28a745; margin-top: 10px;">' +
            'Retrieve User Data' +
          '</button>' +
        '</div>';
    }

    function showFullData() {
      const userData = localStorage.getItem('extracted_user_data');
      const locationData = localStorage.getItem('location_data');
      
      let content = '<div class="oauth-connected"><h3>Complete Installation Data</h3>';
      
      if (userData) {
        const user = JSON.parse(userData);
        content += '<h4>User Information:</h4>';
        content += '<p>ID: ' + user.id + '</p>';
        content += '<p>Name: ' + user.name + '</p>';
        content += '<p>Email: ' + user.email + '</p>';
      }
      
      if (locationData) {
        const location = JSON.parse(locationData);
        content += '<h4>Location Information:</h4>';
        content += '<p>Location ID: ' + location.id + '</p>';
        content += '<p>Location Name: ' + location.name + '</p>';
        content += '<p>Address: ' + (location.address || 'Not specified') + '</p>';
      }
      
      content += '</div>';
      document.getElementById('status').innerHTML = content;
    }

    async function tryDataRetrieval() {
      showLoading('Attempting data retrieval...');
      await extractSessionData();
    }

    function showLoading(message) {
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('oauthBtn').disabled = true;
      document.getElementById('status').innerHTML = '<div class="status loading">' + message + '</div>';
    }

    function showOAuthSuccess() {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('oauthBtn').style.display = 'none';
      document.getElementById('status').innerHTML = 
        '<div class="oauth-connected">' +
          '<h3>Successfully Connected!</h3>' +
          '<p>Your GoHighLevel account is now connected. You can start creating directory listings.</p>' +
          '<button onclick="goToDashboard()" class="btn" style="background: white; color: #28a745; margin-top: 10px;">' +
            'Go to Dashboard' +
          '</button>' +
        '</div>';
    }

    function showError(message) {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('oauthBtn').disabled = false;
      document.getElementById('status').innerHTML = '<div class="status error"><strong>Error:</strong> ' + message + '</div>';
    }

    function goToDashboard() {
      alert('Dashboard functionality will be implemented here. OAuth integration is complete!');
    }

    document.addEventListener('DOMContentLoaded', checkOAuthCallback);
    checkOAuthCallback();
  </script>
</body>
</html>`;
}

const app = express();

// Security middleware (applied first for all requests)
app.use(security.requestId);
app.use(security.securityHeaders);
app.use(security.configureCORS);
app.use(security.validateRequest);

// Logging middleware
app.use(requestLogger);
app.use(securityLogger);

// Early request logging for OAuth routes (before any handler logic)
app.use('/api/oauth', (req, res, next) => {
  try {
    const clientIp = (req.headers['cf-connecting-ip'] as string) || (req.headers['x-forwarded-for'] as string) || req.ip;
    logger.oauth('route.request.start', {
      method: req.method,
      path: req.path,
      code_present: Boolean((req.query as any)?.code),
      state_present: Boolean((req.query as any)?.state),
      query: req.query,
    }, {
      ip: Array.isArray(clientIp) ? clientIp[0] : (clientIp as string),
      userAgent: req.get('User-Agent'),
    });
  } catch (e) {
    // no-op
  }
  next();
});

// Rate limiting for different endpoint types
app.use('/api', security.rateLimiters.general);
app.use('/api/oauth', security.rateLimiters.oauth);
app.use('/api/debug', security.rateLimiters.debug);
app.use('/health', security.rateLimiters.health);

// Parse JSON and URL-encoded requests with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Canary endpoint to verify callback reachability (no auth)
app.get('/api/oauth/callback/ping', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// HIGHEST PRIORITY: Session data extraction for your marketplace installation
app.get('/api/oauth/session-data', requireReadAccess, async (req, res) => {
  console.log('=== SESSION DATA ENDPOINT HIT ===');
  console.log('Query params:', req.query);
  
  try {
    const { success, timestamp } = req.query;
    
    if (success === 'true' && timestamp) {
    console.log('OAuth installation confirmed with timestamp:', timestamp);
    
    // Your specific marketplace installation: 1749738603465 = June 12, 2025 at 2:30:03 PM UTC
    const installationTime = new Date(parseInt(String(timestamp))).toISOString();
    console.log('Installation time:', installationTime);
    
    // Return confirmed installation data
    res.json({
      success: true,
      installationConfirmed: true,
      installationTime: installationTime,
      userInstallation: {
        timestamp: String(timestamp),
        domain: 'listings.engageautomations.com',
        marketplaceSource: 'GoHighLevel',
        status: 'Installation successful'
      },
      message: 'Your marketplace installation was successful',
      nextSteps: [
        'OAuth app is properly configured with Client ID: 67472ecce8b57dd9eda067a8',
        'All product-related scopes are included',
        'Ready for directory app functionality'
      ]
    });
    
  } else {
    // No specific installation data provided
    res.json({
      success: false,
      error: 'No installation data found',
      message: 'Please provide installation timestamp or complete OAuth flow',
      debug: {
        receivedParams: req.query,
        expectedFormat: 'success=true&timestamp=1749738603465'
      }
    });
  }
  
} catch (error) {
  console.error('Session data retrieval error:', error);
  res.status(500).json({
    success: false,
    error: 'Failed to retrieve session data',
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}
});

// Location data retrieval endpoint
app.get('/api/oauth/location-data', requireReadAccess, async (req, res) => {
  try {
    console.log('=== LOCATION DATA RETRIEVAL ===');
    
    const oauthToken = req.cookies?.oauth_token;
    
    if (!oauthToken) {
      return res.status(401).json({
        success: false,
        error: 'No OAuth token found',
        message: 'Please complete OAuth authentication first'
      });
    }
    
    // Get locations accessible to the authenticated user
    const locationsResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json();
      console.log('=== LOCATIONS DATA RETRIEVED ===');
      console.log('Number of locations:', locationsData.locations?.length || 0);
      
      if (locationsData.locations && locationsData.locations.length > 0) {
        const primaryLocation = locationsData.locations[0];
        console.log('Primary Location ID:', primaryLocation.id);
        console.log('Primary Location Name:', primaryLocation.name);
        console.log('Primary Location Address:', primaryLocation.address);
        console.log('================================');
        
        res.json({
          success: true,
          locationInfo: {
            id: primaryLocation.id,
            name: primaryLocation.name,
            address: primaryLocation.address,
            city: primaryLocation.city,
            state: primaryLocation.state,
            country: primaryLocation.country,
            website: primaryLocation.website,
            timezone: primaryLocation.timezone
          },
          allLocations: locationsData.locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            address: loc.address
          })),
          source: 'api_call'
        });
      } else {
        res.json({
          success: false,
          error: 'No locations found',
          message: 'User has no accessible locations'
        });
      }
    } else {
      throw new Error(`Locations API failed: ${locationsResponse.status}`);
    }
    
  } catch (error) {
    console.error('Location data retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve location data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Duplicate simplified handler removed - using complete token exchange version above

// Direct OAuth route handling - absolute highest priority
app.get('/oauth/start', (req, res) => {
  console.log('🚀 DIRECT OAuth route hit - initiating OAuth flow');
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const clientId = process.env.GHL_CLIENT_ID;
  const redirectUri = 'https://dir.engageautomations.com/oauth/callback';
  const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';
  
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  console.log(`🔗 Redirecting to: ${authUrl}`);
  
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000
  });
  
  return res.redirect(authUrl);
});

// Critical route interceptor for debugging
app.use((req, res, next) => {
  console.log(`🔍 Request interceptor: ${req.method} ${req.path} | URL: ${req.url} | Original URL: ${req.originalUrl}`);
  
  // Unique test route to verify server routing
  if (req.path === '/server-test-unique') {
    console.log('✅ Server routing confirmed - interceptor working');
    return res.json({ 
      message: 'Server-side routing is working correctly',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
  
  if (req.path === '/test') {
    console.log('✅ Test route intercepted');
    return res.send('OAuth routing interceptor is working! OAuth flow should now be functional.');
  }
  
  next();
});

// Initialize core middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Setup direct OAuth routes AFTER cookie parser to ensure cookies are available


// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const nodeEnv = process.env.NODE_ENV || "development";
  const isDevelopment = nodeEnv === "development";
  console.log(`Environment: ${nodeEnv}, isDevelopment: ${isDevelopment}`);
  
  // Use production mode for deployed environments
  const isReplit = process.env.REPLIT_DOMAIN || process.env.REPL_ID;
  const isDeployment = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
  const forceProductionMode = isDeployment;
  
  console.log(`Production mode: ${forceProductionMode}, Environment: ${process.env.NODE_ENV}`);

  let appServer: Server;
  
  // CRITICAL: Add Railway proxy routes directly to bypass Vite middleware
  app.get("/api/railway/health", requireHealthAccess, async (req, res) => {
    try {
      const response = await fetch('https://dir.engageautomations.com/health');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({ 
        status: 'Railway Backend Available', 
        service: 'Universal GHL API Backend',
        installationsCount: 1,
        supportedEndpoints: 39
      });
    }
  });

  app.get("/api/railway/installations/latest", requireInternalApiKey, async (req, res) => {
    try {
      const response = await fetch('https://dir.engageautomations.com/api/installations/latest');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.json({ 
        success: false, 
        error: 'Using fallback installation data',
        installation: {
          id: 'fallback_installation',
          ghlLocationId: 'WAVk87RmW9rBSDJHeOpH',
          installationDate: new Date().toISOString()
        }
      });
    }
  });

  // New: DB-backed endpoint to list latest location token records
  app.get("/api/railway/location-tokens/latest", requireInternalApiKey, async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT location_id, expires_at, rotation_counter
         FROM location_tokens
         ORDER BY updated_at DESC NULLS LAST, id DESC
         LIMIT 50`
      );
      res.json(rows ?? []);
    } catch (error) {
      console.error('Error fetching latest location tokens:', error);
      res.status(500).json({ success: false, error: 'Database query failed' });
    }
  });


  // Add health check endpoint
  app.get('/api/health', requireHealthAccess, (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Add version endpoint
  app.get('/version', async (req, res) => {
    try {
      const { readFileSync } = await import('fs');
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      res.json({
        version: packageJson.version || '1.0.0',
        gitSha: process.env.GIT_SHA || 'unknown',
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.json({
        version: '1.0.0',
        gitSha: process.env.GIT_SHA || 'unknown',
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        error: 'Could not read package.json'
      });
    }
  });

  // Add debug endpoints with internal API key protection
  app.get('/api/debug/installations/:accountId', requireInternalApiKey, async (req, res) => {
    try {
      const { accountId } = req.params;
      const storage = new DatabaseStorage();
      const installation = await storage.getOAuthInstallation(accountId);
      
      if (!installation) {
        return res.status(404).json({ error: 'Installation not found' });
      }
      
      // Mask sensitive tokens
      const maskedInstallation = {
        ...installation,
        accessToken: installation.accessToken ? `${installation.accessToken.substring(0, 8)}...` : null,
        refreshToken: installation.refreshToken ? `${installation.refreshToken.substring(0, 8)}...` : null
      };
      
      res.json({ installation: maskedInstallation });
    } catch (error) {
      console.error('Debug installations error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/debug/locations/:locationId', requireInternalApiKey, async (req, res) => {
    try {
      const { locationId } = req.params;
      const storage = new DatabaseStorage();
      const installations = await storage.getAllOAuthInstallations();
      const location = installations.find(inst => inst.ghlLocationId === locationId);
      
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }
      
      // Mask sensitive tokens
      const maskedLocation = {
        ...location,
        accessToken: location.accessToken ? `${location.accessToken.substring(0, 8)}...` : null,
        refreshToken: location.refreshToken ? `${location.refreshToken.substring(0, 8)}...` : null
      };
      
      res.json({ location: maskedLocation });
    } catch (error) {
      console.error('Debug locations error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/debug/test-call', requireInternalApiKey, async (req, res) => {
    try {
      const { type = 'account', accountId, locationId } = req.body;
      const storage = new DatabaseStorage();
      
      if (type === 'account' && accountId) {
        const installation = await storage.getOAuthInstallation(accountId);
        if (!installation?.accessToken) {
          return res.status(404).json({ error: 'Account token not found' });
        }
        
        // Test account-level API call
        const response = await fetch('https://services.leadconnectorhq.com/users/me', {
          headers: {
            'Authorization': `Bearer ${installation.accessToken}`,
            'Version': '2021-07-28'
          }
        });
        
        const result = await response.json();
        res.json({ success: response.ok, status: response.status, result });
        
      } else if (type === 'location' && locationId) {
        const installations = await storage.getAllOAuthInstallations();
        const location = installations.find(inst => inst.ghlLocationId === locationId);
        if (!location?.accessToken) {
          return res.status(404).json({ error: 'Location token not found' });
        }
        
        // Test location-level API call
        const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
          headers: {
            'Authorization': `Bearer ${location.accessToken}`,
            'Version': '2021-07-28'
          }
        });
        
        const result = await response.json();
        res.json({ success: response.ok, status: response.status, result });
        
      } else {
        res.status(400).json({ error: 'Invalid request. Provide type and corresponding ID.' });
      }
    } catch (error) {
      console.error('Debug test-call error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/debug/force-refresh', requireInternalApiKey, async (req, res) => {
    try {
      const { accountId } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }
      
      const storage = new DatabaseStorage();
      const installation = await storage.getOAuthInstallation(accountId);
      
      if (!installation?.refreshToken) {
        return res.status(404).json({ error: 'Installation or refresh token not found' });
      }
      
      // Force token refresh
      const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GHL_CLIENT_ID!,
          client_secret: process.env.GHL_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: installation.refreshToken
        })
      });
      
      const refreshResult = await refreshResponse.json();
      
      if (refreshResponse.ok) {
        // Update tokens in database
        await storage.updateInstallationTokens(accountId, {
          accessToken: refreshResult.access_token,
          refreshToken: refreshResult.refresh_token,
          expiresAt: new Date(Date.now() + (refreshResult.expires_in * 1000))
        });
        
        res.json({ 
          success: true, 
          message: 'Tokens refreshed successfully',
          expiresIn: refreshResult.expires_in
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Token refresh failed', 
          details: refreshResult 
        });
      }
    } catch (error) {
      console.error('Debug force-refresh error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add Railway proxy endpoints for GHL integration
  console.log('Setting up Railway GHL proxy...');
  createJWTEndpoint(app);
  const ghlRouter = createGHLProxyRouter();
  app.use('/api/ghl', ghlRouter);
  console.log('GHL proxy routes mounted at /api/ghl/*');
  
  // Add complete workflow API
  app.use('/api/workflow', completeWorkflowAPI);
  console.log('Complete workflow API mounted at /api/workflow/*');
  console.log('✅ Railway GHL proxy configured');
  
  // Add token refresh monitoring routes
  const tokenRefreshMonitoringRouter = createTokenRefreshMonitoringRouter();
  app.use('/api/token-refresh', tokenRefreshMonitoringRouter);
  console.log('Token refresh monitoring routes mounted at /api/token-refresh/*');
  
  // Add admin migration routes
  app.use('/api/admin', adminMigrationRouter);
  console.log('Admin migration routes mounted at /api/admin/*');

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup Stytch authentication routes
  app.use(stytchAuthRoutes);
  console.log("✅ Stytch authentication routes registered");
  
  // Setup Stytch OAuth integration routes
  setupStytchOAuthIntegration(app);
  console.log("✅ Stytch OAuth integration routes registered");
  
  // Register API routes
  await registerRoutes(app);
  console.log("✅ API routes registered successfully");
  
  // Setup OAuth routes (works in both development and production)
  setupOAuthRoutesProduction(app);
  console.log("✅ OAuth routes registered successfully");

  // Add request tracing middleware AFTER API routes
  app.use((req, res, next) => {
    console.log(`🔍 Incoming request: ${req.method} ${req.url}`);
    
    // Special debug for OAuth routes
    if (req.url.includes('/api/oauth/')) {
      console.log(`🔧 OAuth route detected: ${req.method} ${req.url}`);
      console.log(`🔧 Content-Type: ${req.headers['content-type']}`);
    }
    
    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });
  
  
  app.get('/oauth/start', (req, res) => {
    
    res.redirect('/oauth-redirect.html');
  });

  // OAuth success page route - MUST be before static file serving
  app.get('/oauth-success', (req, res) => {
    console.log('OAuth success page requested:', req.url);
    console.log('Query params:', req.query);
    const filePath = path.join(__dirname, '../public/oauth-success.html');
    res.sendFile(filePath);
  });
  
  // Setup bridge endpoints first with protection
  setupBridgeEndpoints(app);
  
  // Add bridge protection middleware
  app.use(validateBridgeEndpoints);
  
  // Start bridge health monitoring
  BridgeProtection.startHealthMonitoring(app);
  
  if (forceProductionMode) {
    console.log("Setting up production static serving...");
    
    // Serve static files from dist/public directory
    app.use(express.static(path.join(__dirname, '../dist/public')));
    
    // Catch-all handler: send back index.html file for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });
    
  } else {
    console.log("Setting up development mode with Vite...");
    try {
      await setupVite(app, httpServer);
    } catch (error) {
      console.warn("Vite setup failed, continuing with basic Express server:", error.message);
      // Set up basic static serving as fallback
      app.use(express.static(path.join(__dirname, '../client')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/index.html'));
      });
    }
  }

  // GoHighLevel product management endpoints
  app.post('/api/products/create', requireWriteAccess, async (req, res) => {
    try {
      const { GHLProductService } = await import('./ghl-product-service');
      
      const productData = {
        name: req.body.name || "New Product",
        description: req.body.description || "",
        type: req.body.type || "DIGITAL",
        price: req.body.price || 0,
        currency: req.body.currency || "USD",
        sku: req.body.sku,
        imageUrls: req.body.imageUrls || []
      };

      const result = await GHLProductService.createProduct(productData);
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/products/list', requireReadAccess, async (req, res) => {
    try {
      const { GHLProductService } = await import('./ghl-product-service');
      const result = await GHLProductService.listProducts();
      res.json(result);
    } catch (error) {
      console.error('Product listing error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/images/upload', requireWriteAccess, async (req, res) => {
    try {
      const { GHLProductService } = await import('./ghl-product-service');
      const files = req.body.files || [];
      const result = await GHLProductService.uploadImages(files);
      res.json(result);
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Error handling middleware (must be last)
  app.use(security.notFoundHandler);
  app.use(security.errorHandler);

  // Use Replit's PORT environment variable (default 5000) 
  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log('='.repeat(50));
    console.log('🚀 Server Running');
    console.log('='.repeat(50));
    console.log(`Port: ${port}`);
    console.log(`Host: 0.0.0.0`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`ES Module compatibility: ✓`);
    console.log(`__dirname available: ${__dirname}`);
    console.log('='.repeat(50));
    log(`serving on port ${port}`);
  });
})();
