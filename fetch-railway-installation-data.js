/**
 * Fetch Installation Data from Railway Backend
 * Attempts to retrieve real OAuth installation data from production Railway instance
 */

import { Pool } from '@neondatabase/serverless';

async function fetchRailwayInstallationData() {
  console.log('\n🔍 Fetching Installation Data from Railway Backend');
  console.log('==================================================');

  // Try different potential endpoints on Railway
  const railwayDomain = 'https://dir.engageautomations.com';
  const endpoints = [
    '/api/installations',
    '/installations', 
    '/oauth/installations',
    '/debug/installations',
    '/api/oauth/installations',
    '/api/debug/installations'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${railwayDomain}${endpoint}`);
      
      const response = await fetch(`${railwayDomain}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Replit-Development-Instance'
        },
        timeout: 5000
      });

      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully retrieved installation data');
        console.log(`Found ${Array.isArray(data) ? data.length : 'unknown'} installations`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('\n📋 Installation Data Preview:');
          data.forEach((install, i) => {
            console.log(`${i + 1}. User: ${install.ghlUserId || install.ghl_user_id}`);
            console.log(`   Location: ${install.ghlLocationId || install.ghl_location_id}`);
            console.log(`   Access Token: ${install.ghlAccessToken || install.ghl_access_token ? 'Present' : 'Missing'}`);
          });
          
          // Store the data in local database
          await storeInstallationDataLocally(data);
          return data;
        }
      } else if (response.status === 404) {
        console.log('❌ Endpoint not found');
      } else {
        const text = await response.text();
        console.log(`❌ Error response: ${text.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n⚠️ Could not retrieve installation data from Railway');
  console.log('Railway backend may need to expose an API endpoint for installation data');
  
  return null;
}

async function storeInstallationDataLocally(installations) {
  console.log('\n💾 Storing Railway installation data locally...');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    for (const install of installations) {
      const installationData = {
        ghl_user_id: install.ghlUserId || install.ghl_user_id || `railway_user_${Date.now()}`,
        ghl_user_email: install.ghlUserEmail || install.ghl_user_email,
        ghl_user_name: install.ghlUserName || install.ghl_user_name,
        ghl_user_phone: install.ghlUserPhone || install.ghl_user_phone,
        ghl_user_company: install.ghlUserCompany || install.ghl_user_company,
        ghl_location_id: install.ghlLocationId || install.ghl_location_id,
        ghl_location_name: install.ghlLocationName || install.ghl_location_name,
        ghl_location_business_type: install.ghlLocationBusinessType || install.ghl_location_business_type,
        ghl_location_address: install.ghlLocationAddress || install.ghl_location_address,
        ghl_access_token: install.ghlAccessToken || install.ghl_access_token,
        ghl_refresh_token: install.ghlRefreshToken || install.ghl_refresh_token,
        ghl_token_type: install.ghlTokenType || install.ghl_token_type || 'Bearer',
        ghl_expires_in: install.ghlExpiresIn || install.ghl_expires_in || 3600,
        ghl_scopes: install.ghlScopes || install.ghl_scopes,
        installation_date: new Date(install.installationDate || install.installation_date || Date.now()),
        last_token_refresh: new Date(install.lastTokenRefresh || install.last_token_refresh || Date.now()),
        is_active: install.isActive !== undefined ? install.isActive : (install.is_active !== undefined ? install.is_active : true)
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
          ghl_refresh_token = EXCLUDED.ghl_refresh_token,
          ghl_location_id = EXCLUDED.ghl_location_id,
          ghl_location_name = EXCLUDED.ghl_location_name,
          last_token_refresh = EXCLUDED.last_token_refresh,
          is_active = EXCLUDED.is_active
        RETURNING id, ghl_user_id, ghl_location_id;
      `;

      const result = await pool.query(insertQuery, [
        installationData.ghl_user_id,
        installationData.ghl_user_email,
        installationData.ghl_user_name,
        installationData.ghl_user_phone,
        installationData.ghl_user_company,
        installationData.ghl_location_id,
        installationData.ghl_location_name,
        installationData.ghl_location_business_type,
        installationData.ghl_location_address,
        installationData.ghl_access_token,
        installationData.ghl_refresh_token,
        installationData.ghl_token_type,
        installationData.ghl_expires_in,
        installationData.ghl_scopes,
        installationData.installation_date,
        installationData.last_token_refresh,
        installationData.is_active
      ]);

      console.log(`✅ Stored installation ID: ${result.rows[0].id}`);
    }
    
    await pool.end();
    console.log('✅ All installation data stored locally');
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
  }
}

// Run the fetch
fetchRailwayInstallationData().catch(console.error);