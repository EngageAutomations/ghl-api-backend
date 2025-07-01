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

  // Image Upload API - GoHighLevel Media Upload
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
      
      // Get OAuth installation from the OAuth backend
      const installationsResponse = await axios.get('https://dir.engageautomations.com/installations');
      const installations = installationsResponse.data.installations || [];
      
      const installation = installations.find((inst: any) => inst.id === installation_id);
      if (!installation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Installation not found',
          available_installations: installations.map((i: any) => i.id)
        });
      }
      
      if (installation.tokenStatus !== 'valid') {
        return res.status(401).json({ 
          success: false, 
          error: 'OAuth token invalid or expired',
          tokenStatus: installation.tokenStatus
        });
      }
      
      console.log(`Using installation ${installation_id} with location ${installation.locationId}`);
      
      // Get fresh access token by making a test API call through OAuth backend
      let accessToken;
      try {
        const tokenTestResponse = await axios.post('https://dir.engageautomations.com/api/products/create', {
          name: 'Token Test - Delete Me',
          description: 'Testing token for image upload',
          installation_id: installation_id
        });
        
        // If the call succeeds, we know the token is valid
        // We need to get the actual token - for now we'll make a direct call
        console.log('OAuth token confirmed valid through product creation test');
        
        // Since we can't directly access the token from OAuth backend,
        // we'll make the upload request through the OAuth backend instead
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });
        formData.append('installation_id', installation_id);
        
        console.log('Uploading file through OAuth backend...');
        
        // Try to upload through OAuth backend first (if it has the endpoint)
        try {
          const uploadResponse = await axios.post('https://dir.engageautomations.com/api/images/upload', formData, {
            headers: formData.getHeaders(),
            timeout: 30000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          
          return res.json({
            success: true,
            media: uploadResponse.data,
            message: 'Image uploaded successfully via OAuth backend'
          });
          
        } catch (oauthUploadError) {
          console.log('OAuth backend upload not available, using direct GoHighLevel API...');
          
          // Since OAuth backend doesn't have upload endpoint, we'll need the actual token
          // For now, return a helpful message
          return res.status(501).json({
            success: false,
            error: 'Image upload requires OAuth backend enhancement',
            suggestion: 'OAuth backend needs image upload endpoint implementation',
            fileReady: {
              name: req.file.originalname,
              size: req.file.size,
              type: req.file.mimetype
            },
            installationReady: {
              id: installation_id,
              locationId: installation.locationId,
              tokenStatus: installation.tokenStatus
            }
          });
        }
        
      } catch (tokenError) {
        console.error('Token validation failed:', tokenError.response?.data || tokenError.message);
        return res.status(401).json({
          success: false,
          error: 'OAuth token validation failed',
          details: tokenError.response?.data || tokenError.message
        });
      }
      
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Image upload failed',
        details: error.response?.data || error.message
      });
    }
  });

  // List Media Files API  
  app.get("/api/images/list", async (req, res) => {
    try {
      const { installation_id, limit = 20, offset = 0 } = req.query;
      
      if (!installation_id) {
        return res.status(400).json({ success: false, error: 'installation_id required' });
      }
      
      // Get installation info from OAuth backend
      const installationsResponse = await axios.get('https://dir.engageautomations.com/installations');
      const installations = installationsResponse.data.installations || [];
      
      const installation = installations.find((inst: any) => inst.id === installation_id);
      if (!installation) {
        return res.status(404).json({ success: false, error: 'Installation not found' });
      }
      
      // For now, return a placeholder response since we need OAuth backend media endpoint
      res.json({
        success: true,
        media: [],
        pagination: { limit, offset, total: 0 },
        message: 'Media listing requires OAuth backend media endpoints',
        installation: {
          id: installation_id,
          locationId: installation.locationId,
          tokenStatus: installation.tokenStatus
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