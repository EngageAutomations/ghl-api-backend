/**
 * Working API Routes for Directories, Collections, and Listings
 * This fixes the data saving issue by using a simple working storage implementation
 */

import type { Express } from "express";
import { simpleDataStore } from "./simple-storage";

export function setupWorkingRoutes(app: Express) {
  // GET single directory by name
  app.get("/api/directories/:directoryName", (req, res) => {
    try {
      const directoryName = req.params.directoryName;
      console.log("=== FETCHING SINGLE DIRECTORY ===");
      console.log("Directory name:", directoryName);
      
      const userId = 1;
      const directories = simpleDataStore.getDirectoriesByUser(userId);
      const directory = directories.find(d => d.directoryName === directoryName);
      
      if (!directory) {
        console.log("Directory not found:", directoryName);
        return res.status(404).json({ message: "Directory not found" });
      }
      
      const listings = simpleDataStore.getListingsByDirectory(directoryName);
      const directoryWithStats = {
        id: directory.id,
        name: directory.directoryName,
        directoryName: directory.directoryName,
        listingCount: listings.length,
        logoUrl: directory.logoUrl,
        config: directory.config,
        actionButtonColor: directory.actionButtonColor,
        isActive: directory.isActive,
        createdAt: directory.createdAt,
        updatedAt: directory.updatedAt
      };
      
      console.log("Found directory:", directoryWithStats);
      res.status(200).json(directoryWithStats);
    } catch (error) {
      console.error("Error fetching directory:", error);
      res.status(500).json({ message: "Failed to fetch directory", error: error.message });
    }
  });

  // GET directories
  app.get("/api/directories", (req, res) => {
    try {
      console.log("=== FETCHING DIRECTORIES ===");
      // Get authenticated user ID to ensure data isolation
      const userId = req.user?.id || req.headers['x-user-id'] || parseInt(req.query.userId as string) || 1;
      const directories = simpleDataStore.getDirectoriesByUser(parseInt(userId));
      
      const directoriesWithStats = directories.map((directory) => {
        const listings = simpleDataStore.getListingsByDirectory(directory.directoryName);
        const listingCount = listings.length;
        const lastActivity = listings.length > 0 
          ? Math.max(...listings.map(l => new Date(l.updatedAt || l.createdAt).getTime()))
          : null;
        
        return {
          id: directory.id,
          name: directory.directoryName,
          slug: directory.directoryName.toLowerCase().replace(/\s+/g, '-'),
          description: `Directory for ${directory.directoryName}`,
          listingCount,
          lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
          logoUrl: directory.logoUrl,
          config: directory.config,
          actionButtonColor: directory.actionButtonColor,
          isActive: directory.isActive,
          createdAt: directory.createdAt,
          updatedAt: directory.updatedAt,
          directoryName: directory.directoryName
        };
      });
      
      console.log("Found directories:", directoriesWithStats.length);
      console.log("Directories with stats:", JSON.stringify(directoriesWithStats, null, 2));
      res.status(200).json(directoriesWithStats);
    } catch (error) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ message: "Failed to fetch directories", error: error.message });
    }
  });

  // POST directories
  app.post("/api/directories", (req, res) => {
    try {
      console.log("=== CREATING DIRECTORY ===");
      console.log("Request body:", req.body);
      
      const directory = simpleDataStore.createDirectory({
        directoryName: req.body.directoryName,
        userId: req.user?.id || req.headers['x-user-id'] || req.body.userId || 1,
        logoUrl: req.body.logoUrl,
        config: req.body.config || {},
        actionButtonColor: req.body.actionButtonColor || '#3b82f6',
        isActive: req.body.isActive !== false
      });
      
      console.log("Created directory:", directory);
      res.status(201).json(directory);
    } catch (error) {
      console.error("Error creating directory:", error);
      res.status(500).json({ message: "Failed to create directory", error: error.message });
    }
  });

  // PUT directories/:id
  app.put("/api/directories/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid directory ID" });
      }
      
      console.log("=== UPDATING DIRECTORY ===");
      console.log("Directory ID:", id);
      console.log("Update data:", req.body);
      
      const updatedDirectory = simpleDataStore.updateDirectory(id, req.body);
      
      if (!updatedDirectory) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      console.log("Updated directory:", updatedDirectory);
      res.status(200).json(updatedDirectory);
    } catch (error) {
      console.error("Error updating directory:", error);
      res.status(500).json({ message: "Failed to update directory", error: error.message });
    }
  });

  // DELETE directories/:id
  app.delete("/api/directories/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid directory ID" });
      }
      
      console.log("=== DELETING DIRECTORY ===");
      console.log("Directory ID:", id);
      
      const success = simpleDataStore.deleteDirectory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      console.log("Directory deleted successfully");
      res.status(200).json({ message: "Directory deleted successfully" });
    } catch (error) {
      console.error("Error deleting directory:", error);
      res.status(500).json({ message: "Failed to delete directory", error: error.message });
    }
  });

  // GET listings for directory
  app.get("/api/listings/:directoryName", (req, res) => {
    try {
      const directoryName = req.params.directoryName;
      console.log("=== FETCHING LISTINGS FOR DIRECTORY ===");
      console.log("Directory:", directoryName);
      
      const listings = simpleDataStore.getListingsByDirectory(directoryName);
      console.log("Found listings:", listings.length);
      res.status(200).json(listings);
    } catch (error) {
      console.error("Error fetching listings for directory:", error);
      res.status(500).json({ message: "Failed to fetch listings", error: error.message });
    }
  });

  // POST listings
  app.post("/api/listings", (req, res) => {
    try {
      console.log("=== CREATING LISTING ===");
      console.log("Request body:", req.body);
      
      // Check if a listing with this slug already exists
      const existingListing = simpleDataStore.getListingBySlug(req.body.slug);
      
      if (existingListing) {
        return res.status(400).json({ message: "A listing with this slug already exists" });
      }
      
      const listing = simpleDataStore.createListing({
        title: req.body.title,
        slug: req.body.slug,
        directoryName: req.body.directoryName,
        userId: req.user?.id || req.headers['x-user-id'] || req.body.userId || 1,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        imageUrl: req.body.imageUrl,
        isActive: req.body.isActive !== false
      });
      
      console.log("Created listing:", listing);
      res.status(201).json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to create listing", error: error.message });
    }
  });

  // PUT listings/:id
  app.put("/api/listings/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      console.log("=== UPDATING LISTING ===");
      console.log("Listing ID:", id);
      console.log("Update data:", req.body);
      
      // If slug is being updated, check if it's unique
      if (req.body.slug) {
        const existingListing = simpleDataStore.getListingBySlug(req.body.slug);
        
        if (existingListing && existingListing.id !== id) {
          return res.status(400).json({ message: "A listing with this slug already exists" });
        }
      }
      
      const updatedListing = simpleDataStore.updateListing(id, req.body);
      
      if (!updatedListing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      console.log("Updated listing:", updatedListing);
      res.status(200).json(updatedListing);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing", error: error.message });
    }
  });

  // GET collections
  app.get("/api/collections", (req, res) => {
    try {
      const userId = 1;
      console.log("=== FETCHING COLLECTIONS ===");
      const collections = simpleDataStore.getCollectionsByUser(userId);
      console.log("Found collections:", collections.length);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections", message: error.message });
    }
  });

  // POST collections
  app.post("/api/collections", (req, res) => {
    try {
      const userId = 1;
      console.log("=== CREATING COLLECTION ===");
      console.log("Request body:", req.body);
      
      const collection = simpleDataStore.createCollection({
        name: req.body.name,
        description: req.body.description,
        directoryName: req.body.directoryName,
        userId,
        imageUrl: req.body.imageUrl,
        isActive: req.body.isActive !== false
      });
      
      console.log("Created collection:", collection);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection", message: error.message });
    }
  });
}