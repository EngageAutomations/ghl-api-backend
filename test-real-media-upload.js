/**
 * Test Real Media Upload API with Authentic GoHighLevel Credentials
 * Tests directory logo upload functionality with actual account data
 */

import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

// Load real credentials
const CREDENTIALS = {
  access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiV0F2azg3Um1XOXJCU0RKSGVPcEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjg0NzQ5MjRhNTg2YmNlMjJhNmU2NGY3LW1icGtteXU0IiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiV0F2azg3Um1XOXJCU0RKSGVPcEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbInByb2R1Y3RzL3ByaWNlcy53cml0ZSIsInByb2R1Y3RzL3ByaWNlcy5yZWFkb25seSIsInByb2R1Y3RzL2NvbGxlY3Rpb24ud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLnJlYWRvbmx5IiwibWVkaWFzLndyaXRlIiwibWVkaWFzLnJlYWRvbmx5IiwibG9jYXRpb25zLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQifSwiaWF0IjoxNzQ5OTE5MzYyLjQ1OCwiZXhwIjoxNzUwMDA1NzYyLjQ1OH0.v71sEn225JdaEARcaYG70dlAUokXJ5Ri8uvVa-aVIPOOrOt1s67yZWV0TTqv-5YPun0BLD8pvmOzjpzaYBfjmuXQSMvpbzAdM5xABL79pyhpGJ_YInF6NTbxgYkxViq1kTiaUBOyCcBMeKtIsynhq_FVu7dLyJghL8-TaSLYf2E4GKA8WNswN5RdczvyfqKfcytdjhC0k3PO2d3gaE3vFXY6aV9kDmGeFm1fP_Fwg4k0H89qN4uxVeVnFfqPvf9HMJsrkdESfxMRplGYGSbz2Ri7Jl3OwbQpSpObjobDxNVWUpmt3jaVrmqvIdpQY1GZLYrHdFzJruE_QkXJx-FQUylXNAtuSmpFjZ3PNtHJEd_LWzof20ijlyq5qOGv_VuIe3_UtUQa1OKg14qqQr7e-_i6huvIuOJwFZ1kFUJdDzqWQLOZJZGFO0efbgMORxuHmbSRZsN3F2_9yGp70z3ek680kYsmFd32LT29gmPDgo6zBb_o5TLfwGUcqBhg_CK62tYS4vR40SlJhy0XOwIHMQg7dWidrLScp2ksPvvMBXXpFS9vRgDVo5b2KuN0bZE9kyYCOdMp_YxHKx-LHyR5tigjHejWcUuWy6N8nwKYu_Y5fNBA79lvnz5PTIS-QDYynbTmQ83YDsXlrNSNgp9hPZfvc1nbBcC01mpqbbAlnGA",
  location_id: "WAVk87RmW9rBSDJHeOpH"
};

// Create a test image file for upload
function createTestImage() {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#4A90E2" rx="10"/>
  <text x="100" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="24" dy=".3em">
    LOGO
  </text>
  <text x="100" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="12" dy=".3em">
    Directory Test
  </text>
</svg>`;
  
  fs.writeFileSync('test-directory-logo.svg', svgContent);
  return 'test-directory-logo.svg';
}

async function testMediaUpload() {
  console.log('Testing Media Upload API with Real Credentials...');
  
  try {
    // Create test logo
    const logoPath = createTestImage();
    console.log('Created test logo:', logoPath);
    
    // Test 1: List existing media files
    console.log('\n1. Testing Media List API...');
    const listResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${CREDENTIALS.location_id}/medias`, {
      headers: {
        'Authorization': `Bearer ${CREDENTIALS.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10
      }
    });
    
    console.log('Media List Success:', {
      count: listResponse.data.medias?.length || 0,
      totalCount: listResponse.data.meta?.total || 0
    });
    
    // Test 2: Upload directory logo
    console.log('\n2. Testing Media Upload API...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(logoPath));
    formData.append('altText', 'Directory Logo Upload Test');
    
    const uploadResponse = await axios.post(
      `https://services.leadconnectorhq.com/locations/${CREDENTIALS.location_id}/medias/upload-file`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${CREDENTIALS.access_token}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('Media Upload Success:', {
      id: uploadResponse.data.id,
      url: uploadResponse.data.url,
      name: uploadResponse.data.name,
      type: uploadResponse.data.type
    });
    
    // Test 3: Verify uploaded file
    console.log('\n3. Verifying Uploaded File...');
    const verifyResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${CREDENTIALS.location_id}/medias/${uploadResponse.data.id}`, {
      headers: {
        'Authorization': `Bearer ${CREDENTIALS.access_token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Verification Success:', {
      id: verifyResponse.data.id,
      url: verifyResponse.data.url,
      uploadedAt: verifyResponse.data.dateAdded
    });
    
    // Cleanup
    fs.unlinkSync(logoPath);
    
    return {
      success: true,
      uploadedFile: {
        id: uploadResponse.data.id,
        url: uploadResponse.data.url,
        name: uploadResponse.data.name
      },
      message: 'Directory logo upload functionality confirmed working with real account'
    };
    
  } catch (error) {
    console.error('Media Upload Test Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

async function testRailwayBackendAPI() {
  console.log('\nTesting Railway Backend Universal API...');
  
  try {
    // Test through Railway backend
    const railwayResponse = await axios.get('https://dir.engageautomations.com/api/ghl/media', {
      headers: {
        'Accept': 'application/json'
      },
      params: {
        limit: 5
      }
    });
    
    console.log('Railway Backend API Success:', {
      success: railwayResponse.data.success,
      count: railwayResponse.data.data?.medias?.length || 0
    });
    
    return {
      success: true,
      message: 'Railway backend API confirmed working'
    };
    
  } catch (error) {
    console.error('Railway Backend Test Failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Testing Real Media Upload Functionality...\n');
  
  console.log('📊 Using Real Credentials:');
  console.log('- Location ID:', CREDENTIALS.location_id);
  console.log('- Token Status: Valid until June 15, 2025');
  console.log('- Scopes: medias.write, medias.readonly\n');
  
  // Test direct GoHighLevel API
  const directTest = await testMediaUpload();
  
  // Test Railway backend API
  const railwayTest = await testRailwayBackendAPI();
  
  console.log('\n📋 Summary:');
  console.log('Direct API:', directTest.success ? '✅ Working' : '❌ Failed');
  console.log('Railway API:', railwayTest.success ? '✅ Working' : '❌ Failed');
  
  if (directTest.success) {
    console.log('\n🎯 SUCCESS: Directory logo upload API confirmed working!');
    console.log('Your GoHighLevel account can successfully upload and manage media files.');
    console.log('The system is ready for production directory functionality.');
  } else {
    console.log('\n⚠️ Issues detected with media upload functionality');
    console.log('Check authentication scope and permissions');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testMediaUpload, testRailwayBackendAPI };