/**
 * Fetch Installation Data from Railway Backend
 * Attempts to retrieve real OAuth installation data from production Railway instance
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';

async function fetchRailwayInstallationData() {
  console.log('Fetching installation data from Railway backend...\n');

  // Try different endpoints that might expose installation data
  const endpoints = [
    '/api/oauth/installations',
    '/api/installations',
    '/oauth/installations', 
    '/installations',
    '/debug',
    '/api/debug',
    '/status',
    '/api/status',
    '/health',
    '/api/health',
    '/info',
    '/api/info'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${RAILWAY_URL}${endpoint}`);
      const response = await fetch(`${RAILWAY_URL}${endpoint}`);
      
      if (response.status === 200) {
        const data = await response.text();
        console.log(`✅ Found data at ${endpoint}:`);
        console.log(data);
        console.log('---\n');
        
        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.installations || jsonData.installs) {
            console.log('🎉 Found installation data!');
            return jsonData;
          }
        } catch (e) {
          // Not JSON, continue
        }
      } else {
        console.log(`❌ ${response.status}: ${endpoint}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${endpoint} - ${error.message}`);
    }
  }

  console.log('\nTrying to access installation data through product API with various patterns...');
  
  // Try different installation ID patterns based on timestamps
  const now = Date.now();
  const patterns = [
    // Recent timestamps (last 10 minutes)
    ...Array.from({length: 10}, (_, i) => `install_${now - (i * 60000)}`),
    // Sequential IDs
    'install_1', 'install_2', 'install_3', 'install_4', 'install_5',
    // Environment-based
    'install_seed', 'install_default', 'install_main',
    // Timestamp variations
    `install_${Math.floor(now / 1000)}`,
    `install_${Math.floor(now / 60000)}`,
    // Try the old one plus new sequential
    'install_1750191250983', 'install_1750191250984', 'install_1750191250985'
  ];

  for (const installationId of patterns) {
    try {
      const response = await fetch(`${RAILWAY_URL}/api/ghl/products?installation_id=${installationId}&limit=1`);
      const data = await response.json();
      
      if (response.status === 200 && !data.error) {
        console.log(`✅ ACTIVE INSTALLATION FOUND: ${installationId}`);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        // Test creating a product with this installation
        await testProductCreation(installationId);
        return installationId;
      } else if (data.error && !data.error.includes('Installation not found')) {
        console.log(`🔍 Potential: ${installationId} - ${data.error}`);
      }
    } catch (error) {
      // Silent fail for network errors
    }
  }

  return null;
}

async function testProductCreation(installationId) {
  console.log(`\nTesting product creation with ${installationId}...`);
  
  const productData = {
    installation_id: installationId,
    name: `Test Product - Fresh Install ${Date.now()}`,
    description: 'Product created after fresh OAuth installation',
    productType: 'DIGITAL',
    price: 39.99
  };

  try {
    const response = await fetch(`${RAILWAY_URL}/api/ghl/products/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    console.log(`Product Creation Status: ${response.status}`);
    if (result.success) {
      console.log('🎉 PRODUCT CREATED SUCCESSFULLY!');
      console.log(`Product ID: ${result.product?.id}`);
      console.log(`Product Name: ${result.product?.name}`);
      console.log(`Location: ${result.product?.locationId}`);
    } else {
      console.log(`❌ Product creation failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Product creation error: ${error.message}`);
    return null;
  }
}

async function storeInstallationDataLocally(installations) {
  // Store found installation data for future use
  const fs = require('fs');
  const installationData = {
    timestamp: new Date().toISOString(),
    installations: installations,
    railwayUrl: RAILWAY_URL,
    locationId: 'WAvk87RmW9rBSDJHeOpH'
  };
  
  fs.writeFileSync('.railway-installations.json', JSON.stringify(installationData, null, 2));
  console.log('📁 Installation data saved to .railway-installations.json');
}

// Execute the search
fetchRailwayInstallationData()
  .then(async (result) => {
    if (result) {
      console.log('\n🎉 Successfully found active installation!');
      await storeInstallationDataLocally(result);
    } else {
      console.log('\n💡 No active installation found. The new installation may need time to activate.');
      console.log('Try running this script again in a few minutes.');
    }
  })
  .catch(console.error);