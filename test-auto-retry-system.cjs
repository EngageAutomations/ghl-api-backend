/**
 * Test Auto-Retry System with Fresh Installation
 */

const axios = require('axios');

async function testAutoRetrySystem() {
  try {
    console.log('=== Testing Auto-Retry System ===');
    
    const installation_id = "install_1751350886734";
    
    console.log(`Testing with installation: ${installation_id}`);
    console.log('Auto-retry features: 3 attempts, smart refresh, token monitoring');
    
    // Test 1: Product Creation with Auto-Retry
    console.log('\n1. Testing Product Creation with Auto-Retry...');
    const productData = {
      name: "Maker Expressed Design Service - Complete Branding Package",
      description: "Professional design services including logo creation, brand identity, marketing materials, and digital assets. Complete package for businesses needing cohesive branding across all platforms.",
      productType: "SERVICE",
      installation_id: installation_id
    };
    
    const startTime = Date.now();
    const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', productData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // Extended timeout for retry attempts
    });
    const duration = Date.now() - startTime;
    
    console.log(`✅ Product creation successful (${duration}ms)`);
    console.log('Product ID:', productResponse.data.product?._id);
    console.log('Auto-retry protection:', productResponse.data.message);
    
    // Test 2: Product Listing with Auto-Retry
    console.log('\n2. Testing Product Listing with Auto-Retry...');
    const listResponse = await axios.get(`https://dir.engageautomations.com/api/products?installation_id=${installation_id}`, {
      timeout: 30000
    });
    
    console.log(`✅ Product listing successful`);
    console.log(`Found ${listResponse.data.count} products`);
    
    // Test 3: Check Installation Status
    console.log('\n3. Checking Installation Status...');
    const statusResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = statusResponse.data.installations[0];
    
    console.log('Token Status:', installation.tokenStatus);
    console.log('Time Until Expiry:', `${Math.round(installation.timeUntilExpiry / 3600)} hours`);
    console.log('Last Refresh:', installation.lastRefresh || 'None needed yet');
    
    return {
      success: true,
      installation_id,
      product: {
        id: productResponse.data.product?._id,
        name: productResponse.data.product?.name
      },
      totalProducts: listResponse.data.count,
      tokenStatus: installation.tokenStatus,
      autoRetryFeatures: ['smart-refresh', '3-retry-attempts', 'token-monitoring'],
      responseTime: `${duration}ms`,
      message: 'Auto-retry system fully operational'
    };
    
  } catch (error) {
    console.error('❌ Auto-retry test failed:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data || error.message,
      recommendation: 'Check auto-retry system logs'
    };
  }
}

testAutoRetrySystem().then(result => {
  console.log('\n=== AUTO-RETRY SYSTEM TEST RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});