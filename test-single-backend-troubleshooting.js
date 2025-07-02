/**
 * Comprehensive Single Backend Troubleshooting
 * Test all aspects of the single backend implementation
 */

async function testSingleBackendTroubleshooting() {
  console.log('🔧 COMPREHENSIVE SINGLE BACKEND TROUBLESHOOTING');
  console.log('Testing all aspects of single backend implementation');
  console.log('='.repeat(70));
  
  // Step 1: Test backend health
  console.log('\n1️⃣ Testing Backend Health');
  await testBackendHealth();
  
  // Step 2: Test OAuth installation retrieval
  console.log('\n2️⃣ Testing OAuth Installation Retrieval');
  const installationData = await testOAuthInstallation();
  
  if (!installationData.success) {
    console.log('❌ Cannot proceed without OAuth installation data');
    return;
  }
  
  // Step 3: Test token access
  console.log('\n3️⃣ Testing Token Access');
  const tokenData = await testTokenAccess(installationData.installationId);
  
  if (!tokenData.success) {
    console.log('❌ Cannot proceed without valid token');
    return;
  }
  
  // Step 4: Test direct API endpoints
  console.log('\n4️⃣ Testing Direct API Endpoints');
  await testDirectAPIEndpoints(tokenData.accessToken);
  
  // Step 5: Test single backend API routes
  console.log('\n5️⃣ Testing Single Backend API Routes');
  await testSingleBackendRoutes(installationData.installationId);
  
  // Step 6: Compare with working reference
  console.log('\n6️⃣ Compare with Working Reference');
  await compareWithWorkingReference(tokenData.accessToken);
  
  console.log('\n📊 TROUBLESHOOTING COMPLETE');
  console.log('Check results above for any differences or issues');
}

async function testBackendHealth() {
  console.log('  Testing: https://dir.engageautomations.com/');
  
  try {
    const response = await fetch('https://dir.engageautomations.com/');
    console.log(`  Status: ${response.status}`);
    
    if (response.ok) {
      console.log('  ✅ Backend is responding');
    } else {
      console.log('  ❌ Backend health check failed');
    }
  } catch (error) {
    console.log('  ❌ Backend unreachable:', error.message);
  }
}

async function testOAuthInstallation() {
  console.log('  Testing: /installations endpoint');
  
  try {
    const response = await fetch('https://dir.engageautomations.com/installations');
    const data = await response.json();
    
    console.log(`  Status: ${response.status}`);
    console.log('  Response:', JSON.stringify(data, null, 2));
    
    if (data.installations && data.installations.length > 0) {
      const installation = data.installations[0];
      console.log('  ✅ Installation found:', installation.id);
      return { success: true, installationId: installation.id, installation };
    } else {
      console.log('  ❌ No installations found');
      return { success: false };
    }
  } catch (error) {
    console.log('  ❌ Failed to get installations:', error.message);
    return { success: false };
  }
}

async function testTokenAccess(installationId) {
  console.log(`  Testing: /api/token-access/${installationId}`);
  
  try {
    const response = await fetch(`https://dir.engageautomations.com/api/token-access/${installationId}`);
    const data = await response.json();
    
    console.log(`  Status: ${response.status}`);
    
    if (response.ok && data.access_token) {
      console.log('  ✅ Token retrieved successfully');
      console.log('  Token:', data.access_token.substring(0, 50) + '...');
      return { success: true, accessToken: data.access_token };
    } else {
      console.log('  ❌ Failed to get token');
      console.log('  Response:', JSON.stringify(data, null, 2));
      return { success: false };
    }
  } catch (error) {
    console.log('  ❌ Token access failed:', error.message);
    return { success: false };
  }
}

async function testDirectAPIEndpoints(accessToken) {
  console.log('  Testing direct GoHighLevel API endpoints...');
  
  // Test 1: Basic product creation
  console.log('\n  🧪 Test 1: Minimal Product Creation');
  const minimalProduct = {
    locationId: "SGtYHkPbOl2WJV08GOpg",
    name: "Single Backend Test Product",
    description: "Testing from single backend"
  };
  
  await testDirectProductCreation(accessToken, minimalProduct, 'Minimal Product');
  
  // Test 2: Product with type
  console.log('\n  🧪 Test 2: Product with Type');
  const productWithType = {
    locationId: "SGtYHkPbOl2WJV08GOpg",
    name: "Single Backend Test Product",
    description: "Testing from single backend",
    type: "COURSE"
  };
  
  await testDirectProductCreation(accessToken, productWithType, 'Product with Type');
  
  // Test 3: Full product structure
  console.log('\n  🧪 Test 3: Full Product Structure');
  const fullProduct = {
    locationId: "SGtYHkPbOl2WJV08GOpg",
    name: "Single Backend Test Product",
    description: "Testing from single backend",
    type: "COURSE",
    productType: "DIGITAL",
    medias: [],
    variants: [],
    collections: [],
    taxes: [],
    seo: {
      title: "",
      description: "",
      keywords: ""
    },
    visibility: {
      hidden: false,
      hideFromStoreFront: false
    },
    sharable: true,
    trackQuantity: false,
    allowOutOfStockPurchases: true,
    availableInStore: true
  };
  
  await testDirectProductCreation(accessToken, fullProduct, 'Full Structure');
}

