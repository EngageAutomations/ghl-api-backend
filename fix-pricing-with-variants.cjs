const axios = require('axios');

async function fixPricingWithVariants() {
  try {
    console.log('=== Creating Maker Expressed Product with CORRECT Pricing Structure ===');
    
    const installation_id = "install_1751333384380";
    
    // GoHighLevel uses "variants" for pricing, not separate price endpoints
    // Let's create a product with multiple variants (pricing tiers)
    
    console.log('\n--- Creating Product with Variants (Pricing Tiers) ---');
    
    const productWithVariants = await axios.post('https://dir.engageautomations.com/api/products/create', {
      name: "Maker Expressed - Complete Brand Suite",
      description: "Professional design services with multiple service tiers. Choose from logo design, complete branding package, or our ultimate brand identity suite.",
      productType: "DIGITAL",
      sku: "MAKER-BRAND-SUITE",
      currency: "USD",
      installation_id: installation_id,
      // Add variants directly in product creation
      variants: [
        {
          name: "Logo Design Package",
          price: 297,
          currency: "USD",
          sku: "MAKER-LOGO-297"
        },
        {
          name: "Complete Brand Package", 
          price: 597,
          currency: "USD",
          sku: "MAKER-BRAND-597"
        },
        {
          name: "Ultimate Brand Identity",
          price: 997, 
          currency: "USD",
          sku: "MAKER-ULTIMATE-997"
        }
      ]
    });
    
    console.log('✅ Product with variants created!');
    console.log('Product ID:', productWithVariants.data.product._id);
    console.log('Product Name:', productWithVariants.data.product.name);
    console.log('Variants Count:', productWithVariants.data.product.variantsLength);
    
    // Test 2: Try updating an existing product to add variants
    console.log('\n--- Testing Product Update with Variants ---');
    
    const existingProductId = "68633a338e0f54b3a4e8aee2"; // First Maker Expressed product
    
    try {
      const updateWithVariants = await axios.put(`https://dir.engageautomations.com/api/products/${existingProductId}`, {
        installation_id: installation_id,
        variants: [
          {
            name: "Starter Design Package",
            price: 197,
            currency: "USD", 
            sku: "MAKER-STARTER-197"
          },
          {
            name: "Professional Design Package",
            price: 497,
            currency: "USD",
            sku: "MAKER-PRO-497"
          }
        ]
      });
      
      console.log('✅ Product updated with variants!');
      console.log('Update result:', updateWithVariants.data);
      
    } catch (updateError) {
      console.log('❌ Product update failed:', updateError.response?.data?.message || updateError.message);
    }
    
    // Test 3: Check if variants show up in product listing
    console.log('\n--- Checking Updated Product Structure ---');
    
    try {
      const updatedList = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation_id}`);
      
      const newProduct = updatedList.data.products.find(p => p.name.includes('Complete Brand Suite'));
      if (newProduct) {
        console.log('✅ Found new product with variants:');
        console.log('Name:', newProduct.name);
        console.log('Variants Length:', newProduct.variantsLength);
        console.log('Has variants field:', 'variants' in newProduct);
        if (newProduct.variants) {
          console.log('Variant details:', newProduct.variants);
        }
      }
      
      const existingProduct = updatedList.data.products.find(p => p._id === existingProductId);
      if (existingProduct) {
        console.log('✅ Found updated existing product:');
        console.log('Name:', existingProduct.name);
        console.log('Variants Length:', existingProduct.variantsLength);
        if (existingProduct.variants && existingProduct.variants.length > 0) {
          console.log('Variant details:', existingProduct.variants);
        }
      }
      
    } catch (listError) {
      console.log('❌ Updated product list failed:', listError.response?.data);
    }
    
    // Test 4: Create the complete workflow with correct variant structure
    console.log('\n--- Testing Complete Workflow with Variants ---');
    
    try {
      const completeWorkflow = await axios.post('https://dir.engageautomations.com/api/products/create', {
        name: "Maker Expressed - FINAL COMPLETE PRODUCT",
        description: "Complete design services with multiple pricing options, ready for GoHighLevel marketplace integration.",
        productType: "DIGITAL",
        sku: "MAKER-FINAL-COMPLETE",
        currency: "USD",
        installation_id: installation_id,
        variants: [
          {
            name: "Quick Logo Design",
            price: 147,
            currency: "USD",
            sku: "MAKER-QUICK-147",
            description: "Fast turnaround logo design"
          },
          {
            name: "Professional Logo Package", 
            price: 297,
            currency: "USD",
            sku: "MAKER-PRO-LOGO-297",
            description: "Professional logo with revisions"
          },
          {
            name: "Complete Brand Identity",
            price: 597,
            currency: "USD", 
            sku: "MAKER-BRAND-597",
            description: "Logo, colors, fonts, brand guidelines"
          },
          {
            name: "Ultimate Design Suite",
            price: 997,
            currency: "USD",
            sku: "MAKER-ULTIMATE-997", 
            description: "Complete branding + marketing materials"
          }
        ]
      });
      
      console.log('✅ FINAL COMPLETE PRODUCT CREATED!');
      console.log('Product ID:', completeWorkflow.data.product._id);
      console.log('Variants:', completeWorkflow.data.product.variantsLength);
      
      return {
        success: true,
        productId: completeWorkflow.data.product._id,
        productName: completeWorkflow.data.product.name,
        variantsCount: completeWorkflow.data.product.variantsLength,
        message: 'Product created with correct pricing structure using variants'
      };
      
    } catch (finalError) {
      console.log('❌ Final complete product failed:', finalError.response?.data || finalError.message);
      return { success: false, error: finalError.message };
    }
    
  } catch (error) {
    console.error('Fix pricing setup error:', error.message);
    return { success: false, error: error.message };
  }
}

fixPricingWithVariants().then(result => {
  console.log('\n=== FINAL RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});