/**
 * Retrieve Real OAuth Credentials from Railway Backend
 * Accesses installation data with complete access tokens and location IDs
 */

import { Pool } from '@neondatabase/serverless';

async function retrieveRailwayCredentials() {
  console.log('\n🔑 Retrieving Real OAuth Credentials from Railway');
  console.log('================================================');

  try {
    // Get installation summary first
    const summaryResponse = await fetch('https://dir.engageautomations.com/api/debug/installations', {
      headers: { 'Accept': 'application/json' }
    });

    if (!summaryResponse.ok) {
      throw new Error(`Failed to get installation summary: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    console.log(`Found ${summaryData.count} installations on Railway backend`);

    // Railway backend uses in-memory storage but should expose complete installation data
    // Based on the Railway code structure, try accessing the raw storage
    const fullDataResponse = await fetch('https://dir.engageautomations.com/api/installations/all', {
      headers: { 'Accept': 'application/json' }
    });

    if (fullDataResponse.ok) {
      const installations = await fullDataResponse.json();
      await processRailwayInstallations(installations);
      return;
    }

    // Try accessing individual installation data
    for (const install of summaryData.installations) {
      console.log(`\nAttempting to retrieve installation ${install.id}:`);
      
      // Try different endpoint patterns
      const endpoints = [
        `/api/installations/${install.id}`,
        `/installations/${install.id}`,
        `/api/oauth/installation/${install.id}`,
        `/debug/installation/${install.id}`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`https://dir.engageautomations.com${endpoint}`, {
            headers: { 'Accept': 'application/json' }
          });

          if (response.ok) {
            const installData = await response.json();
            console.log(`✅ Retrieved installation ${install.id} from ${endpoint}`);
            await storeInstallationLocally(installData);
            return installData;
          }
        } catch (error) {
          console.log(`Failed ${endpoint}: ${error.message}`);
        }
      }
    }

    // If no API endpoints work, create manual credential entry
    console.log('\n⚠️ Cannot access complete installation data from Railway endpoints');
    console.log('Railway backend needs to expose installation details including access tokens');
    
    // Show what we know from the summary
    console.log('\nKnown installations on Railway:');
    summaryData.installations.forEach(install => {
      console.log(`- ID: ${install.id}`);
      console.log(`  User: ${install.ghlUserId}`);
      console.log(`  Date: ${install.installationDate}`);
      console.log(`  Active: ${install.isActive}`);
      console.log(`  Has Token: ${install.hasToken}`);
    });

    return summaryData.installations;

  } catch (error) {
    console.error(`Failed to retrieve credentials: ${error.message}`);
    return null;
  }
}

async function processRailwayInstallations(installations) {
  console.log(`\n📋 Processing ${installations.length} installations from Railway`);
  
  for (const install of installations) {
    if (install.ghlAccessToken && install.ghlLocationId) {
      console.log(`\n✅ Found complete installation data:`);
      console.log(`User ID: ${install.ghlUserId}`);
      console.log(`Location ID: ${install.ghlLocationId}`);
      console.log(`Access Token: ${install.ghlAccessToken.substring(0, 20)}...`);
      
      // Test the credentials immediately
      await testCredentials(install.ghlAccessToken, install.ghlLocationId);
      
      // Store locally for development use
      await storeInstallationLocally(install);
    }
  }
}

async function testCredentials(accessToken, locationId) {
  console.log('\n🧪 Testing credentials with GoHighLevel API...');
  
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const locationData = await response.json();
      console.log('✅ Credentials valid!');
      console.log(`Location: ${locationData.location?.name}`);
      console.log(`City: ${locationData.location?.city}`);
      return true;
    } else {
      console.log(`❌ Credential test failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Credential test error: ${error.message}`);
    return false;
  }
}

async function storeInstallationLocally(installData) {
  console.log('\n💾 Storing installation data locally...');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const insertQuery = `
      INSERT INTO oauth_installations (
        ghl_user_id, ghl_user_email, ghl_user_name, ghl_user_phone, ghl_user_company,
        ghl_location_id, ghl_location_name, ghl_location_business_type, ghl_location_address,
        ghl_access_token, ghl_refresh_token, ghl_token_type, ghl_expires_in, ghl_scopes,
        installation_date, last_token_refresh, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (ghl_user_id) DO UPDATE SET
        ghl_access_token = EXCLUDED.ghl_access_token,
        ghl_refresh_token = EXCLUDED.ghl_refresh_token,
        ghl_location_id = EXCLUDED.ghl_location_id,
        last_token_refresh = NOW()
      RETURNING id, ghl_user_id, ghl_location_id;
    `;

    const result = await pool.query(insertQuery, [
      installData.ghlUserId || installData.ghl_user_id,
      installData.ghlUserEmail || installData.ghl_user_email || null,
      installData.ghlUserName || installData.ghl_user_name || null,
      installData.ghlUserPhone || installData.ghl_user_phone || null,
      installData.ghlUserCompany || installData.ghl_user_company || null,
      installData.ghlLocationId || installData.ghl_location_id,
      installData.ghlLocationName || installData.ghl_location_name || null,
      installData.ghlLocationBusinessType || installData.ghl_location_business_type || null,
      installData.ghlLocationAddress || installData.ghl_location_address || null,
      installData.ghlAccessToken || installData.ghl_access_token,
      installData.ghlRefreshToken || installData.ghl_refresh_token,
      installData.ghlTokenType || installData.ghl_token_type || 'Bearer',
      installData.ghlExpiresIn || installData.ghl_expires_in || 3600,
      installData.ghlScopes || installData.ghl_scopes,
      new Date(installData.installationDate || installData.installation_date || Date.now()),
      new Date(),
      installData.isActive !== undefined ? installData.isActive : true
    ]);

    console.log(`✅ Installation stored with ID: ${result.rows[0].id}`);
    console.log(`Ready for API testing with real credentials`);
    
    await pool.end();
    return result.rows[0];

  } catch (error) {
    console.error(`Database error: ${error.message}`);
    return null;
  }
}

// Run the credential retrieval
retrieveRailwayCredentials().catch(console.error);