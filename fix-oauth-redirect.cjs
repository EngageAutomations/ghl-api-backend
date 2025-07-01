/**
 * Fix OAuth Redirect Configuration
 * Process the OAuth code through the Replit application instead of Railway
 */

const axios = require('axios');

async function processOAuthCode() {
  try {
    console.log('=== Processing OAuth Code Through Replit ===');
    
    // The OAuth code you received
    const authCode = "0fe9f041619fbb3c0ced3990c63ce568c98e5082";
    
    console.log('OAuth code received:', authCode);
    console.log('Processing through Replit application...');
    
    // Send the OAuth code to your Replit application's OAuth endpoint
    const replayResponse = await axios.get(`http://localhost:5000/oauth/callback?code=${authCode}`, {
      timeout: 30000
    });
    
    console.log('✅ OAuth processed successfully through Replit');
    console.log('Response:', replayResponse.data);
    
    return {
      success: true,
      message: 'OAuth code processed through Replit application',
      data: replayResponse.data
    };
    
  } catch (error) {
    console.error('❌ OAuth processing failed:', error.response?.data || error.message);
    
    // If local processing fails, show configuration guidance
    return {
      success: false,
      error: error.message,
      guidance: {
        issue: 'OAuth redirect URL misconfiguration',
        currentRedirect: 'https://dir.engageautomations.com/oauth/callback',
        shouldBe: 'Your Replit application URL + /oauth/callback',
        solution: 'Update GoHighLevel app redirect URL to point to Replit instead of Railway'
      }
    };
  }
}

processOAuthCode().then(result => {
  console.log('\\n=== OAUTH PROCESSING RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});