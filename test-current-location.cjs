/**
 * Test Current Location ID for API Access
 * Test if WAvk87RmW9rBSDJHeOpH works for API calls
 */

const https = require('https');

async function testCurrentLocation() {
  console.log('🧪 TESTING CURRENT LOCATION ID FOR API ACCESS');
  console.log('Location ID: WAvk87RmW9rBSDJHeOpH');
  console.log('Installation: install_1751522189429');
  console.log('='.repeat(60));
  
  try {
    // Get access token from OAuth backend
    console.log('📡 Getting access token from OAuth backend...');
    
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('❌ Failed to get access token:', errorText);
      return;
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Got access token');
    console.log('📍 Token location ID:', tokenData.location_id);
    console.log('⏰ Expires at:', tokenData.expires_at);
    
    // Test API call to GoHighLevel
    console.log('\n🔥 TESTING API CALL TO GOHIGHLEVEL...');
    
    const apiResponse = await fetch(`https://services.leadconnectorhq.com/locations/${tokenData.location_id}/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 API Response Status:', apiResponse.status);
    console.log('📊 API Response Headers:', Object.fromEntries(apiResponse.headers.entries()));
    
    if (apiResponse.ok) {
      const products = await apiResponse.json();
      console.log('✅ API CALL SUCCESSFUL!');
      console.log('📦 Product count:', products.products?.length || 0);
      console.log('🎯 LOCATION ID WORKS FOR API CALLS!');
      
      if (products.products && products.products.length > 0) {
        console.log('📋 Sample products:');
        products.products.slice(0, 3).forEach((product, i) => {
          console.log(`  ${i+1}. ${product.name} - $${product.price || 'N/A'}`);
        });
      }
    } else {
      const errorText = await apiResponse.text();
      console.log('❌ API call failed:', errorText);
      
      if (apiResponse.status === 400 && errorText.includes('not found')) {
        console.log('💡 Location ID is invalid - need OAuth response extraction fix');
      } else if (apiResponse.status === 403) {
        console.log('🔒 Access forbidden - check API permissions');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrentLocation().catch(console.error);