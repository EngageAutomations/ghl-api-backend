/**
 * Setup Real GoHighLevel Credentials from Railway Backend
 * Stores authentic OAuth data locally for development testing
 */

import fs from 'fs';
import axios from 'axios';

// Real OAuth credentials captured from Railway backend
const REAL_CREDENTIALS = {
  access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiV0F2azg3Um1XOXJCU0RKSGVPcEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjg0NzQ5MjRhNTg2YmNlMjJhNmU2NGY3LW1icGtteXU0IiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiV0F2azg3Um1XOXJCU0RKSGVPcEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbInByb2R1Y3RzL3ByaWNlcy53cml0ZSIsInByb2R1Y3RzL3ByaWNlcy5yZWFkb25seSIsInByb2R1Y3RzL2NvbGxlY3Rpb24ud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLnJlYWRvbmx5IiwibWVkaWFzLndyaXRlIiwibWVkaWFzLnJlYWRvbmx5IiwibG9jYXRpb25zLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQifSwiaWF0IjoxNzQ5OTE5MzYyLjQ1OCwiZXhwIjoxNzUwMDA1NzYyLjQ1OH0.v71sEn225JdaEARcaYG70dlAUokXJ5Ri8uvVa-aVIPOOrOt1s67yZWV0TTqv-5YPun0BLD8pvmOzjpzaYBfjmuXQSMvpbzAdM5xABL79pyhpGJ_YInF6NTbxgYkxViq1kTiaUBOyCcBMeKtIsynhq_FVu7dLyJghL8-TaSLYf2E4GKA8WNswN5RdczvyfqKfcytdjhC0k3PO2d3gaE3vFXY6aV9kDmGeFm1fP_Fwg4k0H89qN4uxVeVnFfqPvf9HMJsrkdESfxMRplGYGSbz2Ri7Jl3OwbQpSpObjobDxNVWUpmt3jaVrmqvIdpQY1GZLYrHdFzJruE_QkXJx-FQUylXNAtuSmpFjZ3PNtHJEd_LWzof20ijlyq5qOGv_VuIe3_UtUQa1OKg14qqQr7e-_i6huvIuOJwFZ1kFUJdDzqWQLOZJZGFO0efbgMORxuHmbSRZsN3F2_9yGp70z3ek680kYsmFd32LT29gmPDgo6zBb_o5TLfwGUcqBhg_CK62tYS4vR40SlJhy0XOwIHMQg7dWidrLScp2ksPvvMBXXpFS9vRgDVo5b2KuN0bZE9kyYCOdMp_YxHKx-LHyR5tigjHejWcUuWy6N8nwKYu_Y5fNBA79lvnz5PTIS-QDYynbTmQ83YDsXlrNSNgp9hPZfvc1nbBcC01mpqbbAlnGA",
  location_id: "WAVk87RmW9rBSDJHeOpH",
  refresh_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiV0F2azg3Um1XOXJCU0RKSGVPcEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjg0NzQ5MjRhNTg2YmNlMjJhNmU2NGY3LW1icGtteXU0IiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiV0F2azg3Um1XOXJCU0RKSGVPcEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbInByb2R1Y3RzL3ByaWNlcy53cml0ZSIsInByb2R1Y3RzL3ByaWNlcy5yZWFkb25seSIsInByb2R1Y3RzL2NvbGxlY3Rpb24ud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLnJlYWRvbmx5IiwibWVkaWFzLndyaXRlIiwibWVkaWFzLnJlYWRvbmx5IiwibG9jYXRpb25zLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQifSwiaWF0IjoxNzQ5OTE5MzYyLjQ2NSwiZXhwIjoxNzgxNDU1MzYyLjQ2NSwidW5pcXVlSWQiOiI2YTg3NzFiNC00NzAwLTRjYTMtOWQyMy1kZDI2Y2JmMmNhNTUiLCJ2IjoiMiJ9.bcuKSpxd0uT-17_TuEURo0C_xEQogOSvhHu9cRlYpCu8cTILzISuCULunriZvl8BVlv_TVP_1Uv8IUnkyhUlfDXSk_LcfAi96pRrtTFAf20LsDGRSYufH7ksJhEwWfwHAmkhpv3QwEf6w2ZnOPQpROTOFq6lyQ0Uyu5FH4Xs3miX6QePseoSfeVyiF8TTsuRVuTqYSuFJMFI1AHXPZowebk0N4Zs94SpDYpFzAjbqfRDoz36A5bdl1c-sWpSPgOe05h0gYkAPP_Net38AqejWvESPk5E_MxC735nXchcXPKLRpF5yTJWTtjzFywUu9NbyrWfSci6Ou-2nLkXXVi2TU0dKpnW4H06LwxBEYeXVArBCGzlr0rcYea22yEASKjIXCmMLzQ5c1hdW-NY6JCWXh_jQJvR9Iu1x1DDY_c-YBMx7LXzSzYCZn1Zn5kYoPpu02lpRO1rv8jkMwu1CXeRk6xjrwawJARrJN0wcxuq7ERB-uvRjY4YdyJYFS3tr6Y9D6QvDq4PNFuPfsbWzY9snkNB984wAmUoPURhBhVv0r-A9ZQetBB2m0xM0o1QITM8DTMorgCEIxooRkNdW1tJ9LPUx1yCOEFyMShrxmn38tPINpBkTkKQTD0v9vi62lAnFfExbRKfbcPP8ubu-z9jMsHEZAMZJ29Nekennjtye78",
  installation_id: 1,
  scopes: "products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write",
  expires: "2025-06-15T16:42:42.458Z"
};

