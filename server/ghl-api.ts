import { z } from 'zod';

// GoHighLevel API configuration
const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Request/Response schemas
export const GHLContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const GHLDirectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  contacts: z.array(GHLContactSchema).optional(),
});

export type GHLContact = z.infer<typeof GHLContactSchema>;
export type GHLDirectory = z.infer<typeof GHLDirectorySchema>;

export class GoHighLevelAPI {
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.apiKey = process.env.GHL_API_KEY || '';
    this.clientId = process.env.GHL_CLIENT_ID || '';
    this.clientSecret = process.env.GHL_CLIENT_SECRET || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${GHL_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GHL API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Contact management
  async getContacts(limit = 100, offset = 0) {
    const response = await this.makeRequest(`/contacts?limit=${limit}&offset=${offset}`);
    return z.array(GHLContactSchema).parse(response.contacts || []);
  }

  async getContact(contactId: string) {
    const response = await this.makeRequest(`/contacts/${contactId}`);
    return GHLContactSchema.parse(response.contact);
  }

  async createContact(contact: Omit<GHLContact, 'id'>) {
    const response = await this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
    return GHLContactSchema.parse(response.contact);
  }

  async updateContact(contactId: string, updates: Partial<GHLContact>) {
    const response = await this.makeRequest(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return GHLContactSchema.parse(response.contact);
  }

  async deleteContact(contactId: string) {
    await this.makeRequest(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
    return true;
  }

  // Directory/List management
  async getDirectories() {
    const response = await this.makeRequest('/campaigns'); // Assuming campaigns are directories
    return z.array(GHLDirectorySchema).parse(response.campaigns || []);
  }

  async createDirectory(directory: Omit<GHLDirectory, 'id'>) {
    const response = await this.makeRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify(directory),
    });
    return GHLDirectorySchema.parse(response.campaign);
  }

  // Sync methods for your local database
  async syncContactsToLocal() {
    try {
      const ghlContacts = await this.getContacts();
      
      // Here you would sync with your local database
      // This is a placeholder for the sync logic
      console.log(`Fetched ${ghlContacts.length} contacts from GHL`);
      
      return {
        success: true,
        contactsCount: ghlContacts.length,
        contacts: ghlContacts,
      };
    } catch (error) {
      console.error('Error syncing contacts:', error);
      throw error;
    }
  }

  async syncDirectoriesToLocal() {
    try {
      const ghlDirectories = await this.getDirectories();
      
      console.log(`Fetched ${ghlDirectories.length} directories from GHL`);
      
      return {
        success: true,
        directoriesCount: ghlDirectories.length,
        directories: ghlDirectories,
      };
    } catch (error) {
      console.error('Error syncing directories:', error);
      throw error;
    }
  }

  // Health check
  async testConnection() {
    try {
      await this.makeRequest('/contacts?limit=1');
      return { connected: true, message: 'GHL API connection successful' };
    } catch (error) {
      return { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const ghlAPI = new GoHighLevelAPI();