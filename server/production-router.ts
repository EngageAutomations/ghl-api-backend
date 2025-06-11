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
    // Just serve a simple fallback for non-API routes
    app.use("*", (req: Request, res: Response) => {
      if (req.originalUrl.startsWith('/api/') || 
          req.originalUrl.startsWith('/oauth/') ||
          req.originalUrl.startsWith('/auth/')) {
        return res.status(404).json({ 
          error: 'API endpoint not found',
          path: req.originalUrl,
          timestamp: new Date().toISOString()
        });
      }
      res.send(`
        <!DOCTYPE html>
        <html><head><title>GoHighLevel Directory</title></head>
        <body><h1>Application Loading...</h1></body>
        </html>
      `);
    });
    return;
  }

  console.log(`Production static files serving from: ${distPath}`);

  // Serve static files only for non-API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip all static serving for API routes - let them pass through
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
  app.use("*", (req: Request, res: Response) => {
    const url = req.originalUrl;
    
    // CRITICAL: Never serve static files for API, OAuth, or Auth routes
    if (url.startsWith('/api/') || 
        url.startsWith('/oauth/') ||
        url.startsWith('/auth/')) {
      console.log(`❌ API route ${url} not found - returning 404`);
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: url,
        method: req.method,
        timestamp: new Date().toISOString(),
        note: 'This route should be handled by Express, not static serving'
      });
    }
    
    // Serve index.html ONLY for frontend SPA routes
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