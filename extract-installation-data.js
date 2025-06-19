/**
 * Extract Installation Data from Railway Backend
 * Attempts to gather all visible installation information
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';

async function extractInstallationData() {
  console.log('=== EXTRACTING RAILWAY INSTALLATION DATA ===\n');

  // 1. Backend basic info
  try {
    const response = await fetch(`${RAILWAY_URL}/`);
    const data = await response.json();
    console.log('1. BACKEND INFO:');
    console.log(`   Service: ${data.service}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Installations: ${data.installs}`);
    console.log(`   Timestamp: ${data.ts}`);
    console.log('');
  } catch (error) {
    console.log('   Backend info unavailable');
  }

  // 2. OAuth status check
  try {
    const response = await fetch(`${RAILWAY_URL}/api/oauth/status`);
    const data = await response.json();
    console.log('2. OAUTH STATUS (no installation_id):');
    console.log(`   Authenticated: ${data.authenticated}`);
    if (data.tokenStatus) console.log(`   Token Status: ${data.tokenStatus}`);
    if (data.locationId) console.log(`   Location ID: ${data.locationId}`);
    console.log('');
  } catch (error) {
    console.log('   OAuth status unavailable');
  }

  // 3. Test connection patterns to find installation structure
  console.log('3. INSTALLATION ID TESTING:');
  const testPatterns = [
    'install_seed',
    'install_1',
    'install_default',
    'default',
    '1'
  ];

  for (const pattern of testPatterns) {
    try {
      const response = await fetch(`${RAILWAY_URL}/api/oauth/status?installation_id=${pattern}`);
      const data = await response.json();
      
      if (data.authenticated !== false || data.error !== `Installation not found: ${pattern}`) {
        console.log(`   Found installation: ${pattern}`);
        console.log(`   Data: ${JSON.stringify(data, null, 4)}`);
      } else {
        console.log(`   ${pattern}: Not found`);
      }
    } catch (error) {
      console.log(`   ${pattern}: Error - ${error.message}`);
    }
  }

  // 4. Check for environment-based installation hints
  console.log('\n4. ENVIRONMENT HINTS:');
  console.log('   From backend code analysis:');
  console.log('   - Uses install_seed for env-based installations');
  console.log('   - Requires GHL_ACCESS_TOKEN environment variable');
  console.log('   - Default location: WAvk87RmW9rBSDJHeOpH');
  console.log('   - Default scopes: medias.write medias.readonly');

  // 5. API endpoint accessibility
  console.log('\n5. API ENDPOINT STATUS:');
  const endpoints = [
    '/api/ghl/products',
    '/api/ghl/media/upload', 
    '/api/ghl/contacts/create',
    '/api/ghl/test-connection'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${RAILWAY_URL}${endpoint}?installation_id=install_seed&limit=1`);
      const data = await response.json();
      console.log(`   ${endpoint}: ${data.success ? 'Accessible' : 'Requires auth'}`);
      if (data.error) console.log(`     Error: ${data.error}`);
    } catch (error) {
      console.log(`   ${endpoint}: Connection failed`);
    }
  }

  // 6. Installation metadata inference
  console.log('\n6. INSTALLATION METADATA INFERENCE:');
  console.log('   Based on backend reporting 1 installation:');
  console.log('   - Installation exists but not accessible via standard patterns');
  console.log('   - Likely environment-based (install_seed) but missing env vars');
  console.log('   - Or OAuth-based with timestamp ID not discoverable');
  console.log('   - Backend code suggests location ID: WAvk87RmW9rBSDJHeOpH');
  
  console.log('\n=== EXTRACTION COMPLETE ===');
}

extractInstallationData().catch(console.error);