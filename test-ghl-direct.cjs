const axios = require('axios');

async function testDirectGHL() {
  try {
    // Get installation token
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    const installation = installResponse.data.installations[0];
    
    console.log('Testing direct GoHighLevel API calls...');
    console.log('Installation:', installation.id);
    console.log('Access Token:', installation.accessToken ? 'Present' : 'Missing');
    
    // Try to create product with minimal data first
    console.log('\n--- Testing minimal product creation ---');
    
    try {
      const minimalProduct = await axios.post('https://services.leadconnectorhq.com/products/', {
        name: 'Minimal Test Product',
        locationId: installation.locationId
      }, {
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Minimal product created:', minimalProduct.data);
      
    } catch (minError) {
      console.log('❌ Minimal product failed:');
      console.log('Status:', minError.response?.status);
      console.log('Error:', JSON.stringify(minError.response?.data, null, 2));
    }
    
    // Try with different productType values
    const productTypes = ['product', 'service', 'subscription', 'digital', 'physical'];
    
    for (const productType of productTypes) {
      try {
        console.log(`\n--- Testing productType: ${productType} ---`);
        
        const testProduct = await axios.post('https://services.leadconnectorhq.com/products/', {
          name: `Test Product - ${productType}`,
          description: 'Testing productType enum',
          productType: productType,
          locationId: installation.locationId
        }, {
          headers: {
            'Authorization': `Bearer ${installation.accessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ ${productType} worked:`, testProduct.data.id);
        break; // If one works, we found the format
        
      } catch (typeError) {
        console.log(`❌ ${productType} failed:`, typeError.response?.data?.message || typeError.message);
      }
    }
    
  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

testDirectGHL();
