/**
 * Test Real GoHighLevel API Access
 * Uses actual credentials to test API functionality
 */

import { Pool } from '@neondatabase/serverless';

async function testRealAPIAccess() {
  console.log('\n🔐 Testing Real GoHighLevel API Access');
  console.log('====================================');

  // Check for manually provided credentials
  const accessToken = process.env.GHL_ACCESS_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  
  if (accessToken && locationId) {
    console.log('✅ Manual credentials found');
    await testAPIWithCredentials(accessToken, locationId);
    return;
  }

  console.log('❌ No manual credentials provided');
  console.log('Since your installation data is on Railway backend,');
  console.log('please provide your access token and location ID manually.');
  
  console.log('\n📋 Required Environment Variables:');
  console.log('- GHL_ACCESS_TOKEN: Your GoHighLevel access token');
  console.log('- GHL_LOCATION_ID: Your GoHighLevel location ID');
}

async function testAPIWithCredentials(accessToken, locationId) {
  console.log('\n🧪 Testing API Connection...');
  
  try {
    // Test location API first
    const locationResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      console.log('✅ Location API Test Successful');
      console.log(`Location Name: ${locationData.location?.name}`);
      console.log(`Location City: ${locationData.location?.city}`);
      
      // Store credentials in database for future use
      await storeCredentialsInDatabase(accessToken, locationId, locationData.location);
      
      // Test media upload API
      await testMediaUploadAPI(accessToken, locationId);
      
    } else {
      const errorText = await locationResponse.text();
      console.log(`❌ Location API Failed: ${locationResponse.status}`);
      console.log(`Error: ${errorText}`);
    }

  } catch (error) {
    console.log(`❌ API Test Error: ${error.message}`);
  }
}

async function storeCredentialsInDatabase(accessToken, locationId, locationData) {
  console.log('\n💾 Storing credentials in database...');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const installationData = {
      ghl_user_id: `manual_user_${Date.now()}`,
      ghl_user_email: 'manual@installation.com',
      ghl_user_name: 'Manual Installation',
      ghl_location_id: locationId,
      ghl_location_name: locationData?.name || 'Unknown Location',
      ghl_access_token: accessToken,
      ghl_refresh_token: 'manual_refresh_token',
      ghl_token_type: 'Bearer',
      ghl_expires_in: 3600,
      ghl_scopes: 'products/prices.write products/prices.readonly medias.write medias.readonly locations.readonly',
      installation_date: new Date(),
      last_token_refresh: new Date(),
      is_active: true
    };

    const insertQuery = `
      INSERT INTO oauth_installations (
        ghl_user_id, ghl_user_email, ghl_user_name, ghl_user_phone, ghl_user_company,
        ghl_location_id, ghl_location_name, ghl_location_business_type, ghl_location_address,
        ghl_access_token, ghl_refresh_token, ghl_token_type, ghl_expires_in, ghl_scopes,
        installation_date, last_token_refresh, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (ghl_user_id) DO UPDATE SET
        ghl_access_token = EXCLUDED.ghl_access_token,
        ghl_location_id = EXCLUDED.ghl_location_id,
        ghl_location_name = EXCLUDED.ghl_location_name,
        last_token_refresh = EXCLUDED.last_token_refresh
      RETURNING id, ghl_user_id, ghl_location_id;
    `;

    const result = await pool.query(insertQuery, [
      installationData.ghl_user_id,
      installationData.ghl_user_email,
      installationData.ghl_user_name,
      null, // phone
      null, // company
      installationData.ghl_location_id,
      installationData.ghl_location_name,
      null, // business_type
      null, // address
      installationData.ghl_access_token,
      installationData.ghl_refresh_token,
      installationData.ghl_token_type,
      installationData.ghl_expires_in,
      installationData.ghl_scopes,
      installationData.installation_date,
      installationData.last_token_refresh,
      installationData.is_active
    ]);

    console.log('✅ Credentials stored in database');
    console.log(`Installation ID: ${result.rows[0].id}`);
    
    await pool.end();

  } catch (error) {
    console.log(`❌ Database Error: ${error.message}`);
  }
}

async function testMediaUploadAPI(accessToken, locationId) {
  console.log('\n📸 Testing Media Upload API...');
  
  try {
    // Test media list endpoint first
    const mediaResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/medias`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      console.log('✅ Media API Test Successful');
      console.log(`Total media files: ${mediaData.medias?.length || 0}`);
      
      if (mediaData.medias && mediaData.medias.length > 0) {
        console.log('📁 Recent media files:');
        mediaData.medias.slice(0, 3).forEach((media, i) => {
          console.log(`${i + 1}. ${media.name} (${media.type})`);
        });
      }
      
    } else {
      const errorText = await mediaResponse.text();
      console.log(`❌ Media API Failed: ${mediaResponse.status}`);
      console.log(`Error: ${errorText}`);
    }

  } catch (error) {
    console.log(`❌ Media API Test Error: ${error.message}`);
  }
}

// Run the test
testRealAPIAccess().catch(console.error);