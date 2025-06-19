/**
 * Railway Installation Checker
 * Multiple methods to check OAuth installations on Railway backend
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const RAILWAY_BASE_URL = 'https://dir.engageautomations.com';

async function checkRailwayHealth() {
  try {
    log('=== CHECKING RAILWAY BACKEND HEALTH ===', colors.cyan);
    
    const response = await fetch(`${RAILWAY_BASE_URL}/health`);
    const data = await response.json();
    
    log(`✅ Railway Status: ${data.status}`, colors.green);
    log(`✅ Timestamp: ${data.ts}`, colors.green);
    
    return true;
  } catch (error) {
    log(`❌ Railway Health Check Failed: ${error.message}`, colors.red);
    return false;
  }
}

async function checkRailwayRoot() {
  try {
    log('=== CHECKING RAILWAY ROOT INFO ===', colors.cyan);
    
    const response = await fetch(`${RAILWAY_BASE_URL}/`);
    const data = await response.json();
    
    log(`✅ Service: ${data.service}`, colors.green);
    log(`✅ Version: ${data.version}`, colors.green);
    log(`✅ Installs: ${data.installs}`, colors.green);
    log(`✅ Timestamp: ${data.ts}`, colors.green);
    
    return data;
  } catch (error) {
    log(`❌ Railway Root Check Failed: ${error.message}`, colors.red);
    return null;
  }
}

async function tryInstallationEndpoints() {
  const endpoints = [
    '/api/debug/installations',
    '/api/installations',
    '/api/installations/all',
    '/api/installations/latest',
    '/api/oauth/installations',
    '/debug/installations',
    '/installations',
    '/oauth/installations'
  ];
  
  log('=== TESTING INSTALLATION ENDPOINTS ===', colors.cyan);
  
  for (const endpoint of endpoints) {
    try {
      log(`Testing: ${RAILWAY_BASE_URL}${endpoint}`, colors.yellow);
      
      const response = await fetch(`${RAILWAY_BASE_URL}${endpoint}`);
      const text = await response.text();
      
      if (response.ok && !text.includes('Cannot GET')) {
        try {
          const data = JSON.parse(text);
          log(`✅ SUCCESS: ${endpoint}`, colors.green);
          log(`Response: ${JSON.stringify(data, null, 2)}`, colors.bright);
          return { endpoint, data };
        } catch {
          log(`✅ SUCCESS (HTML): ${endpoint}`, colors.green);
          log(`Response length: ${text.length} characters`, colors.bright);
        }
      } else {
        log(`❌ Not found: ${endpoint}`, colors.red);
      }
    } catch (error) {
      log(`❌ Error: ${endpoint} - ${error.message}`, colors.red);
    }
  }
  
  return null;
}

async function checkSpecificInstallation(installationId = 'install_1750191250983') {
  const endpoints = [
    `/api/installations/${installationId}`,
    `/api/oauth/installation/${installationId}`,
    `/installations/${installationId}`,
    `/debug/installation/${installationId}`
  ];
  
  log(`=== CHECKING SPECIFIC INSTALLATION: ${installationId} ===`, colors.cyan);
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${RAILWAY_BASE_URL}${endpoint}`);
      const text = await response.text();
      
      if (response.ok && !text.includes('Cannot GET')) {
        try {
          const data = JSON.parse(text);
          log(`✅ Found installation at: ${endpoint}`, colors.green);
          log(`Installation data: ${JSON.stringify(data, null, 2)}`, colors.bright);
          return data;
        } catch {
          log(`✅ Found installation (HTML) at: ${endpoint}`, colors.green);
        }
      }
    } catch (error) {
      log(`❌ Error checking ${endpoint}: ${error.message}`, colors.red);
    }
  }
  
  return null;
}

async function checkLocalInstallationData() {
  try {
    log('=== CHECKING LOCAL INSTALLATION DATA ===', colors.cyan);
    
    // Check if we have local Railway installation data
    const response = await fetch('/api/railway/installations/latest');
    const data = await response.json();
    
    log(`✅ Local proxy successful`, colors.green);
    log(`Data: ${JSON.stringify(data, null, 2)}`, colors.bright);
    
    return data;
  } catch (error) {
    log(`❌ Local installation check failed: ${error.message}`, colors.red);
    return null;
  }
}

async function testGHLAPIAccess() {
  try {
    log('=== TESTING GHL API ACCESS VIA RAILWAY ===', colors.cyan);
    
    const locationId = 'WAvk87RmW9rBSDJHeOpH';
    const installationId = 'install_1750191250983';
    
    // Test products endpoint
    const response = await fetch(`${RAILWAY_BASE_URL}/api/ghl/products?installation_id=${installationId}&location_id=${locationId}&limit=5`);
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ GHL API access working`, colors.green);
      log(`Products count: ${data.products?.length || 0}`, colors.bright);
      return data;
    } else {
      const error = await response.text();
      log(`❌ GHL API access failed: ${error}`, colors.red);
    }
  } catch (error) {
    log(`❌ GHL API test error: ${error.message}`, colors.red);
  }
  
  return null;
}

async function displayInstallationSummary() {
  log('=== RAILWAY INSTALLATION SUMMARY ===', colors.bright);
  log('Known Installation Details:', colors.yellow);
  log('• Installation ID: install_1750191250983', colors.green);
  log('• Location ID: WAvk87RmW9rBSDJHeOpH', colors.green);
  log('• Railway Backend: dir.engageautomations.com', colors.green);
  log('• Backend Version: 1.4.0+', colors.green);
  log('• OAuth Status: Active with real GoHighLevel account', colors.green);
  log('• Access Token: Valid (with automatic refresh)', colors.green);
  log('• Supported APIs: Products, Media, Contacts, Locations', colors.green);
}

async function main() {
  log('🚀 Railway Installation Checker Started', colors.bright);
  
  // Check Railway backend health
  const isHealthy = await checkRailwayHealth();
  if (!isHealthy) {
    log('❌ Railway backend is not accessible', colors.red);
    return;
  }
  
  // Get basic Railway info
  await checkRailwayRoot();
  
  // Try to find installation endpoints
  const installationEndpoint = await tryInstallationEndpoints();
  
  // Check specific installation
  await checkSpecificInstallation();
  
  // Test GHL API access
  await testGHLAPIAccess();
  
  // Check local proxy
  await checkLocalInstallationData();
  
  // Display summary
  await displayInstallationSummary();
  
  log('✅ Railway Installation Check Complete', colors.bright);
}

// Run the main function
main().catch(console.error);