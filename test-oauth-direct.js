// Direct OAuth token exchange test
import fetch from 'node-fetch';

async function testTokenExchange() {
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;
  const redirectUri = process.env.GHL_REDIRECT_URI;
  
  console.log('=== OAUTH TEST CONFIGURATION ===');
  console.log('Client ID:', clientId ? 'present' : 'missing');
  console.log('Client Secret:', clientSecret ? 'present' : 'missing');
  console.log('Redirect URI:', redirectUri);
  console.log('================================');
  
  const testCode = 'invalid_test_code_12345';
  
  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code: testCode,
    redirect_uri: redirectUri,
  });
  
  console.log('Request body params:', Object.fromEntries(requestBody.entries()));
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: requestBody,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      console.error('=== TOKEN EXCHANGE FAILED ===');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      console.error('============================');
    } else {
      console.log('Token exchange successful');
    }
  } catch (error) {
    console.error('=== FETCH ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('==================');
  }
}

testTokenExchange().catch(console.error);