/**
 * Direct Account Data Retrieval Script
 * Attempts to fetch user and location data using available authentication
 */

import fetch from 'node-fetch';

async function fetchAccountData() {
  console.log('=== ACCOUNT DATA RETRIEVAL ATTEMPT ===');
  
  // Check environment variables for tokens
  const accessToken = process.env.GHL_ACCESS_TOKEN;
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;
  
  console.log('OAuth Config Status:');
  console.log('- Client ID:', clientId ? 'Present' : 'Missing');
  console.log('- Client Secret:', clientSecret ? 'Present' : 'Missing');
  console.log('- Access Token:', accessToken ? 'Present' : 'Missing');
  
  if (!accessToken) {
    console.log('No access token available - account data cannot be retrieved');
    return {
      success: false,
      error: 'No access token available',
      message: 'User needs to complete OAuth flow to retrieve account data'
    };
  }
  
  try {
    // Attempt to fetch user information
    console.log('\n=== FETCHING USER DATA ===');
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('User Data Retrieved:');
      console.log('- User ID:', userData.id);
      console.log('- Name:', userData.name || userData.firstName + ' ' + userData.lastName);
      console.log('- Email:', userData.email);
      console.log('- Company:', userData.companyName);
      
      // Attempt to fetch locations
      console.log('\n=== FETCHING LOCATION DATA ===');
      const locationsResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      let locationData = null;
      if (locationsResponse.ok) {
        const locationsResult = await locationsResponse.json();
        if (locationsResult.locations && locationsResult.locations.length > 0) {
          locationData = locationsResult.locations[0];
          console.log('Primary Location Data:');
          console.log('- Location ID:', locationData.id);
          console.log('- Business Name:', locationData.name);
          console.log('- Address:', locationData.address);
          console.log('- City:', locationData.city);
          console.log('- State:', locationData.state);
          console.log('- Website:', locationData.website);
        }
      }
      
      return {
        success: true,
        accountData: {
          user: {
            id: userData.id,
            name: userData.name || userData.firstName + ' ' + userData.lastName,
            email: userData.email,
            company: userData.companyName
          },
          location: locationData ? {
            id: locationData.id,
            name: locationData.name,
            address: locationData.address,
            city: locationData.city,
            state: locationData.state,
            website: locationData.website
          } : null
        },
        retrievalTime: new Date().toISOString()
      };
      
    } else {
      console.log('User API call failed:', userResponse.status, userResponse.statusText);
      return {
        success: false,
        error: 'User API call failed',
        details: {
          status: userResponse.status,
          statusText: userResponse.statusText
        }
      };
    }
    
  } catch (error) {
    console.error('Account data retrieval error:', error);
    return {
      success: false,
      error: 'Account data retrieval failed',
      details: error.message
    };
  }
}

// Run the account data retrieval
fetchAccountData().then(result => {
  console.log('\n=== FINAL RESULT ===');
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('Script execution error:', error);
});