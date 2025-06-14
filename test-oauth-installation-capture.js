/**
 * Test OAuth Installation Data Capture
 * Simulates a fresh OAuth installation to test database storage
 */

import { Pool } from '@neondatabase/serverless';

// Test the OAuth installation capture with your real credentials
async function testOAuthInstallationCapture() {
  console.log('\n🔐 Testing OAuth Installation Data Capture');
  console.log('==========================================');

  // Check if we have the client credentials configured
  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
    console.log('❌ Missing GHL_CLIENT_ID or GHL_CLIENT_SECRET');
    return;
  }

  console.log('✅ OAuth credentials configured');
  console.log(`Client ID: ${process.env.GHL_CLIENT_ID.substring(0, 8)}...`);

  // Generate OAuth authorization URL for fresh installation
  const scopes = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';
  const state = `state_${Date.now()}`;
  const redirectUri = `${process.env.REPLIT_DEV_DOMAIN || 'https://dir.engageautomations.com'}/api/oauth/callback`;
  
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `client_id=${process.env.GHL_CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `state=${state}`;

  console.log('\n📱 OAuth Authorization URL Generated:');
  console.log('=====================================');
  console.log(authUrl);
  console.log('\n💡 To capture your real installation data:');
  console.log('1. Visit the URL above in your browser');
  console.log('2. Authorize the app with your GoHighLevel account');
  console.log('3. The callback will capture and store your real account data');
  
  // Check current database state
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query('SELECT COUNT(*) as count FROM oauth_installations');
    console.log(`\n📊 Current installations in database: ${result.rows[0].count}`);
    
    if (result.rows[0].count > 0) {
      const installations = await pool.query(`
        SELECT id, ghl_user_id, ghl_location_id, ghl_location_name, 
               installation_date, is_active
        FROM oauth_installations 
        ORDER BY installation_date DESC 
        LIMIT 3
      `);
      
      console.log('\n📋 Recent installations:');
      installations.rows.forEach((install, i) => {
        console.log(`${i + 1}. ID: ${install.id} | User: ${install.ghl_user_id} | Location: ${install.ghl_location_name || 'Unknown'}`);
      });
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }

  console.log('\n🔄 Ready to capture fresh OAuth installation data!');
}

// Run the test
testOAuthInstallationCapture().catch(console.error);