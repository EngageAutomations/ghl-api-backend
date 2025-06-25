// OAuth Flow Test and Product Creation
const https = require('https');

async function monitorOAuthAndTest() {
  console.log('=== OAuth Flow Monitoring ===');
  
  // Check backend status every 10 seconds for 2 minutes
  for (let i = 0; i < 12; i++) {
    try {
      const status = await makeRequest('GET', 'https://dir.engageautomations.com/');
      console.log(`Check ${i + 1}/12: v${status.version}, Installs: ${status.installs}, Auth: ${status.authenticated}`);
      
      if (status.authenticated > 0) {
        console.log('\n✓ OAuth authentication detected! Testing product creation...');
        
        // Test complete workflow
        const productData = {
          name: "Premium Digital Marketing Course",
          description: "Complete digital marketing course covering SEO, social media, email marketing, and paid advertising strategies. Includes video lessons, templates, and lifetime access.",
          type: "DIGITAL",
          currency: "USD",
          sku: "DMC-PREM-001"
        };
        
        const productResult = await makeRequest('POST', 'https://dir.engageautomations.com/api/products/create', productData);
        
        if (productResult.success) {
          console.log('✓ Product created:', productResult.product.name);
          console.log('✓ Product ID:', productResult.product.id);
          
          // Test image upload
          const imageResult = await makeRequest('POST', 'https://dir.engageautomations.com/api/images/upload', {
            filename: 'digital-marketing-course.png'
          });
          
          if (imageResult.success) {
            console.log('✓ Image uploaded:', imageResult.file.url);
          }
          
          // Test price creation
          const priceResult = await makeRequest('POST', `https://dir.engageautomations.com/api/products/${productResult.product.id}/prices`, {
            name: "Premium Course Price",
            type: "one_time",
            amount: 99700,
            currency: "USD"
          });
          
          if (priceResult.success) {
            console.log('✓ Price created: $997');
          }
          
          console.log('\n=== COMPLETE WORKFLOW SUCCESS ===');
          return true;
        } else {
          console.log('✗ Product creation failed:', productResult.error);
        }
        
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
    } catch (error) {
      console.log(`Check ${i + 1}/12: Error -`, error.message);
    }
  }
  
  console.log('\nMonitoring complete. OAuth installation may need to be retried.');
  return false;
}

function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: method,
      headers: { 'Accept': 'application/json' }
    };
    
    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ success: false, message: responseData });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

monitorOAuthAndTest();