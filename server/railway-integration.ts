import axios from 'axios';

// Railway backend configuration
const RAILWAY_BACKEND_URL = process.env.RAILWAY_BACKEND_URL || 'https://dir.engageautomations.com';

interface RailwayInstallation {
  id: string;
  accessToken: string;
  locationId: string;
  scopes: string;
  tokenStatus: string;
  createdAt: string;
}

interface RailwayHealthCheck {
  status: string;
  timestamp: string;
  hasToken: boolean;
  installations: number;
  installationIds: string[];
}

export class RailwayIntegration {
  private baseUrl: string;

  constructor(baseUrl: string = RAILWAY_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check Railway backend health and available installations
   */
  async getHealthStatus(): Promise<RailwayHealthCheck> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Railway backend health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get OAuth status for a specific installation
   */
  async getOAuthStatus(installationId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/oauth/status`, {
        params: { installation_id: installationId },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`OAuth status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to GoHighLevel through Railway backend
   */
  async testGHLConnection(installationId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/ghl/test-connection`, {
        params: { installationId },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      throw new Error(`GHL connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create product in GoHighLevel through Railway backend
   */
  async createProduct(productData: any, installationId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/ghl/products/create`, {
        ...productData,
        installationId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Product creation failed: ${error.response.data?.error || error.response.data?.message || error.message}`);
      }
      throw new Error(`Product creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get products from GoHighLevel through Railway backend
   */
  async getProducts(installationId: string, limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/ghl/products`, {
        params: { installationId, limit, offset },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Product fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create contact in GoHighLevel through Railway backend
   */
  async createContact(contactData: any, installationId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/ghl/contacts/create`, {
        ...contactData,
        installationId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Contact creation failed: ${error.response.data?.error || error.response.data?.message || error.message}`);
      }
      throw new Error(`Contact creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the primary installation ID from Railway backend
   */
  async getPrimaryInstallation(): Promise<string> {
    try {
      const health = await this.getHealthStatus();
      if (health.installationIds.length === 0) {
        throw new Error('No OAuth installations found on Railway backend');
      }
      return health.installationIds[0]; // Return first available installation
    } catch (error) {
      throw new Error(`Failed to get primary installation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const railwayIntegration = new RailwayIntegration();