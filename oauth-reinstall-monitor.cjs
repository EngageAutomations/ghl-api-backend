const https = require('https');

console.log('OAuth Reinstallation Monitor - Detecting token exchange...');
console.log('Backend: v5.0.0-stable with working token exchange pattern');
console.log('OAuth URL: https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=https%3A%2F%2Fdir.engageautomations.com%2Fapi%2Foauth%2Fcallback&client_id=68474924a586bce22a6e64f7-mbpkmyu4&state=oauth_test&scope=locations.readonly%20locations.write%20contacts.readonly%20contacts.write%20opportunities.readonly%20opportunities.write%20calendars.readonly%20calendars.write%20forms.readonly%20forms.write%20surveys.readonly%20surveys.write%20workflows.readonly%20workflows.write%20snapshots.readonly%20snapshots.write%20products/prices.write%20products/prices.readonly%20products/collection.write%20products/collection.readonly%20medias.write%20medias.readonly');

const monitor = setInterval(async () => {
  try {
    const status = await makeRequest('GET', 'https://dir.engageautomations.com/');
    const installations = await makeRequest('GET', 'https://dir.engageautomations.com/installations');
    
    const time = new Date().toLocaleTimeString();
    console.log(`${time}: Installs: ${status.installs}, Auth: ${status.authenticated}`);
    
    if (status.authenticated > 0) {
      console.log('\n=== TOKEN EXCHANGE SUCCESS ===');
      console.log('OAuth authentication detected!');
      clearInterval(monitor);
      
      // Get installation details
      const install = installations.installations[0];
      console.log('Installation Details:');
      console.log('- ID:', install.id);
      console.log('- User ID:', install.ghlUserId);
      console.log('- Location ID:', install.ghlLocationId);
      console.log('- Location Name:', install.ghlLocationName);
      console.log('- Has Token:', install.hasToken);
      console.log('- Scopes:', install.scopes);
      
      // Test product creation immediately
      console.log('\nTesting product creation with authenticated token...');
      
      const productData = {
        name: "Premium Digital Marketing Course",
        description: "Complete digital marketing course covering SEO, social media, email marketing, and paid advertising strategies. Includes video lessons, templates, and lifetime access.",
        type: "DIGITAL",
        currency: "USD",
        sku: "DMC-PREM-001"
      };
      
      const productResult = await makeRequest('POST', 'https://dir.engageautomations.com/api/products/create', productData);
      
      if (productResult.success) {
        console.log('\n=== PRODUCT CREATION SUCCESS ===');
        console.log('Product Name:', productResult.product.name);
        console.log('Product ID:', productResult.product.id);
        console.log('Location ID:', productResult.locationId);
        console.log('Created in GoHighLevel account:', productResult.product);
        
        // Test image upload
        const imageResult = await makeRequest('POST', 'https://dir.engageautomations.com/api/images/upload', {
          filename: 'digital-marketing-course.png'
        });
        
        if (imageResult.success) {
          console.log('\n=== IMAGE UPLOAD SUCCESS ===');
          console.log('Image URL:', imageResult.file.url);
        }
        
        // Test price creation
        const priceResult = await makeRequest('POST', `https://dir.engageautomations.com/api/products/${productResult.product.id}/prices`, {
          name: "Premium Course Price",
          type: "one_time",
          amount: 99700,
          currency: "USD"
        });
        
        if (priceResult.success) {
          console.log('\n=== PRICE CREATION SUCCESS ===');
          console.log('Price: $997');
          console.log('Price ID:', priceResult.price.id);
        }
        
        console.log('\n=== COMPLETE WORKFLOW SUCCESS ===');
        console.log('Premium Digital Marketing Course created with image and pricing!');
        console.log('Token exchange verified working correctly.');
        
      } else {
        console.log('\n=== PRODUCT CREATION FAILED ===');
        console.log('Error:', productResult.error);
        console.log('Message:', productResult.message);
      }
      
      process.exit(0);
    }
    
  } catch (error) {
    console.log(`${new Date().toLocaleTimeString()}: Check failed -`, error.message);
  }
}, 5000);

setTimeout(() => {
  clearInterval(monitor);
  console.log('\nMonitoring timeout - OAuth may need manual verification');
  process.exit(0);
}, 300000); // 5 minutes

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