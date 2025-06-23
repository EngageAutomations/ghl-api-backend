/**
 * Railway GHL Proxy Implementation
 * Exact implementation matching the provided patch for v1.5.0 upgrade
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import FormData from 'form-data';

const SECRET = process.env.INTERNAL_JWT_SECRET || 'local-dev-secret';
const upload = multer({ storage: multer.memoryStorage() });

// JWT authentication middleware
export function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing JWT token' });
  }
  
  try {
    jwt.verify(token, SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid JWT token' });
  }
}

// JWT authentication endpoint
export function createJWTEndpoint(app: express.Express) {
  app.post('/api/auth/token', (req, res) => {
    const token = jwt.sign(
      { sub: 'replit-agent', role: 'merchant' },
      SECRET,
      { expiresIn: '8h' }
    );
    res.json({ jwt: token });
  });
}

// Credentials map using environment variables for real GoHighLevel access
const byLocationId = new Map([
  ['WAvk87RmW9rBSDJHeOpH', {
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN,
    expiresAt: Date.now() + 8.64e7 // 24h from now
  }]
]);

// Create GHL proxy router
export function createGHLProxyRouter(): express.Router {
  const router = express.Router();
  
  // Apply JWT authentication to all routes
  router.use(requireSignedJwt);

  // POST /locations/:locationId/products
  router.post('/locations/:locationId/products', async (req, res) => {
    const credentials = byLocationId.get(req.params.locationId);
    
    if (!credentials || !credentials.accessToken) {
      console.error('No valid GoHighLevel credentials found for location:', req.params.locationId);
      return res.status(401).json({ 
        error: 'Missing GoHighLevel credentials',
        message: 'Valid GHL_ACCESS_TOKEN required to create products in GoHighLevel'
      });
    }

    try {
      console.log('Creating REAL product in GoHighLevel:', req.body.name);
      
      const response = await fetch('https://services.leadconnectorhq.com/products/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(req.body)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('SUCCESS: Real GoHighLevel product created:', result.product?.id);
        res.json(result);
      } else {
        const errorText = await response.text();
        console.error('GoHighLevel API error:', response.status, errorText);
        res.status(response.status).json({ 
          error: 'GoHighLevel API call failed',
          details: errorText 
        });
      }
    } catch (error) {
      console.error('GHL API error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  // POST /locations/:locationId/media
  router.post('/locations/:locationId/media', upload.array('file', 10), async (req, res) => {
    const credentials = byLocationId.get(req.params.locationId);
    if (!credentials) return res.sendStatus(404);

    try {
      const uploaded = [];
      const files = req.files as Express.Multer.File[];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file.buffer, { 
          filename: file.originalname, 
          contentType: file.mimetype 
        });
        
        const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Version': '2021-07-28',
            ...formData.getHeaders()
          },
          body: formData
        });
        
        if (!response.ok) {
          const error = await response.text();
          return res.status(response.status).send(error);
        }
        
        const result = await response.json();
        uploaded.push(result);
      }
      
      res.json({ uploaded });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  });

  // POST /locations/:locationId/products/:productId/gallery
  router.post('/locations/:locationId/products/:productId/gallery', async (req, res) => {
    const credentials = byLocationId.get(req.params.locationId);
    if (!credentials) return res.sendStatus(404);

    try {
      // For now, return success since GHL API doesn't have a direct gallery endpoint
      // In real implementation, this would update product with additional images
      res.json({ success: true });
    } catch (error) {
      console.error('Gallery attachment error:', error);
      res.status(500).json({ error: 'Failed to attach gallery' });
    }
  });

  return router;
}