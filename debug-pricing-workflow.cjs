const axios = require('axios');

async function debugPricingWorkflow() {
  try {
    console.log('=== Debugging Pricing Workflow Issues ===');
    
    const installation_id = "install_1751333384380";
    const productId = "68633a338e0f54b3a4e8aee2"; // First Maker Expressed product
    
    // Test 1: Check if pricing endpoint URL format is correct
    console.log('\n--- Test 1: Direct Pricing API Call ---');
    
    try {
      const directPricing = await axios.post(`https://dir.engageautomations.com/api/products/${productId}/prices`, {
        installation_id: installation_id,
        name: "Debug Price Test",
        type: "one_time", 
        amount: 100,
        currency: "USD"
      });
      
      console.log('✅ Direct pricing worked:', directPricing.data);
      
    } catch (directError) {
      console.log('❌ Direct pricing failed:');
      console.log('Status:', directError.response?.status);
      console.log('Error:', directError.response?.data);
      console.log('URL attempted:', `https://dir.engageautomations.com/api/products/${productId}/prices`);
    }
    
    // Test 2: Check what the GoHighLevel API actually expects
    console.log('\n--- Test 2: Check Current Product Structure ---');
    
    try {
      const productList = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation_id}`);
      
      if (productList.data.products) {
        const testProduct = productList.data.products.find(p => p._id === productId);
        if (testProduct) {
          console.log('✅ Found test product:');
          console.log('Name:', testProduct.name);
          console.log('ID:', testProduct._id);
          console.log('Has prices field:', 'prices' in testProduct);
          console.log('Price count:', testProduct.prices?.length || 0);
          console.log('Full structure keys:', Object.keys(testProduct));
        }
      }
      
    } catch (listError) {
      console.log('❌ Product list failed:', listError.response?.data);
    }
    
    // Test 3: Try alternative pricing creation methods
    console.log('\n--- Test 3: Testing Alternative Pricing Methods ---');
    
    // Method A: Try the price creation endpoint with different URL format
    try {
      const altPricing1 = await axios.post('https://dir.engageautomations.com/api/prices/create', {
        productId: productId,
        installation_id: installation_id,
        name: "Alternative Method 1",
        type: "one_time",
        amount: 150,
        currency: "USD"
      });
      
      console.log('✅ Alternative method 1 worked:', altPricing1.data);
      
    } catch (alt1Error) {
      console.log('❌ Alternative method 1 failed:', alt1Error.response?.data?.message || alt1Error.message);
    }
    
    // Method B: Try using GoHighLevel's direct pricing API format
    try {
      const altPricing2 = await axios.post(`https://dir.engageautomations.com/api/ghl/products/${productId}/prices`, {
        installation_id: installation_id,
        name: "Alternative Method 2", 
        type: "one_time",
        amount: 200,
        currency: "USD"
      });
      
      console.log('✅ Alternative method 2 worked:', altPricing2.data);
      
    } catch (alt2Error) {
      console.log('❌ Alternative method 2 failed:', alt2Error.response?.data?.message || alt2Error.message);
    }
    
    // Test 4: Create a completely new product with integrated pricing
    console.log('\n--- Test 4: New Product with Integrated Pricing ---');
    
    try {
      const newProductResponse = await axios.post('https://dir.engageautomations.com/api/products/create', {
        name: "Maker Expressed - DEBUG TEST PRODUCT",
        description: "This product is created specifically to test pricing integration",
        productType: "DIGITAL",
        sku: "DEBUG-PRICING-TEST",
        currency: "USD",
        installation_id: installation_id
      });
      
      console.log('✅ New product created:', newProductResponse.data.product._id);
      
      // Now try to add pricing to the new product
      const newProductId = newProductResponse.data.product._id;
      
      const newProductPricing = await axios.post(`https://dir.engageautomations.com/api/products/${newProductId}/prices`, {
        installation_id: installation_id,
        name: "Debug Pricing for New Product",
        type: "one_time",
        amount: 250,
        currency: "USD"
      });
      
      console.log('✅ Pricing added to new product:', newProductPricing.data);
      
    } catch (newProductError) {
      console.log('❌ New product + pricing failed:');
      console.log('Error:', newProductError.response?.data || newProductError.message);
    }
    
    // Test 5: Check the complete workflow implementation
    console.log('\n--- Test 5: Complete Workflow Endpoint Debug ---');
    
    try {
      const workflowDebug = await axios.post('https://dir.engageautomations.com/api/workflow/complete-product', {
        name: "DEBUG - Complete Workflow Test",
        description: "Testing the complete workflow with detailed debugging",
        productType: "DIGITAL",
        sku: "DEBUG-WORKFLOW-COMPLETE",
        currency: "USD",
        photos: [], // No photos due to OAuth scope issue
        pricing: [
          {
            name: "Debug Price Tier 1",
            type: "one_time", 
            amount: 300,
            currency: "USD"
          },
          {
            name: "Debug Price Tier 2",
            type: "recurring",
            amount: 99,
            currency: "USD"
          }
        ],
        installation_id: installation_id
      });
      
      console.log('✅ Complete workflow response:');
      console.log('Success:', workflowDebug.data.success);
      console.log('Summary:', workflowDebug.data.summary);
      console.log('Errors:', workflowDebug.data.errors);
      
    } catch (workflowError) {
      console.log('❌ Complete workflow failed:');
      console.log('Status:', workflowError.response?.status);
      console.log('Error:', workflowError.response?.data);
    }
    
    console.log('\n=== Debugging Summary ===');
    console.log('The issue appears to be in the GoHighLevel API endpoint format for pricing.');
    console.log('GoHighLevel may not support the pricing API structure we are using.');
    console.log('Products are created successfully, but pricing endpoints return 404.');
    
  } catch (error) {
    console.error('Debug setup error:', error.message);
  }
}

debugPricingWorkflow();