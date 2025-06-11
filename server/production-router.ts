import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

/**
 * Production-specific routing middleware that ensures API routes
 * are handled before static file serving
 */
export function setupProductionRouting(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with explicit exclusion of API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip static serving for API endpoints
    if (req.originalUrl.startsWith('/api/') || 
        req.originalUrl.startsWith('/oauth/') ||
        req.originalUrl.startsWith('/auth/')) {
      return next();
    }
    
    // Serve static files for everything else
    express.static(distPath)(req, res, next);
  });

  // Final fallback - serve index.html for frontend routes only
  app.use((req: Request, res: Response, next: NextFunction) => {
    // API routes should have been handled by now - return 404 if they reach here
    if (req.originalUrl.startsWith('/api/') || 
        req.originalUrl.startsWith('/oauth/') ||
        req.originalUrl.startsWith('/auth/')) {
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    }
    
    // Serve index.html for frontend routes
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}