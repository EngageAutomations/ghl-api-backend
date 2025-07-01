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