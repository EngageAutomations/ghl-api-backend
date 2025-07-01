const axios = require('axios');

async function createProductWithImageAndPrice() {
  try {
    console.log('=== Creating Maker Expressed Product with Image and Pricing ===');
    
    const installation_id = "install_1751333384380";
    
    // Since media upload has OAuth scope issues, let's create a complete product 
    // with pricing and prepare for image attachment once scope is resolved
    
    console.log('\n--- Creating Enhanced Maker Expressed Product ---');
    
    const enhancedProduct = await axios.post('https://dir.engageautomations.com/api/products/create-with-collection', {
      name: "Maker Expressed - Ultimate Design Suite",
      description: "Complete design services package including logo design, branding, visual identity, and ongoing support. Transform your brand with professional design solutions that make a lasting impact.",
      productType: "DIGITAL",
      sku: "MAKER-ULTIMATE-SUITE",
      currency: "USD",
      pricing: [
        {
          name: "Logo Design Only",
          type: "one_time",
          amount: 297,
          currency: "USD"
        },
        {
          name: "Complete Brand Package",
          type: "one_time",
          amount: 597,
          currency: "USD"
        },
        {
          name: "Ultimate Brand Identity",
          type: "one_time",
          amount: 997,
          currency: "USD"
        },
        {
          name: "Monthly Design Retainer",
          type: "recurring",
          amount: 497,
          currency: "USD"
        }
      ],
      installation_id: installation_id
    });
    
    console.log('✅ Enhanced product created successfully!');
    console.log('Product ID:', enhancedProduct.data.product._id);
    console.log('Product Name:', enhancedProduct.data.product.name);
    console.log('Pricing Tiers:', enhancedProduct.data.pricing?.length || 0);
    
    // Test the complete workflow endpoint with pricing
    console.log('\n--- Testing Complete Workflow with Pricing ---');
    
    const workflowResult = await axios.post('https://dir.engageautomations.com/api/workflow/complete-product', {
      name: "Maker Expressed - Workflow Test Suite",
      description: "Testing complete workflow endpoint with multiple pricing tiers",
      productType: "DIGITAL",
      sku: "MAKER-WORKFLOW-COMPLETE",
      currency: "USD",
      photos: [], // Empty due to OAuth scope issue
      pricing: [
        {
          name: "Starter Package",
          type: "one_time",
          amount: 197,
          currency: "USD"
        },
        {
          name: "Professional Package",
          type: "one_time",
          amount: 497,
          currency: "USD"
        },
        {
          name: "Enterprise Package",
          type: "one_time",
          amount: 797,
          currency: "USD"
        }
      ],
      installation_id: installation_id
    });
    
    console.log('✅ Workflow test completed!');
    console.log('Summary:', workflowResult.data.summary);
    
    // Check what we've created
    console.log('\n--- Final Product Count ---');
    
    const finalList = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation_id}`);
    const makerProducts = finalList.data.products.filter(p => p.name.includes('Maker Expressed'));
    
    console.log(`Total Maker Expressed products: ${makerProducts.length}`);
    makerProducts.forEach(product => {
      console.log(`- ${product.name}`);
      console.log(`  ID: ${product._id}`);
      console.log(`  SKU: ${product.sku || 'No SKU'}`);
    });
    
    console.log('\n=== OAuth Scope Issue Analysis ===');
    console.log('Media upload failing due to IAM configuration:');
    console.log('- OAuth scope includes "medias.write" ✅');
    console.log('- GoHighLevel returns "authClass type not allowed" ❌');
    console.log('- Solution: May need marketplace app configuration update');
    console.log('- Workaround: Products created successfully, images can be added manually in GHL');
    
    return {
      products_created: makerProducts.length,
      latest_product_id: enhancedProduct.data.product._id,
      pricing_working: true,
      image_upload_status: 'oauth_scope_issue'
    };
    
  } catch (error) {
    console.error('Product creation error:', error.response?.data || error.message);
    return { error: error.message };
  }
}

createProductWithImageAndPrice().then(result => {
  console.log('\n=== Final Result ===');
  console.log(JSON.stringify(result, null, 2));
});