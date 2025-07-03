/**
 * Test OAuth Backend and Fix Token Exchange
 * Diagnose and fix the token exchange failure
 */

async function testOAuthBackend() {
  console.log('🔍 DIAGNOSING OAUTH TOKEN EXCHANGE FAILURE');
  console.log('='.repeat(60));
  
  try {
    // 1. Check backend health
    console.log('1. Checking OAuth backend health...');
    const healthResponse = await fetch('https://dir.engageautomations.com/');
    console.log(`Backend status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ OAuth backend is responding');
    } else {
      console.log('❌ OAuth backend health check failed');
      return;
    }
    
    // 2. Check installations endpoint
    console.log('\n2. Checking installations endpoint...');
    const installResponse = await fetch('https://dir.engageautomations.com/installations');
    
    if (installResponse.ok) {
      const installData = await installResponse.json();
      console.log(`Current installations: ${installData.count}`);
      
      if (installData.count > 0) {
        console.log('Recent installations:');
        installData.installations.forEach((inst, i) => {
          console.log(`  ${i+1}. ID: ${inst.id}, Active: ${inst.active}, Created: ${inst.created_at}`);
        });
      }
    } else {
      console.log('❌ Installations endpoint failed');
    }
    
    // 3. Test token exchange manually
    console.log('\n3. Testing token exchange process...');
    const authCode = '545557cf021700a26b6643379173ad4b20becc79';
    
    console.log(`Testing with auth code: ${authCode}`);
    
    // Direct token exchange test
    const tokenExchangeResult = await testTokenExchange(authCode);
    
    if (tokenExchangeResult.success) {
      console.log('✅ Token exchange working');
      console.log(`Access token received: ${tokenExchangeResult.data.access_token ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Token exchange failed');
      console.log(`Error: ${tokenExchangeResult.error}`);
      
      // Analyze the error
      if (tokenExchangeResult.error.includes('invalid_grant')) {
        console.log('\n🔍 DIAGNOSIS: Authorization code expired or invalid');
        console.log('Auth codes expire quickly (usually 10 minutes)');
        console.log('Need fresh installation attempt');
      } else if (tokenExchangeResult.error.includes('invalid_client')) {
        console.log('\n🔍 DIAGNOSIS: OAuth credentials issue');
        console.log('Client ID or secret may be incorrect');
      } else {
        console.log('\n🔍 DIAGNOSIS: Unknown token exchange error');
        console.log('May need to check OAuth backend configuration');
      }
    }
    
    // 4. Check OAuth configuration
    console.log('\n4. Checking OAuth configuration...');
    await checkOAuthConfig();
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

async function testTokenExchange(authCode) {
  try {
    console.log('Making direct token exchange request...');
    
    const tokenData = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback',
      client_id: process.env.GHL_CLIENT_ID || 'your-client-id',
      client_secret: process.env.GHL_CLIENT_SECRET || 'your-client-secret',
      user_type: 'location'
    };
    
    const formData = new URLSearchParams();
    Object.keys(tokenData).forEach(key => {
      formData.append(key, tokenData[key]);
    });
    
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData
    });
    
    console.log(`Token exchange response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        error: `${response.status}: ${error}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function checkOAuthConfig() {
  try {
    console.log('Checking OAuth backend configuration...');
    
    // Test if backend has proper OAuth credentials
    const testResponse = await fetch('https://dir.engageautomations.com/test-config', {
      method: 'GET'
    });
    
    if (testResponse.ok) {
      const configData = await testResponse.json();
      console.log('✅ OAuth configuration endpoint responding');
    } else {
      console.log('⚠️ OAuth configuration endpoint not available');
    }
    
  } catch (error) {
    console.log('Configuration check failed:', error.message);
  }
}

// Run with instructions
console.log('📋 OAUTH TOKEN EXCHANGE DIAGNOSTIC');
console.log('');
console.log('This script will help diagnose the token exchange failure');
console.log('');
console.log('Common issues:');
console.log('1. Authorization code expired (codes expire in ~10 minutes)');
console.log('2. OAuth credentials mismatch');
console.log('3. Backend configuration issues');
console.log('');
console.log('Running diagnostic...');
console.log('');

testOAuthBackend().catch(console.error);