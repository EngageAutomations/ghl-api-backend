import { z } from 'zod';

// GoHighLevel API configuration - Using v2 for OAuth
const GHL_BASE_URL = 'https://services.leadconnectorhq.com/v2';
const GHL_MARKETPLACE_URL = 'https://marketplace.gohighlevel.com/oauth';

// OAuth Token Response Schema
export const GHLTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
  userType: z.string(),
  companyId: z.string().optional(),
  locationId: z.string().optional(),
});

// User Info Schema
export const GHLUserInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  extension: z.string().optional(),
  permissions: z.object({
    campaignsEnabled: z.boolean().optional(),
    campaignsReadOnly: z.boolean().optional(),
    contactsEnabled: z.boolean().optional(),
    workflowsEnabled: z.boolean().optional(),
    triggersEnabled: z.boolean().optional(),
    funnelsEnabled: z.boolean().optional(),
    websitesEnabled: z.boolean().optional(),
    opportunitiesEnabled: z.boolean().optional(),
    dashboardStatsEnabled: z.boolean().optional(),
    bulkRequestsEnabled: z.boolean().optional(),
    appointmentsEnabled: z.boolean().optional(),
    reviewsEnabled: z.boolean().optional(),
    onlineListingsEnabled: z.boolean().optional(),
    phoneCallEnabled: z.boolean().optional(),
    conversationsEnabled: z.boolean().optional(),
    assignedDataOnly: z.boolean().optional(),
    adwordsReportingEnabled: z.boolean().optional(),
    membershipEnabled: z.boolean().optional(),
    facebookAdsReportingEnabled: z.boolean().optional(),
    attributionsReportingEnabled: z.boolean().optional(),
    socialPlanner: z.boolean().optional(),
    bloggingEnabled: z.boolean().optional(),
    invoiceEnabled: z.boolean().optional(),
    affiliateManagerEnabled: z.boolean().optional(),
    contentAiEnabled: z.boolean().optional(),
    refundsEnabled: z.boolean().optional(),
    recordPaymentEnabled: z.boolean().optional(),
    cancelSubscriptionEnabled: z.boolean().optional(),
    paymentsEnabled: z.boolean().optional(),
    communitiesEnabled: z.boolean().optional(),
    exportPaymentsEnabled: z.boolean().optional(),
  }).optional(),
  roles: z.object({
    type: z.string(),
    role: z.string(),
    locationIds: z.array(z.string()).optional(),
  }).optional(),
});

// Contact Schema (v2 API)
export const GHLContactSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  contactName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
  dnd: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.array(z.object({
    id: z.string(),
    value: z.any(),
  })).optional(),
  source: z.string().optional(),
  dateAdded: z.string().optional(),
  dateUpdated: z.string().optional(),
});

// Location Schema
export const GHLLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
});

// Custom Field Schema
export const GHLCustomFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  fieldKey: z.string(),
  dataType: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'PHONE', 'EMAIL', 'CHECKBOX', 'SINGLE_OPTIONS', 'MULTIPLE_OPTIONS', 'DATE', 'DATETIME', 'FILE_UPLOAD']),
  position: z.number(),
  picklistOptions: z.array(z.string()).optional(),
  isRequired: z.boolean(),
  placeholder: z.string().optional(),
});

export type GHLTokenResponse = z.infer<typeof GHLTokenResponseSchema>;
export type GHLUserInfo = z.infer<typeof GHLUserInfoSchema>;
export type GHLContact = z.infer<typeof GHLContactSchema>;
export type GHLLocation = z.infer<typeof GHLLocationSchema>;
export type GHLCustomField = z.infer<typeof GHLCustomFieldSchema>;

