#!/usr/bin/env node

// Direct OAuth token exchange test to identify the exact failure point
import fetch from 'node-fetch';

const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
const TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';

console.log('=== OAuth Token Exchange Test ===');
console.log('Client ID:', GHL_CLIENT_ID ? 'configured' : 'MISSING');
console.log('Client Secret:', GHL_CLIENT_SECRET ? 'configured' : 'MISSING');
console.log('Redirect URI:', REDIRECT_URI);
console.log('Token URL:', TOKEN_URL);

// Use a test authorization code (this should fail with specific error)
const TEST_CODE = 'test_authorization_code_for_debugging';

async function testTokenExchange() {
  try {
    console.log('\n=== Making Token Exchange Request ===');
    
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: GHL_CLIENT_ID,
      client_secret: GHL_CLIENT_SECRET,
      code: TEST_CODE,
      redirect_uri: REDIRECT_URI,
    });
    
    console.log('Request body:', Object.fromEntries(requestBody.entries()));
    
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: requestBody,
    });

    console.log('\n=== Response Details ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (!response.ok) {
      console.log('\n=== Expected Error Analysis ===');
      console.log('This error is expected since we used a test code.');
      console.log('The important part is that we can reach GoHighLevel servers.');
      
      // Try to parse as JSON for structured error
      try {
        const errorData = JSON.parse(responseText);
        console.log('Structured Error:', errorData);
      } catch {
        console.log('Raw Error Response:', responseText);
      }
    } else {
      console.log('Unexpected success with test code!');
    }

  } catch (error) {
    console.error('\n=== Network or Configuration Error ===');
    console.error('Error:', error.message);
    console.error('This indicates a more fundamental issue with the OAuth configuration.');
  }
}

testTokenExchange();