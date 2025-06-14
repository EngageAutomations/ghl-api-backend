import { z } from 'zod';

// Product schemas
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  status: z.enum(['active', 'inactive']),
  category: z.string().optional(),
  locationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// Price schemas
export const PriceSchema = z.object({
  id: z.string(),
  productId: z.string(),
  amount: z.number(),
  currency: z.string().default('USD'),
  type: z.enum(['one_time', 'recurring']),
  interval: z.enum(['day', 'week', 'month', 'year']).optional(),
  intervalCount: z.number().optional(),
});

export const CreatePriceSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  type: z.enum(['one_time', 'recurring']),
  interval: z.enum(['day', 'week', 'month', 'year']).optional(),
  intervalCount: z.number().optional(),
});

// Contact schemas
export const ContactSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  locationId: z.string(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).optional(),
});

export const CreateContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).optional(),
});

// API Response schemas
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(z.any()),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  }),
});

// Type exports
export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type Price = z.infer<typeof PriceSchema>;
export type CreatePrice = z.infer<typeof CreatePriceSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type APIResponse<T = any> = z.infer<typeof APIResponseSchema> & { data: T };
export type PaginatedResponse<T = any> = z.infer<typeof PaginatedResponseSchema> & { data: { items: T[] } };

// API Client class
export class GHLAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL = '/api/ghl', headers: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (schema) {
      return schema.parse(data);
    }
    
    return data;
  }

  // Product methods
  async getProducts(params: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.search) searchParams.set('search', params.search);

    return this.request(
      `/products?${searchParams.toString()}`,
      { method: 'GET' },
      PaginatedResponseSchema
    );
  }

  async getProduct(id: string): Promise<APIResponse<Product>> {
    return this.request(
      `/products/${id}`,
      { method: 'GET' },
      APIResponseSchema
    );
  }

  async createProduct(data: CreateProduct): Promise<APIResponse<Product>> {
    const validatedData = CreateProductSchema.parse(data);
    return this.request(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify(validatedData),
      },
      APIResponseSchema
    );
  }

  async updateProduct(id: string, data: UpdateProduct): Promise<APIResponse<Product>> {
    const validatedData = UpdateProductSchema.parse(data);
    return this.request(
      `/products/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(validatedData),
      },
      APIResponseSchema
    );
  }

  async deleteProduct(id: string): Promise<APIResponse<void>> {
    return this.request(
      `/products/${id}`,
      { method: 'DELETE' },
      APIResponseSchema
    );
  }

  // Price methods
  async getProductPrices(productId: string): Promise<PaginatedResponse<Price>> {
    return this.request(
      `/products/${productId}/prices`,
      { method: 'GET' },
      PaginatedResponseSchema
    );
  }

  async createProductPrice(productId: string, data: CreatePrice): Promise<APIResponse<Price>> {
    const validatedData = CreatePriceSchema.parse(data);
    return this.request(
      `/products/${productId}/prices`,
      {
        method: 'POST',
        body: JSON.stringify(validatedData),
      },
      APIResponseSchema
    );
  }

  async updatePrice(productId: string, priceId: string, data: Partial<CreatePrice>): Promise<APIResponse<Price>> {
    return this.request(
      `/products/${productId}/prices/${priceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      APIResponseSchema
    );
  }

  async deletePrice(productId: string, priceId: string): Promise<APIResponse<void>> {
    return this.request(
      `/products/${productId}/prices/${priceId}`,
      { method: 'DELETE' },
      APIResponseSchema
    );
  }

  // Contact methods
  async getContacts(params: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<Contact>> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.search) searchParams.set('search', params.search);

    return this.request(
      `/contacts?${searchParams.toString()}`,
      { method: 'GET' },
      PaginatedResponseSchema
    );
  }

  async createContact(data: CreateContact): Promise<APIResponse<Contact>> {
    const validatedData = CreateContactSchema.parse(data);
    return this.request(
      '/contacts',
      {
        method: 'POST',
        body: JSON.stringify(validatedData),
      },
      APIResponseSchema
    );
  }

  // Media methods
  async uploadMedia(file: File, params: {
    altText?: string;
    folder?: string;
  } = {}): Promise<APIResponse<{ url: string; id: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    if (params.altText) formData.append('altText', params.altText);
    if (params.folder) formData.append('folder', params.folder);

    return this.request(
      '/media/upload',
      {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }
    );
  }

  async getMediaFiles(params: {
    limit?: number;
    offset?: number;
    type?: string;
  } = {}): Promise<PaginatedResponse<{ id: string; url: string; name: string; type: string }>> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.type) searchParams.set('type', params.type);

    return this.request(
      `/media?${searchParams.toString()}`,
      { method: 'GET' },
      PaginatedResponseSchema
    );
  }
}

// Default client instance
export const ghlApi = new GHLAPIClient();