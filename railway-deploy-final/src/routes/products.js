const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { byLocation, ensureFresh } = require('../utils/install-store');

router.post('/locations/:locationId/products', async (req, res) => {
  const { locationId } = req.params;
  const productData = req.body;
  
  try {
    console.log(`Product creation request for location: ${locationId}`);
    console.log('Product data:', { 
      name: productData.name, 
      price: productData.price,
      type: productData.productType 
    });
    
    const installation = byLocation(locationId);
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: `Unknown locationId ${locationId}`
      });
    }
    
    const freshToken = await ensureFresh(installation.id);
    if (!freshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    const productPayload = {
      locationId,
      ...productData
    };
    
    console.log('Sending product creation request to GoHighLevel...');
    const productResponse = await fetch(`https://services.leadconnectorhq.com/products/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productPayload)
    });
    
    const responseText = await productResponse.text();
    console.log('GoHighLevel response status:', productResponse.status);
    
    if (productResponse.ok) {
      const product = JSON.parse(responseText);
      const productId = product.id || product.product?.id;
      
      console.log(`Product created successfully: ${productId}`);
      
      res.json({
        success: true,
        product: product.product || product,
        id: productId
      });
    } else {
      console.error('Product creation failed:', responseText);
      res.status(productResponse.status).json({ 
        success: false, 
        error: responseText
      });
    }
    
  } catch (error) {
    console.error('Product creation error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/locations/:locationId/products', async (req, res) => {
  const { locationId } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  
  try {
    const installation = byLocation(locationId);
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: `Unknown locationId ${locationId}` 
      });
    }
    
    const freshToken = await ensureFresh(installation.id);
    if (!freshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    const productsResponse = await fetch(`https://services.leadconnectorhq.com/products/?locationId=${locationId}&limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${freshToken}` }
    });
    
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      res.json(products);
    } else {
      const errorText = await productsResponse.text();
      res.status(productsResponse.status).json({ 
        success: false, 
        error: errorText 
      });
    }
    
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;