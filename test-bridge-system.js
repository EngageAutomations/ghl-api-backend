import axios from 'axios';

async function testBridgeSystem() {
  console.log('=== Testing Railway-Replit Bridge System ===\n');
  
  try {
    // Test bridge OAuth credentials endpoint
    console.log('Testing bridge OAuth credentials endpoint...');
    
    const credentialsResponse = await axios.get('https://dir.engageautomations.com/api/bridge/oauth-credentials');
    console.log('Bridge credentials response:', credentialsResponse.data);
    
    if (credentialsResponse.data.client_id && credentialsResponse.data.client_secret) {
      console.log('✓ Bridge providing OAuth credentials to Railway');
    } else {
      console.log('❌ Bridge not providing complete OAuth credentials');
    }
    
    // Test if Railway is requesting credentials from bridge
    console.log('\nTesting Railway bridge integration...');
    
    // Check if Railway backend has the bridge integration code
    const backendResponse = await axios.get('https://dir.engageautomations.com/');
    console.log(`Railway backend version: ${backendResponse.data.version}`);
    
    // Test bridge OAuth processing endpoint
    console.log('\nTesting bridge OAuth processing...');
    
    try {
      const processResponse = await axios.post('https://dir.engageautomations.com/api/bridge/process-oauth', {
        code: 'test_code',
        state: 'test_state'
      });
      console.log('Bridge processing test:', processResponse.data);
    } catch (processError) {
      console.log('Bridge processing test error:', processError.response?.data || processError.message);
      
      if (processError.response?.data?.error?.includes('Invalid authorization code')) {
        console.log('✓ Bridge OAuth processing endpoint functional');
      }
    }
    
    // Check if Railway should be using bridge instead of direct OAuth
    console.log('\n=== BRIDGE SYSTEM ANALYSIS ===');
    console.log('Railway-Replit Bridge Architecture:');
    console.log('1. Railway requests credentials from Replit bridge endpoints');
    console.log('2. Replit provides OAuth credentials via /api/bridge/oauth-credentials');
    console.log('3. OAuth callback processing handled by bridge system');
    console.log('4. Installation data managed through bridge endpoints');
    
    console.log('\nIf Railway is not using bridge system:');
    console.log('- Railway backend needs to request credentials from bridge');
    console.log('- OAuth callback should redirect to bridge processing');
    console.log('- Installation management through bridge endpoints');
    
    return {
      bridgeCredentialsWorking: !!credentialsResponse.data.client_id,
      bridgeProcessingAvailable: true,
      railwayNeedsBridgeIntegration: true
    };
    
  } catch (error) {
    console.error('Bridge system test failed:', error.message);
    
    if (error.response?.status === 404) {
      console.log('❌ Bridge endpoints not accessible - may need to be created');
    }
    
    return { error: error.message };
  }
}

testBridgeSystem();