async function testDirectProductCreation(accessToken, productData, testName) {
  console.log(`    Testing: ${testName}`);
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    console.log(`    Status: ${response.status}`);
    if (response.ok) {
      console.log('    ✅ SUCCESS!');
      console.log('    Product ID:', result.id || result._id);
    } else {
      console.log('    ❌ FAILED');
      console.log('    Error:', result.message || result.error);
    }
  } catch (error) {
    console.log('    ❌ REQUEST ERROR');
    console.log('    Error:', error.message);
  }
}

async function testSingleBackendRoutes(installationId) {
  console.log('  Testing single backend API routes...');
  
  // Test 1: Product creation via single backend
  console.log('\n  🧪 Test 1: Product Creation Route');
  await testSingleBackendProductCreation(installationId);
  
  // Test 2: Media upload route
  console.log('\n  🧪 Test 2: Media Upload Route');
  await testSingleBackendMediaUpload(installationId);
  
  // Test 3: Product listing route
  console.log('\n  🧪 Test 3: Product Listing Route');
  await testSingleBackendProductListing(installationId);
}

async function testSingleBackendProductCreation(installationId) {
  console.log('    Testing: /api/products/create');
  
  const productData = {
    installation_id: installationId,
    name: "Single Backend Route Test",
    description: "Testing via single backend route",
    type: "COURSE"
  };
  
  try {
    const response = await fetch('https://dir.engageautomations.com/api/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    console.log(`    Status: ${response.status}`);
    if (response.ok) {
      console.log('    ✅ SUCCESS via single backend route!');
      console.log('    Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('    ❌ FAILED via single backend route');
      console.log('    Error:', result.message || result.error);
      console.log('    Details:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('    ❌ ROUTE REQUEST ERROR');
    console.log('    Error:', error.message);
  }
}

async function testSingleBackendMediaUpload(installationId) {
  console.log('    Testing: /api/images/upload');
  console.log('    Note: Skipping file upload test - endpoint structure check only');
  
  try {
    const response = await fetch('https://dir.engageautomations.com/api/images/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ installation_id: installationId })
    });
    
    const result = await response.json();
    console.log(`    Status: ${response.status}`);
    console.log('    Response indicates endpoint exists:', response.status !== 404);
  } catch (error) {
    console.log('    Endpoint test completed');
  }
}

async function testSingleBackendProductListing(installationId) {
  console.log('    Testing: /api/products');
  
  try {
    const response = await fetch(`https://dir.engageautomations.com/api/products?installation_id=${installationId}`);
    const result = await response.json();
    
    console.log(`    Status: ${response.status}`);
    if (response.ok) {
      console.log('    ✅ Products listing successful');
      console.log('    Products count:', result.products ? result.products.length : 'N/A');
    } else {
      console.log('    ❌ Products listing failed');
      console.log('    Error:', result.message || result.error);
    }
  } catch (error) {
    console.log('    ❌ LISTING REQUEST ERROR');
    console.log('    Error:', error.message);
  }
}

async function compareWithWorkingReference(accessToken) {
  console.log('  Comparing with July 1, 2025 working implementation...');
  
  // Test the exact same request that was working
  console.log('\n  🔍 Testing Exact Working Request Format');
  
  const workingProductData = {
    name: "Car Detailing Service",
    locationId: "SGtYHkPbOl2WJV08GOpg", 
    description: "Professional car detailing service",
    productType: "DIGITAL",
    availableInStore: true,
    seo: {
      title: "Car Detailing",
      description: "Professional detailing"
    }
  };
  
  console.log('  Request identical to July 1, 2025 working version:');
  console.log('  Product Data:', JSON.stringify(workingProductData, null, 2));
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workingProductData)
    });
    
    const result = await response.json();
    
    console.log(`  Status: ${response.status}`);
    console.log('  Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log('  ✅ WORKING! Same as July 1, 2025');
    } else if (response.status === 403) {
      console.log('  ❌ 403 CONFIRMED - API access restriction since July 1');
    } else {
      console.log('  ⚠️ Different error than expected');
    }
  } catch (error) {
    console.log('  ❌ REQUEST ERROR');
    console.log('  Error:', error.message);
  }
  
  console.log('\n  📈 Analysis:');
  console.log('  - If 200/201: API access restored');
  console.log('  - If 403: Confirms API restriction since July 1');
  console.log('  - If 401: Token/authentication issue');
  console.log('  - If other: New issue to investigate');
}

// Run comprehensive troubleshooting
testSingleBackendTroubleshooting().catch(console.error);