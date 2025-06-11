#!/usr/bin/env node

// Direct test of OAuth callback processing to identify the exact failure point
import fetch from 'node-fetch';

const TEST_CODE = 'test_auth_code_for_debugging';
const CALLBACK_URL = 'https://dir.engageautomations.com/api/oauth/callback';

console.log('=== Direct OAuth Callback Test ===');
console.log('Testing callback with code parameter...');

async function testOAuthCallback() {
  try {
    const testUrl = `${CALLBACK_URL}?code=${TEST_CODE}&state=debug_state`;
    console.log('Request URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects to see the exact response
    });

    console.log('\n=== Callback Response ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    // Check for redirect
    const location = response.headers.get('location');
    if (location) {
      console.log('\n=== Redirect Information ===');
      console.log('Redirect Location:', location);
      
      // Parse redirect URL to extract error information
      try {
        const redirectUrl = new URL(location, CALLBACK_URL);
        const errorParam = redirectUrl.searchParams.get('error');
        if (errorParam) {
          console.log('Error Parameter:', errorParam);
        }
      } catch (e) {
        console.log('Relative redirect:', location);
      }
    }

  } catch (error) {
    console.error('\n=== Request Error ===');
    console.error('Error:', error.message);
    console.error('This indicates a fundamental connectivity issue.');
  }
}

testOAuthCallback();