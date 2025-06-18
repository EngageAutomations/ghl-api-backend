/**
 * GoHighLevel API Routes - Express route handlers for all GHL endpoints
 * Integrates with the scalable API manager system
 */

import { Router, Request, Response } from 'express';
import GHLAPIRouter from './ghl-api-router';
import GoHighLevelAPIManager from './ghl-api-manager';
import { storage } from './storage';

const router = Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Authentication middleware - ensures OAuth installation exists or allows installation ID bypass
 */
async function requireOAuthInstallation(req: Request, res: Response, next: any) {
  try {
    // Check if this is an installation ID request (bypass OAuth requirement)
    const installationIdFromBody = req.body?.installationId;
    if (installationIdFromBody) {
      console.log('Installation ID detected in request body, bypassing OAuth check:', installationIdFromBody);
      (req as any).hasInstallationId = true;
      return next();
    }
    
    const installations = storage.getAllInstallations();
    
    if (installations.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'No OAuth installations found. Complete OAuth setup first.',
        hint: 'Visit /api/oauth/url to start OAuth flow'
      });
    }
    
    // Attach installation to request
    const installationId = req.query.installationId as string || req.headers['x-installation-id'] as string;
    const installation = installationId 
      ? installations.find(i => i.id.toString() === installationId)
      : installations[0];
    
    if (!installation) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found'
      });
    }
    
    if (!installation.ghlAccessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token available for installation'
      });
    }
    
    (req as any).installation = installation;
    next();
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Authentication check failed',
      details: error.message
    });
  }
}

// ============================================================================
// DYNAMIC API ROUTES
// ============================================================================

// Universal API handler - routes all /api/ghl/* requests dynamically
router.all('/*', requireOAuthInstallation, GHLAPIRouter.handleAPIRequest);

// ============================================================================
// SPECIALIZED ENDPOINTS
// ============================================================================

// Test all API endpoints
router.get('/test/all-endpoints', requireOAuthInstallation, async (req: Request, res: Response) => {
  try {
    const installation = (req as any).installation;
    const results = await GHLAPIRouter.testAllEndpoints(installation.id);
    
    res.json({
      success: true,
      installation: {
        id: installation.id,
        locationId: installation.ghlLocationId,
        locationName: installation.ghlLocationName
      },
      testResults: results
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Endpoint testing failed',
      details: error.message
    });
  }
});

// Get API documentation
router.get('/docs', (req: Request, res: Response) => {
  const documentation = GHLAPIRouter.generateAPIDocumentation();
  
  res.json({
    success: true,
    documentation,
    examples: {
      createProduct: {
        url: 'POST /api/ghl/products',
        body: {
          name: 'Test Product',
          productType: 'DIGITAL',
          description: 'Product created via API',
          availableInStore: true
        }
      },
      getProducts: {
        url: 'GET /api/ghl/products?limit=10&offset=0'
      },
      createContact: {
        url: 'POST /api/ghl/contacts',
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        }
      }
    }
  });
});

// Health check for GHL API
router.get('/health', requireOAuthInstallation, async (req: Request, res: Response) => {
  try {
    const installation = (req as any).installation;
    const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
    
    const healthCheck = await apiManager.testConnection();
    
    res.json({
      success: healthCheck.success,
      health: {
        apiConnection: healthCheck.success,
        tokenValid: healthCheck.success,
        locationId: installation.ghlLocationId,
        scopes: installation.ghlScopes
      },
      installation: {
        id: installation.id,
        locationName: installation.ghlLocationName,
        installationDate: installation.installationDate
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

// Batch product creation
router.post('/batch/products', requireOAuthInstallation, async (req: Request, res: Response) => {
  try {
    const installation = (req as any).installation;
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'Products must be an array'
      });
    }
    
    const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
    const results = [];
    
    for (const productData of products) {
      try {
        const result = await apiManager.createProduct(productData);
        results.push({
          product: productData,
          result
        });
      } catch (error: any) {
        results.push({
          product: productData,
          result: {
            success: false,
            error: error.message
          }
        });
      }
    }
    
    const successCount = results.filter(r => r.result.success).length;
    
    res.json({
      success: true,
      summary: {
        total: products.length,
        successful: successCount,
        failed: products.length - successCount
      },
      results
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Batch operation failed',
      details: error.message
    });
  }
});

// Batch contact import
router.post('/batch/contacts', requireOAuthInstallation, async (req: Request, res: Response) => {
  try {
    const installation = (req as any).installation;
    const { contacts } = req.body;
    
    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        error: 'Contacts must be an array'
      });
    }
    
    const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
    const results = [];
    
    for (const contactData of contacts) {
      try {
        const result = await apiManager.createContact(contactData);
        results.push({
          contact: contactData,
          result
        });
      } catch (error: any) {
        results.push({
          contact: contactData,
          result: {
            success: false,
            error: error.message
          }
        });
      }
    }
    
    const successCount = results.filter(r => r.result.success).length;
    
    res.json({
      success: true,
      summary: {
        total: contacts.length,
        successful: successCount,
        failed: contacts.length - successCount
      },
      results
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Batch operation failed',
      details: error.message
    });
  }
});

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

// Advanced product search
router.get('/search/products', requireOAuthInstallation, async (req: Request, res: Response) => {
  try {
    const installation = (req as any).installation;
    const { query, productType, priceMin, priceMax, limit = 100, offset = 0 } = req.query;
    
    const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
    
    // Get all products and filter client-side for now
    // Note: This would be optimized with server-side filtering in production
    const allProducts = await apiManager.getProducts();
    
    if (!allProducts.success) {
      return res.status(400).json(allProducts);
    }
    
    let filteredProducts = allProducts.data.products || [];
    
    // Apply filters
    if (query) {
      const searchQuery = (query as string).toLowerCase();
      filteredProducts = filteredProducts.filter((product: any) =>
        product.name?.toLowerCase().includes(searchQuery) ||
        product.description?.toLowerCase().includes(searchQuery)
      );
    }
    
    if (productType) {
      filteredProducts = filteredProducts.filter((product: any) =>
        product.productType === productType
      );
    }
    
    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        total: filteredProducts.length,
        offset: parseInt(offset as string),
        limit: parseInt(limit as string)
      },
      filters: {
        query,
        productType,
        priceMin,
        priceMax
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message
    });
  }
});

export default router;