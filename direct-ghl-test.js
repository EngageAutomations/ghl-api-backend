import axios from 'axios';

const BACKEND_URL = 'https://dir.engageautomations.com';

async function testDirectGHLAPI() {
  console.log('=== Testing Direct GoHighLevel API ===');
  
  try {
    // Get installation data
    const installResponse = await axios.get(`${BACKEND_URL}/installations`);
    const installation = installResponse.data.installations[0];
    
    if (!installation) {
      console.log('No installation found');
      return;
    }
    
    console.log('Using installation:', installation.id);
    console.log('Location ID:', installation.locationId);
    
    // Make direct API call to GoHighLevel using the Railway backend proxy pattern
    const productData = {
      locationId: installation.locationId,
      name: "Premium Digital Marketing Course",
      description: "Complete digital marketing course with video tutorials, worksheets, and bonus materials. Learn SEO, social media marketing, email campaigns, and conversion optimization.",
      productType: "DIGITAL",
      imageUrls: [
        "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
      ]
    };
    
    // Check if backend has direct product creation endpoint
    console.log('Testing available endpoints...');
    
    // Try different endpoint patterns
    const endpoints = [
      '/api/products/create',
      '/products/create', 
      '/api/ghl/products',
      '/ghl/products/create'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await axios.post(`${BACKEND_URL}${endpoint}`, {
          installation_id: installation.id,
          ...productData
        });
        console.log(`✅ ${endpoint} works:`, response.data);
        return;
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.response?.status || error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDirectGHLAPI();