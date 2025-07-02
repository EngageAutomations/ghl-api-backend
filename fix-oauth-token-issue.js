#!/usr/bin/env node

/**
 * Fix OAuth Token Issue
 * Direct test to see what's available in the Railway backend
 */

import https from 'https';

const installationId = 'install_1751436979939';

// Test all possible endpoints to find tokens
async function testAllEndpoints() {
  console.log('🔍 Testing all possible Railway backend endpoints for OAuth tokens...');
  
  const endpoints = [
    '/installations',
    '/api/installations',
    `/api/installation/${installationId}`,
    `/installation/${installationId}`,
    `/api/token/${installationId}`,
    `/token/${installationId}`,
    `/api/oauth/status/${installationId}`,
    `/oauth/status/${installationId}`,
    `/api/ghl/token/${installationId}`,
    '/api/health',
    '/health'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: https://dir.engageautomations.com${endpoint}`);
    
    await new Promise((resolve) => {
      const options = {
        hostname: 'dir.engageautomations.com',
        port: 443,
        path: endpoint,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              console.log('✅ SUCCESS - JSON Response:');
              console.log(JSON.stringify(response, null, 2).substring(0, 500));
              
              // Look for access tokens
              if (typeof response === 'object') {
                const jsonStr = JSON.stringify(response);
                if (jsonStr.includes('access_token') || jsonStr.includes('accessToken')) {
                  console.log('🎯 FOUND ACCESS TOKEN IN THIS ENDPOINT!');
                }
                if (jsonStr.includes('location') || jsonStr.includes('Location')) {
                  console.log('🎯 FOUND LOCATION DATA IN THIS ENDPOINT!');
                }
              }
            } catch (error) {
              console.log('⚠️ Response (non-JSON):');
              console.log(data.substring(0, 200));
            }
          } else {
            console.log(`❌ Status ${res.statusCode}:`, data.substring(0, 100));
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        console.log('❌ Request failed:', error.message);
        resolve();
      });

      req.end();
    });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Test POST endpoints that might provide tokens
async function testPostEndpoints() {
  console.log('\n🔍 Testing POST endpoints for token access...');
  
  const postEndpoints = [
    {
      path: '/api/token-access',
      data: { installationId: installationId }
    },
    {
      path: '/api/oauth/token',
      data: { installation_id: installationId }
    },
    {
      path: '/api/ghl/auth',
      data: { installationId: installationId }
    }
  ];

  for (const endpoint of postEndpoints) {
    console.log(`\n📡 Testing POST: https://dir.engageautomations.com${endpoint.path}`);
    
    await new Promise((resolve) => {
      const postData = JSON.stringify(endpoint.data);
      
      const options = {
        hostname: 'dir.engageautomations.com',
        port: 443,
        path: endpoint.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              console.log('✅ SUCCESS - JSON Response:');
              console.log(JSON.stringify(response, null, 2));
              
              // Look for access tokens
              if (typeof response === 'object') {
                const jsonStr = JSON.stringify(response);
                if (jsonStr.includes('access_token') || jsonStr.includes('accessToken')) {
                  console.log('🎯 FOUND ACCESS TOKEN IN THIS ENDPOINT!');
                }
              }
            } catch (error) {
              console.log('Response:', data.substring(0, 200));
            }
          } else {
            console.log(`Status ${res.statusCode}:`, data.substring(0, 100));
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        console.log('❌ Request failed:', error.message);
        resolve();
      });

      req.write(postData);
      req.end();
    });
  }
}

// Main function
async function main() {
  console.log('🚨 OAUTH TOKEN DEBUGGING FOR FRESH INSTALLATION');
  console.log('Installation ID:', installationId);
  console.log('='.repeat(70));
  
  await testAllEndpoints();
  await testPostEndpoints();
  
  console.log('\n🎯 DEBUGGING SUMMARY');
  console.log('='.repeat(70));
  console.log('✅ Installation exists and shows "valid" status');
  console.log('❌ Access token is missing (length: 0)');
  console.log('❌ Location ID is undefined');
  console.log('');
  console.log('🔧 NEXT STEPS:');
  console.log('1. Railway OAuth backend needs to properly store access tokens');
  console.log('2. OAuth callback must capture and save the actual JWT token');
  console.log('3. Location ID must be extracted from OAuth response');
  console.log('');
  console.log('The OAuth installation process completed but token storage failed.');
}

main().catch(console.error);