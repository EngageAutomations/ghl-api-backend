import { type Express } from "express";
import { createServer } from "http";
import { db } from "server/db";
import { insertListingSchema, insertListingAddonSchema, insertWizardFormTemplateSchema, users } from "@shared/schema";
import { z } from "zod";
import { storage } from "./storage";
import { RailwayBridge, bridgeRoutes } from "./bridge-endpoints";

export function registerRoutes(app: Express) {
  // Railway Bridge Routes - Hardcoded OAuth credential system
  bridgeRoutes.forEach(route => {
    if (route.method === 'GET') {
      app.get(route.path, route.handler);
    } else if (route.method === 'POST') {
      app.post(route.path, route.handler);
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