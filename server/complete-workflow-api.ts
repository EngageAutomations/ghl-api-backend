/**
 * Complete GoHighLevel Workflow API
 * Handles Image Upload → Product Creation → Pricing in sequence
 */

import { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images allowed.'));
    }
  }
});

interface WorkflowResult {
  success: boolean;
  steps: {
    imageUpload?: string;
    productCreation?: string;
    pricing?: string;
  };
  data?: {
    media?: any;
    product?: any;
    pricing?: any;
  };
  error?: string;
}

interface TokenData {
  access_token: string;
  location_id: string;
  expires_at: string;
}

// Complete workflow endpoint
router.post('/complete-workflow', upload.single('image'), async (req, res) => {
  try {
    const { installation_id, product_name, product_description, price_amount, price_type = 'one_time' } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ error: 'Installation ID required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file required' });
    }
    
    console.log('🚀 Starting complete workflow for installation:', installation_id);
    
    // Get OAuth token
    const tokenData = await getInstallationToken(installation_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired installation' });
    }
    
    // Execute complete workflow
    const result = await executeCompleteWorkflow(tokenData, {
      image: req.file,
      productName: product_name || 'New Product',
      productDescription: product_description || 'Created via complete workflow',
      priceAmount: parseInt(price_amount) || 2999,
      priceType: price_type
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Complete workflow error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Individual step endpoints
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { installation_id } = req.body;
    
    if (!installation_id || !req.file) {
      return res.status(400).json({ error: 'Installation ID and image required' });
    }
    
    const tokenData = await getInstallationToken(installation_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid installation' });
    }
    
    const result = await uploadImageToGHL(tokenData, req.file);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create-product', async (req, res) => {
  try {
    const { installation_id, product_data } = req.body;
    
    const tokenData = await getInstallationToken(installation_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid installation' });
    }
    
    const result = await createProductInGHL(tokenData, product_data);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/add-pricing/:productId', async (req, res) => {
  try {
    const { installation_id, pricing_data } = req.body;
    const { productId } = req.params;
    
    const tokenData = await getInstallationToken(installation_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid installation' });
    }
    
    const result = await addProductPricing(tokenData, productId, pricing_data);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test workflow with sample data
router.post('/test-workflow', async (req, res) => {
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ error: 'Installation ID required' });
    }
    
    const tokenData = await getInstallationToken(installation_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid installation' });
    }
    
    // Create test image
    const testImage = createTestImage();
    
    const result = await executeCompleteWorkflow(tokenData, {
      image: {
        buffer: testImage,
        originalname: 'test-product.png',
        mimetype: 'image/png'
      },
      productName: 'Test Workflow Product',
      productDescription: 'Product created for testing complete workflow',
      priceAmount: 4999,
      priceType: 'one_time'
    });
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
async function getInstallationToken(installationId: string): Promise<TokenData | null> {
  try {
    const response = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
    
    if (!response.ok) {
      return null;
    }
    
    const tokenData = await response.json() as TokenData;
    return tokenData;
  } catch (error) {
    console.error('Token retrieval error:', error);
    return null;
  }
}

async function executeCompleteWorkflow(tokenData: TokenData, workflowData: any): Promise<WorkflowResult> {
  const result: WorkflowResult = {
    success: false,
    steps: {},
    data: {}
  };
  
  try {
    // Step 1: Upload Image
    console.log('Step 1: Uploading image...');
    const mediaResult = await uploadImageToGHL(tokenData, workflowData.image);
    
    if (!mediaResult.success) {
      result.error = `Image upload failed: ${mediaResult.error}`;
      result.steps.imageUpload = '❌ Failed';
      return result;
    }
    
    result.data.media = mediaResult.data;
    result.steps.imageUpload = '✅ Success';
    console.log('✅ Image uploaded:', mediaResult.data.id);
    
    // Step 2: Create Product with Image
    console.log('Step 2: Creating product...');
    const productData = {
      name: workflowData.productName,
      description: workflowData.productDescription,
      productType: 'DIGITAL',
      locationId: tokenData.location_id,
      available: true,
      currency: 'USD',
      medias: [{
        url: mediaResult.data.url,
        type: 'image'
      }],
      prices: [{
        name: 'Standard Price',
        amount: workflowData.priceAmount,
        currency: 'USD',
        type: workflowData.priceType
      }],
      variants: [],
      seo: {
        title: workflowData.productName,
        description: workflowData.productDescription
      }
    };
    
    const productResult = await createProductInGHL(tokenData, productData);
    
    if (!productResult.success) {
      result.error = `Product creation failed: ${productResult.error}`;
      result.steps.productCreation = '❌ Failed';
      return result;
    }
    
    result.data.product = productResult.data;
    result.steps.productCreation = '✅ Success';
    result.steps.pricing = '✅ Embedded';
    console.log('✅ Product created:', productResult.data.id);
    
    result.success = true;
    return result;
    
  } catch (error) {
    result.error = error.message;
    return result;
  }
}

async function uploadImageToGHL(tokenData: TokenData, imageFile: any): Promise<any> {
  try {
    const form = new FormData();
    form.append('file', imageFile.buffer, {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype
    });
    form.append('locationId', tokenData.location_id);
    
    const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      return {
        success: true,
        data: {
          id: (data as any).id || (data as any)._id,
          url: (data as any).url || (data as any).fileUrl,
          name: (data as any).name || imageFile.originalname
        }
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error.substring(0, 200)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function createProductInGHL(tokenData: TokenData, productData: any): Promise<any> {
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error.substring(0, 200)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function addProductPricing(tokenData: TokenData, productId: string, pricingData: any): Promise<any> {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/products/${productId}/prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pricingData)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error.substring(0, 200)}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function createTestImage(): Buffer {
  // Create minimal 1x1 pixel PNG for testing
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x5C, 0xCD, 0x90, 0x0A, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
}

export default router;