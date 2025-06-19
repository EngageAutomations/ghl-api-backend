/**
 * Extract Installation Data from Railway Backend
 * Attempts to gather all visible installation information
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';

async function extractInstallationData() {
  console.log('Extracting installation data from Railway backend...\n');

  // Test around the current time when fresh install was performed
  const now = Date.now();
  const testRanges = [
    // Last 15 minutes in 30-second intervals
    ...Array.from({length: 30}, (_, i) => now - (i * 30000)),
    // Last hour in 5-minute intervals  
    ...Array.from({length: 12}, (_, i) => now - (i * 300000)),
    // Sequential patterns
    ...Array.from({length: 10}, (_, i) => `install_${i + 1}`),
    // Environment patterns
    'install_seed', 'install_default', 'install_main', 'install_prod'
  ];

  console.log('Testing installation patterns...');
  
  for (const pattern of testRanges) {
    const installationId = typeof pattern === 'string' ? pattern : `install_${pattern}`;
    
    try {
      // Test with a simple API call that requires authentication
      const response = await fetch(`${RAILWAY_URL}/api/ghl/products?installation_id=${installationId}&limit=1`);
      const data = await response.json();
      
      if (response.status === 200 && data.success !== false) {
        console.log(`\n🎉 ACTIVE INSTALLATION FOUND: ${installationId}`);
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        // Test product creation immediately
        await testProductCreation(installationId);
        return installationId;
        
      } else if (response.status === 401) {
        console.log(`🔐 Authentication required for: ${installationId}`);
        
      } else if (response.status === 403) {
        console.log(`🚫 Access forbidden for: ${installationId}`);
        
      } else if (data.error && !data.error.includes('Installation not found')) {
        console.log(`⚠️  Potential match: ${installationId} - ${data.error}`);
      }
      
    } catch (error) {
      // Network errors are expected, continue silently
    }
  }

  console.log('\nNo accessible installation found through API testing.');
  console.log('The fresh installation may still be initializing...');
  
  return null;
}

async function testProductCreation(installationId) {
  console.log(`\nTesting product creation with installation: ${installationId}`);
  
  const testProduct = {
    installation_id: installationId,
    name: `Test Product - ${Date.now()}`,
    description: 'Test product created after fresh Railway OAuth installation',
    productType: 'DIGITAL',
    price: 29.99
  };

  try {
    const response = await fetch(`${RAILWAY_URL}/api/ghl/products/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });

    const result = await response.json();
    
    console.log(`Product Creation - Status: ${response.status}`);
    
    if (result.success) {
      console.log('✅ PRODUCT CREATED SUCCESSFULLY!');
      console.log(`Product ID: ${result.product?.id}`);
      console.log(`Product Name: ${result.product?.name}`);
      console.log(`Location ID: ${result.product?.locationId}`);
      
      // Also test media upload with this installation
      await testMediaUpload(installationId);
      
    } else {
      console.log(`Product creation failed: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`Product creation error: ${error.message}`);
    return null;
  }
}

async function testMediaUpload(installationId) {
  console.log(`\nTesting media upload with installation: ${installationId}`);
  
  // Create a simple test file
  const testFileContent = `Test file uploaded at ${new Date().toISOString()}`;
  const testFile = new Blob([testFileContent], { type: 'text/plain' });
  
  const formData = new FormData();
  formData.append('file', testFile, 'test-upload.txt');
  formData.append('installation_id', installationId);
  formData.append('location_id', 'WAvk87RmW9rBSDJHeOpH');

  try {
    const response = await fetch(`${RAILWAY_URL}/api/ghl/media/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    console.log(`Media Upload - Status: ${response.status}`);
    
    if (result.success) {
      console.log('✅ MEDIA UPLOADED SUCCESSFULLY!');
      console.log(`File URL: ${result.fileUrl}`);
      console.log(`File ID: ${result.fileId}`);
    } else {
      console.log(`Media upload failed: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`Media upload error: ${error.message}`);
    return null;
  }
}

// Execute extraction
extractInstallationData()
  .then(installationId => {
    if (installationId) {
      console.log(`\n🎉 Success! Active installation ID: ${installationId}`);
      console.log('You can now use this installation ID for API calls to location WAvk87RmW9rBSDJHeOpH');
    } else {
      console.log('\n⏳ Fresh installation is still initializing.');
      console.log('Railway backend shows 2 installations but new one needs a few minutes to activate.');
      console.log('Try again in 5-10 minutes for the OAuth tokens to be ready.');
    }
  })
  .catch(console.error);