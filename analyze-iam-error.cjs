/**
 * Analyze IAM Error Details
 * Get comprehensive details on the media upload IAM restriction
 */

const https = require('https');

async function analyzeIAMError() {
  console.log('🔍 ANALYZING IAM ERROR DETAILS');
  console.log('Deep dive into media upload permission restrictions');
  console.log('='.repeat(60));
  
  try {
    // Get access token
    const tokenResponse = await fetch('https://dir.engageautomations.com/api/token-access/install_1751522189429');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Got access token');
    
    // Decode JWT token for detailed analysis
    console.log('\n🎫 JWT TOKEN ANALYSIS');
    const tokenParts = tokenData.access_token.split('.');
    if (tokenParts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        
        console.log('📋 Token Header:', JSON.stringify(header, null, 2));
        console.log('📋 Token Payload:', JSON.stringify(payload, null, 2));
        
        console.log('\n🔐 SCOPE ANALYSIS:');
        const scopes = payload.oauthMeta?.scopes || [];
        scopes.forEach(scope => {
          console.log(`  ${scope.includes('media') ? '📸' : '📦'} ${scope}`);
        });
        
        console.log('\n🏢 AUTH CLASS DETAILS:');
        console.log(`  Auth Class: ${payload.authClass}`);
        console.log(`  Auth Class ID: ${payload.authClassId}`);
        console.log(`  Primary Auth Class ID: ${payload.primaryAuthClassId}`);
        console.log(`  Source: ${payload.source}`);
        console.log(`  Channel: ${payload.channel}`);
        
      } catch (error) {
        console.log('❌ Could not decode JWT token:', error.message);
      }
    }
    
    // Test media upload with detailed error capture
    console.log('\n📸 DETAILED MEDIA UPLOAD ERROR ANALYSIS');
    
    const mediaEndpoints = [
      {
        url: 'https://services.leadconnectorhq.com/medias/upload-file',
        method: 'POST',
        description: 'Standard media upload endpoint'
      },
      {
        url: 'https://services.leadconnectorhq.com/medias',
        method: 'GET',
        description: 'List existing media (test access)'
      },
      {
        url: `https://services.leadconnectorhq.com/locations/${tokenData.location_id}/medias`,
        method: 'GET',
        description: 'Location-specific media list'
      }
    ];
    
    for (const endpoint of mediaEndpoints) {
      console.log(`\n🧪 Testing: ${endpoint.description}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const result = await makeDetailedRequest(endpoint.url, endpoint.method, tokenData.access_token);
      
      console.log(`   📊 Status: ${result.statusCode}`);
      console.log(`   📋 Headers: ${JSON.stringify(result.headers, null, 4)}`);
      console.log(`   📄 Response: ${result.response}`);
      
      if (result.statusCode === 401) {
        try {
          const errorData = JSON.parse(result.response);
          console.log('   🔍 IAM Error Details:');
          console.log(`      Message: ${errorData.message}`);
          console.log(`      Status Code: ${errorData.statusCode}`);
          console.log(`      Error Type: ${errorData.error || 'Not specified'}`);
          
          if (errorData.message.includes('authClass')) {
            console.log('   💡 Auth Class Issue: The authentication class type is restricted');
            console.log('   🔧 Possible Solutions:');
            console.log('      - Contact GoHighLevel support to enable media scope for this auth class');
            console.log('      - Request different OAuth app configuration');
            console.log('      - Use agency-level authentication instead of location-level');
          }
          
          if (errorData.message.includes('IAM')) {
            console.log('   💡 IAM Service Issue: Identity and Access Management restriction');
            console.log('   🔧 Possible Solutions:');
            console.log('      - IAM service may not be configured for this route');
            console.log('      - Route may require different authentication method');
            console.log('      - API version compatibility issue');
          }
          
        } catch (parseError) {
          console.log('   ⚠️ Non-JSON error response');
        }
      }
    }
    
    // Test with different authentication approaches
    console.log('\n🔐 TESTING ALTERNATIVE AUTHENTICATION APPROACHES');
    
    const authVariations = [
      {
        name: 'Standard Bearer Token',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28'
        }
      },
      {
        name: 'Without Version Header',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      },
      {
        name: 'With Location Header',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2021-07-28',
          'Location-Id': tokenData.location_id
        }
      },
      {
        name: 'Different API Version',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Version': '2022-02-01'
        }
      }
    ];
    
    for (const auth of authVariations) {
      console.log(`\n🧪 Testing: ${auth.name}`);
      
      const result = await makeRequestWithHeaders(
        'https://services.leadconnectorhq.com/medias',
        'GET',
        auth.headers
      );
      
      console.log(`   📊 Status: ${result.statusCode}`);
      if (result.statusCode !== 401) {
        console.log(`   ✅ Different result with ${auth.name}!`);
        console.log(`   📋 Response: ${result.response.substring(0, 200)}`);
      } else {
        console.log(`   ❌ Still 401 with ${auth.name}`);
      }
    }
    
    // Check if there are working media-related endpoints
    console.log('\n🔍 CHECKING ALTERNATIVE MEDIA OPERATIONS');
    
    const alternativeEndpoints = [
      'https://services.leadconnectorhq.com/medias/library',
      'https://services.leadconnectorhq.com/media',
      'https://services.leadconnectorhq.com/files',
      'https://services.leadconnectorhq.com/assets'
    ];
    
    for (const endpoint of alternativeEndpoints) {
      console.log(`\n🧪 Testing alternative: ${endpoint}`);
      
      const result = await makeDetailedRequest(endpoint, 'GET', tokenData.access_token);
      console.log(`   📊 Status: ${result.statusCode}`);
      
      if (result.statusCode === 200) {
        console.log('   ✅ Found working media endpoint!');
        console.log(`   📋 Response: ${result.response.substring(0, 200)}`);
      } else if (result.statusCode !== 401 && result.statusCode !== 404) {
        console.log(`   💡 Different response: ${result.response.substring(0, 100)}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

async function makeDetailedRequest(url, method, accessToken, body = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const postData = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Version': '2021-07-28'
      }
    };
    
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        headers: {},
        response: `Request error: ${error.message}`
      });
    });

    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function makeRequestWithHeaders(url, method, customHeaders) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: customHeaders
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          response: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        response: `Request error: ${error.message}`
      });
    });

    req.end();
  });
}

analyzeIAMError().catch(console.error);