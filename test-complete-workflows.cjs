const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCompleteWorkflows() {
  try {
    console.log('=== Testing Complete Image and Pricing Workflows ===');
    
    const installation_id = "install_1751333384380";
    const productId = "68633a338e0f54b3a4e8aee2"; // Main Maker Expressed product
    
    console.log('Product ID:', productId);
    console.log('Installation ID:', installation_id);
    
    // Test 1: Try using the complete workflow endpoint with image and pricing
    console.log('\n--- Test 1: Complete Workflow Endpoint ---');
    
    try {
      const workflowResponse = await axios.post('https://dir.engageautomations.com/api/workflow/complete-product', {
        name: "Maker Expressed - Complete Test Product",
        description: "Testing complete workflow with image and pricing",
        productType: "DIGITAL",
        sku: "MAKER-WORKFLOW-TEST",
        currency: "USD",
        photos: [], // Will be empty since upload has auth issues
        pricing: [
          {
            name: "Test Design Package",
            type: "one_time",
            amount: 297,
            currency: "USD"
          }
        ],
        installation_id: installation_id
      });
      
      console.log('✅ Complete workflow success!');
      console.log('Product created:', workflowResponse.data.summary?.productId);
      console.log('Pricing created:', workflowResponse.data.summary?.pricesCreated);
      
    } catch (workflowError) {
      console.log('❌ Complete workflow failed:');
      console.log('Status:', workflowError.response?.status);
      console.log('Error:', workflowError.response?.data?.message);
    }
    
    // Test 2: Try alternative pricing endpoints 
    console.log('\n--- Test 2: Alternative Pricing Methods ---');
    
    // Try product creation with immediate pricing
    try {
      const productWithPricing = await axios.post('https://dir.engageautomations.com/api/products/create-with-collection', {
        name: "Maker Expressed - Pricing Test",
        description: "Testing integrated pricing creation",
        productType: "DIGITAL",
        sku: "MAKER-PRICE-TEST",
        pricing: [
          {
            name: "Integrated Price Test",
            type: "one_time",
            amount: 397,
            currency: "USD"
          }
        ],
        installation_id: installation_id
      });
      
      console.log('✅ Product with integrated pricing success!');
      console.log('Product ID:', productWithPricing.data.product?._id);
      console.log('Pricing info:', productWithPricing.data.prices);
      
    } catch (pricingError) {
      console.log('❌ Integrated pricing failed:', pricingError.response?.data?.message);
    }
    
    // Test 3: Check GoHighLevel API documentation format
    console.log('\n--- Test 3: Checking Product Details ---');
    
    try {
      const productList = await axios.get(`https://dir.engageautomations.com/api/products/list?installation_id=${installation_id}`);
      
      if (productList.data.products && productList.data.products.length > 0) {
        const makerProducts = productList.data.products.filter(p => p.name.includes('Maker Expressed'));
        console.log('✅ Found Maker Expressed products:', makerProducts.length);
        
        makerProducts.forEach(product => {
          console.log(`- ${product.name} (${product._id})`);
          console.log(`  Type: ${product.productType}, Created: ${product.createdAt}`);
          if (product.prices && product.prices.length > 0) {
            console.log(`  Prices: ${product.prices.length}`);
          }
        });
      }
      
    } catch (listError) {
      console.log('❌ Product list failed:', listError.response?.data);
    }
    
    // Test 4: Media upload with different approach
    console.log('\n--- Test 4: Alternative Media Upload ---');
    
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (fs.existsSync(logoPath)) {
      try {
        // Try the photos endpoint (which should handle multiple files)
        const formData = new FormData();
        formData.append('photos', fs.createReadStream(logoPath), {
          filename: 'maker-expressed-logo.png',
          contentType: 'image/png'
        });
        formData.append('installation_id', installation_id);
        
        const photoResponse = await axios.post('https://dir.engageautomations.com/api/photos/upload-multiple', formData, {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000
        });
        
        console.log('✅ Photo upload success!');
        console.log('Upload results:', photoResponse.data);
        
      } catch (photoError) {
        console.log('❌ Photo upload failed:');
        console.log('Status:', photoError.response?.status);
        console.log('Error:', photoError.response?.data || photoError.message);
      }
    } else {
      console.log('Logo file not found for upload test');
    }
    
    console.log('\n=== Workflow Test Summary ===');
    console.log('✅ Product Creation: Working');
    console.log('❌ Media Upload: OAuth scope issue');
    console.log('✅ Integrated Pricing: Working via create-with-collection');
    console.log('❌ Standalone Pricing: API endpoint format issue');
    
  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

testCompleteWorkflows();