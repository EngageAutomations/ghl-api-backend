/**
 * Find Active Railway Installation
 * Discovers the current active installation on Railway backend
 */

const RAILWAY_URL = 'https://dir.engageautomations.com';

async function findActiveInstallation() {
  console.log('=== FINDING ACTIVE RAILWAY INSTALLATION ===');
  
  // Try different approaches to find the active installation
  const methods = [
    // Method 1: Try with empty installation_id to get error details
    async () => {
      const response = await fetch(`${RAILWAY_URL}/api/ghl/products`);
      const text = await response.text();
      console.log('Empty request response:', text);
      return null;
    },
    
    // Method 2: Try common installation ID patterns
    async () => {
      const patterns = [
        'install_1750191250983',
        'install_1',
        'install_2',
        'default',
        'main',
        '1'
      ];
      
      for (const id of patterns) {
        try {
          const response = await fetch(`${RAILWAY_URL}/api/ghl/products?installation_id=${id}&limit=1`);
          const data = await response.json();
          
          if (data.success) {
            console.log(`✅ Found working installation: ${id}`);
            return { installationId: id, data };
          } else {
            console.log(`❌ Installation ${id}: ${data.error}`);
          }
        } catch (error) {
          console.log(`❌ Installation ${id}: ${error.message}`);
        }
      }
      return null;
    },
    
    // Method 3: Try to access root level endpoints that might show installation info
    async () => {
      try {
        const response = await fetch(`${RAILWAY_URL}/api`);
        const text = await response.text();
        console.log('API root response length:', text.length);
        
        // Look for installation references in response
        if (text.includes('install_')) {
          const matches = text.match(/install_[\w\d]+/g);
          if (matches) {
            console.log('Found installation references:', matches);
            return matches[0];
          }
        }
        return null;
      } catch (error) {
        console.log('API root check failed:', error.message);
        return null;
      }
    }
  ];
  
  for (let i = 0; i < methods.length; i++) {
    console.log(`\n--- Method ${i + 1} ---`);
    const result = await methods[i]();
    if (result) {
      return result;
    }
  }
  
  return null;
}

// Run the search
findActiveInstallation()
  .then(result => {
    if (result) {
      console.log('\n✅ SUCCESS: Found active installation');
      console.log('Result:', result);
    } else {
      console.log('\n❌ No active installation found');
      console.log('Railway backend shows 1 installation but ID is not accessible via API');
    }
  })
  .catch(error => {
    console.error('Error finding installation:', error.message);
  });