import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertDesignerConfigSchema, 
  insertPortalDomainSchema,
  insertListingSchema,
  insertListingAddonSchema,
  insertFormConfigurationSchema,
  insertCollectionSchema,
  insertCollectionItemSchema
} from "@shared/schema";
import { generateBulletPoints } from "./ai-summarizer";
import { googleDriveService } from "./google-drive";
import { runTestSuite, runFormTests, generateCode, getFeatureDocumentation, updateConfigurationCode } from "./dev-tools";
import { handleFormSubmission, getFormSubmissions, downloadJSONFile } from "./form-submission-handler";
import { aiAgent, AIRequest } from "./ai-agent";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't return the password
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("[AUTH] Login attempt received:", req.body);
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log("[AUTH] Login failed: Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if user exists
      console.log("[AUTH] Checking if user exists:", username);
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        // User doesn't exist, create a new user account
        console.log("[AUTH] User not found, creating new account:", username);
        
        try {
          // Create a new user with the provided credentials
          const newUser = await storage.createUser({
            username,
            password,
            displayName: username.split('@')[0],
            email: username
          });
          
          console.log("[AUTH] New user created:", newUser.id);
          
          // Don't return the password
          const { password: _, ...userResponse } = newUser;
          
          // Return the newly created user
          console.log("[AUTH] Returning new user data:", userResponse);
          return res.status(200).json(userResponse);
        } catch (error) {
          console.error("[AUTH] Error creating user:", error);
          return res.status(500).json({ message: "Failed to create user account" });
        }
      }
      
      // User exists, validate password
      console.log("[AUTH] User found, validating password");
      if (user.password !== password) {
        console.log("[AUTH] Invalid password for user:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Don't return the password
      const { password: _, ...userResponse } = user;
      console.log("[AUTH] Login successful for user:", userResponse.id);
      res.status(200).json(userResponse);
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Designer Config routes
  app.get("/api/config/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const config = await storage.getDesignerConfig(userId);
      
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to get configuration" });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const configData = insertDesignerConfigSchema.parse(req.body);
      
      // Check if config already exists for this user
      const existingConfig = await storage.getDesignerConfig(configData.userId);
      
      if (existingConfig) {
        // Update existing config
        const updatedConfig = await storage.updateDesignerConfig(configData.userId, configData);
        return res.status(200).json(updatedConfig);
      }
      
      // Create new config
      const config = await storage.createDesignerConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save configuration" });
    }
  });

  app.patch("/api/config/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const configData = req.body;
      const updatedConfig = await storage.updateDesignerConfig(userId, configData);
      
      if (!updatedConfig) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.status(200).json(updatedConfig);
    } catch (error) {
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Portal Domain routes
  app.get("/api/domain/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const domain = await storage.getPortalDomain(userId);
      
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      
      res.status(200).json(domain);
    } catch (error) {
      res.status(500).json({ message: "Failed to get domain" });
    }
  });

  app.post("/api/domain", async (req, res) => {
    try {
      const domainData = insertPortalDomainSchema.parse(req.body);
      
      // Check if domain already exists for this user
      const existingDomain = await storage.getPortalDomain(domainData.userId);
      
      if (existingDomain) {
        return res.status(400).json({ message: "Domain already exists for this user" });
      }
      
      // Generate verification token (in a real app, this would be more secure)
      const verificationToken = Math.random().toString(36).substring(2, 15);
      const domain = await storage.createPortalDomain({
        ...domainData,
        verificationToken,
      });
      
      res.status(201).json(domain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid domain data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.post("/api/domain/verify", async (req, res) => {
    try {
      const { userId, subdomain, domain } = req.body;
      
      if (!userId || !subdomain || !domain) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const verified = await storage.verifyPortalDomain(userId, subdomain, domain);
      
      if (!verified) {
        return res.status(400).json({ message: "Failed to verify domain" });
      }
      
      res.status(200).json({ message: "Domain verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify domain" });
    }
  });

  // AI Summarization route
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, error: "Description is required" });
      }

      const bulletPoints = await generateBulletPoints(description);
      res.json({ success: true, bulletPoints });
    } catch (error) {
      console.error("AI Summarization error:", error);
      res.status(500).json({ success: false, error: "Failed to generate bullet points" });
    }
  });

  // Form Configuration Management
  app.post("/api/form-config", async (req, res) => {
    try {
      const { locationId, directoryName, config, logoUrl, actionButtonColor } = req.body;
      
      if (!locationId || !directoryName || !config) {
        return res.status(400).json({ success: false, error: "Missing required configuration data" });
      }

      // In a real implementation, save to database
      // For now, return success with the configuration
      const formConfig = {
        locationId,
        directoryName,
        config,
        logoUrl: logoUrl || null,
        actionButtonColor: actionButtonColor || "#3b82f6",
        formUrl: `${req.protocol}://${req.get('host')}/form/${locationId}/${directoryName}`,
        embedCode: `<iframe src="${req.protocol}://${req.get('host')}/form/${locationId}/${directoryName}" width="100%" height="800" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`,
        createdAt: new Date().toISOString()
      };

      res.json({ success: true, formConfig });
    } catch (error) {
      console.error("Form configuration error:", error);
      res.status(500).json({ success: false, error: "Failed to create form configuration" });
    }
  });

  app.get("/api/form-config/:locationId/:directoryName", async (req, res) => {
    try {
      const { locationId, directoryName } = req.params;
      
      // In a real implementation, fetch from database
      // For now, return a default configuration
      const formConfig = {
        locationId,
        directoryName,
        config: {
          customFieldName: 'listing',
          showDescription: true,
          showMetadata: true,
          showMaps: true,
          showPrice: true,
          metadataFields: [],
          formEmbedUrl: '',
          buttonType: 'popup'
        },
        logoUrl: null,
        actionButtonColor: "#3b82f6"
      };

      res.json({ success: true, formConfig });
    } catch (error) {
      console.error("Form configuration fetch error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch form configuration" });
    }
  });

  // Real Form Submission Routes
  app.post("/api/form-submit/:locationId/:directoryName", handleFormSubmission);
  app.get("/api/form-submissions/:locationId/:directoryName", getFormSubmissions);
  app.get("/api/download/uploads/*", downloadJSONFile);

  // Listing Routes
  // Get all listings for a user
  app.get("/api/listings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const listings = await storage.getListingsByUser(userId);
      res.status(200).json(listings);
    } catch (error) {
      console.error("Error getting listings by user:", error);
      res.status(500).json({ message: "Failed to get listings" });
    }
  });

  // Get a specific listing by ID
  app.get("/api/listings/id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json(listing);
    } catch (error) {
      console.error("Error getting listing by ID:", error);
      res.status(500).json({ message: "Failed to get listing" });
    }
  });

  // Get a specific listing by slug
  app.get("/api/listings/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({ message: "Slug is required" });
      }
      
      const listing = await storage.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json(listing);
    } catch (error) {
      console.error("Error getting listing by slug:", error);
      res.status(500).json({ message: "Failed to get listing" });
    }
  });

  // Create a new listing
  app.post("/api/listings", async (req, res) => {
    try {
      const listingData = insertListingSchema.parse(req.body);
      
      // Check if a listing with this slug already exists
      const existingListing = await storage.getListingBySlug(listingData.slug);
      
      if (existingListing) {
        return res.status(400).json({ message: "A listing with this slug already exists" });
      }
      
      const listing = await storage.createListing(listingData);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing data", errors: error.errors });
      }
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  // Update a listing
  app.patch("/api/listings/id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listingData = req.body;
      
      // If slug is being updated, check if it's unique
      if (listingData.slug) {
        const existingListing = await storage.getListingBySlug(listingData.slug);
        
        if (existingListing && existingListing.id !== id) {
          return res.status(400).json({ message: "A listing with this slug already exists" });
        }
      }
      
      const updatedListing = await storage.updateListing(id, listingData);
      
      if (!updatedListing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json(updatedListing);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  // Delete a listing
  app.delete("/api/listings/id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const success = await storage.deleteListing(id);
      
      if (!success) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Listing Addons Routes
  // Get all addons for a listing
  app.get("/api/listing-addons/listing/:listingId", async (req, res) => {
    try {
      const listingId = parseInt(req.params.listingId);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const addons = await storage.getListingAddonsByListing(listingId);
      res.status(200).json(addons);
    } catch (error) {
      console.error("Error fetching listing addons:", error);
      res.status(500).json({ message: "Failed to fetch listing addons" });
    }
  });
  
  // Get addons by type for a listing
  app.get("/api/listing-addons/listing/:listingId/type/:type", async (req, res) => {
    try {
      const listingId = parseInt(req.params.listingId);
      const type = req.params.type;
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const addons = await storage.getListingAddonsByType(listingId, type);
      res.status(200).json(addons);
    } catch (error) {
      console.error("Error fetching listing addons by type:", error);
      res.status(500).json({ message: "Failed to fetch listing addons" });
    }
  });
  
  // Get a specific addon
  app.get("/api/listing-addons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid addon ID" });
      }
      
      const addon = await storage.getListingAddon(id);
      
      if (!addon) {
        return res.status(404).json({ message: "Addon not found" });
      }
      
      res.status(200).json(addon);
    } catch (error) {
      console.error("Error fetching listing addon:", error);
      res.status(500).json({ message: "Failed to fetch listing addon" });
    }
  });
  
  // Create a new addon
  app.post("/api/listing-addons", async (req, res) => {
    try {
      console.log("Creating addon with data:", req.body);
      const addonData = insertListingAddonSchema.parse(req.body);
      console.log("Parsed addon data:", addonData);
      const addon = await storage.createListingAddon(addonData);
      console.log("Created addon:", addon);
      res.status(201).json(addon);
    } catch (error) {
      console.error("Error creating listing addon:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ message: "Failed to create listing addon" });
    }
  });
  
  // Update an addon
  app.patch("/api/listing-addons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid addon ID" });
      }
      
      const addonData = req.body;
      const updatedAddon = await storage.updateListingAddon(id, addonData);
      
      if (!updatedAddon) {
        return res.status(404).json({ message: "Addon not found" });
      }
      
      res.status(200).json(updatedAddon);
    } catch (error) {
      console.error("Error updating listing addon:", error);
      res.status(500).json({ message: "Failed to update listing addon" });
    }
  });
  
  // Delete an addon
  app.delete("/api/listing-addons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid addon ID" });
      }
      
      const success = await storage.deleteListingAddon(id);
      
      if (!success) {
        return res.status(404).json({ message: "Addon not found" });
      }
      
      res.status(200).json({ message: "Addon deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing addon:", error);
      res.status(500).json({ message: "Failed to delete listing addon" });
    }
  });

  // AI Summarizer endpoint for generating bullet points
  app.post("/api/ai/generate-bullets", async (req, res) => {
    try {
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required" });
      }
      
      const bulletPoints = await generateBulletPoints(description);
      res.status(200).json({ bulletPoints });
    } catch (error) {
      console.error("Error generating bullet points:", error);
      res.status(500).json({ message: "Failed to generate bullet points" });
    }
  });

  // Developer Dashboard API Routes
  app.post("/api/dev/run-tests", runTestSuite);
  app.post("/api/dev/run-form-tests", runFormTests);
  app.post("/api/dev/generate-code", generateCode);
  app.get("/api/dev/docs/:feature", getFeatureDocumentation);
  app.post("/api/dev/update-code", updateConfigurationCode);

  // Tracking endpoint for opt-in interactions
  app.post("/api/tracking/opt-in", async (req, res) => {
    try {
      const { type, listingId, listingTitle, listingSlug, timestamp, ...details } = req.body;
      
      // In a real implementation, you would store this tracking data in a database
      console.log("Tracking opt-in interaction:", {
        type,
        listingId,
        listingTitle,
        listingSlug,
        timestamp,
        ...details
      });
      
      res.status(200).json({ message: "Tracking data recorded" });
    } catch (error) {
      console.error("Error tracking opt-in:", error);
      // Always return 200 for tracking endpoints to prevent disrupting the user experience
      res.status(200).json({ message: "Tracking request received" });
    }
  });

  // Directory (Form Configuration) Routes
  // Get all directories for a user
  app.get("/api/directories", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth context
      const directories = await storage.getFormConfigurationsByUser(userId);
      
      // Add listing count and last activity for each directory
      const directoriesWithStats = await Promise.all(
        directories.map(async (directory) => {
          const listings = await storage.getListingsByDirectory(directory.directoryName);
          const listingCount = listings.length;
          const lastActivity = listings.length > 0 
            ? Math.max(...listings.map(l => new Date(l.updatedAt || l.createdAt).getTime()))
            : null;
          
          return {
            ...directory,
            listingCount,
            lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null
          };
        })
      );
      
      res.status(200).json(directoriesWithStats);
    } catch (error) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ message: "Failed to fetch directories" });
    }
  });

  // Get directory by name
  app.get("/api/directories/:directoryName", async (req, res) => {
    try {
      const directoryName = req.params.directoryName;
      const userId = 1; // TODO: Get from auth context
      const directory = await storage.getFormConfigurationByName(userId, directoryName);
      
      if (!directory) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      res.status(200).json(directory);
    } catch (error) {
      console.error("Error fetching directory:", error);
      res.status(500).json({ message: "Failed to fetch directory" });
    }
  });

  // Create directory
  app.post("/api/directories", async (req, res) => {
    try {
      const configData = insertFormConfigurationSchema.parse(req.body);
      const directory = await storage.createFormConfiguration(configData);
      res.status(201).json(directory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid directory data", errors: error.errors });
      }
      console.error("Error creating directory:", error);
      res.status(500).json({ message: "Failed to create directory" });
    }
  });

  // Update directory
  app.put("/api/directories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid directory ID" });
      }
      
      const configData = req.body;
      const updatedDirectory = await storage.updateFormConfiguration(id, configData);
      
      if (!updatedDirectory) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      res.status(200).json(updatedDirectory);
    } catch (error) {
      console.error("Error updating directory:", error);
      res.status(500).json({ message: "Failed to update directory" });
    }
  });

  // Delete directory
  app.delete("/api/directories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid directory ID" });
      }
      
      // Get directory to find its name
      const directory = await storage.getFormConfiguration(id);
      if (!directory) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      // Delete all listings in this directory first
      const listings = await storage.getListingsByDirectory(directory.directoryName);
      for (const listing of listings) {
        await storage.deleteListing(listing.id);
      }
      
      // Delete the directory
      const success = await storage.deleteFormConfiguration(id);
      if (!success) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      res.status(200).json({ message: "Directory and all listings deleted successfully" });
    } catch (error) {
      console.error("Error deleting directory:", error);
      res.status(500).json({ message: "Failed to delete directory" });
    }
  });

  // Get listings for a directory
  app.get("/api/listings/:directoryName", async (req, res) => {
    try {
      const directoryName = req.params.directoryName;
      const listings = await storage.getListingsByDirectory(directoryName);
      res.status(200).json(listings);
    } catch (error) {
      console.error("Error fetching listings for directory:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Get listing by ID
  app.get("/api/listings/by-id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  // Update listing (PUT endpoint for the form)
  app.put("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listingData = req.body;
      
      // If slug is being updated, check if it's unique
      if (listingData.slug) {
        const existingListing = await storage.getListingBySlug(listingData.slug);
        if (existingListing && existingListing.id !== id) {
          return res.status(400).json({ message: "A listing with this slug already exists" });
        }
      }
      
      const updatedListing = await storage.updateListing(id, listingData);
      if (!updatedListing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json(updatedListing);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  // Get listing addons by listing ID
  app.get("/api/listing-addons/listing/:listingId", async (req, res) => {
    try {
      const listingId = parseInt(req.params.listingId);
      if (isNaN(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const addons = await storage.getListingAddonsByListing(listingId);
      res.status(200).json(addons);
    } catch (error) {
      console.error("Error fetching listing addons:", error);
      res.status(500).json({ message: "Failed to fetch listing addons" });
    }
  });

  // Delete listing (DELETE endpoint)
  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const success = await storage.deleteListing(id);
      if (!success) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Serve GHL embed code
  app.get("/ghl-embed-code.js", (req, res) => {
    try {
      // Read the embed code file
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), "client", "src", "lib", "ghl-embed-code.js");
      let embedCode = fs.readFileSync(filePath, "utf8");
      
      // Replace placeholders with dynamic values
      const apiBaseUrl = `${req.protocol}://${req.get("host")}`;
      embedCode = embedCode.replace("{{YOUR_REPLIT_API_URL}}", apiBaseUrl);
      
      // Default form URL - can be overridden in config
      embedCode = embedCode.replace("{{YOUR_DEFAULT_GHL_FORM_URL}}", "https://forms.gohighlevel.com/");
      
      // Set appropriate content type and cache headers
      res.set("Content-Type", "application/javascript");
      res.set("Cache-Control", "max-age=3600"); // Cache for 1 hour
      
      // Send the processed embed code
      res.send(embedCode);
    } catch (error) {
      console.error("Error serving embed code:", error);
      res.status(500).send("// Error loading embed code");
    }
  });
  
  // Serve documentation for GHL integration
  app.get("/docs/ghl-integration", (req, res) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), "docs", "ghl-integration-guide.md");
      const markdown = fs.readFileSync(filePath, "utf8");
      
      // Simple HTML wrapping for the markdown
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Go HighLevel Integration Guide</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          pre {
            background-color: #f5f5f5;
            padding: 16px;
            border-radius: 4px;
            overflow: auto;
          }
          code {
            font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            background-color: rgba(0, 0, 0, 0.05);
            padding: 2px 4px;
            border-radius: 3px;
          }
          pre > code {
            background-color: transparent;
            padding: 0;
          }
          h1, h2, h3 {
            color: #111;
          }
          h2 {
            margin-top: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          a {
            color: #0366d6;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div id="content">
          ${markdown.replace(/```(.+?)```/gs, (match, p1) => {
            // Simple code block handling
            const code = p1.trim();
            const isHtml = code.startsWith('html');
            const language = isHtml ? 'html' : (code.startsWith('css') ? 'css' : 'javascript');
            const displayCode = isHtml || code.startsWith('css') || code.startsWith('javascript') 
              ? code.replace(/^(html|css|javascript)\n/, '') 
              : code;
            
            return `<pre><code class="language-${language}">${displayCode}</code></pre>`;
          }).replace(/\n/g, '<br>').replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
          .replace(/- (.+)/g, '<ul><li>$1</li></ul>').replace(/<\/ul><ul>/g, '')}
        </div>
      </body>
      </html>
      `;
      
      res.set("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Error serving documentation:", error);
      res.status(500).send("Error loading documentation");
    }
  });

  // AI Summarization route
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      const bulletPoints = await generateBulletPoints(text);
      res.json({ bulletPoints });
    } catch (error) {
      console.error("AI summarization error:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Google Drive OAuth routes
  app.get("/auth/google", async (req, res) => {
    try {
      const authUrl = googleDriveService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  app.get("/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).send("Missing authorization code");
      }

      const tokens = await googleDriveService.getTokens(code);
      
      // Send tokens back to the frontend via postMessage
      res.send(`
        <html>
          <script>
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              tokens: ${JSON.stringify(tokens)}
            }, window.location.origin);
            window.close();
          </script>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/google-drive/upload", async (req, res) => {
    try {
      const { tokens, fileName, fileData, mimeType } = req.body;
      
      if (!tokens || !fileName || !fileData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Set credentials for this request
      googleDriveService.setCredentials(tokens);
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData.split(',')[1], 'base64');
      
      const result = await googleDriveService.uploadImage(fileName, buffer, mimeType);
      
      res.json({
        success: true,
        fileId: result.fileId,
        publicUrl: googleDriveService.getPublicImageUrl(result.fileId),
        webViewLink: result.webViewLink
      });
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Google Drive Credentials persistence endpoints
  app.get("/api/google-drive/credentials", async (req, res) => {
    try {
      // For demo purposes, using userId 1. In production, get from session/auth
      const userId = 1;
      const credentials = await storage.getGoogleDriveCredentials(userId);
      
      if (credentials) {
        // Return only safe data, not tokens
        res.json({
          email: credentials.email,
          folderName: credentials.folderName,
          isActive: credentials.isActive
        });
      } else {
        res.status(404).json({ message: "No credentials found" });
      }
    } catch (error) {
      console.error("Error fetching Google Drive credentials:", error);
      res.status(500).json({ error: "Failed to fetch credentials" });
    }
  });

  app.post("/api/google-drive/credentials", async (req, res) => {
    try {
      const { email, accessToken, refreshToken, expiryDate, folderName, folderId } = req.body;
      
      if (!email || !accessToken) {
        return res.status(400).json({ error: "Email and access token are required" });
      }

      // For demo purposes, using userId 1. In production, get from session/auth
      const userId = 1;
      
      const credentials = await storage.createGoogleDriveCredentials({
        userId,
        email,
        accessToken,
        refreshToken: refreshToken || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        folderName: folderName || 'Directory Images',
        folderId: folderId || null,
        isActive: true
      });

      res.status(201).json({
        id: credentials.id,
        email: credentials.email,
        folderName: credentials.folderName,
        isActive: credentials.isActive
      });
    } catch (error) {
      console.error("Error saving Google Drive credentials:", error);
      res.status(500).json({ error: "Failed to save credentials" });
    }
  });

  app.put("/api/google-drive/credentials", async (req, res) => {
    try {
      const { email, accessToken, refreshToken, expiryDate, folderName, folderId } = req.body;
      
      // For demo purposes, using userId 1. In production, get from session/auth
      const userId = 1;
      
      const credentials = await storage.updateGoogleDriveCredentials(userId, {
        email,
        accessToken,
        refreshToken,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        folderName,
        folderId
      });

      if (credentials) {
        res.json({
          id: credentials.id,
          email: credentials.email,
          folderName: credentials.folderName,
          isActive: credentials.isActive
        });
      } else {
        res.status(404).json({ message: "Credentials not found" });
      }
    } catch (error) {
      console.error("Error updating Google Drive credentials:", error);
      res.status(500).json({ error: "Failed to update credentials" });
    }
  });

  app.delete("/api/google-drive/credentials", async (req, res) => {
    try {
      // For demo purposes, using userId 1. In production, get from session/auth
      const userId = 1;
      
      const deactivated = await storage.deactivateGoogleDriveCredentials(userId);
      
      if (deactivated) {
        res.json({ message: "Credentials deactivated successfully" });
      } else {
        res.status(404).json({ message: "No active credentials found" });
      }
    } catch (error) {
      console.error("Error deactivating Google Drive credentials:", error);
      res.status(500).json({ error: "Failed to deactivate credentials" });
    }
  });

  // Collections API routes
  app.get("/api/collections", async (req, res) => {
    try {
      const userId = 1; // In production, get from session/auth
      const collections = await storage.getCollectionsByUser(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/directory/:directoryName", async (req, res) => {
    try {
      const { directoryName } = req.params;
      const collections = await storage.getCollectionsByDirectory(directoryName);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections by directory:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id);
      
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getCollectionItemsWithListings(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching collection items:", error);
      res.status(500).json({ error: "Failed to fetch collection items" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const userId = 1; // In production, get from session/auth
      const collectionData = insertCollectionSchema.parse({
        ...req.body,
        userId
      });
      
      const collection = await storage.createCollection(collectionData);
      
      // TODO: Integrate with GoHighLevel API to create collection
      // For now, we'll just mark as pending sync
      
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid collection data", details: error.errors });
      }
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  app.patch("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const collection = await storage.updateCollection(id, updateData);
      
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      // TODO: Sync changes with GoHighLevel API
      
      res.json(collection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ error: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCollection(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      // TODO: Delete from GoHighLevel API
      
      res.json({ message: "Collection deleted successfully" });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Collection Items API routes
  app.get("/api/collections/:id/items", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const items = await storage.getCollectionItemsByCollection(collectionId);
      
      // Get full listing details for each item
      const itemsWithListings = await Promise.all(
        items.map(async (item) => {
          const listing = await storage.getListing(item.listingId);
          return {
            ...item,
            listing
          };
        })
      );
      
      res.json(itemsWithListings);
    } catch (error) {
      console.error("Error fetching collection items:", error);
      res.status(500).json({ error: "Failed to fetch collection items" });
    }
  });

  // Get collections that contain a specific listing
  app.get("/api/listings/:id/collections", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const items = await storage.getCollectionItemsByListing(listingId);
      
      // Get collection details for each item
      const collectionsWithDetails = await Promise.all(
        items.map(async (item) => {
          const collection = await storage.getCollection(item.collectionId);
          return {
            ...item,
            collection
          };
        })
      );
      
      res.json(collectionsWithDetails);
    } catch (error) {
      console.error("Error fetching listing collections:", error);
      res.status(500).json({ error: "Failed to fetch listing collections" });
    }
  });

  app.post("/api/collections/:id/items", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const { listingId, listingIds } = req.body;
      
      // Support both single listingId and batch listingIds
      const idsToAdd = listingIds || (listingId ? [listingId] : []);
      
      if (!idsToAdd || idsToAdd.length === 0) {
        return res.status(400).json({ error: "listingId or listingIds is required" });
      }
      
      // Check existing items in collection
      const existingItems = await storage.getCollectionItemsByCollection(collectionId);
      const existingListingIds = existingItems.map(item => item.listingId);
      
      // Filter out already existing items
      const newListingIds = idsToAdd.filter((id: number) => !existingListingIds.includes(id));
      
      if (newListingIds.length === 0) {
        return res.status(400).json({ error: "All specified listings are already in this collection" });
      }
      
      // Add all new items
      const addedItems = [];
      for (const listingId of newListingIds) {
        const item = await storage.addListingToCollection(collectionId, listingId);
        addedItems.push(item);
      }
      
      // TODO: Add to GoHighLevel collection via API
      
      res.status(201).json({
        message: `Successfully added ${addedItems.length} item(s) to collection`,
        addedItems,
        skipped: idsToAdd.length - newListingIds.length
      });
    } catch (error) {
      console.error("Error adding listing to collection:", error);
      res.status(500).json({ error: "Failed to add listing to collection" });
    }
  });

  app.delete("/api/collections/:id/items/:listingId", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const listingId = parseInt(req.params.listingId);
      
      const removed = await storage.removeListingFromCollection(collectionId, listingId);
      
      if (!removed) {
        return res.status(404).json({ error: "Listing not found in collection" });
      }
      
      // TODO: Remove from GoHighLevel collection via API
      
      res.json({ message: "Listing removed from collection successfully" });
    } catch (error) {
      console.error("Error removing listing from collection:", error);
      res.status(500).json({ error: "Failed to remove listing from collection" });
    }
  });

  // Bulk operations for collections
  app.post("/api/collections/:id/items/bulk", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const { listingIds } = req.body;
      
      if (!Array.isArray(listingIds)) {
        return res.status(400).json({ error: "listingIds must be an array" });
      }
      
      const results = [];
      
      for (const listingId of listingIds) {
        try {
          // Check if already exists
          const existingItems = await storage.getCollectionItemsByCollection(collectionId);
          const alreadyExists = existingItems.some(item => item.listingId === listingId);
          
          if (!alreadyExists) {
            const item = await storage.addListingToCollection(collectionId, listingId);
            results.push({ listingId, success: true, item });
          } else {
            results.push({ listingId, success: false, error: "Already in collection" });
          }
        } catch (error) {
          results.push({ listingId, success: false, error: error.message });
        }
      }
      
      // TODO: Bulk sync with GoHighLevel API
      
      res.json(results);
    } catch (error) {
      console.error("Error bulk adding listings to collection:", error);
      res.status(500).json({ error: "Failed to bulk add listings to collection" });
    }
  });

  const httpServer = createServer(app);
  // AI Agent API routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, requestType, userId } = req.body;
      
      if (!message || !requestType) {
        return res.status(400).json({ error: "Message and requestType are required" });
      }

      const aiRequest: AIRequest = {
        message,
        requestType,
        userId
      };

      const response = await aiAgent.processQuery(aiRequest);
      res.json(response);
    } catch (error) {
      console.error("AI Agent chat error:", error);
      res.status(500).json({ error: "Failed to process AI request" });
    }
  });

  app.get("/api/ai/analytics/:userId?", async (req, res) => {
    try {
      const userId = req.params.userId ? parseInt(req.params.userId) : undefined;
      const analytics = await aiAgent.getUserAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("AI Agent analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  app.get("/api/ai/system-insights", async (req, res) => {
    try {
      const insights = await aiAgent.getSystemInsights();
      res.json(insights);
    } catch (error) {
      console.error("AI Agent system insights error:", error);
      res.status(500).json({ error: "Failed to get system insights" });
    }
  });

  app.post("/api/ai/analyze-code", async (req, res) => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: "filePath is required" });
      }

      const analysis = await aiAgent.analyzeCode(filePath);
      res.json(analysis);
    } catch (error) {
      console.error("AI Agent code analysis error:", error);
      res.status(500).json({ error: "Failed to analyze code" });
    }
  });

  app.post("/api/ai/propose-change", async (req, res) => {
    try {
      const { filePath, description, currentCode } = req.body;
      
      if (!filePath || !description) {
        return res.status(400).json({ error: "filePath and description are required" });
      }

      const proposal = await aiAgent.proposeCodeChange(filePath, description, currentCode);
      res.json(proposal);
    } catch (error) {
      console.error("AI Agent code proposal error:", error);
      res.status(500).json({ error: "Failed to propose code change" });
    }
  });

  return httpServer;
}
