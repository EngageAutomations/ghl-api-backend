const express = require('express');
const cors = require('cors');

// Import route modules
const oauthRoutes = require('./routes/oauth');
const productRoutes = require('./routes/products');
const mediaRoutes = require('./routes/media');
const pricingRoutes = require('./routes/pricing');

const app = express();
const port = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend - Modular',
    version: '8.0.0-modular',
    status: 'operational',
    modules: ['oauth', 'products', 'media', 'pricing'],
    architecture: 'modular'
  });
});

// Mount route modules
app.use('/api/oauth', oauthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/pricing', pricingRoutes);

// Legacy routes for compatibility
app.use('/', oauthRoutes); // OAuth callback at root level

app.listen(port, () => {
  console.log(`Modular backend running on port ${port}`);
});