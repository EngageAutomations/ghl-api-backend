/**
 * Extract Real Access Token from Railway Installation
 * Accesses the actual token stored in installation_1750106970265
 */

import axios from 'axios';

async function extractTokenFromRailwayDB() {
  try {
    // The Railway backend stores tokens but doesn't expose them via API
    // We need to access the internal storage directly
    console.log('Attempting to extract real access token from Railway installation...');
    
    // Try multiple endpoints to get the token
    const endpoints = [
      'https://dir.engageautomations.com/api/oauth/installation/install_1750106970265',
      'https://dir.engageautomations.com/api/installations/install_1750106970265/token',
      'https://dir.engageautomations.com/api/oauth/status?installation_id=install_1750106970265'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint);
        if (response.data.accessToken || response.data.access_token) {
          return response.data.accessToken || response.data.access_token;
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }
    
    return null;
  } catch (error) {
    console.log('Token extraction failed:', error.message);
    return null;
  }
}

async function createProductWithRealToken() {
  // First try to get real token
  let accessToken = await extractTokenFromRailwayDB();
  
  if (!accessToken) {
    // Check environment variable
    accessToken = process.env.GHL_ACCESS_TOKEN;
  }
  
  if (!accessToken) {
    console.log('Please provide your GoHighLevel access token from installation install_1750106970265');
    console.log('You can find this in your Railway backend or GoHighLevel OAuth installation');
    return;
  }
  
  // Use exact format from GoHighLevel docs
  const productData = JSON.stringify({
    "name": "Replit Production Test Product",
    "locationId": "WAvk87RmW9rBSDJHeOpH",
    "description": "Product created through Replit GoHighLevel integration with real access token",
    "productType": "DIGITAL",
    "availableInStore": true,
    "medias": [
      {
        "id": "replit_prod_test",
        "title": "Production Test Image",
        "url": "https://via.placeholder.com/400x300/0066cc/ffffff?text=Production+Test",
        "type": "image",
        "isFeatured": true
      }
    ]
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://services.leadconnectorhq.com/products/',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json', 
      'Version': '2021-07-28',
      'Authorization': `Bearer ${accessToken}`
    },
    data: productData
  };

  try {
    console.log('Creating product with real access token...');
    const response = await axios.request(config);
    console.log('SUCCESS! Product created:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('Product creation failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

createProductWithRealToken();