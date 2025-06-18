import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { simpleDataStore } from "./simple-storage";
import { setupWorkingRoutes } from "./working-routes";
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
// import { generateBulletPoints } from "./ai-summarizer";
import { googleDriveService } from "./google-drive";
import { runTestSuite, runFormTests, generateCode, getFeatureDocumentation, updateConfigurationCode } from "./dev-tools";
import { handleFormSubmission, getFormSubmissions, downloadJSONFile } from "./form-submission-handler";
// import { aiAgent, AIRequest } from "./ai-agent-simple";
import { ghlAPI } from "./ghl-api";
import { ghlOAuth } from "./ghl-oauth";
import { authenticateToken } from "./auth-middleware";
import { ghlProductCreator } from "./ghl-product-creator";
import { getCurrentUser, logoutUser } from "./current-user";
import { recoverSession, checkEmbeddedSession } from "./session-recovery";
import jwt from "jsonwebtoken";

// Helper function to generate form fields from wizard configuration
async function generateFormFieldsFromWizardConfig(directoryId: number, config: any) {
  try {
    console.log('Generating form fields for directory:', directoryId, 'with config:', config);
    
    // Core required fields for GoHighLevel product creation
    const coreFields = [
      {
        formConfigId: directoryId,
        name: 'name',
        label: 'Product Name',
        type: 'TEXT' as const,
        required: true,
        placeholder: 'Enter product name',
        displayOrder: 1
      },
      {
        formConfigId: directoryId,
        name: 'description',
        label: 'Description',
        type: 'TEXTAREA' as const,
        required: true,
        placeholder: 'Describe your product',
        displayOrder: 2
      },
      {
        formConfigId: directoryId,
        name: 'productType',
        label: 'Product Type',
        type: 'SINGLE_OPTIONS' as const,
        required: true,
        options: ['DIGITAL', 'PHYSICAL', 'SERVICE', 'PHYSICAL-DIGITAL'],
        defaultValue: 'DIGITAL',
        displayOrder: 3
      }
    ];

    // Add pricing field based on wizard configuration
    if (config.features?.showPrice !== false) {
      coreFields.push({
        formConfigId: directoryId,
        name: 'price',
        label: 'Price ($)',
        type: 'NUMBER' as const,
        required: true,
        placeholder: '0.00',
        displayOrder: 4
      });
    }

    // Add optional fields based on wizard configuration
    let displayOrder = 5;
    
    if (config.features?.showMetadata !== false) {
      coreFields.push({
        formConfigId: directoryId,
        name: 'category',
        label: 'Category',
        type: 'TEXT' as const,
        required: false,
        placeholder: 'Product category',
        displayOrder: displayOrder++
      });
    }

    if (config.features?.showDescription !== false) {
      coreFields.push({
        formConfigId: directoryId,
        name: 'metaTitle',
        label: 'SEO Title',
        type: 'TEXT' as const,
        required: false,
        placeholder: 'SEO-optimized title',
        displayOrder: displayOrder++
      },
      {
        formConfigId: directoryId,
        name: 'metaDescription',
        label: 'SEO Description',
        type: 'TEXTAREA' as const,
        required: false,
        placeholder: 'SEO meta description',
        displayOrder: displayOrder++
      });
    }

    // Always add image upload fields
    coreFields.push({
      formConfigId: directoryId,
      name: 'images',
      label: 'Product Images',
      type: 'FILE_UPLOAD' as const,
      required: false,
      placeholder: 'Upload product images',
      displayOrder: displayOrder++
    });

    // Store all fields using the simple data store
    for (const field of coreFields) {
      simpleDataStore.createFormField(field);
    }
    
    console.log(`Generated ${coreFields.length} form fields for directory ${directoryId}`);
    return coreFields;
  } catch (error) {
    console.error('Error generating form fields:', error);
    return [];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup working routes for directories, collections, and listings
  setupWorkingRoutes(app);
  // Railway backend proxy routes to avoid CORS issues
  app.get("/api/railway/health", async (req, res) => {
    try {
      const response = await fetch('https://dir.engageautomations.com/health');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        status: 'Railway Backend Unavailable', 
        service: 'Universal GHL API Backend',
        installationsCount: 1,
        supportedEndpoints: 39
      });
    }
  });

  app.get("/api/railway/installations/latest", async (req, res) => {
    try {
      const response = await fetch('https://dir.engageautomations.com/api/installations/latest');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Could not fetch installation data from Railway backend' 
      });
    }
  });

  // GHL Product Creation via Railway Backend with Auto-Refresh
  app.post("/api/ghl/create-product", async (req, res) => {
    try {
      const productData = {
        installationId: 'install_1750252333303', // Active installation with valid OAuth tokens
        name: req.body.name,
        description: req.body.description || '',
        productType: req.body.productType || 'DIGITAL',
        price: req.body.price || undefined
      };

      console.log('Creating GHL product via Railway backend:', productData);

      // Call Railway backend product creation endpoint with automatic token refresh
      const railwayResponse = await fetch('https://dir.engageautomations.com/api/ghl/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const result = await railwayResponse.json();

      if (!railwayResponse.ok) {
        console.error('Railway backend error:', result);
        return res.status(railwayResponse.status).json({
          success: false,
          error: result.error || 'Product creation failed',
          details: result.details || result.message,
          railwayBackend: true
        });
      }

      console.log('GHL product created successfully via Railway:', result.productId);

      res.json({
        success: true,
        product: result.product,
        productId: result.productId,
        locationId: result.locationId,
        message: result.message || "Product created successfully in GoHighLevel",
        railwayBackend: true
      });

    } catch (error) {
      console.error('GHL Product Creation Error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to connect to Railway backend',
        details: error.message
      });
    }
  });

  // User authentication routes
  app.get("/api/auth/me", getCurrentUser);
  app.post("/api/auth/logout", logoutUser);
  
  // Session recovery for embedded CRM tab access
  app.get("/api/auth/recover", recoverSession);
  app.get("/api/auth/check-embedded", checkEmbeddedSession);

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

      const bulletPoints = [];
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

  // Test endpoint for download button functionality
  app.get("/api/test/listing/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      const testListing = {
        id: 999,
        title: `Test Product: ${slug}`,
        slug: slug,
        downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        description: "This is a test product for download button functionality",
        category: "Test Category",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`[TEST] Returning test listing for slug: ${slug}`);
      res.status(200).json(testListing);
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ message: "Test endpoint error" });
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
        userId: req.body.userId || 1,
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
        const existingListing = simpleDataStore.getListingBySlug(listingData.slug);
        
        if (existingListing && existingListing.id !== id) {
          return res.status(400).json({ message: "A listing with this slug already exists" });
        }
      }
      
      const updatedListing = simpleDataStore.updateListing(id, listingData);
      
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
      
      const bulletPoints = [];
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
      console.log("=== DIRECTORY API CALLED ===");
      const userId = 1; // Using default user for development
      console.log("Fetching directories for user:", userId);
      
      const directories = simpleDataStore.getDirectoriesByUser(userId);
      console.log("Raw directories from simple storage:", directories);
      
      // Transform format to match frontend expectations
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
      
      console.log("Final directories with stats:", directoriesWithStats);
      res.status(200).json(directoriesWithStats);
    } catch (error) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ message: "Failed to fetch directories", error: error.message });
    }
  });

  // Get directory by name
  app.get("/api/directories/:directoryName", async (req, res) => {
    try {
      const directoryName = req.params.directoryName;
      const directory = await storage.getFormConfigurationByDirectoryName(directoryName);
      
      if (!directory) {
        return res.status(404).json({ message: "Directory not found" });
      }
      
      res.status(200).json(directory);
    } catch (error) {
      console.error("Error fetching directory:", error);
      res.status(500).json({ message: "Failed to fetch directory" });
    }
  });

  // Get form configuration by directory name for wizard-generated forms
  app.get("/api/form-configurations/:directoryName", async (req, res) => {
    try {
      const directoryName = req.params.directoryName;
      const directory = await storage.getFormConfigurationByDirectoryName(directoryName);
      
      if (!directory) {
        return res.status(404).json({ message: "Form configuration not found" });
      }
      
      res.status(200).json(directory);
    } catch (error) {
      console.error("Error fetching form configuration:", error);
      res.status(500).json({ message: "Failed to fetch form configuration" });
    }
  });

  // Create directory with automatic form field generation
  app.post("/api/directories", async (req, res) => {
    try {
      console.log("=== CREATING DIRECTORY ===");
      console.log("Request body:", req.body);
      
      const directory = simpleDataStore.createDirectory({
        directoryName: req.body.directoryName,
        userId: req.body.userId || 1,
        logoUrl: req.body.logoUrl,
        config: req.body.config || {},
        actionButtonColor: req.body.actionButtonColor || '#3b82f6',
        isActive: req.body.isActive !== false
      });
      
      // Auto-generate form fields based on wizard configuration
      if (directory && req.body.config) {
        await generateFormFieldsFromWizardConfig(directory.id, req.body.config);
      }
      
      console.log("Created directory:", directory);
      res.status(201).json(directory);
    } catch (error) {
      console.error("Error creating directory:", error);
      res.status(500).json({ message: "Failed to create directory", error: error.message });
    }
  });

  // Update directory
  app.put("/api/directories/:id", async (req, res) => {
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

  // Delete directory
  app.delete("/api/directories/:id", async (req, res) => {
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

  // Get listing by ID
  app.get("/api/listings/by-id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      const listing = simpleDataStore.getListing(id);
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

      const bulletPoints = [];
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
      console.log("=== FETCHING COLLECTIONS ===");
      const collections = simpleDataStore.getCollectionsByUser(userId);
      console.log("Found collections:", collections.length);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections", message: error.message });
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

      const aiRequest = {
        message,
        requestType,
        userId
      };

      const response = await { success: true, message: "AI agent disabled" };
      res.json(response);
    } catch (error) {
      console.error("AI Agent chat error:", error);
      res.status(500).json({ error: "Failed to process AI request" });
    }
  });

  app.get("/api/ai/analytics/:userId?", async (req, res) => {
    try {
      const analytics = await { success: true, message: "AI agent disabled" };
      res.json(analytics);
    } catch (error) {
      console.error("AI Agent analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  app.get("/api/ai/system-insights", async (req, res) => {
    try {
      const insights = await { success: true, message: "AI agent disabled" };
      res.json(insights);
    } catch (error) {
      console.error("AI Agent system insights error:", error);
      res.status(500).json({ error: "Failed to get system insights" });
    }
  });

  // Designer Config API routes - Save generated code
  app.post("/api/designer-configs", async (req, res) => {
    try {
      const configData = req.body;
      const config = await storage.createDesignerConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error creating designer config:", error);
      res.status(500).json({ error: "Failed to create designer config" });
    }
  });

  app.put("/api/designer-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const configData = req.body;
      const config = await storage.updateDesignerConfig(id, configData);
      res.json(config);
    } catch (error) {
      console.error("Error updating designer config:", error);
      res.status(500).json({ error: "Failed to update designer config" });
    }
  });

  app.get("/api/designer-configs/directory/:directoryName", async (req, res) => {
    try {
      const { directoryName } = req.params;
      const { userId } = req.query;
      const config = await storage.getDesignerConfigByDirectory(directoryName, userId ? parseInt(userId as string) : undefined);
      res.json(config);
    } catch (error) {
      console.error("Error fetching designer config:", error);
      res.status(500).json({ error: "Failed to fetch designer config" });
    }
  });

  // GoHighLevel API routes
  app.get("/api/ghl/health", async (req, res) => {
    try {
      const health = await ghlAPI.testConnection();
      res.json(health);
    } catch (error) {
      console.error("GHL health check error:", error);
      res.status(500).json({ error: "Failed to check GHL connection" });
    }
  });

  // OAuth-based GoHighLevel API endpoints
  app.get("/api/ghl/user-info", async (req, res) => {
    try {
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const userInfo = await ghlAPI.getUserInfo(accessToken as string);
      res.json(userInfo);
    } catch (error) {
      console.error("GHL user info error:", error);
      res.status(500).json({ error: "Failed to fetch user info from GHL" });
    }
  });

  app.get("/api/ghl/locations", async (req, res) => {
    try {
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const locations = await ghlAPI.getLocations(accessToken as string);
      res.json(locations);
    } catch (error) {
      console.error("GHL locations error:", error);
      res.status(500).json({ error: "Failed to fetch locations from GHL" });
    }
  });

  app.get("/api/ghl/locations/:locationId/contacts", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken, limit = 100, offset = 0 } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const contacts = await ghlAPI.getContacts(locationId, accessToken as string, Number(limit), Number(offset));
      res.json(contacts);
    } catch (error) {
      console.error("GHL contacts error:", error);
      res.status(500).json({ error: "Failed to fetch contacts from GHL" });
    }
  });

  app.get("/api/ghl/locations/:locationId/contacts/:contactId", async (req, res) => {
    try {
      const { locationId, contactId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const contact = await ghlAPI.getContact(locationId, contactId, accessToken as string);
      res.json(contact);
    } catch (error) {
      console.error("GHL contact error:", error);
      res.status(500).json({ error: "Failed to fetch contact from GHL" });
    }
  });

  app.post("/api/ghl/locations/:locationId/contacts", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const contact = await ghlAPI.createContact(locationId, req.body, accessToken as string);
      res.status(201).json(contact);
    } catch (error) {
      console.error("GHL create contact error:", error);
      res.status(500).json({ error: "Failed to create contact in GHL" });
    }
  });

  app.put("/api/ghl/locations/:locationId/contacts/:contactId", async (req, res) => {
    try {
      const { locationId, contactId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const contact = await ghlAPI.updateContact(locationId, contactId, req.body, accessToken as string);
      res.json(contact);
    } catch (error) {
      console.error("GHL update contact error:", error);
      res.status(500).json({ error: "Failed to update contact in GHL" });
    }
  });

  app.delete("/api/ghl/locations/:locationId/contacts/:contactId", async (req, res) => {
    try {
      const { locationId, contactId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      await ghlAPI.deleteContact(locationId, contactId, accessToken as string);
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("GHL delete contact error:", error);
      res.status(500).json({ error: "Failed to delete contact from GHL" });
    }
  });

  app.get("/api/ghl/locations/:locationId/custom-fields", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const customFields = await ghlAPI.getCustomFields(locationId, accessToken as string);
      res.json(customFields);
    } catch (error) {
      console.error("GHL custom fields error:", error);
      res.status(500).json({ error: "Failed to fetch custom fields from GHL" });
    }
  });

  app.post("/api/ghl/locations/:locationId/custom-fields", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const customField = await ghlAPI.createCustomField(locationId, req.body, accessToken as string);
      res.status(201).json(customField);
    } catch (error) {
      console.error("GHL create custom field error:", error);
      res.status(500).json({ error: "Failed to create custom field in GHL" });
    }
  });

  // Media Library/Files Management
  app.get("/api/ghl/locations/:locationId/files", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken, limit = 100, offset = 0 } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const files = await ghlAPI.getFiles(locationId, accessToken as string, Number(limit), Number(offset));
      res.json(files);
    } catch (error) {
      console.error("GHL files error:", error);
      res.status(500).json({ error: "Failed to fetch files from GHL" });
    }
  });

  app.post("/api/ghl/locations/:locationId/files/upload", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      // req.body should be FormData for file upload
      const uploadResult = await ghlAPI.uploadFile(locationId, req.body, accessToken as string);
      res.status(201).json(uploadResult);
    } catch (error) {
      console.error("GHL file upload error:", error);
      res.status(500).json({ error: "Failed to upload file to GHL" });
    }
  });

  // Products Management
  app.get("/api/ghl/locations/:locationId/products", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { accessToken, limit = 100, offset = 0 } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const products = await ghlAPI.getProducts(locationId, accessToken as string, Number(limit), Number(offset));
      res.json(products);
    } catch (error) {
      console.error("GHL products error:", error);
      res.status(500).json({ error: "Failed to fetch products from GHL" });
    }
  });

  app.get("/api/ghl/locations/:locationId/products/:productId", async (req, res) => {
    try {
      const { locationId, productId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const product = await ghlAPI.getProduct(locationId, productId, accessToken as string);
      res.json(product);
    } catch (error) {
      console.error("GHL product error:", error);
      res.status(500).json({ error: "Failed to fetch product from GHL" });
    }
  });

  app.post("/api/ghl/products", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        return res.status(401).json({ error: "Authorization header with Bearer token required" });
      }
      
      // Validate required fields per GHL API spec
      const { name, locationId, productType } = req.body;
      if (!name || !locationId || !productType) {
        return res.status(400).json({ 
          error: "Missing required fields: name, locationId, and productType are required" 
        });
      }
      
      const product = await ghlAPI.createProduct(req.body, accessToken as string);
      res.status(201).json(product);
    } catch (error) {
      console.error("GHL create product error:", error);
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create product in GHL" });
      }
    }
  });

  app.put("/api/ghl/locations/:locationId/products/:productId", async (req, res) => {
    try {
      const { locationId, productId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const product = await ghlAPI.updateProduct(locationId, productId, req.body, accessToken as string);
      res.json(product);
    } catch (error) {
      console.error("GHL update product error:", error);
      res.status(500).json({ error: "Failed to update product in GHL" });
    }
  });

  app.delete("/api/ghl/locations/:locationId/products/:productId", async (req, res) => {
    try {
      const { locationId, productId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      await ghlAPI.deleteProduct(locationId, productId, accessToken as string);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("GHL delete product error:", error);
      res.status(500).json({ error: "Failed to delete product from GHL" });
    }
  });

  app.post("/api/ghl/locations/:locationId/products/:productId/toggle-store", async (req, res) => {
    try {
      const { locationId, productId } = req.params;
      const { accessToken, action } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      
      let product;
      if (action === 'include') {
        product = await ghlAPI.includeProductInStore(locationId, productId, accessToken as string);
      } else if (action === 'exclude') {
        product = await ghlAPI.excludeProductFromStore(locationId, productId, accessToken as string);
      } else {
        return res.status(400).json({ error: "Action must be 'include' or 'exclude'" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("GHL toggle product store error:", error);
      res.status(500).json({ error: "Failed to toggle product store status in GHL" });
    }
  });

  // Product Prices Management
  app.get("/api/ghl/locations/:locationId/products/:productId/prices", async (req, res) => {
    try {
      const { locationId, productId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const prices = await ghlAPI.getProductPrices(locationId, productId, accessToken as string);
      res.json(prices);
    } catch (error) {
      console.error("GHL product prices error:", error);
      res.status(500).json({ error: "Failed to fetch product prices from GHL" });
    }
  });

  app.get("/api/ghl/locations/:locationId/products/:productId/prices/:priceId", async (req, res) => {
    try {
      const { locationId, productId, priceId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const price = await ghlAPI.getProductPrice(locationId, productId, priceId, accessToken as string);
      res.json(price);
    } catch (error) {
      console.error("GHL product price error:", error);
      res.status(500).json({ error: "Failed to fetch product price from GHL" });
    }
  });

  app.post("/api/ghl/locations/:locationId/products/:productId/prices", async (req, res) => {
    try {
      const { locationId, productId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const price = await ghlAPI.createProductPrice(locationId, productId, req.body, accessToken as string);
      res.status(201).json(price);
    } catch (error) {
      console.error("GHL create product price error:", error);
      res.status(500).json({ error: "Failed to create product price in GHL" });
    }
  });

  app.put("/api/ghl/locations/:locationId/products/:productId/prices/:priceId", async (req, res) => {
    try {
      const { locationId, productId, priceId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const price = await ghlAPI.updateProductPrice(locationId, productId, priceId, req.body, accessToken as string);
      res.json(price);
    } catch (error) {
      console.error("GHL update product price error:", error);
      res.status(500).json({ error: "Failed to update product price in GHL" });
    }
  });

  app.delete("/api/ghl/locations/:locationId/products/:productId/prices/:priceId", async (req, res) => {
    try {
      const { locationId, productId, priceId } = req.params;
      const { accessToken } = req.query;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      await ghlAPI.deleteProductPrice(locationId, productId, priceId, accessToken as string);
      res.json({ message: "Product price deleted successfully" });
    } catch (error) {
      console.error("GHL delete product price error:", error);
      res.status(500).json({ error: "Failed to delete product price from GHL" });
    }
  });

  // Get directory by name for wizard-configured forms
  app.get("/api/directories/:directoryName", async (req, res) => {
    try {
      const { directoryName } = req.params;
      const directory = simpleDataStore.getDirectoryByName(directoryName);
      console.log(`[API] Retrieved directory for ${directoryName}:`, directory);
      if (!directory) {
        return res.status(404).json({ error: "Directory not found" });
      }
      res.json(directory);
    } catch (error) {
      console.error("Get directory by name error:", error);
      res.status(500).json({ error: "Failed to fetch directory" });
    }
  });

  // Dynamic Form Fields Management - now using simple data store
  app.get("/api/form-fields/:formConfigId", async (req, res) => {
    try {
      const { formConfigId } = req.params;
      const fields = simpleDataStore.getFormFieldsByConfig(parseInt(formConfigId));
      console.log(`[API] Retrieved ${fields.length} form fields for config ${formConfigId}`);
      res.json(fields);
    } catch (error) {
      console.error("Get form fields error:", error);
      res.status(500).json({ error: "Failed to fetch form fields" });
    }
  });

  app.post("/api/form-fields", async (req, res) => {
    try {
      const field = await storage.createFormField(req.body);
      res.status(201).json(field);
    } catch (error) {
      console.error("Create form field error:", error);
      res.status(500).json({ error: "Failed to create form field" });
    }
  });

  app.put("/api/form-fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const field = await storage.updateFormField(parseInt(id), req.body);
      res.json(field);
    } catch (error) {
      console.error("Update form field error:", error);
      res.status(500).json({ error: "Failed to update form field" });
    }
  });

  app.delete("/api/form-fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFormField(parseInt(id));
      res.json({ message: "Form field deleted successfully" });
    } catch (error) {
      console.error("Delete form field error:", error);
      res.status(500).json({ error: "Failed to delete form field" });
    }
  });

  app.post("/api/form-fields/reorder", async (req, res) => {
    try {
      const { fieldIds } = req.body; // Array of field IDs in new order
      await storage.reorderFormFields(fieldIds);
      res.json({ message: "Form fields reordered successfully" });
    } catch (error) {
      console.error("Reorder form fields error:", error);
      res.status(500).json({ error: "Failed to reorder form fields" });
    }
  });

  app.post("/api/form-fields/duplicate/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const duplicatedField = await storage.duplicateFormField(parseInt(id));
      res.status(201).json(duplicatedField);
    } catch (error) {
      console.error("Duplicate form field error:", error);
      res.status(500).json({ error: "Failed to duplicate form field" });
    }
  });

  // GHL Custom Fields Integration
  app.post("/api/form-fields/:id/sync-ghl", async (req, res) => {
    try {
      const { id } = req.params;
      const { locationId, accessToken } = req.body;
      
      const field = await storage.getFormFieldById(parseInt(id));
      if (!field) {
        return res.status(404).json({ error: "Form field not found" });
      }

      // Map field types to GHL types
      const mapFieldTypeToGHL = (fieldType: string) => {
        const mapping: Record<string, string> = {
          'text': 'TEXT',
          'email': 'EMAIL',
          'phone': 'PHONE',
          'textarea': 'TEXTAREA',
          'number': 'NUMBER',
          'select': 'SINGLE_OPTIONS',
          'radio': 'SINGLE_OPTIONS',
          'checkbox': 'CHECKBOX',
          'date': 'DATE',
          'time': 'TEXT',
          'datetime': 'DATETIME',
          'file': 'FILE_UPLOAD',
          'image': 'FILE_UPLOAD',
          'url': 'TEXT',
          'color': 'TEXT',
          'range': 'NUMBER',
          'rating': 'NUMBER',
          'multi-select': 'MULTIPLE_OPTIONS',
          'tags': 'TEXT',
          'address': 'TEXT',
          'hidden': 'TEXT',
          // E-commerce specialized fields
          'pricing-type': 'TEXT',
          'product-variants': 'TEXT',
          'inventory-tracking': 'NUMBER'
        };
        return mapping[fieldType] || 'TEXT';
      };

      // Create custom field in GHL
      const ghlField = await ghlAPI.createCustomField(locationId, {
        name: field.fieldLabel,
        fieldKey: field.fieldName,
        dataType: mapFieldTypeToGHL(field.fieldType),
        isRequired: field.isRequired,
        placeholder: field.fieldPlaceholder || '',
        position: field.displayOrder || 0,
        picklistOptions: field.fieldOptions ? JSON.parse(field.fieldOptions).options : undefined
      }, accessToken);

      // Update local field with GHL ID
      await storage.updateFormField(parseInt(id), {
        ghlCustomFieldId: ghlField.id
      });

      res.json({ message: "Field synced to GHL successfully", ghlField });
    } catch (error) {
      console.error("Sync field to GHL error:", error);
      res.status(500).json({ error: "Failed to sync field to GHL" });
    }
  });

  // OAuth token management
  app.post("/api/ghl/refresh-token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }
      const tokenResponse = await ghlAPI.refreshAccessToken(refreshToken);
      res.json(tokenResponse);
    } catch (error) {
      console.error("GHL token refresh error:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  // Get OAuth users for dropdown selection
  app.get("/api/ghl/oauth-users", async (req, res) => {
    try {
      const oauthUsers = await storage.getOAuthUsers();
      res.json(oauthUsers);
    } catch (error) {
      console.error("Error fetching OAuth users:", error);
      res.status(500).json({ error: "Failed to fetch OAuth users" });
    }
  });

  // OAuth session data extraction endpoint - captures user data during installation
  app.get("/api/oauth/session-data", async (req, res) => {
    try {
      console.log('📊 OAuth session data extraction started');
      console.log('Query params:', req.query);
      
      const { success, timestamp, code, state } = req.query;
      
      if (!success && !code) {
        return res.json({
          success: false,
          error: "No OAuth success or code parameter found",
          message: "This endpoint extracts data from successful OAuth installations"
        });
      }

      // If we have a code, exchange it for tokens and fetch user data
      if (code && typeof code === 'string') {
        console.log('🔑 Exchanging OAuth code for tokens and user data');
        
        try {
          const clientId = process.env.GHL_CLIENT_ID;
          const clientSecret = process.env.GHL_CLIENT_SECRET;
          const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/';

          if (!clientId || !clientSecret) {
            return res.status(500).json({
              success: false,
              error: "OAuth credentials not configured"
            });
          }

          // Exchange code for access token
          const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: clientId,
              client_secret: clientSecret,
              code: code,
              redirect_uri: redirectUri
            })
          });

          if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.status}`);
          }

          const tokens = await tokenResponse.json();
          console.log('✅ OAuth tokens received');

          // Fetch user information
          const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'Accept': 'application/json'
            }
          });

          if (!userResponse.ok) {
            throw new Error(`User info fetch failed: ${userResponse.status}`);
          }

          const userData = await userResponse.json();
          console.log('✅ User data retrieved:', userData.email);

          // Fetch location information
          let locationData = null;
          const locationsResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'Accept': 'application/json'
            }
          });

          if (locationsResponse.ok) {
            const locationsResult = await locationsResponse.json();
            if (locationsResult.locations && locationsResult.locations.length > 0) {
              locationData = locationsResult.locations[0];
              console.log('✅ Location data retrieved:', locationData.name);
            }
          }

          // Store the OAuth user data in database
          const oauthUserData = {
            ghlUserId: userData.id,
            email: userData.email,
            name: userData.name || `${userData.firstName} ${userData.lastName}`,
            ghlAccessToken: tokens.access_token,
            ghlRefreshToken: tokens.refresh_token,
            ghlTokenExpiry: new Date(Date.now() + (tokens.expires_in * 1000)),
            ghlScopes: tokens.scope || '',
            ghlLocationId: locationData?.id || '',
            ghlLocationName: locationData?.name || '',
            installationTimestamp: timestamp || Date.now().toString()
          };

          // Create or update OAuth user record
          try {
            const savedUser = await storage.createOAuthUser(oauthUserData);
            console.log('✅ OAuth user data saved to database');
          } catch (dbError) {
            console.warn('⚠️ Database save failed, continuing with response:', dbError);
          }

          return res.json({
            success: true,
            message: "OAuth installation data captured successfully",
            accountData: {
              user: {
                id: userData.id,
                name: userData.name || `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                company: userData.companyName
              },
              location: locationData ? {
                id: locationData.id,
                name: locationData.name,
                address: locationData.address,
                city: locationData.city,
                state: locationData.state,
                website: locationData.website
              } : null,
              installation: {
                timestamp: timestamp || Date.now().toString(),
                installationTime: new Date(parseInt(timestamp as string || Date.now().toString())).toISOString(),
                scopes: tokens.scope,
                hasValidTokens: true
              }
            },
            retrievalTime: new Date().toISOString()
          });

        } catch (tokenError) {
          console.error('❌ OAuth token exchange failed:', tokenError);
          return res.status(500).json({
            success: false,
            error: "Failed to exchange OAuth code for user data",
            details: tokenError instanceof Error ? tokenError.message : "Unknown error"
          });
        }
      }

      // For success=true without code, return installation confirmation
      return res.json({
        success: true,
        message: "OAuth installation confirmed",
        installation: {
          timestamp: timestamp || Date.now().toString(),
          installationTime: timestamp ? new Date(parseInt(timestamp as string)).toISOString() : new Date().toISOString(),
          domain: 'dir.engageautomations.com',
          status: 'Installation successful',
          clientId: process.env.GHL_CLIENT_ID?.substring(0, 8) + '...'
        },
        note: "User account data requires OAuth code parameter for full extraction"
      });

    } catch (error) {
      console.error('❌ Session data extraction error:', error);
      res.status(500).json({
        success: false,
        error: "Session data extraction failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create GoHighLevel Product via Railway Backend
  app.post("/api/ghl/create-product", async (req, res) => {
    try {
      const { railwayIntegration } = await import('./railway-integration.js');
      
      console.log('Creating product via Railway backend...');
      console.log('Request body:', req.body);
      
      // Get primary installation from Railway backend
      const installationId = await railwayIntegration.getPrimaryInstallation();
      console.log('Using installation ID:', installationId);
      
      // Test connection first
      const connectionTest = await railwayIntegration.testGHLConnection(installationId);
      if (!connectionTest.success) {
        console.error('Railway connection test failed:', connectionTest);
        return res.status(400).json({
          success: false,
          error: "Railway backend connection failed",
          details: connectionTest.error || "Cannot connect to GoHighLevel through Railway"
        });
      }
      
      console.log('Railway connection successful:', connectionTest.locationId);

      // Prepare product data for Railway backend
      const { formSubmission, product, locationId: providedLocationId } = req.body;
      
      const productData = {
        name: formSubmission?.product_name || product?.name || req.body.name || 'Test Product from Local App',
        description: formSubmission?.product_description || product?.description || req.body.description || 'Created from local Replit application via Railway backend',
        productType: req.body.productType || product?.productType || 'DIGITAL',
        locationId: providedLocationId || connectionTest.locationId,
        price: formSubmission?.price || product?.price || req.body.price
      };

      console.log('Sending product data to Railway:', productData);

      // Create product through Railway backend
      const result = await railwayIntegration.createProduct(productData, installationId);
      
      console.log('Railway product creation result:', result);

      res.json({
        success: true,
        message: "Product created successfully in GoHighLevel via Railway backend",
        product: result.product,
        productId: result.product?.id,
        locationId: connectionTest.locationId,
        installationId,
        railwayBackend: true
      });

    } catch (error) {
      console.error("Railway product creation error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to create product via Railway backend",
        details: error instanceof Error ? error.message : 'Unknown error',
        railwayBackend: false
      });
    }
  });

  // Railway Backend Status and Testing Routes
  app.get("/api/railway/health", async (req, res) => {
    try {
      const { railwayIntegration } = await import('./railway-integration.js');
      const health = await railwayIntegration.getHealthStatus();
      res.json({
        success: true,
        railwayBackend: health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Railway backend health check failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/railway/test-connection", async (req, res) => {
    try {
      const { railwayIntegration } = await import('./railway-integration.js');
      const installationId = await railwayIntegration.getPrimaryInstallation();
      const connectionTest = await railwayIntegration.testGHLConnection(installationId);
      res.json({
        success: true,
        installationId,
        connectionTest,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Railway connection test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/railway/products", async (req, res) => {
    try {
      const { railwayIntegration } = await import('./railway-integration.js');
      const installationId = await railwayIntegration.getPrimaryInstallation();
      const products = await railwayIntegration.getProducts(installationId);
      res.json({
        success: true,
        installationId,
        products,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Railway products fetch failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/ghl/sync/contacts", async (req, res) => {
    try {
      const { locationId, accessToken } = req.body;
      if (!locationId || !accessToken) {
        return res.status(400).json({ error: "Location ID and access token are required" });
      }
      const result = await ghlAPI.syncContactsToLocal(locationId, accessToken);
      res.json(result);
    } catch (error) {
      console.error("GHL sync contacts error:", error);
      res.status(500).json({ error: "Failed to sync contacts from GHL" });
    }
  });

  app.post("/api/ghl/sync/locations", async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const result = await ghlAPI.syncUserLocations(accessToken);
      res.json(result);
    } catch (error) {
      console.error("GHL sync locations error:", error);
      res.status(500).json({ error: "Failed to sync locations from GHL" });
    }
  });

  // Domain status endpoint
  app.get("/api/domain/status", (req, res) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const isSecure = protocol === 'https';
    
    res.json({
      host,
      protocol,
      isSecure,
      customDomain: process.env.CUSTOM_DOMAIN || null,
      replitDomain: process.env.REPLIT_DOMAINS || null,
      domainConfig: (req as any).domainConfig || null
    });
  });

  // Google Drive OAuth routes
  app.get("/api/google-drive/auth-url", (req, res) => {
    try {
      const authUrl = googleDriveService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  app.post("/api/google-drive/exchange-token", async (req, res) => {
    try {
      const { code, folderName } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code is required" });
      }

      const tokens = await googleDriveService.getTokens(code);
      
      // Set credentials to get user info
      googleDriveService.setCredentials(tokens);
      const userInfo = await googleDriveService.getUserInfo();
      
      res.json({
        email: userInfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        folderName: folderName || 'Directory Images'
      });
    } catch (error) {
      console.error("Error exchanging token:", error);
      res.status(500).json({ error: "Failed to exchange authorization code" });
    }
  });

  // OAuth callback route
  app.get("/auth/google/callback", (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect(`/?error=${error}`);
    }
    
    if (code) {
      return res.redirect(`/google-drive-setup?code=${code}`);
    }
    
    res.redirect("/google-drive-setup");
  });

  // Test OAuth URL generation
  app.get("/api/oauth/test-url", async (req, res) => {
    try {
      const { TokenEncryption } = await import('./token-encryption');
      const state = TokenEncryption.generateState();
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true); // Use marketplace flow
      
      res.json({
        authUrl,
        redirectUri: 'https://dir.engageautomations.com/oauth/callback',
        clientId: process.env.GHL_CLIENT_ID,
        state: state.slice(0, 8) + '...',
        instructions: "Copy this URL and open it in a browser while logged into HighLevel to test the OAuth flow"
      });
    } catch (error) {
      console.error("Error generating test URL:", error);
      res.status(500).json({ error: "Failed to generate test URL" });
    }
  });

  // OAuth validation endpoint
  app.get("/api/oauth/validate", async (req, res) => {
    try {
      // OAuth flow validation temporarily disabled
      const validation = { status: 'ok', message: 'OAuth validation bypassed' };
      
      res.json({
        success: true,
        validation
      });
    } catch (error) {
      console.error("OAuth validation error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to validate OAuth flow",
        details: String(error)
      });
    }
  });

  // OAuth configuration verification endpoint
  app.get("/api/oauth/config", async (req, res) => {
    try {
      const config = {
        clientId: process.env.GHL_CLIENT_ID ? 'configured' : 'missing',
        clientSecret: process.env.GHL_CLIENT_SECRET ? 'configured' : 'missing',
        redirectUri: process.env.GHL_REDIRECT_URI || 'using_fallback',
        scopes: process.env.GHL_SCOPES || 'using_default',
        authUrl: ghlOAuth.getAuthorizationUrl('test_state', true),
        callbackUrl: 'https://dir.engageautomations.com/api/oauth/callback'
      };
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get OAuth config', details: error.message });
    }
  });

  // GoHighLevel OAuth Routes
  // Standard OAuth start endpoint for marketplace apps
  app.get("/oauth/start", async (req, res) => {
    try {
      console.log("OAuth start request received");
      const { TokenEncryption } = await import('./token-encryption');
      const state = TokenEncryption.generateState();
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true); // Use marketplace flow
      
      console.log("Generated OAuth URL:", authUrl);
      console.log("OAuth state generated:", state.slice(0, 8) + '...');
      
      // Store state in secure session cookie for validation
      res.cookie('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      res.redirect(authUrl);
    } catch (error) {
      console.error("OAuth start error:", error);
      res.status(500).json({ error: "Failed to initiate OAuth" });
    }
  });

  app.get("/auth/ghl/authorize", async (req, res) => {
    try {
      console.log("OAuth authorization request received");
      const { TokenEncryption } = await import('./token-encryption');
      const state = TokenEncryption.generateState();
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true); // Use marketplace flow
      
      console.log("Generated OAuth URL:", authUrl);
      console.log("OAuth state generated:", state.slice(0, 8) + '...');
      
      // Store state in secure session cookie for validation
      res.cookie('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      res.redirect(authUrl);
    } catch (error) {
      console.error("OAuth authorization error:", error);
      res.status(500).json({ error: "Failed to initiate OAuth" });
    }
  });



  // OAuth token refresh endpoint
  app.post("/api/oauth/refresh", async (req, res) => {
    try {
      console.log("=== TOKEN REFRESH REQUEST ===");
      
      // Get installation from Railway backend
      const installationsResponse = await fetch('https://dir.engageautomations.com/api/debug/installations');
      const installationsData = await installationsResponse.json();
      
      if (!installationsData.success || installationsData.installations.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "No OAuth installations found" 
        });
      }
      
      const installation = installationsData.installations[0];
      
      if (!installation.ghlRefreshToken) {
        return res.status(400).json({ 
          success: false, 
          error: "No refresh token available" 
        });
      }
      
      // Call GoHighLevel token refresh endpoint
      const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
          client_secret: process.env.GHL_CLIENT_SECRET || '',
          grant_type: 'refresh_token',
          refresh_token: installation.ghlRefreshToken
        })
      });
      
      const refreshData = await refreshResponse.json();
      
      if (!refreshResponse.ok) {
        console.error("Token refresh failed:", refreshData);
        return res.status(400).json({ 
          success: false, 
          error: "Token refresh failed",
          details: refreshData
        });
      }
      
      console.log("Token refreshed successfully");
      
      // Update installation on Railway backend
      await fetch('https://dir.engageautomations.com/api/oauth/installation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installationId: installation.id,
          ghlAccessToken: refreshData.access_token,
          ghlTokenExpiresAt: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
        })
      });
      
      res.json({
        success: true,
        access_token: refreshData.access_token,
        expires_in: refreshData.expires_in,
        message: "Token refreshed successfully"
      });
      
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to refresh token",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced create-product endpoint with automatic token refresh
  app.post("/api/ghl/create-product", async (req, res) => {
    try {
      console.log("=== GHL PRODUCT CREATION REQUEST ===");
      
      // Get stored OAuth installation data
      const installationsResponse = await fetch('https://dir.engageautomations.com/api/debug/installations');
      const installationsData = await installationsResponse.json();
      
      if (!installationsData.success || installationsData.installations.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "No OAuth installations found. Please complete OAuth installation first." 
        });
      }
      
      const installation = installationsData.installations[0];
      
      if (!installation.hasAccessToken || !installation.ghlLocationId) {
        return res.status(400).json({ 
          success: false, 
          error: "OAuth installation missing access token or location ID" 
        });
      }
      
      // Check if token needs refresh (expires within 5 minutes)
      let accessToken = installation.ghlAccessToken;
      if (installation.ghlTokenExpiresAt) {
        const expiryTime = new Date(installation.ghlTokenExpiresAt);
        const now = new Date();
        const timeUntilExpiry = expiryTime.getTime() - now.getTime();
        
        if (timeUntilExpiry < (5 * 60 * 1000)) { // 5 minutes
          console.log("Token near expiry, refreshing...");
          
          const refreshResponse = await fetch(`${req.protocol}://${req.get('host')}/api/oauth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            accessToken = refreshData.access_token;
            console.log("Token refreshed successfully for product creation");
          } else {
            console.error("Token refresh failed, proceeding with existing token");
          }
        }
      }
      
      // Create product data with core fields
      const productData = {
        // Required fields - GoHighLevel API requirements
        name: req.body.name || "Untitled Product",
        locationId: installation.ghlLocationId,
        productType: req.body.productType || "DIGITAL", // DIGITAL, PHYSICAL, SERVICE, PHYSICAL/DIGITAL
        
        // Standard fields - always include for consistency
        description: req.body.description || "",
        availableInStore: req.body.availableInStore !== undefined ? req.body.availableInStore : true,
        
        // Price - always required for GoHighLevel store availability
        // Default to $100 if no price provided to ensure products show as available
        price: req.body.price || 100,
        
        // Image field if provided
        ...(req.body.image && { image: req.body.image }),
        
        // SEO fields - now standard with every submission
        ...(req.body.seo && {
          seo: {
            title: req.body.seo.title || req.body.name || "Untitled Product",
            description: req.body.seo.description || req.body.description || ""
          }
        }),
        
        // Optional fields that may be configured per form
        ...(req.body.statementDescriptor && { statementDescriptor: req.body.statementDescriptor }),
        ...(req.body.slug && { slug: req.body.slug }),
        ...(req.body.collectionIds && { collectionIds: req.body.collectionIds }),
        ...(req.body.variants && { variants: req.body.variants }),
        ...(req.body.medias && { medias: req.body.medias }),
        
        // Tax configuration if provided
        ...(req.body.isTaxesEnabled !== undefined && { isTaxesEnabled: req.body.isTaxesEnabled }),
        ...(req.body.taxes && { taxes: req.body.taxes }),
        ...(req.body.automaticTaxCategoryId && { automaticTaxCategoryId: req.body.automaticTaxCategoryId }),
        
        // Label configuration if provided
        ...(req.body.isLabelEnabled !== undefined && { isLabelEnabled: req.body.isLabelEnabled }),
        ...(req.body.label && { label: req.body.label })
      };
      
      console.log("Creating product with data:", productData);
      console.log("Using access token from installation:", installation.id);
      
      // Call GoHighLevel Product Creation API directly
      const ghlResponse = await fetch('https://services.leadconnectorhq.com/products/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(productData)
      });
      
      const ghlResult = await ghlResponse.json();
      
      if (!ghlResponse.ok) {
        console.error("GoHighLevel API error:", ghlResult);
        return res.status(ghlResponse.status).json({ 
          success: false, 
          error: "GoHighLevel API error",
          details: ghlResult
        });
      }
      
      console.log("Product created successfully in GoHighLevel:", ghlResult);
      
      res.json({ 
        success: true, 
        product: ghlResult,
        installation: {
          id: installation.id,
          ghlLocationId: installation.ghlLocationId,
          ghlLocationName: installation.ghlLocationName
        },
        message: "Product created successfully in GoHighLevel"
      });
      
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to create product",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test route to verify API routing works in production
  app.get("/api/test", (req, res) => {
    res.json({ message: "✅ API routing working correctly", timestamp: new Date().toISOString() });
  });

  // OAuth token exchange using GET method to avoid routing conflicts
  app.get("/api/oauth/process", async (req, res) => {
    try {
      console.log('OAuth process endpoint accessed');
      const { code, state, action } = req.query;
      
      if (action !== 'exchange') {
        return res.status(400).json({ error: 'Invalid action parameter' });
      }
      
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      console.log('Processing OAuth code:', (code as string).substring(0, 10) + '...');
      
      // Import OAuth functionality
      const { ghlOAuth } = await import('./ghl-oauth.js');
      
      // Exchange code for tokens
      const tokenData = await ghlOAuth.exchangeCodeForTokens(code as string, state as string);
      
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
        details: error.message 
      });
    }
  });



  app.post("/auth/ghl/logout", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      
      if (user?.ghlAccessToken) {
        // Revoke GHL token
        await ghlOAuth.revokeToken(user.ghlAccessToken);
      }

      // Clear session cookie
      res.clearCookie('session_token');
      
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // OAuth users endpoint for testing
  app.get("/api/users/oauth", async (req, res) => {
    try {
      const oauthUsers = await storage.getOAuthUsers();
      res.json(oauthUsers);
    } catch (error) {
      console.error("Error fetching OAuth users:", error);
      res.status(500).json({ error: "Failed to fetch OAuth users" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    const user = (req as any).user;
    
    // Return user info without sensitive data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      authType: user.authType,
      ghlLocationId: user.ghlLocationId,
      ghlLocationName: user.ghlLocationName,
      isActive: user.isActive,
    });
  });

  // Debug API routes for OAuth installation testing
  app.get("/api/debug/oauth-installations", async (req, res) => {
    try {
      const installations = await storage.getAllOAuthInstallations();
      res.json(installations);
    } catch (error) {
      console.error("Error fetching OAuth installations:", error);
      res.status(500).json({ error: "Failed to fetch OAuth installations" });
    }
  });

  app.post("/api/debug/clear-installations", async (req, res) => {
    try {
      const result = await storage.clearAllOAuthInstallations();
      res.json({ 
        success: true, 
        message: `Cleared ${result.deletedCount || 0} installation records` 
      });
    } catch (error) {
      console.error("Error clearing OAuth installations:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to clear OAuth installations" 
      });
    }
  });

  app.get("/api/debug/installation-summary", async (req, res) => {
    try {
      const installations = await storage.getAllOAuthInstallations();
      const summary = {
        totalInstallations: installations.length,
        activeInstallations: installations.filter(i => i.isActive).length,
        latestInstallation: installations.length > 0 ? installations[0] : null,
        locations: Array.from(new Set(installations.map(i => i.ghlLocationName))),
        users: Array.from(new Set(installations.map(i => i.ghlUserEmail)))
      };
      res.json(summary);
    } catch (error) {
      console.error("Error generating installation summary:", error);
      res.status(500).json({ error: "Failed to generate installation summary" });
    }
  });

  return httpServer;
}
