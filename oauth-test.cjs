const https = require('https');

async function testOAuth() {
  console.log('Testing OAuth workflow...');
  
  const checkInterval = setInterval(async () => {
    try {
      const status = await makeRequest('GET', 'https://dir.engageautomations.com/');
      console.log(`${new Date().toLocaleTimeString()}: v${status.version}, Auth: ${status.authenticated}`);
      
      if (status.authenticated > 0) {
        console.log('\nOAuth authentication successful! Testing product creation...');
        clearInterval(checkInterval);
        
        const productData = {
          name: "Premium Digital Marketing Course",
          description: "Complete digital marketing course covering SEO, social media, email marketing, and paid advertising strategies. Includes video lessons, templates, and lifetime access.",
          type: "DIGITAL",
          currency: "USD",
          sku: "DMC-PREM-001"
        };
        
        const productResult = await makeRequest('POST', 'https://dir.engageautomations.com/api/products/create', productData);
        
        if (productResult.success) {
          console.log('PRODUCT CREATED:', productResult.product.name);
          
          const imageResult = await makeRequest('POST', 'https://dir.engageautomations.com/api/images/upload', {
            filename: 'digital-marketing-course.png'
          });
          
          if (imageResult.success) {
            console.log('IMAGE UPLOADED:', imageResult.file.url);
          }
          
          const priceResult = await makeRequest('POST', `https://dir.engageautomations.com/api/products/${productResult.product.id}/prices`, {
            name: "Premium Course Price",
            type: "one_time",
            amount: 99700,
            currency: "USD"
          });
          
          if (priceResult.success) {
            console.log('PRICE CREATED: $997');
          }
          
          console.log('\nCOMPLETE WORKFLOW SUCCESS');
        } else {
          console.log('Product creation failed:', productResult.error);
        }
        
        process.exit(0);
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
  }, 5000);
  
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('Test timeout');
    process.exit(0);
  }, 180000);
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

testOAuth();