import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertDesignerConfigSchema, 
  insertPortalDomainSchema 
} from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
