/**
 * Process OAuth Code Manually
 * Handle the OAuth code you received to complete the installation
 */

const axios = require('axios');

async function processOAuthManually() {
  try {
    console.log('=== Processing OAuth Code Manually ===');
    
    // The OAuth code you received from the callback
    const authCode = "0fe9f041619fbb3c0ced3990c63ce568c98e5082";
    
    console.log('OAuth code:', authCode);
    console.log('Processing directly with GoHighLevel...');
    
    // Exchange the authorization code for access token
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID || 'your_client_id',
      client_secret: process.env.GHL_CLIENT_SECRET || 'your_client_secret',
      code: authCode,
      redirect_uri: 'https://dir.engageautomations.com/oauth/callback'
    });

    console.log('Exchanging code for tokens...');
    
    try {
      const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', tokenBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });

      console.log('✅ Token exchange successful!');
      
      const installationId = `install_${Date.now()}`;
      
      // Store the installation in Railway backend
      const installData = {
        installationId,
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        expiresIn: tokenResponse.data.expires_in,
        locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
        scopes: tokenResponse.data.scope,
        tokenStatus: 'valid'
      };
      
      console.log('Installation processed:', installationId);
      console.log('Location ID:', installData.locationId);
      console.log('Token expires in:', installData.expiresIn, 'seconds');
      
      return {
        success: true,
        installationId,
        locationId: installData.locationId,
        tokenStatus: 'valid',
        message: 'OAuth installation completed manually',
        apiReady: true
      };
      
    } catch (tokenError) {
      console.log('Token exchange failed:', tokenError.response?.data || tokenError.message);
      
      if (tokenError.response?.data?.error === 'invalid_grant') {
        return {
          success: false,
          error: 'OAuth code expired or already used',
          solution: 'Complete a fresh OAuth installation through GoHighLevel marketplace',
          nextSteps: [
            'Go to GoHighLevel marketplace',
            'Reinstall your app to get a new OAuth code',
            'The OAuth code can only be used once and expires quickly'
          ]
        };
      }
      
      throw tokenError;
    }
    
  } catch (error) {
    console.error('Manual OAuth processing failed:', error.message);
    return {
      success: false,
      error: error.message,
      guidance: 'OAuth code may be expired or already used'
    };
  }
}

processOAuthManually().then(result => {
  console.log('\n=== MANUAL OAUTH PROCESSING RESULT ===');
  console.log(JSON.stringify(result, null, 2));
});