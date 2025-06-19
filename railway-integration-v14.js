/**
 * Railway Backend v1.4.0 Integration
 * Works with the actual Railway backend structure
 */

const RAILWAY_BASE_URL = 'https://dir.engageautomations.com';

class RailwayIntegration {
  constructor() {
    this.baseUrl = RAILWAY_BASE_URL;
    this.installationId = null;
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBackendInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testConnection(installationId = 'install_seed') {
    try {
      const response = await fetch(`${this.baseUrl}/api/ghl/test-connection?installation_id=${installationId}`);
      const data = await response.json();
      
      if (data.success) {
        this.installationId = installationId;
        return { success: true, data, installationId };
      }
      
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getProducts(installationId = this.installationId, limit = 20, offset = 0) {
    if (!installationId) {
      return { success: false, error: 'No installation ID provided' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/ghl/products?installation_id=${installationId}&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createProduct(productData, installationId = this.installationId) {
    if (!installationId) {
      return { success: false, error: 'No installation ID provided' };
    }

    try {
      const payload = {
        installation_id: installationId,
        name: productData.name,
        description: productData.description,
        productType: productData.productType || 'DIGITAL',
        price: productData.price
      };

      const response = await fetch(`${this.baseUrl}/api/ghl/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createContact(contactData, installationId = this.installationId) {
    if (!installationId) {
      return { success: false, error: 'No installation ID provided' };
    }

    try {
      const payload = {
        installation_id: installationId,
        firstName: contactData.firstName || 'Test',
        lastName: contactData.lastName || 'Contact',
        email: contactData.email || `test${Date.now()}@example.com`,
        phone: contactData.phone
      };

      const response = await fetch(`${this.baseUrl}/api/ghl/contacts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async uploadMedia(file, installationId = this.installationId) {
    if (!installationId) {
      return { success: false, error: 'No installation ID provided' };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('installation_id', installationId);

      const response = await fetch(`${this.baseUrl}/api/ghl/media/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkOAuthStatus(installationId = this.installationId) {
    if (!installationId) {
      return { success: false, error: 'No installation ID provided' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/status?installation_id=${installationId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getOAuthUrl() {
    return `${this.baseUrl}/oauth/callback`;
  }

  async discoverValidInstallation() {
    console.log('Discovering valid Railway installation...');
    
    // Try common installation patterns
    const patterns = [
      'install_seed',
      'install_1', 
      'install_2',
      'install_3'
    ];

    for (const pattern of patterns) {
      console.log(`Testing installation: ${pattern}`);
      const result = await this.testConnection(pattern);
      
      if (result.success) {
        console.log(`Found valid installation: ${pattern}`);
        this.installationId = pattern;
        return { success: true, installationId: pattern, data: result.data };
      }
    }

    // Try timestamp-based patterns (last 24 hours)
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    for (let timestamp = now; timestamp > dayAgo; timestamp -= (60 * 60 * 1000)) {
      const id = `install_${Math.floor(timestamp)}`;
      const result = await this.testConnection(id);
      
      if (result.success) {
        console.log(`Found valid installation: ${id}`);
        this.installationId = id;
        return { success: true, installationId: id, data: result.data };
      }
    }

    return { success: false, error: 'No valid installation found' };
  }

  async getInstallationSummary() {
    const health = await this.checkBackendHealth();
    const info = await this.getBackendInfo();
    const discovery = await this.discoverValidInstallation();

    return {
      backend: {
        health: health.success,
        info: info.data,
        url: this.baseUrl
      },
      installation: {
        found: discovery.success,
        id: discovery.installationId,
        data: discovery.data
      },
      endpoints: {
        oauth: this.getOAuthUrl(),
        products: `${this.baseUrl}/api/ghl/products`,
        media: `${this.baseUrl}/api/ghl/media/upload`,
        contacts: `${this.baseUrl}/api/ghl/contacts/create`
      }
    };
  }
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RailwayIntegration;
}

// Global for browser usage
if (typeof window !== 'undefined') {
  window.RailwayIntegration = RailwayIntegration;
}

// CLI execution
async function runIntegrationCheck() {
  const integration = new RailwayIntegration();
  
  try {
    const summary = await integration.getInstallationSummary();
    console.log('=== RAILWAY INTEGRATION SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('Integration check failed:', error);
  }
}

// Run if executed directly
runIntegrationCheck();