/**
 * GoHighLevel API Endpoints Configuration
 * Comprehensive endpoint definitions based on official API documentation
 */

export interface APIEndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  ghlEndpoint: string;
  description: string;
  requiresLocationId: boolean;
  scope: string;
  parameters?: {
    path?: string[];
    query?: string[];
    body?: string[];
  };
  responseSchema?: any;
}

export const GHL_API_ENDPOINTS: APIEndpointConfig[] = [
  // ============================================================================
  // PRODUCTS API
  // ============================================================================
  {
    path: '/products',
    method: 'GET',
    ghlEndpoint: '/products/',
    description: 'List Products - retrieve paginated list with filtering',
    requiresLocationId: true,
    scope: 'products.readonly',
    parameters: {
      query: ['limit', 'offset', 'locationId', 'search']
    }
  },
  {
    path: '/products',
    method: 'POST',
    ghlEndpoint: '/products/',
    description: 'Create Product',
    requiresLocationId: true,
    scope: 'products.write',
    parameters: {
      body: ['name', 'locationId', 'productType', 'description', 'image', 'availableInStore', 'statementDescriptor']
    }
  },
  {
    path: '/products/:productId',
    method: 'GET',
    ghlEndpoint: '/products/{productId}',
    description: 'Get Product by ID',
    requiresLocationId: false,
    scope: 'products.readonly',
    parameters: {
      path: ['productId']
    }
  },
  {
    path: '/products/:productId',
    method: 'PUT',
    ghlEndpoint: '/products/{productId}',
    description: 'Update Product',
    requiresLocationId: false,
    scope: 'products.write',
    parameters: {
      path: ['productId'],
      body: ['name', 'description', 'image', 'availableInStore', 'statementDescriptor']
    }
  },
  {
    path: '/products/:productId',
    method: 'DELETE',
    ghlEndpoint: '/products/{productId}',
    description: 'Delete Product',
    requiresLocationId: false,
    scope: 'products.write',
    parameters: {
      path: ['productId']
    }
  },

  // ============================================================================
  // PRODUCT PRICES API
  // ============================================================================
  {
    path: '/products/:productId/prices',
    method: 'GET',
    ghlEndpoint: '/products/{productId}/prices',
    description: 'List Product Prices',
    requiresLocationId: false,
    scope: 'products/prices.readonly',
    parameters: {
      path: ['productId']
    }
  },
  {
    path: '/products/:productId/prices',
    method: 'POST',
    ghlEndpoint: '/products/{productId}/prices',
    description: 'Create Product Price',
    requiresLocationId: false,
    scope: 'products/prices.write',
    parameters: {
      path: ['productId'],
      body: ['name', 'amount', 'currency', 'type', 'recurring']
    }
  },
  {
    path: '/products/:productId/prices/:priceId',
    method: 'GET',
    ghlEndpoint: '/products/{productId}/prices/{priceId}',
    description: 'Get Product Price',
    requiresLocationId: false,
    scope: 'products/prices.readonly',
    parameters: {
      path: ['productId', 'priceId']
    }
  },
  {
    path: '/products/:productId/prices/:priceId',
    method: 'PUT',
    ghlEndpoint: '/products/{productId}/prices/{priceId}',
    description: 'Update Product Price',
    requiresLocationId: false,
    scope: 'products/prices.write',
    parameters: {
      path: ['productId', 'priceId'],
      body: ['name', 'amount', 'currency']
    }
  },
  {
    path: '/products/:productId/prices/:priceId',
    method: 'DELETE',
    ghlEndpoint: '/products/{productId}/prices/{priceId}',
    description: 'Delete Product Price',
    requiresLocationId: false,
    scope: 'products/prices.write',
    parameters: {
      path: ['productId', 'priceId']
    }
  },

  // ============================================================================
  // CONTACTS API
  // ============================================================================
  {
    path: '/contacts',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/contacts',
    description: 'List Contacts',
    requiresLocationId: true,
    scope: 'contacts.readonly',
    parameters: {
      query: ['limit', 'offset', 'query', 'email', 'phone']
    }
  },
  {
    path: '/contacts',
    method: 'POST',
    ghlEndpoint: '/locations/{locationId}/contacts',
    description: 'Create Contact',
    requiresLocationId: true,
    scope: 'contacts.write',
    parameters: {
      body: ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'postalCode', 'country']
    }
  },
  {
    path: '/contacts/:contactId',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/contacts/{contactId}',
    description: 'Get Contact',
    requiresLocationId: true,
    scope: 'contacts.readonly',
    parameters: {
      path: ['contactId']
    }
  },
  {
    path: '/contacts/:contactId',
    method: 'PUT',
    ghlEndpoint: '/locations/{locationId}/contacts/{contactId}',
    description: 'Update Contact',
    requiresLocationId: true,
    scope: 'contacts.write',
    parameters: {
      path: ['contactId'],
      body: ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'postalCode', 'country']
    }
  },
  {
    path: '/contacts/:contactId',
    method: 'DELETE',
    ghlEndpoint: '/locations/{locationId}/contacts/{contactId}',
    description: 'Delete Contact',
    requiresLocationId: true,
    scope: 'contacts.write',
    parameters: {
      path: ['contactId']
    }
  },

  // ============================================================================
  // OPPORTUNITIES API
  // ============================================================================
  {
    path: '/opportunities',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/opportunities',
    description: 'List Opportunities',
    requiresLocationId: true,
    scope: 'opportunities.readonly',
    parameters: {
      query: ['limit', 'offset', 'pipelineId', 'status']
    }
  },
  {
    path: '/opportunities',
    method: 'POST',
    ghlEndpoint: '/locations/{locationId}/opportunities',
    description: 'Create Opportunity',
    requiresLocationId: true,
    scope: 'opportunities.write',
    parameters: {
      body: ['title', 'status', 'pipelineId', 'pipelineStageId', 'contactId', 'monetaryValue']
    }
  },
  {
    path: '/opportunities/:opportunityId',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/opportunities/{opportunityId}',
    description: 'Get Opportunity',
    requiresLocationId: true,
    scope: 'opportunities.readonly',
    parameters: {
      path: ['opportunityId']
    }
  },
  {
    path: '/opportunities/:opportunityId',
    method: 'PUT',
    ghlEndpoint: '/locations/{locationId}/opportunities/{opportunityId}',
    description: 'Update Opportunity',
    requiresLocationId: true,
    scope: 'opportunities.write',
    parameters: {
      path: ['opportunityId'],
      body: ['title', 'status', 'pipelineStageId', 'monetaryValue']
    }
  },
  {
    path: '/opportunities/:opportunityId',
    method: 'DELETE',
    ghlEndpoint: '/locations/{locationId}/opportunities/{opportunityId}',
    description: 'Delete Opportunity',
    requiresLocationId: true,
    scope: 'opportunities.write',
    parameters: {
      path: ['opportunityId']
    }
  },

  // ============================================================================
  // LOCATIONS API
  // ============================================================================
  {
    path: '/locations',
    method: 'GET',
    ghlEndpoint: '/locations/',
    description: 'List Locations',
    requiresLocationId: false,
    scope: 'locations.readonly',
    parameters: {
      query: ['limit', 'offset']
    }
  },
  {
    path: '/locations/:locationId',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}',
    description: 'Get Location',
    requiresLocationId: false,
    scope: 'locations.readonly',
    parameters: {
      path: ['locationId']
    }
  },
  {
    path: '/locations/:locationId',
    method: 'PUT',
    ghlEndpoint: '/locations/{locationId}',
    description: 'Update Location',
    requiresLocationId: false,
    scope: 'locations.write',
    parameters: {
      path: ['locationId'],
      body: ['name', 'address', 'city', 'state', 'country', 'postalCode', 'website']
    }
  },

  // ============================================================================
  // WORKFLOWS API
  // ============================================================================
  {
    path: '/workflows',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/workflows',
    description: 'List Workflows',
    requiresLocationId: true,
    scope: 'workflows.readonly'
  },
  {
    path: '/workflows/:workflowId/contacts/:contactId',
    method: 'POST',
    ghlEndpoint: '/locations/{locationId}/workflows/{workflowId}/contacts/{contactId}',
    description: 'Add Contact to Workflow',
    requiresLocationId: true,
    scope: 'workflows.write',
    parameters: {
      path: ['workflowId', 'contactId']
    }
  },

  // ============================================================================
  // FORMS API
  // ============================================================================
  {
    path: '/forms',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/forms',
    description: 'List Forms',
    requiresLocationId: true,
    scope: 'forms.readonly'
  },
  {
    path: '/forms/:formId',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/forms/{formId}',
    description: 'Get Form',
    requiresLocationId: true,
    scope: 'forms.readonly',
    parameters: {
      path: ['formId']
    }
  },
  {
    path: '/forms/:formId/submissions',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/forms/{formId}/submissions',
    description: 'Get Form Submissions',
    requiresLocationId: true,
    scope: 'forms.readonly',
    parameters: {
      path: ['formId'],
      query: ['limit', 'offset', 'startDate', 'endDate']
    }
  },

  // ============================================================================
  // SURVEYS API
  // ============================================================================
  {
    path: '/surveys',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/surveys',
    description: 'List Surveys',
    requiresLocationId: true,
    scope: 'surveys.readonly'
  },
  {
    path: '/surveys/:surveyId/submissions',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/surveys/{surveyId}/submissions',
    description: 'Get Survey Submissions',
    requiresLocationId: true,
    scope: 'surveys.readonly',
    parameters: {
      path: ['surveyId'],
      query: ['limit', 'offset', 'startDate', 'endDate']
    }
  },

  // ============================================================================
  // MEDIA API
  // ============================================================================
  {
    path: '/media',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/medias',
    description: 'List Media Files',
    requiresLocationId: true,
    scope: 'medias.readonly',
    parameters: {
      query: ['limit', 'offset', 'type']
    }
  },
  {
    path: '/media/upload',
    method: 'POST',
    ghlEndpoint: '/locations/{locationId}/medias/upload-file',
    description: 'Upload Media File',
    requiresLocationId: true,
    scope: 'medias.write',
    parameters: {
      body: ['file', 'name', 'type']
    }
  },
  {
    path: '/media/:mediaId',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/medias/{mediaId}',
    description: 'Get Media File',
    requiresLocationId: true,
    scope: 'medias.readonly',
    parameters: {
      path: ['mediaId']
    }
  },
  {
    path: '/media/:mediaId',
    method: 'DELETE',
    ghlEndpoint: '/locations/{locationId}/medias/{mediaId}',
    description: 'Delete Media File',
    requiresLocationId: true,
    scope: 'medias.write',
    parameters: {
      path: ['mediaId']
    }
  },

  // ============================================================================
  // CALENDARS API
  // ============================================================================
  {
    path: '/calendars',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/calendars',
    description: 'List Calendars',
    requiresLocationId: true,
    scope: 'calendars.readonly'
  },
  {
    path: '/calendars/:calendarId/events',
    method: 'GET',
    ghlEndpoint: '/locations/{locationId}/calendars/{calendarId}/events',
    description: 'List Calendar Events',
    requiresLocationId: true,
    scope: 'calendars.readonly',
    parameters: {
      path: ['calendarId'],
      query: ['startDate', 'endDate', 'limit', 'offset']
    }
  },
  {
    path: '/calendars/:calendarId/events',
    method: 'POST',
    ghlEndpoint: '/locations/{locationId}/calendars/{calendarId}/events',
    description: 'Create Calendar Event',
    requiresLocationId: true,
    scope: 'calendars.write',
    parameters: {
      path: ['calendarId'],
      body: ['title', 'startTime', 'endTime', 'contactId', 'description']
    }
  },

  // ============================================================================
  // USER INFO API
  // ============================================================================
  {
    path: '/user/info',
    method: 'GET',
    ghlEndpoint: '/oauth/userinfo',
    description: 'Get OAuth User Info',
    requiresLocationId: false,
    scope: 'oauth'
  },
  {
    path: '/user/me',
    method: 'GET',
    ghlEndpoint: '/users/me',
    description: 'Get Current User',
    requiresLocationId: false,
    scope: 'users.readonly'
  }
];

