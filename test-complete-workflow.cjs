const axios = require('axios');
const fs = require('fs');

async function testCompleteWorkflow() {
  try {
    console.log('=== Testing Complete Product Workflow ===');
    
    // Get the latest installation
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[1]; // Use newest installation
    
    console.log('Using installation:', installation.id);
    console.log('Location:', installation.locationId);
    
    // Test 1: Complete workflow with photos and pricing
    console.log('\n--- Test 1: Complete Workflow ---');
    
    const workflowData = {
      name: "Complete Workflow Test Product " + Date.now(),
      description: "Testing full workflow: photos → product → pricing",
      productType: "PHYSICAL",
      sku: "WORKFLOW-" + Date.now(),
      currency: "USD",
      photos: [
        // Note: In real usage, these would be actual photo files
        // For testing, we'll simulate the photo upload process
      ],
      pricing: [
        {
          name: "Basic Plan",
          type: "one_time",
          amount: 29.99,
          currency: "USD"
        },
        {
          name: "Premium Plan", 
          type: "one_time",
          amount: 49.99,
          currency: "USD"
        },
        {
          name: "Monthly Subscription",
          type: "recurring",
          amount: 9.99,
          currency: "USD"
        }
      ],
      installation_id: installation.id
    };
    
    console.log('Workflow data:', JSON.stringify(workflowData, null, 2));
    
    try {
      const workflowResponse = await axios.post('https://dir.engageautomations.com/api/workflow/complete-product', workflowData, {
        timeout: 60000 // Extended timeout for complete workflow
      });
      
      console.log('✅ Complete workflow SUCCESS!');
      console.log('Summary:', JSON.stringify(workflowResponse.data.summary, null, 2));
      console.log('Product ID:', workflowResponse.data.summary.productId);
      console.log('Photos uploaded:', workflowResponse.data.summary.photosUploaded);
      console.log('Prices created:', workflowResponse.data.summary.pricesCreated);
      
    } catch (workflowError) {
      console.log('❌ Complete workflow failed');
      console.log('Status:', workflowError.response?.status);
      console.log('Error:', JSON.stringify(workflowError.response?.data, null, 2));
    }
    
    // Test 2: Step-by-step approach
    console.log('\n--- Test 2: Step-by-Step Approach ---');
    
    // Step 2a: Create product first
    console.log('Step 2a: Creating product...');
    try {
      const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', {
        name: "Step-by-Step Test " + Date.now(),
        description: "Testing individual steps",
        productType: "PHYSICAL", 
        sku: "STEP-" + Date.now(),
        installation_id: installation.id
      });
      
      console.log('✅ Product created:', productResponse.data.product?.id);
      const productId = productResponse.data.product?.id;
      
      if (productId) {
        // Step 2b: Add pricing
        console.log('Step 2b: Adding pricing...');
        
        const priceResponse = await axios.post(`https://dir.engageautomations.com/api/products/${productId}/prices`, {
          name: "Standard Price",
          type: "one_time", 
          amount: 39.99,
          currency: "USD",
          installation_id: installation.id
        });
        
        console.log('✅ Price added:', priceResponse.data.price?.id);
      }
      
    } catch (stepError) {
      console.log('❌ Step-by-step failed');
      console.log('Status:', stepError.response?.status);
      console.log('Error:', JSON.stringify(stepError.response?.data, null, 2));
    }
    
    // Test 3: List existing products to verify
    console.log('\n--- Test 3: Verification ---');
    
    try {
      const listResponse = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation.id}`);
      
      console.log('✅ Product listing works');
      console.log('Total products:', listResponse.data.count);
      
      // Show latest products
      if (listResponse.data.products && listResponse.data.products.length > 0) {
        const latestProducts = listResponse.data.products.slice(0, 3);
        console.log('Latest products:');
        latestProducts.forEach(product => {
          console.log(`- ${product.name} (${product._id})`);
        });
      }
      
    } catch (listError) {
      console.log('❌ Product listing failed');
      console.log('Error:', JSON.stringify(listError.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

testCompleteWorkflow();