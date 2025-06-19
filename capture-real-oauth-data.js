/**
 * Capture Real OAuth Installation Data
 * Helps retrieve and store actual GoHighLevel account data for testing
 */

import pkg from 'pg';
const { Pool } = pkg;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function captureRealOAuthData() {
  log('\n🔐 Real OAuth Data Capture for GoHighLevel', colors.bright);
  log('================================================', colors.cyan);

  // Check for required environment variables
  const accessToken = process.env.GHL_ACCESS_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  
  if (!accessToken || !locationId) {
    log('\n❌ Missing Required Credentials', colors.red);
    log('Please provide the following environment variables:', colors.yellow);
    log('- GHL_ACCESS_TOKEN: Your GoHighLevel access token', colors.yellow);
    log('- GHL_LOCATION_ID: Your GoHighLevel location ID', colors.yellow);
    log('\nYou can find these from your GoHighLevel app installation.', colors.cyan);
    return;
  }

  log(`\n✅ Found Credentials`, colors.green);
  log(`Access Token: ${accessToken.substring(0, 20)}...`, colors.cyan);
  log(`Location ID: ${locationId}`, colors.cyan);

  try {
    // Test API connection with real credentials
    log('\n🧪 Testing GoHighLevel API Connection...', colors.blue);
    
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const locationData = await response.json();
      log(`✅ API Connection Successful!`, colors.green);
      log(`Location Name: ${locationData.location?.name || 'Unknown'}`, colors.cyan);
      log(`Location City: ${locationData.location?.city || 'Unknown'}`, colors.cyan);
      
      // Store real data in database
      await storeRealInstallationData(accessToken, locationId, locationData);
      
    } else {
      log(`❌ API Connection Failed: ${response.status} ${response.statusText}`, colors.red);
      const errorText = await response.text();
      log(`Error Details: ${errorText}`, colors.yellow);
    }

  } catch (error) {
    log(`❌ Connection Error: ${error.message}`, colors.red);
  }
}

async function storeRealInstallationData(accessToken, locationId, locationData) {
  log('\n💾 Storing Real Installation Data...', colors.blue);
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Insert real installation data
    const installationData = {
      ghl_user_id: `real_user_${Date.now()}`,
      ghl_location_id: locationId,
      access_token: accessToken,
      refresh_token: 'real_refresh_token', // This would come from OAuth flow
      location_name: locationData.location?.name || 'Real Location',
      user_email: 'real@user.email', // This would come from OAuth flow
      user_name: 'Real User', // This would come from OAuth flow
      scopes: 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write',
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    const insertQuery = `
      INSERT INTO oauth_installations (
        ghl_user_id, ghl_location_id, access_token, refresh_token,
        location_name, user_email, user_name, scopes, token_expires_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (ghl_user_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        ghl_location_id = EXCLUDED.ghl_location_id,
        location_name = EXCLUDED.location_name,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      installationData.ghl_user_id,
      installationData.ghl_location_id,
      installationData.access_token,
      installationData.refresh_token,
      installationData.location_name,
      installationData.user_email,
      installationData.user_name,
      installationData.scopes,
      installationData.token_expires_at
    ]);

    log(`✅ Real Installation Data Stored!`, colors.green);
    log(`Installation ID: ${result.rows[0].id}`, colors.cyan);
    log(`User ID: ${result.rows[0].ghl_user_id}`, colors.cyan);
    log(`Location: ${result.rows[0].location_name}`, colors.cyan);

    await pool.end();

  } catch (error) {
    log(`❌ Database Error: ${error.message}`, colors.red);
  }
}

// Run the capture
captureRealOAuthData().catch(console.error);