// Helper function to find endpoint configuration
export function findEndpointConfig(method: string, path: string): APIEndpointConfig | undefined {
  return GHL_API_ENDPOINTS.find(endpoint => {
    if (endpoint.method !== method) return false;
    
    // Convert Express-style path to regex for matching
    const pattern = endpoint.path
      .replace(/:[^\/]+/g, '[^/]+')  // Replace :param with regex
      .replace(/\//g, '\\/');        // Escape slashes
    
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });
}

// Extract path parameters from URL
export function extractPathParams(pattern: string, actualPath: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/');
  const actualParts = actualPath.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.substring(1);
      params[paramName] = actualParts[i];
    }
  }
  
  return params;
}

// Build GoHighLevel endpoint URL with parameters
export function buildGHLEndpoint(config: APIEndpointConfig, pathParams: Record<string, string>, locationId?: string): string {
  let endpoint = config.ghlEndpoint;
  
  // Replace path parameters
  Object.entries(pathParams).forEach(([key, value]) => {
    endpoint = endpoint.replace(`{${key}}`, value);
  });
  
  // Replace location ID if needed
  if (config.requiresLocationId && locationId) {
    endpoint = endpoint.replace('{locationId}', locationId);
  }
  
  return endpoint;
}

export default GHL_API_ENDPOINTS;