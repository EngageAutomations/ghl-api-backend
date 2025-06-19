/**
 * Find Active Railway Installation
 * Discovers the current active installation on Railway backend
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';

async function findActiveInstallation() {
  console.log('🔍 Searching for active Railway installation...\n');

  // Generate potential installation IDs based on current timestamp
  const now = Date.now();
  const recentTimestamps = [];
  
  // Check installations from the last hour
  for (let i = 0; i < 60; i++) {
    const timestamp = now - (i * 60000); // Go back i minutes
    recentTimestamps.push(Math.floor(timestamp / 1000) * 1000); // Round to seconds
  }

  console.log('Testing recent installation IDs...');
  
  for (const timestamp of recentTimestamps.slice(0, 10)) { // Test first 10
    const installationId = `install_${timestamp}`;
    
    try {
      const response = await fetch(`${RAILWAY_URL}/api/ghl/products?installation_id=${installationId}`);
      const data = await response.json();
      
      if (response.status === 200 && data.success !== false) {
        console.log(`✅ FOUND ACTIVE INSTALLATION: ${installationId}`);
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${JSON.stringify(data, null, 2)}`);
        return installationId;
      } else if (data.error !== 'Installation not found: ' + installationId) {
        console.log(`🔍 Potential match: ${installationId} - ${data.error}`);
      }
    } catch (error) {
      // Silent fail for network errors
    }
  }

  // Also test sequential installation IDs
  console.log('\nTesting sequential installation IDs...');
  for (let i = 1; i <= 10; i++) {
    const installationId = `install_${Date.now() - (i * 1000)}`;
    
    try {
      const response = await fetch(`${RAILWAY_URL}/api/ghl/test-connection?installation_id=${installationId}`);
      const data = await response.json();
      
      if (response.status === 200 && data.success) {
        console.log(`✅ FOUND ACTIVE INSTALLATION: ${installationId}`);
        console.log(`Connection: ${data.message}`);
        return installationId;
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Test current time-based IDs
  console.log('\nTesting current timestamp-based IDs...');
  const currentTimestamp = Date.now();
  const variations = [
    `install_${currentTimestamp}`,
    `install_${Math.floor(currentTimestamp / 1000)}`,
    `install_${Math.floor(currentTimestamp / 60000)}`, // minute precision
    `install_2`, // sequential
    `install_3`,
    `install_latest`,
    `install_new`
  ];

  for (const installationId of variations) {
    try {
      const response = await fetch(`${RAILWAY_URL}/api/ghl/products?installation_id=${installationId}`);
      const data = await response.json();
      
      console.log(`Testing ${installationId}: ${response.status} - ${data.error || 'Success'}`);
      
      if (response.status === 200 && data.success !== false) {
        console.log(`✅ FOUND ACTIVE INSTALLATION: ${installationId}`);
        return installationId;
      }
    } catch (error) {
      console.log(`Testing ${installationId}: Network error`);
    }
  }

  console.log('\n❌ No active installation found');
  return null;
}

// Run the search
findActiveInstallation().then(installationId => {
  if (installationId) {
    console.log(`\n🎉 Use this installation ID: ${installationId}`);
  } else {
    console.log('\n💡 The new installation may need a few minutes to activate');
  }
}).catch(console.error);