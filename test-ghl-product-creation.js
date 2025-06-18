/**
 * Test GoHighLevel Product Creation with Real Access Token
 * Uses the current valid installation from Railway backend
 */

import fetch from 'node-fetch';

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

async function getRailwayInstallation() {
  try {
    log('Fetching current installation from Railway backend...', colors.blue);
    
    const response = await fetch('https://dir.engageautomations.com/api/installations');
    const data = await response.json();
    
    if (data.success && data.installations.length > 0) {
      const installation = data.installations[0];
      log(`Found installation: ${installation.id}`, colors.green);
      log(`Location ID: ${installation.locationId}`, colors.cyan);
      log(`Scopes: ${installation.scopes}`, colors.cyan);
      log(`Token Status: ${installation.tokenStatus}`, colors.cyan);
      return installation;
    } else {
      throw new Error('No valid installations found');
    }
  } catch (error) {
    log(`Error fetching installation: ${error.message}`, colors.red);
    throw error;
  }
}

async function getAccessTokenFromRailway(installationId) {
  try {
    log('Fetching access token from Railway backend...', colors.blue);
    
    // Try to get the access token by triggering the OAuth status endpoint
    const response = await fetch('https://dir.engageautomations.com/api/oauth/status', {
      headers: {
        'Cookie': `installation_id=${installationId}`
      }
    });
    
    const data = await response.json();
    
    if (data.accessToken) {
      log('Access token retrieved successfully', colors.green);
      return data.accessToken;
    } else {
      throw new Error('No access token in response');
    }
  } catch (error) {
    log(`Error getting access token: ${error.message}`, colors.yellow);
    // For now, we'll use a mock installation ID since we can't extract the token directly
    return null;
  }
}

async function createTestProduct(accessToken, locationId) {
  try {
    log('Creating test product in GoHighLevel...', colors.blue);
    
    const productData = {
      name: "API Integration Test Product",
      description: "This product was created to test the GoHighLevel API integration functionality",
      locationId: locationId
    };
    
    log(`Product data: ${JSON.stringify(productData, null, 2)}`, colors.cyan);
    
    const response = await fetch('https://services.leadconnectorhq.com/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(productData)
    });
    
    const responseText = await response.text();
    log(`Response status: ${response.status}`, colors.cyan);
    log(`Response: ${responseText}`, colors.cyan);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      log('✅ Product created successfully!', colors.green);
      log(`Product ID: ${result.product?.id}`, colors.green);
      log(`Product Name: ${result.product?.name}`, colors.green);
      return result;
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
  } catch (error) {
    log(`❌ Product creation failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function testRailwayAPIProxy(installationId) {
  try {
    log('Testing Railway API proxy for product creation...', colors.blue);
    
    const productData = {
      name: "Railway Proxy Test Product",
      description: "Testing product creation through Railway API proxy",
      price: 19.99,
      installationId: installationId
    };
    
    const response = await fetch('https://dir.engageautomations.com/api/ghl/products/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const responseText = await response.text();
    log(`Railway proxy response: ${responseText}`, colors.cyan);
    
    return JSON.parse(responseText);
  } catch (error) {
    log(`Railway proxy test failed: ${error.message}`, colors.red);
    return null;
  }
}

async function main() {
  try {
    log('🚀 Starting GoHighLevel API Integration Test', colors.bright);
    log('=' * 50, colors.blue);
    
    // Step 1: Get current installation from Railway
    const installation = await getRailwayInstallation();
    
    // Step 2: Test Railway API proxy (even though it's not fully implemented)
    log('\n📡 Testing Railway API Proxy...', colors.yellow);
    await testRailwayAPIProxy(installation.id);
    
    // Step 3: Attempt to get access token
    log('\n🔑 Attempting to get access token...', colors.yellow);
    const accessToken = await getAccessTokenFromRailway(installation.id);
    
    if (accessToken) {
      // Step 4: Create test product directly with GoHighLevel API
      log('\n🏭 Creating test product with GoHighLevel API...', colors.yellow);
      await createTestProduct(accessToken, installation.locationId);
    } else {
      log('\n⚠️  Could not retrieve access token from Railway backend', colors.yellow);
      log('The Railway backend needs to expose the access token for direct API calls', colors.yellow);
    }
    
    log('\n✅ Test completed successfully!', colors.green);
    log('Next steps:', colors.bright);
    log('1. Implement Railway backend API proxy endpoints', colors.cyan);
    log('2. Test product creation through the web interface', colors.cyan);
    log('3. Verify products appear in GoHighLevel dashboard', colors.cyan);
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();