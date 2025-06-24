const fetch = require('node-fetch');

async function refreshAccessToken(installation) {
  if (!installation.refresh_token) {
    console.error('No refresh token available for installation:', installation.id);
    return null;
  }
  
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: installation.refresh_token,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      })
    });
    
    if (response.ok) {
      const tokenData = await response.json();
      console.log('Token refreshed successfully');
      return tokenData;
    } else {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return null;
  }
}

module.exports = {
  refreshAccessToken
};