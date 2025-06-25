#!/usr/bin/env node
/**
 * Bridge Health Test Script
 * Run this anytime to verify bridge is working
 */

import axios from 'axios';

async function testBridge() {
  console.log('🔍 Testing Bridge Health...\n');
  
  try {
    // Test health endpoint
    const health = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    console.log('✅ Health endpoint: OK');
    
    // Test OAuth credentials endpoint
    const credentials = await axios.get('http://localhost:3000/api/bridge/oauth-credentials', { timeout: 5000 });
    
    if (credentials.data.clientId && credentials.data.clientSecret) {
      console.log('✅ OAuth credentials: OK');
      console.log(`   Client ID: ${credentials.data.clientId.substring(0, 12)}...`);
      console.log(`   Has Secret: ${!!credentials.data.clientSecret}`);
      console.log(`   Redirect: ${credentials.data.redirectBase}`);
      
      // Test Railway can access it
      console.log('\n🌐 Testing Railway accessibility...');
      try {
        const railwayTest = await axios.get('https://dir.engageautomations.com/', { timeout: 10000 });
        if (railwayTest.data.bridge_architecture) {
          console.log('✅ Railway backend ready for bridge integration');
        }
      } catch (railwayError) {
        console.log('⚠️ Railway backend test failed (may be temporary)');
      }
      
      console.log('\n🎉 Bridge is healthy and operational!');
      return true;
      
    } else {
      console.log('❌ OAuth credentials incomplete');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Bridge test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running: npm run dev');
    }
    
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBridge();
}

export { testBridge };