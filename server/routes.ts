import { type Express } from "express";
import { createServer } from "http";
import { db } from "server/db";
import { insertListingSchema, insertListingAddonSchema, insertWizardFormTemplateSchema, insertCollectionSchema, insertDirectorySchema, users, installations, installationLocations, nangoWebhookEvents, insertInstallationSchema, insertInstallationLocationSchema, insertNangoWebhookEventSchema } from "@shared/schema";
import { z } from "zod";
import { storage } from "./storage";
import { RailwayBridge, bridgeRoutes } from "./bridge-endpoints";
import { workflowRoutes } from "./workflow-routes";
import { enhancedMediaUploadService, mediaUploadMiddleware } from "./enhanced-media-upload";
import { ensureLocationToken, checkLocationTokenAvailability } from "./middleware/location-token-middleware";
import { oauthInstallations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireHealthAccess } from "./admin-middleware";
import { requireInstallationAccess, requireReadAccess, requireWriteAccess, attachPrimaryInstallation } from "./rbac-middleware";
import multer from "multer";
import axios from "axios";
import { verifyNangoSignature, getNangoToken, enrichInstallation, resolveConnectionId, validateLocationAccess, proxyToHighLevel } from "./nango-utils";
import { sql } from "drizzle-orm";

export function registerRoutes(app: Express) {
  // Configure multer for file uploads (memory storage for API forwarding)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
  });

  // Railway Bridge Routes - Hardcoded OAuth credential system
  bridgeRoutes.forEach(route => {
    if (route.method === 'GET') {
      app.get(route.path, route.handler);
    } else if (route.method === 'POST') {
      app.post(route.path, route.handler);
    }
  });

  // Product Creation Workflow Routes
  app.use('/api/workflow', workflowRoutes);

  // Enhanced Media Upload API with Location-First Token Broker (Phase 5.1)
  app.post('/api/media/upload', 
    requireWriteAccess,
    async (req, res) => {
      try {
        const { installation_id, location_id } = req.body;
        
        if (!installation_id || !location_id) {
          return res.status(400).json({ 
            success: false, 
            error: 'installation_id and location_id are required' 
          });
        }

        // Use location-first token broker
        const { locationTokenBroker } = await import('./location-token-broker');
        const tokenResult = await locationTokenBroker.getLocationToken(parseInt(installation_id), location_id);
        
        if (!tokenResult.success) {
          if (tokenResult.needsReauth) {
            return res.status(401).json({ 
              success: false, 
              error: 'needs_reauth',
              message: 'OAuth installation requires re-authentication' 
            });
          }
          
          return res.status(500).json({ 
            success: false, 
            error: tokenResult.error || 'Failed to obtain location token for media upload' 
          });
        }

        // Attach token to request for upload service
        req.locationToken = tokenResult.token;
        req.installation_id = installation_id;
        req.location_id = location_id;
        
        const result = await enhancedMediaUploadService.uploadFile(req, res);
        res.json(result);
      } catch (error) {
        console.error('[MEDIA UPLOAD] Error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error during media upload' 
        });
      }
    }
  );

  // Enhanced Media List API with Location-First Token Broker (Phase 5.1)
  app.get('/api/media/list', 
    requireReadAccess,
    async (req, res) => {
      try {
        const { installation_id, location_id } = req.query;
        
        if (!installation_id || !location_id) {
          return res.status(400).json({ 
            success: false, 
            error: 'installation_id and location_id query parameters are required' 
          });
        }

        // Use location-first token broker
        const { locationTokenBroker } = await import('./location-token-broker');
        const tokenResult = await locationTokenBroker.getLocationToken(parseInt(installation_id as string), location_id as string);
        
        if (!tokenResult.success) {
          if (tokenResult.needsReauth) {
            return res.status(401).json({ 
              success: false, 
              error: 'needs_reauth',
              message: 'OAuth installation requires re-authentication' 
            });
          }
          
          return res.status(500).json({ 
            success: false, 
            error: tokenResult.error || 'Failed to obtain location token for media list' 
          });
        }

        // Attach token to request for list service
        req.locationToken = tokenResult.token;
        req.installation_id = installation_id as string;
        req.location_id = location_id as string;
        
        const result = await enhancedMediaUploadService.listMedia(req, res);
        res.json(result);
      } catch (error) {
        console.error('[MEDIA LIST] Error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error during media list' 
        });
      }
    }
  );

  // Location Token API - Request Location token for media uploads (Phase 5.1)
  app.post('/api/location-token/request', requireWriteAccess, async (req, res) => {
    try {
      const { installation_id, location_id } = req.body;
      
      if (!installation_id || !location_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'installation_id and location_id are required' 
        });
      }

      console.log(`[LOCATION TOKEN API] Requesting Location token for installation: ${installation_id}, location: ${location_id}`);
      
      // Use the new location-first token broker
      const { locationTokenBroker } = await import('./location-token-broker');
      
      // Get Location token (location-first policy)
      const result = await locationTokenBroker.getLocationToken(parseInt(installation_id), location_id);
      
      if (!result.success) {
        if (result.needsReauth) {
          return res.status(401).json({ 
            success: false, 
            error: 'needs_reauth',
            message: 'OAuth installation requires re-authentication' 
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: result.error || 'Failed to obtain Location token' 
        });
      }

      // Don't return the actual token for security, just confirm it's available
      res.json({
        success: true,
        message: 'Location token obtained successfully',
        hasLocationToken: true,
        installation_id: installation_id,
        location_id: location_id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[LOCATION TOKEN API] Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error requesting Location token' 
      });
    }
  });

  // Location Token Status - Check if Location token is available (Phase 5.1)
  app.get('/api/location-token/status/:installation_id/:location_id', requireReadAccess, async (req, res) => {
    try {
      const { installation_id, location_id } = req.params;
      
      console.log(`[LOCATION TOKEN STATUS] Checking status for installation: ${installation_id}, location: ${location_id}`);
      
      // Use the new location-first token broker
      const { locationTokenBroker } = await import('./location-token-broker');
      
      // Try to get location token (this will check availability without actually using it)
      const result = await locationTokenBroker.getLocationToken(parseInt(installation_id), location_id);
      
      res.json({
        success: true,
        installation_id: installation_id,
        location_id: location_id,
        hasLocationToken: result.success,
        needsReauth: result.needsReauth || false,
        message: result.success ? 'Location token available' : (result.error || 'Location token not available'),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[LOCATION TOKEN STATUS] Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error checking Location token status' 
      });
    }
  });

  // OAuth Status - Check installation authentication status (Phase 5.1)
  app.get('/api/oauth/status', requireReadAccess, async (req, res) => {
    try {
      const { installation_id } = req.query;
      
      if (!installation_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'installation_id query parameter is required' 
        });
      }

      console.log(`[OAUTH STATUS] Checking status for installation: ${installation_id}`);
      
      // Get installation from database
      const installation = await db
        .select()
        .from(oauthInstallations)
        .where(eq(oauthInstallations.id, parseInt(installation_id as string)))
        .limit(1);

      if (!installation[0]) {
        return res.json({ 
          authenticated: false, 
          error: 'Installation not found' 
        });
      }

      const inst = installation[0];
      const needsReauth = inst.status === 'needs_reauth' || inst.needsReauth === 1;
      
      res.json({ 
        authenticated: !needsReauth,
        tokenStatus: needsReauth ? 'needs_reauth' : 'valid',
        locationId: inst.ghlLocationId,
        needsReauth: needsReauth,
        installation_id: installation_id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[OAUTH STATUS] Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error checking OAuth status' 
      });
    }
  });

  // Directory Loading Page
  app.get("/directory", async (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Requesting Access Token</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            font-family: 'Courier New', monospace; 
            height: 100vh; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            overflow: hidden;
        }
        
        .loading-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
            animation: fadeInOut 2s ease-in-out infinite;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid transparent;
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes fadeInOut {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading-text">Requesting Access Token</div>
    <div class="spinner"></div>
</body>
</html>`;
    
    res.send(html);
  });

  // Image Upload API - GoHighLevel Media Upload via OAuth Backend
  app.post("/api/images/upload", requireWriteAccess, upload.single('file'), async (req, res) => {
    try {
      console.log('=== Image Upload Request ===');
      
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
      
      // Get OAuth token from OAuth backend
      const tokenResponse = await axios.post('https://dir.engageautomations.com/api/token-access', {
        installation_id: installation_id
      });
      
      if (!tokenResponse.data.success) {
        return res.status(401).json({
          success: false,
          error: tokenResponse.data.error || 'Token access failed'
        });
      }
      
      const { accessToken, installation } = tokenResponse.data;
      console.log(`Using installation ${installation_id} with location ${installation.locationId}`);
      
      // Create form data for GoHighLevel API
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      
      console.log('🚀 Uploading to GoHighLevel media library...');
      
      // Upload directly to GoHighLevel using the token from OAuth backend
      const uploadResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  // List Media Files API via OAuth Backend
  app.get("/api/images/list", requireReadAccess, async (req, res) => {
    try {
      const { installation_id, limit = 20, offset = 0 } = req.query;
      
      if (!installation_id) {
        return res.status(400).json({ success: false, error: 'installation_id required' });
      }
      
      // Get OAuth token from OAuth backend
      const tokenResponse = await axios.post('https://dir.engageautomations.com/api/token-access', {
        installation_id: installation_id
      });
      
      if (!tokenResponse.data.success) {
        return res.status(401).json({
          success: false,
          error: tokenResponse.data.error || 'Token access failed'
        });
      }
      
      const { accessToken, installation } = tokenResponse.data;
      
      // Get media files from GoHighLevel
      const mediaResponse = await axios.get('https://services.leadconnectorhq.com/medias/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28'
        },
        params: { limit, offset }
      });
      
      res.json({
        success: true,
        media: mediaResponse.data.medias || [],
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: mediaResponse.data.total || 0
        },
        installation: {
          id: installation_id,
          locationId: installation.locationId,
          tokenStatus: installation.tokenStatus
        }
      });
      
    } catch (error) {
      console.error('Media list error:', error);
      
      if (error.response) {
        res.status(error.response.status).json({
          success: false,
          error: error.response.data?.message || 'GoHighLevel API error',
          details: error.response.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to list media files'
        });
      }
    }
  });

  // Directory routes
  app.get("/api/directories", async (req, res) => {
    try {
      const directories = await storage.getDirectories();
      res.json(directories);
    } catch (error) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ error: "Failed to fetch directories" });
    }
  });

  app.post("/api/directories", async (req, res) => {
    try {
      const data = insertDirectorySchema.parse(req.body);
      const directory = await storage.createDirectory(data);
      res.json(directory);
    } catch (error) {
      console.error("Error creating directory:", error);
      res.status(500).json({ error: "Failed to create directory" });
    }
  });

  // Collection routes
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const data = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(data);
      res.json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  // Listing routes
  app.get("/api/listings", async (req, res) => {
    try {
      const listings = await storage.getListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const data = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(data);
      res.json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.get("/api/listings/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await storage.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  // Listing addon routes
  app.post("/api/listings/:listingId/addons", async (req, res) => {
    try {
      const { listingId } = req.params;
      const data = insertListingAddonSchema.parse({
        ...req.body,
        listingId: parseInt(listingId)
      });
      
      const addon = await storage.createListingAddon(data);
      res.json(addon);
    } catch (error) {
      console.error("Error creating listing addon:", error);
      res.status(500).json({ error: "Failed to create listing addon" });
    }
  });

  app.get("/api/listings/:listingId/addons", async (req, res) => {
    try {
      const { listingId } = req.params;
      const addons = await storage.getListingAddons(parseInt(listingId));
      res.json(addons);
    } catch (error) {
      console.error("Error fetching listing addons:", error);
      res.status(500).json({ error: "Failed to fetch listing addons" });
    }
  });

  // Wizard form template routes
  app.post("/api/wizard-templates", async (req, res) => {
    try {
      const data = insertWizardFormTemplateSchema.parse(req.body);
      const template = await storage.createWizardFormTemplate(data);
      res.json(template); 
    } catch (error) {
      console.error("Error creating wizard template:", error);
      res.status(500).json({ error: "Failed to create wizard template" });
    }
  });

  app.get("/api/wizard-templates/:directoryId", async (req, res) => {
    try {
      const { directoryId } = req.params;
      const template = await storage.getWizardFormTemplate(parseInt(directoryId));
      res.json(template);
    } catch (error) {
      console.error("Error fetching wizard template:", error);
      res.status(500).json({ error: "Failed to fetch wizard template" });
    }
  });

  // Railway proxy routes for GoHighLevel API calls
  app.post("/api/ghl/*", async (req, res) => {
    try {
      // Extract path and forward to Railway backend
      const ghlPath = req.path.replace('/api/ghl/', '');
      const railwayUrl = `https://dir.engageautomations.com/api/ghl/${ghlPath}`;
      
      const response = await fetch(railwayUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Railway proxy error:", error);
      res.status(500).json({ error: "Railway proxy failed" });
    }
  });

  // Bridge system health check
  app.get("/api/bridge/health", requireHealthAccess, (req, res) => {
    res.json({
      status: "healthy",
      bridge_system: "active",
      endpoints: [
        "/api/bridge/oauth-credentials",
        "/api/bridge/process-oauth", 
        "/api/bridge/installation/:id"
      ],
      timestamp: Date.now()
    });
  });

  // Nango OAuth Callback Route (GET for OAuth redirects)
  app.get("/api/oauth/callback", async (req, res) => {
    try {
      const { code, state, connection_id } = req.query;
      
      if (!code) {
        return res.status(400).send(`
          <html><body>
            <h1>OAuth Error</h1>
            <p>Missing authorization code. Please restart the OAuth flow.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body></html>
        `);
      }

      // If we have a connection_id from Nango, process the installation
      if (connection_id) {
        try {
          // Get short-lived token from Nango
          const tokenData = await getNangoToken(connection_id as string);
          
          // Enrich installation with HighLevel data
          const enrichmentData = await enrichInstallation(connection_id as string, tokenData.accessToken);
          
          // Upsert installation
          const installationData = {
            tenantId: state as string || 'default',
            nangoConnectionId: connection_id as string,
            providerConfigKey: process.env.PROVIDER_CONFIG_KEY || "highlevel",
            companyId: enrichmentData.companyId,
            installerUserId: enrichmentData.installerUserId,
            installerEmail: enrichmentData.installerEmail,
            status: "active" as const,
            updatedAt: new Date(),
          };

          const [installation] = await db
            .insert(installations)
            .values(installationData)
            .onConflictDoUpdate({
              target: installations.nangoConnectionId,
              set: {
                companyId: enrichmentData.companyId,
                installerUserId: enrichmentData.installerUserId,
                installerEmail: enrichmentData.installerEmail,
                status: "active" as const,
                updatedAt: new Date(),
              },
            })
            .returning();

          // Upsert installation locations
          if (enrichmentData.locations.length > 0) {
            // Clear existing locations for this installation
            await db
              .delete(installationLocations)
              .where(eq(installationLocations.installationId, installation.id));

            // Insert new locations
            const locationData = enrichmentData.locations.map((location: any) => ({
              installationId: installation.id,
              locationId: location.id,
              locationName: location.name,
            }));

            await db.insert(installationLocations).values(locationData);
          }

          // Show success page
          return res.send(`
            <html><body>
              <h1>Installation Successful!</h1>
              <p>HighLevel integration has been configured successfully.</p>
              <p>Company ID: ${enrichmentData.companyId}</p>
              <p>Locations: ${enrichmentData.locations.length}</p>
              <script>setTimeout(() => window.close(), 5000);</script>
            </body></html>
          `);
        } catch (error) {
          console.error("OAuth callback processing error:", error);
          return res.status(500).send(`
            <html><body>
              <h1>Installation Error</h1>
              <p>Failed to complete the installation. Please try again.</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body></html>
          `);
        }
      }

      // Fallback success page if no connection_id
      res.send(`
        <html><body>
          <h1>OAuth Complete</h1>
          <p>Authorization successful. You may close this window.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body></html>
      `);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send(`
        <html><body>
          <h1>OAuth Error</h1>
          <p>An error occurred during authorization. Please try again.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body></html>
      `);
    }
  });

  // Nango OAuth Callback Route (POST for programmatic calls and form-encoded data)
  app.post("/api/oauth/callback", async (req, res) => {
    try {
      // Log request details for debugging
      console.log('POST /api/oauth/callback - Request details:');
      console.log('Content-Type:', req.get('Content-Type'));
      console.log('Body:', req.body);
      console.log('Query:', req.query);
      console.log('Headers:', req.headers);
      
      // Handle both JSON and form-encoded data
      let connection_id, tenant_id;
      
      // Check if data is in req.body (JSON) or form-encoded
      if (req.body && typeof req.body === 'object') {
        connection_id = req.body.connection_id;
        tenant_id = req.body.tenant_id;
      }
      
      // If not found in body, check query parameters (fallback)
      if (!connection_id || !tenant_id) {
        connection_id = req.query.connection_id || connection_id;
        tenant_id = req.query.tenant_id || tenant_id;
      }
      
      if (!connection_id || !tenant_id) {
        console.log('Missing required parameters:', { connection_id, tenant_id });
        return res.status(400).json({ 
          ok: false, 
          error: "connection_id and tenant_id are required",
          received: {
            body: req.body,
            query: req.query,
            contentType: req.get('Content-Type')
          }
        });
      }

      // Get short-lived token from Nango
      const tokenData = await getNangoToken(connection_id);
      
      // Enrich installation with HighLevel data
      const enrichmentData = await enrichInstallation(connection_id, tokenData.accessToken);
      
      // Upsert installation
      const installationData = {
        tenantId: tenant_id,
        nangoConnectionId: connection_id,
        providerConfigKey: process.env.PROVIDER_CONFIG_KEY || "highlevel",
        companyId: enrichmentData.companyId,
        installerUserId: enrichmentData.installerUserId,
        installerEmail: enrichmentData.installerEmail,
        status: "active",
        updatedAt: new Date(),
      };

      const [installation] = await db
        .insert(installations)
        .values(installationData)
        .onConflictDoUpdate({
          target: installations.nangoConnectionId,
          set: {
            companyId: enrichmentData.companyId,
            installerUserId: enrichmentData.installerUserId,
            installerEmail: enrichmentData.installerEmail,
            status: "active",
            updatedAt: new Date(),
          },
        })
        .returning();

      // Upsert installation locations
      if (enrichmentData.locations.length > 0) {
        // Clear existing locations for this installation
        await db
          .delete(installationLocations)
          .where(eq(installationLocations.installationId, installation.id));

        // Insert new locations
        const locationData = enrichmentData.locations.map((location: any) => ({
          installationId: installation.id,
          locationId: location.id,
          locationName: location.name,
        }));

        await db.insert(installationLocations).values(locationData);
      }

      res.json({ ok: true, installationId: installation.id });
    } catch (error) {
      console.error("Nango callback error:", error);
      res.status(500).json({ 
        ok: false, 
        error: "Failed to process OAuth callback" 
      });
    }
  });

  // Nango Webhook Route
  app.post("/webhooks/nango", async (req, res) => {
    try {
      const signature = req.headers["x-nango-signature"] as string;
      const rawBody = Buffer.from(JSON.stringify(req.body));
      
      if (!signature || !verifyNangoSignature(rawBody, signature)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const { type: eventType, connectionId, ...payload } = req.body;
      
      // Store webhook event
      await db.insert(nangoWebhookEvents).values({
        eventType,
        nangoConnectionId: connectionId,
        payload: payload,
      });

      // Handle specific events
      switch (eventType) {
        case "connection.created":
          // Ensure installation exists and is active
          await db
            .update(installations)
            .set({ status: "active", updatedAt: new Date() })
            .where(eq(installations.nangoConnectionId, connectionId));
          break;
          
        case "connection.deleted":
          // Mark installation as revoked
          await db
            .update(installations)
            .set({ status: "revoked", updatedAt: new Date() })
            .where(eq(installations.nangoConnectionId, connectionId));
          break;
          
        case "connection.refreshed":
          // Touch updated_at timestamp
          await db
            .update(installations)
            .set({ updatedAt: new Date() })
            .where(eq(installations.nangoConnectionId, connectionId));
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Nango webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // HighLevel Proxy Route
  app.post("/proxy/hl", requireReadAccess, async (req, res) => {
    try {
      const { companyId, locationId, path, method, params, data } = req.body;
      
      if (!companyId || !path || !method) {
        return res.status(400).json({ 
          error: "companyId, path, and method are required" 
        });
      }

      // Get tenant ID from auth middleware (assuming it's attached to req)
      const tenantId = (req as any).user?.tenantId || (req as any).tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: "Tenant authentication required" });
      }

      // Resolve connection ID
      const connectionId = await resolveConnectionId(tenantId, companyId);
      if (!connectionId) {
        return res.status(404).json({ 
          error: "No active installation found for this company" 
        });
      }

      // Validate location access if locationId provided
      if (locationId) {
        const installation = await db
          .select()
          .from(installations)
          .where(
            eq(installations.nangoConnectionId, connectionId)
          )
          .limit(1);
          
        if (installation.length === 0) {
          return res.status(404).json({ error: "Installation not found" });
        }
        
        const hasLocationAccess = await validateLocationAccess(
          installation[0].id, 
          locationId
        );
        
        if (!hasLocationAccess) {
          return res.status(403).json({ 
            error: "Location access denied" 
          });
        }
      }

      // Proxy request to HighLevel via Nango
      const response = await proxyToHighLevel({
        connectionId,
        path,
        method,
        params,
        data,
      });

      // Stream response back to client
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("HighLevel proxy error:", error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const errorData = error.response?.data || { error: "Proxy request failed" };
        res.status(status).json(errorData);
      } else {
        res.status(500).json({ error: "Internal proxy error" });
      }
    }
  });
}