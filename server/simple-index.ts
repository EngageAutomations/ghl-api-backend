import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GoHighLevel product management endpoints
app.post('/api/products/create', async (req, res) => {
  try {
    const { GHLProductService } = await import('./ghl-product-service');
    
    const productData = {
      name: req.body.name || "New Product",
      description: req.body.description || "",
      type: req.body.type || "DIGITAL",
      price: req.body.price || 0,
      currency: req.body.currency || "USD",
      sku: req.body.sku,
      imageUrls: req.body.imageUrls || []
    };

    const result = await GHLProductService.createProduct(productData);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/list', async (req, res) => {
  try {
    const { GHLProductService } = await import('./ghl-product-service');
    const result = await GHLProductService.listProducts();
    res.json(result);
  } catch (error) {
    console.error('Product listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/images/upload', async (req, res) => {
  try {
    const { GHLProductService } = await import('./ghl-product-service');
    const files = req.body.files || [];
    const result = await GHLProductService.uploadImages(files);
    res.json(result);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ GoHighLevel Product Management Server running on port ${port}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Product API: http://localhost:${port}/api/products/`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;