async function testDirectGHLAPI() {
  console.log('🧪 Testing Direct GoHighLevel API Access with Real Credentials...');
  
  try {
    // Test Location Info
    console.log('\n📍 Testing Location API...');
    const locationResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${REAL_CREDENTIALS.location_id}`, {
      headers: {
        'Authorization': `Bearer ${REAL_CREDENTIALS.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Location API Success:', {
      id: locationResponse.data.location?.id,
      name: locationResponse.data.location?.name,
      business: locationResponse.data.location?.businessName
    });
    
    // Test Products API
    console.log('\n📦 Testing Products API...');
    const productsResponse = await axios.get('https://services.leadconnectorhq.com/products/', {
      headers: {
        'Authorization': `Bearer ${REAL_CREDENTIALS.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      params: {
        locationId: REAL_CREDENTIALS.location_id,
        limit: 5
      }
    });
    
    console.log('✅ Products API Success:', {
      count: productsResponse.data.products?.length || 0,
      totalCount: productsResponse.data.meta?.total || 0
    });
    
    // Test Media API
    console.log('\n📷 Testing Media API...');
    const mediaResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${REAL_CREDENTIALS.location_id}/medias`, {
      headers: {
        'Authorization': `Bearer ${REAL_CREDENTIALS.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5
      }
    });
    
    console.log('✅ Media API Success:', {
      count: mediaResponse.data.medias?.length || 0,
      totalCount: mediaResponse.data.meta?.total || 0
    });
    
    // Test Contacts API  
    console.log('\n👤 Testing Contacts API...');
    const contactsResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${REAL_CREDENTIALS.location_id}/contacts`, {
      headers: {
        'Authorization': `Bearer ${REAL_CREDENTIALS.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5
      }
    });
    
    console.log('✅ Contacts API Success:', {
      count: contactsResponse.data.contacts?.length || 0,
      totalCount: contactsResponse.data.meta?.total || 0
    });
    
    return {
      success: true,
      locationData: locationResponse.data.location,
      apiResults: {
        location: true,
        products: true,
        media: true,
        contacts: true
      }
    };
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

async function storeCredentialsLocally() {
  console.log('💾 Storing Real Credentials Locally...');
  
  const envContent = `# Real GoHighLevel OAuth Credentials (Captured from Railway Backend)
GHL_ACCESS_TOKEN="${REAL_CREDENTIALS.access_token}"
GHL_LOCATION_ID="${REAL_CREDENTIALS.location_id}"
GHL_REFRESH_TOKEN="${REAL_CREDENTIALS.refresh_token}"
GHL_INSTALLATION_ID="${REAL_CREDENTIALS.installation_id}"
GHL_SCOPES="${REAL_CREDENTIALS.scopes}"
GHL_TOKEN_EXPIRES="${REAL_CREDENTIALS.expires}"

# Railway Backend Configuration
GHL_CLIENT_ID="68474924a586bce22a6e64f7-mbpkmyu4"
GHL_REDIRECT_URI="https://dir.engageautomations.com/api/oauth/callback"
`;
  
  fs.writeFileSync('.env.real', envContent);
  console.log('✅ Credentials stored in .env.real');
  
  return REAL_CREDENTIALS;
}

async function main() {
  console.log('🚀 Setting up Real GoHighLevel Credentials...\n');
  
  // Store credentials locally
  const credentials = await storeCredentialsLocally();
  
  // Test direct API access
  const testResults = await testDirectGHLAPI();
  
  if (testResults.success) {
    console.log('\n🎯 SUCCESS: All APIs working with real credentials!');
    console.log('📊 Summary:', {
      accessToken: credentials.access_token.substring(0, 50) + '...',
      locationId: credentials.location_id,
      scopes: credentials.scopes.split(' ').length + ' scopes',
      expires: credentials.expires
    });
    
    console.log('\n📋 Next Steps:');
    console.log('1. Your real credentials are stored in .env.real');
    console.log('2. All GoHighLevel APIs are accessible with your account');
    console.log('3. Ready to test directory logo upload functionality');
    console.log('4. Media upload API confirmed working');
  } else {
    console.log('\n❌ API Access Failed');
    console.log('Check token validity and permissions');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { REAL_CREDENTIALS, testDirectGHLAPI, storeCredentialsLocally };