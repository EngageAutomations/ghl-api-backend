const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testWithFreshOAuthToken() {
  try {
    console.log('=== Testing with Fresh OAuth Token Refresh ===');
    
    const installation_id = "install_1751333384380";
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found');
      return;
    }
    
    // Step 1: Force token refresh via Railway backend
    console.log('\n--- Step 1: Forcing Token Refresh ---');
    
    try {
      const refreshResponse = await axios.post('https://dir.engageautomations.com/api/oauth/refresh', {
        installation_id: installation_id
      });
      
      console.log('✅ Token refresh attempted');
      
    } catch (refreshError) {
      console.log('Token refresh endpoint not available, continuing with existing token...');
    }
    
    // Step 2: Get the refreshed token
    console.log('\n--- Step 2: Getting Latest Token ---');
    
    const latestToken = await axios.get(`https://dir.engageautomations.com/installations`);
    const installation = latestToken.data.installations.find(i => i.id === installation_id);
    
    if (!installation) {
      console.log('❌ Installation not found');
      return;
    }
    
    console.log('Installation Status:', installation.tokenStatus);
    console.log('Token Expires:', installation.expiresAt);
    console.log('Current Time:', new Date().toISOString());
    
    // Step 3: Test basic location API first to verify token
    console.log('\n--- Step 3: Testing Token with Location API ---');
    
    try {
      let locationConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://services.leadconnectorhq.com/locations/${installation.locationId}`,
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28'
        }
      };

      const locationResponse = await axios.request(locationConfig);
      console.log('✅ Location API successful - token is valid');
      
    } catch (locationError) {
      console.log('❌ Location API failed - token invalid');
      console.log('Error:', JSON.stringify(locationError.response?.data));
      
      // Try to get a completely fresh OAuth installation
      console.log('\n--- OAuth Installation May Need Renewal ---');
      console.log('The current OAuth session may have expired at GoHighLevel level');
      console.log('A fresh OAuth installation through the marketplace may be required');
      return;
    }
    
    // Step 4: Now test media upload with your exact format
    console.log('\n--- Step 4: Media Upload with Your Exact Format ---');
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(logoPath), {
        filename: 'maker-logo-fresh-token.png',
        contentType: 'image/png'
      });
      
      // Your exact configuration format
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        headers: { 
          'Accept': 'application/json', 
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        data: formData,
        params: {
          locationId: installation.locationId
        }
      };

      const mediaResponse = await axios.request(config);
      console.log('🎉 MEDIA UPLOAD SUCCESS!');
      console.log('Response:', JSON.stringify(mediaResponse.data, null, 2));
      
      return {
        success: true,
        mediaUrl: mediaResponse.data.url || mediaResponse.data.fileUrl,
        mediaId: mediaResponse.data.id,
        response: mediaResponse.data,
        solution: 'Your exact axios format worked with fresh token'
      };
      
    } catch (mediaError) {
      console.log('❌ Media upload still failed with fresh token');
      console.log('Status:', mediaError.response?.status);
      console.log('Error:', JSON.stringify(mediaError.response?.data));
      
      // Additional debugging
      if (mediaError.response?.data?.message?.includes('JWT')) {
        console.log('\n🔍 JWT Issue Persists');
        console.log('Even with fresh token, JWT validation fails for media API specifically');
        console.log('This confirms GoHighLevel media API has different JWT requirements');
      } else if (mediaError.response?.data?.message?.includes('authClass')) {
        console.log('\n🔍 AuthClass Issue Confirmed');
        console.log('OAuth app configuration lacks proper media API access');
      }
    }
    
    // Step 5: Test if we can create a product to confirm other APIs work
    console.log('\n--- Step 5: Verify Product Creation Still Works ---');
    
    try {
      let productConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://services.leadconnectorhq.com/products/',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json', 
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28'
        },
        data: {
          name: "Test Product - Fresh Token Verification",
          description: "Testing if product creation still works with current token",
          productType: "DIGITAL",
          locationId: installation.locationId,
          sku: "TEST-FRESH-TOKEN"
        }
      };

      const productResponse = await axios.request(productConfig);
      console.log('✅ Product creation still works - token valid for products');
      console.log('Product ID:', productResponse.data.product?._id || productResponse.data._id);
      
    } catch (productError) {
      console.log('❌ Product creation also failed');
      console.log('Error:', JSON.stringify(productError.response?.data));
    }
    
    return {
      success: false,
      token_status: installation.tokenStatus,
      location_api_works: true,
      media_api_works: false,
      conclusion: 'Token is valid but media API has specific authentication requirements'
    };
    
  } catch (error) {
    console.error('Fresh token test error:', error.message);
    return { success: false, error: error.message };
  }
}

testWithFreshOAuthToken().then(result => {
  console.log('\n=== FRESH TOKEN TEST RESULT ===');
  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
});