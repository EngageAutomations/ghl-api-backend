const axios = require('axios');
const fs = require('fs');

async function createMakerProductInternal() {
  try {
    console.log('=== Creating Maker Expressed Product - Internal Method ===');
    
    // Get installation ID
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    console.log('Using installation:', installation.id);
    
    // The issue: GoHighLevel API has specific enum requirements
    // Let's try different approaches to find the working productType
    
    console.log('\n--- Approach 1: Try without productType (auto-detect) ---');
    
    try {
      const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', {
        name: "Maker Expressed - Premium Design Services",
        description: "Professional design and branding services by Maker Expressed. Transform your brand with our premium design solutions including logos, branding packages, and visual identity development.",
        sku: "MAKER-EXPRESS-001",
        installation_id: installation.id
      });
      
      console.log('✅ Product created without productType!');
      console.log('Product ID:', productResponse.data.product?.id);
      
      if (productResponse.data.product?.id) {
        // Add pricing
        await addPricingTiers(productResponse.data.product.id, installation.id);
      }
      
      return;
      
    } catch (error1) {
      console.log('❌ Without productType failed:', error1.response?.data?.message);
    }
    
    console.log('\n--- Approach 2: Try the create-with-collection endpoint ---');
    
    try {
      const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create-with-collection', {
        name: "Maker Expressed - Premium Design Services",
        description: "Professional design and branding services by Maker Expressed. Transform your brand with our premium design solutions including logos, branding packages, and visual identity development.",
        productType: "product",
        sku: "MAKER-EXPRESS-001",
        currency: "USD",
        pricing: [
          {
            name: "Logo Design Package",
            type: "one_time",
            amount: 297.00,
            currency: "USD"
          },
          {
            name: "Complete Branding Package",
            type: "one_time", 
            amount: 597.00,
            currency: "USD"
          },
          {
            name: "Premium Brand Identity",
            type: "one_time",
            amount: 997.00,
            currency: "USD"
          },
          {
            name: "Monthly Design Retainer",
            type: "recurring",
            amount: 497.00,
            currency: "USD"
          }
        ],
        installation_id: installation.id
      });
      
      console.log('✅ Product created with collection endpoint!');
      console.log('Product ID:', productResponse.data.product?.id);
      console.log('Pricing tiers:', productResponse.data.createdPrices?.length);
      
      return;
      
    } catch (error2) {
      console.log('❌ Collection endpoint failed:', error2.response?.data?.message);
    }
    
    console.log('\n--- Approach 3: Check what existing products use ---');
    
    try {
      const listResponse = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation.id}`);
      
      if (listResponse.data.products && listResponse.data.products.length > 0) {
        const existingProduct = listResponse.data.products[0];
        console.log('Existing product format:', JSON.stringify(existingProduct, null, 2));
        
        // Try to replicate the format of existing products
        const replicatedFormat = {
          name: "Maker Expressed - Premium Design Services",
          description: "Professional design and branding services by Maker Expressed. Transform your brand with our premium design solutions including logos, branding packages, and visual identity development.",
          // Copy any additional fields from existing product
          sku: "MAKER-EXPRESS-001",
          installation_id: installation.id
        };
        
        console.log('Trying replicated format...');
        
        const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', replicatedFormat);
        
        console.log('✅ Product created with replicated format!');
        console.log('Product ID:', productResponse.data.product?.id);
        
        if (productResponse.data.product?.id) {
          await addPricingTiers(productResponse.data.product.id, installation.id);
        }
        
      } else {
        console.log('No existing products found to replicate format');
      }
      
    } catch (error3) {
      console.log('❌ Replicated format failed:', error3.response?.data?.message);
    }
    
    console.log('\n❌ All approaches failed. GoHighLevel API productType enum needs specific investigation.');
    
  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

async function addPricingTiers(productId, installationId) {
  console.log('\n--- Adding Pricing Tiers ---');
  
  const pricingTiers = [
    { name: "Logo Design Package", type: "one_time", amount: 297.00, currency: "USD" },
    { name: "Complete Branding Package", type: "one_time", amount: 597.00, currency: "USD" },
    { name: "Premium Brand Identity", type: "one_time", amount: 997.00, currency: "USD" },
    { name: "Monthly Design Retainer", type: "recurring", amount: 497.00, currency: "USD" }
  ];
  
  for (let i = 0; i < pricingTiers.length; i++) {
    try {
      const price = pricingTiers[i];
      console.log(`Adding price ${i + 1}: ${price.name}`);
      
      const priceResponse = await axios.post(`https://dir.engageautomations.com/api/products/${productId}/prices`, {
        ...price,
        installation_id: installationId
      });
      
      console.log(`✅ Price added: ${price.name} - $${price.amount}`);
      
    } catch (priceError) {
      console.log(`❌ Failed to add price: ${pricingTiers[i].name}`);
      console.log('Error:', priceError.response?.data?.message);
    }
  }
}

createMakerProductInternal();