export class GoHighLevelAPI {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.GHL_CLIENT_ID || '';
    this.clientSecret = process.env.GHL_CLIENT_SECRET || '';
  }

  // OAuth Token Exchange
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<GHLTokenResponse> {
    const response = await fetch(`${GHL_MARKETPLACE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token exchange failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    return GHLTokenResponseSchema.parse(tokenData);
  }

  // Refresh Access Token
  async refreshAccessToken(refreshToken: string): Promise<GHLTokenResponse> {
    const response = await fetch(`${GHL_MARKETPLACE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
    return GHLTokenResponseSchema.parse(tokenData);
  }

  // Make authenticated requests with user's OAuth token
  private async makeAuthenticatedRequest(endpoint: string, accessToken: string, options: RequestInit = {}) {
    const url = `${GHL_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GHL API Error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  // Get User Information
  async getUserInfo(accessToken: string): Promise<GHLUserInfo> {
    const response = await this.makeAuthenticatedRequest('/users/me', accessToken);
    return GHLUserInfoSchema.parse(response);
  }

  // Location Management
  async getLocations(accessToken: string): Promise<GHLLocation[]> {
    const response = await this.makeAuthenticatedRequest('/locations', accessToken);
    return z.array(GHLLocationSchema).parse(response.locations || []);
  }

  async getLocation(locationId: string, accessToken: string): Promise<GHLLocation> {
    const response = await this.makeAuthenticatedRequest(`/locations/${locationId}`, accessToken);
    return GHLLocationSchema.parse(response.location);
  }

  // Contact Management (OAuth-based)
  async getContacts(locationId: string, accessToken: string, limit = 100, offset = 0): Promise<GHLContact[]> {
    const response = await this.makeAuthenticatedRequest(
      `/locations/${locationId}/contacts?limit=${limit}&offset=${offset}`, 
      accessToken
    );
    return z.array(GHLContactSchema).parse(response.contacts || []);
  }

  async getContact(locationId: string, contactId: string, accessToken: string): Promise<GHLContact> {
    const response = await this.makeAuthenticatedRequest(
      `/locations/${locationId}/contacts/${contactId}`, 
      accessToken
    );
    return GHLContactSchema.parse(response.contact);
  }

  async createContact(locationId: string, contact: Omit<GHLContact, 'id'>, accessToken: string): Promise<GHLContact> {
    const response = await this.makeAuthenticatedRequest(
      `/locations/${locationId}/contacts`, 
      accessToken, 
      {
        method: 'POST',
        body: JSON.stringify(contact),
      }
    );
    return GHLContactSchema.parse(response.contact);
  }

  async updateContact(locationId: string, contactId: string, updates: Partial<GHLContact>, accessToken: string): Promise<GHLContact> {
    const response = await this.makeAuthenticatedRequest(
      `/locations/${locationId}/contacts/${contactId}`, 
      accessToken, 
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return GHLContactSchema.parse(response.contact);
  }

  async deleteContact(locationId: string, contactId: string, accessToken: string): Promise<boolean> {
    await this.makeAuthenticatedRequest(
      `/locations/${locationId}/contacts/${contactId}`, 
      accessToken, 
      {
        method: 'DELETE',
      }
    );
    return true;
  }

  // Custom Fields Management
  async getCustomFields(locationId: string, accessToken: string): Promise<GHLCustomField[]> {
    const response = await this.makeAuthenticatedRequest(
      `/locations/${locationId}/customFields`, 
      accessToken
    );
    return z.array(GHLCustomFieldSchema).parse(response.customFields || []);
  }

  async createCustomField(locationId: string, field: Omit<GHLCustomField, 'id'>, accessToken: string): Promise<GHLCustomField> {
    const response = await this.makeAuthenticatedRequest(
      `/locations/${locationId}/customFields`, 
      accessToken, 
      {
        method: 'POST',
        body: JSON.stringify(field),
      }
    );
    return GHLCustomFieldSchema.parse(response.customField);
  }

  // Sync methods for OAuth-based users
  async syncContactsToLocal(locationId: string, accessToken: string) {
    try {
      const ghlContacts = await this.getContacts(locationId, accessToken);
      
      console.log(`Fetched ${ghlContacts.length} contacts from GHL location ${locationId}`);
      
      return {
        success: true,
        contactsCount: ghlContacts.length,
        contacts: ghlContacts,
        locationId,
      };
    } catch (error) {
      console.error('Error syncing contacts:', error);
      throw error;
    }
  }

  async syncUserLocations(accessToken: string) {
    try {
      const ghlLocations = await this.getLocations(accessToken);
      
      console.log(`Fetched ${ghlLocations.length} locations from GHL`);
      
      return {
        success: true,
        locationsCount: ghlLocations.length,
        locations: ghlLocations,
      };
    } catch (error) {
      console.error('Error syncing locations:', error);
      throw error;
    }
  }

  // Health check with OAuth token
  async testConnection(accessToken?: string) {
    try {
      if (accessToken) {
        await this.getUserInfo(accessToken);
        return { connected: true, message: 'GHL OAuth API connection successful' };
      } else {
        // Test basic OAuth endpoints without requiring user token
        const response = await fetch(`${GHL_MARKETPLACE_URL}/userinfo`, {
          method: 'HEAD'
        });
        return { 
          connected: response.ok, 
          message: response.ok ? 'GHL OAuth endpoints accessible' : 'GHL OAuth endpoints not accessible'
        };
      }
    } catch (error) {
      return { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Utility method to check if token needs refresh
  isTokenExpired(expiryDate: Date): boolean {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return now.getTime() >= (expiryDate.getTime() - bufferTime);
  }

  // Generate OAuth authorization URL
  generateAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'contacts.readonly contacts.write locations.readonly locations.write users.readonly',
    });
    
    if (state) {
      params.append('state', state);
    }
    
    return `${GHL_MARKETPLACE_URL}/chooselocation?${params.toString()}`;
  }
}

export const ghlAPI = new GoHighLevelAPI();