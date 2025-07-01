const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function createMakerExpressedProduct() {
  try {
    console.log('=== Creating Maker Expressed Product ===');
    
    // Get the latest installation
    const installResponse = await axios.get('https://dir.engageautomations.com/installations');
    
    if (!installResponse.data.installations || installResponse.data.installations.length === 0) {
      console.log('❌ No OAuth installations found. Please reconnect first.');
      console.log('Visit: https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https://dir.engageautomations.com/api/oauth/callback&client_id=675e4251e4b0e7a613050be3&scope=businesses.readonly%20businesses.write%20calendars.readonly%20calendars.write%20campaigns.readonly%20campaigns.write%20companies.readonly%20companies.write%20contacts.readonly%20contacts.write%20conversations.readonly%20conversations.write%20courses.readonly%20courses.write%20forms.readonly%20forms.write%20links.readonly%20links.write%20locations.readonly%20locations.write%20medias.readonly%20medias.write%20opportunities.readonly%20opportunities.write%20payments.write%20products.readonly%20products.write%20snapshots.readonly%20surveys.readonly%20surveys.write%20users.readonly%20users.write%20workflows.readonly%20workflows.write');
      return;
    }
    
    const installation = installResponse.data.installations[0];
    console.log('Using installation:', installation.id);
    console.log('Location:', installation.locationId);
    
    // Step 1: Upload the Maker Expressed logo
    console.log('\n--- Step 1: Uploading Maker Expressed Logo ---');
    
    const logoPath = 'attached_assets/Full_Logo (1) 1_1751332270007.png';
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found:', logoPath);
      return;
    }
    
    console.log('Logo file found, uploading to GoHighLevel media library...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(logoPath), {
      filename: 'maker-expressed-logo.png',
      contentType: 'image/png'
    });
    
    try {
      const uploadResponse = await axios.post('https://dir.engageautomations.com/api/images/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'installation_id': installation.id
        },
        timeout: 30000
      });
      
      console.log('✅ Logo uploaded successfully!');
      console.log('Media ID:', uploadResponse.data.mediaId);
      console.log('URL:', uploadResponse.data.url);
      
      const logoMediaId = uploadResponse.data.mediaId;
      
      // Step 2: Create the Maker Expressed product with logo
      console.log('\n--- Step 2: Creating Maker Expressed Product ---');
      
      const productData = {
        name: "Maker Expressed - Premium Design Services",
        description: "Professional design and branding services by Maker Expressed. Transform your brand with our premium design solutions including logos, branding packages, and visual identity development.",
        type: "SERVICE", // Use SERVICE for design services
        sku: "MAKER-EXPRESS-001",
        currency: "USD",
        mediaIds: [logoMediaId], // Attach the uploaded logo
        installation_id: installation.id
      };
      
      const productResponse = await axios.post('https://dir.engageautomations.com/api/products/create', productData);
      
      console.log('✅ Product created successfully!');
      console.log('Product ID:', productResponse.data.product.id);
      console.log('Product Name:', productResponse.data.product.name);
      
      const productId = productResponse.data.product.id;
      
      // Step 3: Add multiple pricing tiers
      console.log('\n--- Step 3: Adding Pricing Tiers ---');
      
      const pricingTiers = [
        {
          name: "Logo Design Package",
          type: "one_time",
          amount: 297.00,
          currency: "USD"
        },
        {
          name: "Complete Branding Package",
          type: "one_time", 
          amount: 597.00,
          currency: "USD"
        },
        {
          name: "Premium Brand Identity",
          type: "one_time",
          amount: 997.00,
          currency: "USD"
        },
        {
          name: "Monthly Design Retainer",
          type: "recurring",
          amount: 497.00,
          currency: "USD"
        }
      ];
      
      const createdPrices = [];
      
      for (let i = 0; i < pricingTiers.length; i++) {
        const price = pricingTiers[i];
        console.log(`Adding price ${i + 1}/${pricingTiers.length}: ${price.name}`);
        
        try {
          const priceResponse = await axios.post(`https://dir.engageautomations.com/api/products/${productId}/prices`, {
            ...price,
            installation_id: installation.id
          });
          
          console.log(`✅ Price created: ${price.name} - $${price.amount}`);
          createdPrices.push({
            name: price.name,
            amount: price.amount,
            type: price.type,
            id: priceResponse.data.price?.id
          });
          
        } catch (priceError) {
          console.log(`❌ Failed to create price: ${price.name}`);
          console.log('Error:', priceError.response?.data || priceError.message);
        }
      }
      
      // Final summary
      console.log('\n=== MAKER EXPRESSED PRODUCT COMPLETE ===');
      console.log(`Product: ${productResponse.data.product.name}`);
      console.log(`Product ID: ${productId}`);
      console.log(`Logo: Attached (Media ID: ${logoMediaId})`);
      console.log(`Prices Created: ${createdPrices.length}/${pricingTiers.length}`);
      
      console.log('\nPricing Summary:');
      createdPrices.forEach(price => {
        console.log(`- ${price.name}: $${price.amount} (${price.type})`);
      });
      
      console.log('\n✅ Complete Maker Expressed product with logo and pricing created in GoHighLevel!');
      
    } catch (uploadError) {
      console.log('❌ Logo upload failed');
      console.log('Error:', uploadError.response?.data || uploadError.message);
    }
    
  } catch (error) {
    console.error('Product creation error:', error.response?.data || error.message);
  }
}

createMakerExpressedProduct();