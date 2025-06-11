import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

/**
 * Production-specific routing middleware that ensures API routes
 * are handled before static file serving
 */
export function setupProductionRouting(app: Express) {
  // Find the correct dist path for production static files
  const possiblePaths = [
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "public"),
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "../public"),
    path.resolve(__dirname, "../dist")
  ];
  
  let distPath = possiblePaths.find(p => fs.existsSync(p));
  
  if (!distPath) {
    console.warn("No static build directory found, serving API routes only");
    // Don't add any catch-all handlers when no dist directory exists
    // Let the registered routes handle API requests
    return;
  }

  console.log(`Production static files serving from: ${distPath}`);

  // Serve static files only for non-API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip all static serving for API routes - let them pass through to registered handlers
    if (req.originalUrl.startsWith('/api/') || 
        req.originalUrl.startsWith('/oauth/') ||
        req.originalUrl.startsWith('/auth/')) {
      return next();
    }
    
    // Serve static files for everything else
    express.static(distPath, { 
      index: false,  // Don't auto-serve index.html
      fallthrough: true 
    })(req, res, next);
  });

  // Final catch-all - serve index.html for frontend routes ONLY
  // DO NOT handle any API routes here - they are handled by registered Express routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    
    // Skip ALL API routes - they are handled by previously registered routes
    if (url.startsWith('/api/') || 
        url.startsWith('/oauth/') ||
        url.startsWith('/auth/')) {
      return next();
    }
    
    // Only serve static files for non-API routes
    next();
  });
  
  // Serve index.html for SPA routes (non-API routes only)
  app.use("*", (req: Request, res: Response) => {
    const url = req.originalUrl;
    
    // This should never handle API routes due to middleware above
    console.log(`📄 Serving index.html for frontend route: ${url}`);
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html><head><title>GoHighLevel Directory</title></head>
        <body><h1>Application Ready</h1></body>
        </html>
      `);
    }
  });
}