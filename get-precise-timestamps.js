/**
 * Get Precise Timestamps for Support Report
 * Document exact times and request details for GoHighLevel support
 */

async function getPreciseTimestamps() {
  console.log('📋 GENERATING PRECISE TIMESTAMP REPORT');
  console.log('For GoHighLevel support with exact call times and request methods');
  console.log('='.repeat(70));
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  console.log(`\n🕐 CURRENT TIME: ${now.toISOString()}`);
  console.log(`📅 DATE: ${today}`);
  
  // Test the current backend and document response times
  console.log('\n🔍 TESTING WITH PRECISE TIMESTAMPS');
  
  // Test 1: Backend health check with timestamp
  const test1Start = new Date();
  console.log(`\n1️⃣ Backend Health Check - ${test1Start.toISOString()}`);
  
  try {
    const response = await fetch('https://dir.engageautomations.com/', {
      method: 'GET',
      headers: {
        'User-Agent': 'GoHighLevel-Support-Diagnostic/1.0'
      }
    });
    
    const test1End = new Date();
    const responseTime = test1End - test1Start;
    
    console.log(`   Request Time: ${test1Start.toISOString()}`);
    console.log(`   Response Time: ${test1End.toISOString()}`);
    console.log(`   Duration: ${responseTime}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Method: GET`);
    console.log(`   Endpoint: https://dir.engageautomations.com/`);
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Token retrieval with timestamp
  const test2Start = new Date();
  console.log(`\n2️⃣ OAuth Token Retrieval - ${test2Start.toISOString()}`);
  
  try {
    const response = await fetch('https://dir.engageautomations.com/api/token-access/install_1751436979939', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GoHighLevel-Support-Diagnostic/1.0'
      }
    });
    
    const test2End = new Date();
    const responseTime = test2End - test2Start;
    const data = await response.json();
    
    console.log(`   Request Time: ${test2Start.toISOString()}`);
    console.log(`   Response Time: ${test2End.toISOString()}`);
    console.log(`   Duration: ${responseTime}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Method: GET`);
    console.log(`   Endpoint: /api/token-access/install_1751436979939`);
    console.log(`   Token Preview: ${data.access_token ? data.access_token.substring(0, 50) + '...' : 'No token'}`);
    
    if (data.access_token) {
      // Test 3: Direct GoHighLevel API call with detailed logging
      const test3Start = new Date();
      console.log(`\n3️⃣ Direct GoHighLevel API Call - ${test3Start.toISOString()}`);
      
      const productData = {
        name: `Support Test Product ${test3Start.getTime()}`,
        locationId: "SGtYHkPbOl2WJV08GOpg",
        description: "Test product for support timestamp documentation",
        productType: "DIGITAL",
        availableInStore: true
      };
      
      console.log(`   Request Payload:`, JSON.stringify(productData, null, 2));
      
      const headers = {
        'Authorization': `Bearer ${data.access_token}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'GoHighLevel-Support-Diagnostic/1.0'
      };
      
      console.log(`   Request Headers:`);
      Object.entries(headers).forEach(([key, value]) => {
        if (key === 'Authorization') {
          console.log(`     ${key}: Bearer ${value.substring(7, 50)}...`);
        } else {
          console.log(`     ${key}: ${value}`);
        }
      });
      
      try {
        const ghlResponse = await fetch('https://services.leadconnectorhq.com/products/', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(productData)
        });
        
        const test3End = new Date();
        const responseTime = test3End - test3Start;
        const ghlData = await ghlResponse.json();
        
        console.log(`   Request Time: ${test3Start.toISOString()}`);
        console.log(`   Response Time: ${test3End.toISOString()}`);
        console.log(`   Duration: ${responseTime}ms`);
        console.log(`   Status: ${ghlResponse.status}`);
        console.log(`   Method: POST`);
        console.log(`   Endpoint: https://services.leadconnectorhq.com/products/`);
        console.log(`   Response:`, JSON.stringify(ghlData, null, 2));
        
        // Test 4: Alternative endpoint with timestamp
        const test4Start = new Date();
        console.log(`\n4️⃣ Alternative Endpoint Test - ${test4Start.toISOString()}`);
        
        const altResponse = await fetch(`https://services.leadconnectorhq.com/locations/SGtYHkPbOl2WJV08GOpg/products`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(productData)
        });
        
        const test4End = new Date();
        const altResponseTime = test4End - test4Start;
        const altData = await altResponse.json();
        
        console.log(`   Request Time: ${test4Start.toISOString()}`);
        console.log(`   Response Time: ${test4End.toISOString()}`);
        console.log(`   Duration: ${altResponseTime}ms`);
        console.log(`   Status: ${altResponse.status}`);
        console.log(`   Method: POST`);
        console.log(`   Endpoint: /locations/SGtYHkPbOl2WJV08GOpg/products`);
        console.log(`   Response:`, JSON.stringify(altData, null, 2));
        
      } catch (error) {
        console.log(`   GoHighLevel API Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`   Token Retrieval Error: ${error.message}`);
  }
  
  console.log('\n📊 TIMESTAMP REPORT COMPLETE');
  console.log('All request times, response times, and exact methods documented');
  console.log('Ready for GoHighLevel support escalation with precise timing data');
}

// Generate timestamp report
getPreciseTimestamps().catch(console.error);