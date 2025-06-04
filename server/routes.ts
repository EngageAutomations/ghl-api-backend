import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertDesignerConfigSchema, 
  insertPortalDomainSchema,
  insertListingSchema,
  insertListingAddonSchema
} from "@shared/schema";
import { generateBulletPoints } from "./ai-summarizer";
import { googleDriveService } from "./google-drive";
import { runTestSuite, runFormTests, generateCode, getFeatureDocumentation, updateConfigurationCode } from "./dev-tools";
import { handleFormSubmission, getFormSubmissions, downloadJSONFile } from "./form-submission-handler";

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
      const addonData = insertListingAddonSchema.parse(req.body);
      const addon = await storage.createListingAddon(addonData);
      res.status(201).json(addon);
    } catch (error) {
      console.error("Error creating listing addon:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
