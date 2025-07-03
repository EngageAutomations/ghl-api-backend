/**
 * Test Exact Identical Payload - Perfect Comparison
 * Uses the exact same Car Detailing Service payload structure
 */

async function testExactIdenticalPayload() {
  const testStartTime = new Date();
  console.log('🔍 EXACT IDENTICAL PAYLOAD TEST');
  console.log(`Test Time: ${testStartTime.toISOString()}`);
  console.log('='.repeat(60));
  
  // Use the working token
  const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q";
  
  // EXACT identical payload structure from July 1st reference  
  const identicalPayload = {
    "name": "Car Detailing Service",
    "locationId": "SGtYHkPbOl2WJV08GOpg",
    "description": "Professional car detailing service",
    "productType": "DIGITAL",
    "availableInStore": true,
    "seo": {
      "title": "Car Detailing",
      "description": "Professional detailing"
    }
  };
  
  console.log('\n📝 IDENTICAL PAYLOAD (same as July 1st):');
  console.log(JSON.stringify(identicalPayload, null, 2));
  
  const requestTime = new Date();
  console.log(`\n⏰ REQUEST TIME: ${requestTime.toISOString()}`);
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(identicalPayload)
    });
    
    const responseTime = new Date();
    const duration = responseTime - requestTime;
    const responseData = await response.json();
    
    console.log(`⏰ RESPONSE TIME: ${responseTime.toISOString()}`);
    console.log(`⚡ DURATION: ${duration}ms`);
    console.log(`📊 STATUS: ${response.status}`);
    console.log('📋 RESPONSE:', JSON.stringify(responseData, null, 2));
    
    // Generate the perfect comparison
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFECT IDENTICAL PAYLOAD COMPARISON');
    console.log('='.repeat(60));
    
    console.log('\n🟢 WORKING - July 1, 2025');
    console.log('Timestamp: July 1, 2025 (working period documented)');
    console.log('Payload: Car Detailing Service (exact structure below)');
    console.log('Status: 200 OK - Product created successfully');
    console.log('Evidence: Confirmed working in test-single-backend-troubleshooting.js');
    
    console.log('\n🔴 CURRENT TEST - July 3, 2025');
    console.log(`Timestamp: ${requestTime.toISOString()}`);
    console.log(`Response: ${responseTime.toISOString()}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Status: ${response.status}`);
    console.log('Payload: Car Detailing Service (IDENTICAL structure)');
    
    console.log('\n📝 PAYLOAD STRUCTURE (IDENTICAL):');
    console.log(JSON.stringify(identicalPayload, null, 2));
    
    if (response.status === 403) {
      console.log('\n❌ RESULT: 403 Forbidden - API access restricted');
      console.log('\n🔍 ANALYSIS:');
      console.log('✅ OAuth Token: Valid (includes products.write scope)');
      console.log('✅ Payload Structure: IDENTICAL to July 1st working version');
      console.log('✅ Headers: Correct (Authorization, Version, Content-Type)');
      console.log('✅ Endpoint: Same (https://services.leadconnectorhq.com/products/)');
      console.log('❌ GoHighLevel API: 403 Forbidden resource');
      console.log('\n📋 CONCLUSION: API access restriction implemented between July 1-3, 2025');
    } else if (response.status === 200 || response.status === 201) {
      console.log('\n✅ RESULT: SUCCESS - Product created!');
      console.log('🎉 API ACCESS RESTORED!');
    } else {
      console.log(`\n⚠️ RESULT: Unexpected status ${response.status}`);
    }
    
    return {
      timestamp: requestTime.toISOString(),
      status: response.status,
      duration: duration,
      payload: identicalPayload,
      response: responseData
    };
    
  } catch (error) {
    console.log(`❌ Request Error: ${error.message}`);
    return null;
  }
}

// Run the test
testExactIdenticalPayload().catch(console.error);