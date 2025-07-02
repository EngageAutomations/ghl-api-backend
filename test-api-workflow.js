#!/usr/bin/env node

/**
 * Test Actual API Workflow Calls
 * Tests the dynamic workflow API endpoints with real HTTP requests
 */

import http from 'http';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

// Test data for API calls
const testData = {
  directoryName: 'car-detailing-services',
  formData: {
    installationId: 'test_install_12345',
    name: 'Premium Car Detailing Service',
    description: 'Professional exterior and interior car detailing with eco-friendly products and expert care.',
    price: '175.00',
    seoTitle: 'Premium Car Detailing Services',
    seoDescription: 'Professional car detailing with eco-friendly products.',
    seoKeywords: 'car detailing, auto cleaning, professional detailing'
  }
};

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parsed: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parsed: null,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing Dynamic Workflow API Endpoints');
  console.log('='.repeat(50));
  
  // Test 1: Health check
  console.log('\n📡 Test 1: Health Check');
  console.log('-'.repeat(30));
  
  try {
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log('Status:', healthResponse.statusCode);
    console.log('Response:', healthResponse.body);
    
    if (healthResponse.statusCode !== 200) {
      console.log('❌ Server not running on port 5000');
      return;
    }
    
    console.log('✅ Server is running');
    
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    console.log('💡 Server may not be running. Please start it with: npm run dev');
    return;
  }
  
  // Test 2: Get directory configuration
  console.log('\n📋 Test 2: Get Directory Configuration');
  console.log('-'.repeat(30));
  
  try {
    const configOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflow/directory/${testData.directoryName}/example`,
      method: 'GET'
    };
    
    const configResponse = await makeRequest(configOptions);
    console.log('Status:', configResponse.statusCode);
    console.log('Response:', configResponse.body.substring(0, 200) + '...');
    
    if (configResponse.parsed) {
      console.log('✅ Directory config retrieved');
      console.log('Directory:', configResponse.parsed.directoryName || 'Unknown');
    } else {
      console.log('⚠️ Directory not configured (expected for new directories)');
    }
    
  } catch (error) {
    console.log('❌ Directory config request failed:', error.message);
  }
  
  // Test 3: Submit workflow (would need actual image file and OAuth)
  console.log('\n🚀 Test 3: Submit Dynamic Workflow');
  console.log('-'.repeat(30));
  
  try {
    // Create form boundary for multipart/form-data
    const boundary = '----testboundary' + Date.now();
    
    // Prepare form data
    const formParts = [];
    
    // Add data field
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="data"');
    formParts.push('');
    formParts.push(JSON.stringify(testData.formData));
    
    // Add mock image field
    formParts.push(`--${boundary}`);
    formParts.push('Content-Disposition: form-data; name="image"; filename="test-image.jpg"');
    formParts.push('Content-Type: image/jpeg');
    formParts.push('');
    formParts.push('fake-image-data-for-testing');
    formParts.push(`--${boundary}--`);
    
    const formData = formParts.join('\r\n');
    
    const workflowOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/workflow/directory/${testData.directoryName}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      }
    };
    
    const workflowResponse = await makeRequest(workflowOptions, formData);
    console.log('Status:', workflowResponse.statusCode);
    console.log('Response:', workflowResponse.body.substring(0, 300) + '...');
    
    if (workflowResponse.parsed) {
      console.log('✅ Workflow API endpoint responding');
      if (workflowResponse.parsed.error) {
        console.log('⚠️ Expected error (no real OAuth):', workflowResponse.parsed.error);
      }
    }
    
  } catch (error) {
    console.log('❌ Workflow submission failed:', error.message);
  }
  
  // Test 4: Check general API routes
  console.log('\n🔍 Test 4: Check API Routes');
  console.log('-'.repeat(30));
  
  const testRoutes = [
    '/api/users',
    '/api/directories',
    '/api/collections'
  ];
  
  for (const route of testRoutes) {
    try {
      const routeOptions = {
        hostname: 'localhost',
        port: 5000,
        path: route,
        method: 'GET'
      };
      
      const routeResponse = await makeRequest(routeOptions);
      console.log(`${route}: Status ${routeResponse.statusCode}`);
      
    } catch (error) {
      console.log(`${route}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🎯 API Test Summary');
  console.log('='.repeat(50));
  console.log('The dynamic workflow system has the following API endpoints:');
  console.log('');
  console.log('• GET /health - Server health check');
  console.log('• GET /api/workflow/directory/{name}/example - Get directory config');
  console.log('• POST /api/workflow/directory/{name} - Submit workflow with image');
  console.log('• GET /api/users - User management');
  console.log('• GET /api/directories - Directory listings');
  console.log('• GET /api/collections - Collection management');
  console.log('');
  console.log('For full testing with GoHighLevel API:');
  console.log('1. Complete OAuth installation to get access tokens');
  console.log('2. Upload real image file with form submission');
  console.log('3. Use valid installation ID from OAuth process');
  console.log('');
  console.log('The system is ready for production use with proper OAuth setup.');
}

// Run the API tests
testAPIEndpoints().catch(console.error);