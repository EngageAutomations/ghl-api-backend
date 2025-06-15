/**
 * Real GoHighLevel API Endpoints Testing Suite
 * Tests all implemented endpoints with authentic account data
 */

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

class APIEndpointTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.accessToken = null;
    this.locationId = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
  }

  /**
   * Test OAuth flow and get real access token
   */
  async testOAuthFlow() {
    log('\n🔐 Testing OAuth Authentication Flow', colors.cyan);
    
    try {
      // Check if we have stored credentials from Railway backend
      const response = await fetch(`${this.baseUrl}/api/oauth/installations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const installations = await response.json();
        if (installations.length > 0) {
          const installation = installations[0];
          this.accessToken = installation.ghl_access_token;
          this.locationId = installation.ghl_location_id;
          
          log(`✅ Found existing OAuth installation`, colors.green);
          log(`   Location ID: ${this.locationId}`, colors.blue);
          log(`   Access Token: ${this.accessToken.substring(0, 20)}...`, colors.blue);
          
          return true;
        }
      }

      log('❌ No OAuth installation found. Please complete OAuth flow first.', colors.red);
      log('Visit: https://marketplace.leadconnectorhq.com/apps/your-app', colors.yellow);
      return false;

    } catch (error) {
      log(`❌ OAuth test failed: ${error.message}`, colors.red);
      return false;
    }
  }

  /**
   * Test a specific API endpoint
   */
  async testEndpoint(category, endpoint, method = 'GET', data = null, pathParams = {}) {
    const testName = `${method} ${endpoint}`;
    log(`\n📍 Testing: ${testName}`, colors.yellow);

    try {
      // Replace path parameters
      let finalEndpoint = endpoint;
      Object.keys(pathParams).forEach(param => {
        finalEndpoint = finalEndpoint.replace(`:${param}`, pathParams[param]);
      });

      const url = `${this.baseUrl}/api/ghl${finalEndpoint}`;
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'x-location-id': this.locationId
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (response.ok) {
        log(`✅ ${testName} - SUCCESS`, colors.green);
        log(`   Status: ${response.status}`, colors.blue);
        
        if (responseData && typeof responseData === 'object') {
          const keys = Object.keys(responseData);
          log(`   Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`, colors.blue);
        }

        this.testResults.passed++;
        this.testResults.details.push({
          category,
          endpoint: testName,
          status: 'PASSED',
          response: response.status
        });

        return responseData;
      } else {
        log(`❌ ${testName} - FAILED`, colors.red);
        log(`   Status: ${response.status}`, colors.red);
        log(`   Error: ${responseData.message || responseData.error || 'Unknown error'}`, colors.red);

        this.testResults.failed++;
        this.testResults.details.push({
          category,
          endpoint: testName,
          status: 'FAILED',
          response: response.status,
          error: responseData.message || responseData.error
        });

        return null;
      }

    } catch (error) {
      log(`❌ ${testName} - ERROR: ${error.message}`, colors.red);
      this.testResults.failed++;
      this.testResults.details.push({
        category,
        endpoint: testName,
        status: 'ERROR',
        error: error.message
      });
      return null;
    }
  }

  /**
   * Test Products API endpoints
   */
  async testProductsAPI() {
    log('\n🛍️ Testing Products API', colors.magenta);

    // List products
    const products = await this.testEndpoint('Products', '/products');
    
    // Create a test product
    const newProduct = await this.testEndpoint('Products', '/products', 'POST', {
      name: 'Test API Product',
      description: 'Product created via API testing',
      productType: 'DIGITAL',
      locationId: this.locationId
    });

    if (newProduct && newProduct.product) {
      const productId = newProduct.product.id;
      
      // Get specific product
      await this.testEndpoint('Products', '/products/:productId', 'GET', null, { productId });
      
      // Update product
      await this.testEndpoint('Products', '/products/:productId', 'PUT', {
        name: 'Updated Test API Product',
        description: 'Updated via API testing'
      }, { productId });

      // Test product prices
      await this.testProductPricesAPI(productId);
      
      // Clean up - delete test product
      await this.testEndpoint('Products', '/products/:productId', 'DELETE', null, { productId });
    }
  }

  /**
   * Test Product Prices API endpoints
   */
  async testProductPricesAPI(productId) {
    log('\n💰 Testing Product Prices API', colors.magenta);

    // List prices
    await this.testEndpoint('Prices', '/products/:productId/prices', 'GET', null, { productId });
    
    // Create price
    const newPrice = await this.testEndpoint('Prices', '/products/:productId/prices', 'POST', {
      name: 'Test Price',
      amount: 2999,
      currency: 'USD',
      type: 'one_time'
    }, { productId });

    if (newPrice && newPrice.price) {
      const priceId = newPrice.price.id;
      
      // Get specific price
      await this.testEndpoint('Prices', '/products/:productId/prices/:priceId', 'GET', null, { productId, priceId });
      
      // Update price
      await this.testEndpoint('Prices', '/products/:productId/prices/:priceId', 'PUT', {
        name: 'Updated Test Price',
        amount: 3999
      }, { productId, priceId });
      
      // Delete price
      await this.testEndpoint('Prices', '/products/:productId/prices/:priceId', 'DELETE', null, { productId, priceId });
    }
  }

  /**
   * Test Contacts API endpoints
   */
  async testContactsAPI() {
    log('\n👥 Testing Contacts API', colors.magenta);

    // List contacts
    const contacts = await this.testEndpoint('Contacts', '/contacts');
    
    // Create test contact
    const newContact = await this.testEndpoint('Contacts', '/contacts', 'POST', {
      firstName: 'API',
      lastName: 'Test',
      email: `apitest+${Date.now()}@example.com`,
      phone: '+1234567890'
    });

    if (newContact && newContact.contact) {
      const contactId = newContact.contact.id;
      
      // Get specific contact
      await this.testEndpoint('Contacts', '/contacts/:contactId', 'GET', null, { contactId });
      
      // Update contact
      await this.testEndpoint('Contacts', '/contacts/:contactId', 'PUT', {
        firstName: 'Updated API',
        lastName: 'Test User'
      }, { contactId });
      
      // Clean up - delete test contact
      await this.testEndpoint('Contacts', '/contacts/:contactId', 'DELETE', null, { contactId });
    }
  }

  /**
   * Test Opportunities API endpoints
   */
  async testOpportunitiesAPI() {
    log('\n🎯 Testing Opportunities API', colors.magenta);

    // List opportunities
    await this.testEndpoint('Opportunities', '/opportunities');
    
    // Note: Creating opportunities requires pipeline and contact IDs
    // We'll skip creation for now and focus on listing
  }

  /**
   * Test Locations API endpoints
   */
  async testLocationsAPI() {
    log('\n📍 Testing Locations API', colors.magenta);

    // List locations
    await this.testEndpoint('Locations', '/locations');
    
    // Get specific location
    if (this.locationId) {
      await this.testEndpoint('Locations', '/locations/:locationId', 'GET', null, { locationId: this.locationId });
    }
  }

  /**
   * Test Workflows API endpoints
   */
  async testWorkflowsAPI() {
    log('\n⚡ Testing Workflows API', colors.magenta);

    // List workflows
    await this.testEndpoint('Workflows', '/workflows');
  }

  /**
   * Test Forms API endpoints
   */
  async testFormsAPI() {
    log('\n📝 Testing Forms API', colors.magenta);

    // List forms
    const forms = await this.testEndpoint('Forms', '/forms');
    
    // Get form submissions if we have forms
    if (forms && forms.forms && forms.forms.length > 0) {
      const formId = forms.forms[0].id;
      await this.testEndpoint('Forms', '/forms/:formId/submissions', 'GET', null, { formId });
    }
  }

  /**
   * Test Media API endpoints
   */
  async testMediaAPI() {
    log('\n🎬 Testing Media API', colors.magenta);

    // List media files
    await this.testEndpoint('Media', '/media');
  }

  /**
   * Test User Info API endpoints
   */
  async testUserInfoAPI() {
    log('\n👤 Testing User Info API', colors.magenta);

    // Get OAuth user info
    await this.testEndpoint('User', '/user/info');
    
    // Get current user
    await this.testEndpoint('User', '/user/me');
  }

  /**
   * Run comprehensive API test suite
   */
  async runAllTests() {
    log('🚀 Starting Comprehensive API Endpoints Test Suite', colors.bright);
    log('================================================', colors.bright);

    // Test OAuth authentication first
    const authSuccess = await this.testOAuthFlow();
    if (!authSuccess) {
      log('\n❌ Cannot proceed without valid OAuth credentials', colors.red);
      return;
    }

    // Test all API categories
    await this.testUserInfoAPI();
    await this.testLocationsAPI();
    await this.testProductsAPI();
    await this.testContactsAPI();
    await this.testOpportunitiesAPI();
    await this.testWorkflowsAPI();
    await this.testFormsAPI();
    await this.testMediaAPI();

    // Print summary
    this.printTestSummary();
  }

  /**
   * Print test results summary
   */
  printTestSummary() {
    log('\n📊 Test Results Summary', colors.bright);
    log('========================', colors.bright);
    log(`✅ Passed: ${this.testResults.passed}`, colors.green);
    log(`❌ Failed: ${this.testResults.failed}`, colors.red);
    log(`⏭️  Skipped: ${this.testResults.skipped}`, colors.yellow);
    
    const total = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    log(`📈 Success Rate: ${successRate}%`, colors.cyan);

    // Show failed tests
    if (this.testResults.failed > 0) {
      log('\n❌ Failed Tests:', colors.red);
      this.testResults.details
        .filter(test => test.status === 'FAILED' || test.status === 'ERROR')
        .forEach(test => {
          log(`   ${test.endpoint} - ${test.error || 'HTTP ' + test.response}`, colors.red);
        });
    }

    // Show passed tests by category
    log('\n✅ Passed Tests by Category:', colors.green);
    const categories = {};
    this.testResults.details
      .filter(test => test.status === 'PASSED')
      .forEach(test => {
        if (!categories[test.category]) {
          categories[test.category] = 0;
        }
        categories[test.category]++;
      });

    Object.entries(categories).forEach(([category, count]) => {
      log(`   ${category}: ${count} endpoints`, colors.green);
    });
  }
}

/**
 * Main execution
 */
async function main() {
  const tester = new APIEndpointTester();
  await tester.runAllTests();
}

// Run the test suite
main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});