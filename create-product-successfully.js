#!/usr/bin/env node

/**
 * Create Product Successfully with Valid OAuth Token
 * Uses the working access token from your fresh installation
 */

import https from 'https';

const installationId = 'install_1751436979939';
const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q';

// Extract location ID from token
function extractLocationId(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.authClassId || null;
  } catch (error) {
    console.log('Error extracting location ID:', error.message);
    return null;
  }
}

// Create product in GoHighLevel
async function createProduct() {
  console.log('🚀 Creating Product in GoHighLevel with Valid OAuth Token');
  console.log('='.repeat(60));
  
  const locationId = extractLocationId(accessToken);
  console.log('Location ID:', locationId);
  console.log('Token Length:', accessToken.length);
  
  const productData = {
    name: 'Premium Car Detailing Service',
    description: 'Professional exterior and interior car detailing with eco-friendly products and expert care. Complete wash, wax, vacuum, and detail service for premium results.',
    type: 'DIGITAL',
    locationId: locationId
  };

  console.log('\nProduct Data:');
  console.log('- Name:', productData.name);
  console.log('- Description:', productData.description.substring(0, 60) + '...');
  console.log('- Type:', productData.type);
  console.log('- Location ID:', productData.locationId);

  return new Promise((resolve) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/products/',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Version': '2021-07-28'
      }
    };

    console.log('\n📡 Making Request to GoHighLevel Products API...');
    console.log('URL: https://services.leadconnectorhq.com/products/');

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('\n✅ SUCCESS! Product Created in GoHighLevel!');
            console.log('Product ID:', response.id);
            console.log('Product Name:', response.name);
            console.log('Product Type:', response.type);
            console.log('Location ID:', response.locationId);
            console.log('Created At:', response.createdAt);
            
            resolve({
              success: true,
              productId: response.id,
              product: response
            });
          } else {
            console.log('\n⚠️ Product Creation Failed');
            console.log('Status Code:', res.statusCode);
            console.log('Error Message:', response.message || response.error);
            console.log('Full Response:', JSON.stringify(response, null, 2));
            
            resolve({
              success: false,
              error: response.message || response.error,
              statusCode: res.statusCode
            });
          }
        } catch (parseError) {
          console.log('\n❌ Failed to Parse Response');
          console.log('Parse Error:', parseError.message);
          console.log('Raw Response:', data);
          
          resolve({
            success: false,
            error: 'Failed to parse API response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ Request Failed');
      console.log('Error:', error.message);
      
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Add pricing to the created product
async function addPricing(productId) {
  console.log('\n💰 Adding Pricing to Product...');
  
  const priceData = {
    name: 'Premium Detailing Price',
    amount: 17500, // $175.00 in cents
    currency: 'USD',
    type: 'one_time'
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(priceData);
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: `/products/${productId}/price`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Version': '2021-07-28'
      }
    };

    console.log('Adding price:', priceData);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Pricing Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Pricing Added Successfully!');
            console.log('Price ID:', response.id);
            console.log('Amount:', `$${response.amount / 100}`);
            console.log('Currency:', response.currency);
            
            resolve({
              success: true,
              priceId: response.id,
              price: response
            });
          } else {
            console.log('⚠️ Pricing Failed');
            console.log('Error:', response.message || response.error);
            
            resolve({
              success: false,
              error: response.message || response.error
            });
          }
        } catch (parseError) {
          console.log('❌ Pricing Parse Error:', parseError.message);
          console.log('Raw Response:', data);
          
          resolve({
            success: false,
            error: 'Failed to parse pricing response'
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Pricing Request Failed:', error.message);
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Main function
async function main() {
  console.log('🎯 COMPLETE PRODUCT CREATION TEST WITH VALID OAUTH');
  console.log('Installation ID:', installationId);
  console.log('OAuth Status: Valid with Full Permissions');
  console.log('='.repeat(60));

  // Create product
  const productResult = await createProduct();
  
  if (productResult.success) {
    console.log('\n🎉 PRODUCT CREATION SUCCESSFUL!');
    
    // Add pricing
    const pricingResult = await addPricing(productResult.productId);
    
    if (pricingResult.success) {
      console.log('\n🎉 COMPLETE WORKFLOW SUCCESSFUL!');
      console.log('Product ID:', productResult.productId);
      console.log('Price ID:', pricingResult.priceId);
      console.log('Total Amount: $175.00 USD');
    } else {
      console.log('\n⚠️ Product created but pricing failed');
      console.log('Product ID:', productResult.productId);
      console.log('Pricing Error:', pricingResult.error);
    }
    
    console.log('\n🎯 FINAL RESULTS');
    console.log('='.repeat(60));
    console.log('✅ OAuth Installation: Working');
    console.log('✅ Access Token: Valid');
    console.log('✅ Product Creation: SUCCESS');
    console.log('Product Successfully Created in GoHighLevel Account!');
    
  } else {
    console.log('\n❌ PRODUCT CREATION FAILED');
    console.log('Error:', productResult.error);
    console.log('Status Code:', productResult.statusCode);
  }
}

main().catch(console.error);