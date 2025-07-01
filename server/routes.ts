import { type Express } from "express";
import { createServer } from "http";
import { db } from "server/db";
import { insertListingSchema, insertListingAddonSchema, insertWizardFormTemplateSchema, insertCollectionSchema, insertDirectorySchema, users } from "@shared/schema";
import { z } from "zod";
import { storage } from "./storage";
import { RailwayBridge, bridgeRoutes } from "./bridge-endpoints";
import multer from "multer";
import axios from "axios";

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

  // Directory Status Page
  app.get("/directory", async (req, res) => {
    try {
      // Get OAuth backend status
      const oauthResponse = await axios.get('https://dir.engageautomations.com/health');
      const apiResponse = await axios.get('https://api.engageautomations.com/health');
      const installsResponse = await axios.get('https://dir.engageautomations.com/installations');
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace Integration Status</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .status-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .status-header { display: flex; align-items: center; justify-content: between; margin-bottom: 16px; }
        .status-title { font-size: 18px; font-weight: 600; margin: 0; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .status-healthy { background: #dcfce7; color: #166534; }
        .status-unhealthy { background: #fef2f2; color: #dc2626; }
        .status-details { margin-top: 12px; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .detail-label { color: #64748b; font-size: 14px; }
        .detail-value { font-weight: 500; font-size: 14px; }
        .installations { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .install-item { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 12px 0; }
        .install-id { font-family: monospace; font-size: 13px; color: #475569; }
        .workflow-status { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 20px; }
        .workflow-step { display: flex; align-items: center; margin: 12px 0; }
        .step-icon { width: 24px; height: 24px; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        .step-complete { background: #dcfce7; color: #166534; }
        .step-ready { background: #fef3c7; color: #92400e; }
        .step-pending { background: #f1f5f9; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>GoHighLevel Marketplace Integration</h1>
            <p style="color: #64748b; font-size: 16px;">Dual Backend Architecture Status Dashboard</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <div class="status-header">
                    <h3 class="status-title">OAuth Backend</h3>
                    <span class="status-badge status-healthy">✓ Healthy</span>
                </div>
                <div class="status-details">
                    <div class="detail-row">
                        <span class="detail-label">Version</span>
                        <span class="detail-value">${oauthResponse.data.version}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Purpose</span>
                        <span class="detail-value">Authentication Only</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Installations</span>
                        <span class="detail-value">${oauthResponse.data.installations}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">URL</span>
                        <span class="detail-value">dir.engageautomations.com</span>
                    </div>
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-header">
                    <h3 class="status-title">API Backend</h3>
                    <span class="status-badge status-healthy">✓ Healthy</span>
                </div>
                <div class="status-details">
                    <div class="detail-row">
                        <span class="detail-label">Service</span>
                        <span class="detail-value">${apiResponse.data.service}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Features</span>
                        <span class="detail-value">${apiResponse.data.features.length} APIs</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Functions</span>
                        <span class="detail-value">${apiResponse.data.features.join(', ')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">URL</span>
                        <span class="detail-value">api.engageautomations.com</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="installations">
            <h3>OAuth Installations (${installsResponse.data.count})</h3>
            ${installsResponse.data.installations.length === 0 ? 
                '<p style="color: #64748b;">No active installations. Complete OAuth through GoHighLevel marketplace to begin.</p>' :
                installsResponse.data.installations.map(install => `
                    <div class="install-item">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div class="install-id">${install.id}</div>
                                <div style="font-size: 14px; color: #475569; margin-top: 4px;">Location: ${install.locationId}</div>
                            </div>
                            <span class="status-badge ${install.tokenStatus === 'valid' ? 'status-healthy' : 'status-unhealthy'}">
                                ${install.tokenStatus}
                            </span>
                        </div>
                    </div>
                `).join('')
            }
        </div>
        
        <div class="workflow-status">
            <h3>Image Upload Workflow Status</h3>
            <div class="workflow-step">
                <div class="step-icon step-complete">✓</div>
                <span>OAuth Backend Deployed (Authentication)</span>
            </div>
            <div class="workflow-step">
                <div class="step-icon step-complete">✓</div>
                <span>API Backend Deployed (GoHighLevel Operations)</span>
            </div>
            <div class="workflow-step">
                <div class="step-icon ${installsResponse.data.count > 0 ? 'step-complete' : 'step-ready'}">
                    ${installsResponse.data.count > 0 ? '✓' : '!'}
                </div>
                <span>OAuth Installation ${installsResponse.data.count > 0 ? 'Complete' : 'Required'}</span>
            </div>
            <div class="workflow-step">
                <div class="step-icon ${installsResponse.data.count > 0 ? 'step-ready' : 'step-pending'}">
                    ${installsResponse.data.count > 0 ? '!' : '○'}
                </div>
                <span>Image Upload Testing Ready</span>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: white; border-radius: 12px;">
            <h4>Quick Actions</h4>
            <p style="color: #64748b; margin-bottom: 20px;">
                ${installsResponse.data.count === 0 ? 
                    'Complete OAuth installation through GoHighLevel marketplace to begin testing.' :
                    'OAuth installation complete. Ready to test image upload workflow.'
                }
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <a href="https://listings.engageautomations.com" style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Frontend App</a>
                <a href="https://dir.engageautomations.com/debug" style="background: #64748b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">OAuth Debug</a>
                <a href="https://api.engageautomations.com/health" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">API Status</a>
            </div>
        </div>
    </div>
</body>
</html>`;
      
      res.send(html);
      
    } catch (error) {
      console.error('Directory page error:', error);
      res.status(500).send(`
        <html><body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h2>Directory Status Unavailable</h2>
          <p>Unable to fetch backend status information.</p>
          <p style="color: #666;">Error: ${error.message}</p>
          <a href="/" style="color: #0ea5e9;">Return to Application</a>
        </body></html>
      `);
    }
  });

  // Image Upload API - GoHighLevel Media Upload via OAuth Backend
  app.post("/api/images/upload", upload.single('file'), async (req, res) => {
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
      const FormData = require('form-data');
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
  app.get("/api/images/list", async (req, res) => {
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
  app.get("/api/bridge/health", (req, res) => {
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
}