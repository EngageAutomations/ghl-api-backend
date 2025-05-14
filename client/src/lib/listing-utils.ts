import { apiRequest } from './queryClient';
import type { Listing } from '@shared/schema';
import { convertToDirectDownloadLink } from './utils';

/**
 * Interface representing listing data structure
 * This maps to our Listing type from the database schema
 */
export type ListingData = Listing;

/**
 * Extracts the slug from the current URL
 * Example: https://example.com/product-details/product/product-name
 * returns 'product-name'
 */
export function getSlugFromUrl(): string {
  const url = window.location.href;
  // Extract the slug from URLs like domain.com/product-details/product/[slug]
  const slugMatch = url.match(/\/product-details\/product\/([^\/\?#]+)/);
  
  if (slugMatch && slugMatch[1]) {
    return slugMatch[1];
  }
  
  // Fallback: try to get the last segment of any URL path
  const path = window.location.pathname;
  const segments = path.split('/').filter(segment => segment.length > 0);
  return segments.length > 0 ? segments[segments.length - 1] : '';
}

/**
 * Fetches listing data by slug from the API
 * If the API request fails, returns a safe listing object with the slug
 */
export async function getListingBySlug(slug: string): Promise<ListingData> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/listings/by-slug/${slug}`
    );
    
    // We need to get the JSON data from the response
    const data = await response.json();
    
    // Check if we got a valid listing response
    if (data && typeof data === 'object' && 'id' in data) {
      return data as ListingData;
    } else {
      console.warn('No valid listing data found, using safe fallback');
      return getSafeListing({ slug });
    }
  } catch (error) {
    console.error('Error fetching listing by slug:', error);
    return getSafeListing({ slug });
  }
}

/**
 * Master function to apply all slug-based functionality
 * Calls the individual functions from listing-attributes.ts
 */
export function applySlugBasedTracking(): void {
  // This function is now implemented in listing-attributes.ts 
  // as applySlugBasedFunctionality() for better organization
  
  // Import needed functions
  const { applySlugBasedFunctionality } = require('./listing-attributes');
  applySlugBasedFunctionality();
}

/**
 * Provides a safe listing object with fallback values
 * when actual listing data is unavailable
 */
export function getSafeListing(partial: Partial<ListingData> = {}): ListingData {
  return {
    id: typeof partial.id === 'number' ? partial.id : 0,
    title: partial.title || 'Unknown Listing',
    slug: partial.slug || 'unknown-listing',
    userId: partial.userId || 0,
    category: partial.category || 'Uncategorized',
    location: partial.location || '',
    description: partial.description || '',
    price: partial.price || '',
    downloadUrl: partial.downloadUrl || '',
    popupUrl: partial.popupUrl || '',
    embedFormUrl: partial.embedFormUrl || '',
    imageUrl: partial.imageUrl || '',
    createdAt: partial.createdAt || new Date(),
    updatedAt: partial.updatedAt || new Date()
  };
}

/**
 * Replaces tokens in a string template with actual listing data
 * Supported tokens:
 * {listing_id}, {listing_title}, {listing_category}, {listing_location}, {timestamp}, {slug}
 */
export function replaceListingTokens(template: string, listing: ListingData): string {
  if (!template) return '';
  
  const tokens = {
    '{listing_id}': listing.id.toString(),
    '{listing_title}': encodeURIComponent(listing.title),
    '{listing_category}': encodeURIComponent(listing.category || ''),
    '{listing_location}': encodeURIComponent(listing.location || ''),
    '{timestamp}': Date.now().toString(),
    '{slug}': listing.slug
  };

  return Object.entries(tokens).reduce((result, [token, value]) => {
    return result.replace(new RegExp(token, 'g'), value);
  }, template);
}

/**
 * Adds UTM parameters to a URL for tracking purposes
 * If a customFieldName is provided, it will be added as a URL parameter with the slug value
 */
export function addUtmParams(url: string, params: Record<string, string> = {}, customFieldName?: string, slug?: string): string {
  try {
    const urlObj = new URL(url);
    
    // Default UTM parameters
    const defaultUtmParams = {
      utm_source: 'directory',
      utm_medium: 'listing',
      utm_campaign: 'marketplace',
      ...params
    };
    
    // Add UTM parameters to URL
    Object.entries(defaultUtmParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    
    // If a custom field name and slug are provided, add them as a parameter
    if (customFieldName && slug) {
      urlObj.searchParams.set(customFieldName, slug);
      console.log(`Added custom field parameter ${customFieldName}=${slug} to URL`);
    }
    
    return urlObj.toString();
  } catch (error: unknown) {
    console.error('Error adding UTM parameters to URL:', error instanceof Error ? error.message : String(error));
    return url; // Return original URL if there's an error
  }
}

/**
 * Processes a URL for a listing action button
 * Replaces tokens, adds UTM parameters, and adds the custom field parameter
 * 
 * @param urlTemplate The URL template with potential tokens to replace
 * @param listing The listing data to use for token replacement
 * @param config The designer configuration for tracking parameters
 * @returns The final processed URL
 */
export function processListingButtonUrl(urlTemplate: string, listing: ListingData, config?: any): string {
  if (!urlTemplate) return '';
  
  try {
    // Step 1: Replace tokens in the URL template with listing data
    const urlWithTokens = replaceListingTokens(urlTemplate, listing);
    
    // Step 2: Get the GHL custom field name for tracking
    const customFieldName = config?.customFormFieldName || 'listing_id';
    
    // Step 3: Add UTM parameters and the custom field
    return addUtmParams(
      urlWithTokens, 
      {
        utm_source: 'directory',
        utm_medium: 'action_button',
        utm_campaign: listing.category || 'marketplace',
        utm_content: listing.slug
      },
      customFieldName,
      listing.slug
    );
  } catch (error: unknown) {
    console.error('Error processing listing button URL:', error instanceof Error ? error.message : String(error));
    return urlTemplate; // Return original URL template if there's an error
  }
}

// Expose this function to the window object so it can be called from external code
// This is particularly useful for GHL embedded JavaScript
export function exposeListingFunctionsToWindow(): void {
  try {
    // Add our functions to the window object
    if (typeof window !== 'undefined') {
      (window as any).processListingButtonUrl = processListingButtonUrl;
      (window as any).replaceListingTokens = replaceListingTokens;
      (window as any).addUtmParams = addUtmParams;
      (window as any).getSlugFromUrl = getSlugFromUrl;
      
      console.log('Successfully exposed listing functions to window object');
    }
  } catch (error: unknown) {
    console.error('Error exposing listing functions to window:', error instanceof Error ? error.message : String(error));
  }
}

// Note: convertToDirectDownloadLink is now imported from utils.ts

/**
 * Tracks listing interactions (button clicks, form submissions, downloads)
 */
export async function trackOptInInteraction(
  type: 'button_click' | 'form_submission' | 'download' | 'popup_open',
  listing: ListingData,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const response = await fetch('/api/tracking/opt-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        listingId: listing.id,
        listingTitle: listing.title,
        listingSlug: listing.slug,
        timestamp: Date.now(),
        ...details
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Tracking request failed: ${response.statusText}`);
    }
  } catch (error: unknown) {
    console.error('Error tracking opt-in interaction:', error instanceof Error ? error.message : String(error));
    // Don't throw - tracking errors shouldn't break user experience
  }
}

/**
 * Gets stored configuration from localStorage
 */
function getStoredConfig(): any {
  try {
    const configStr = localStorage.getItem('designer_config');
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error: unknown) {
    console.warn('Error parsing stored config:', error instanceof Error ? error.message : String(error));
  }
  return undefined;
}

/**
 * Initializes an embedded form with listing data
 * Populates hidden fields with listing information
 * Uses custom field name from config if available
 */
export function initializeForm(formElement: HTMLElement, listing: ListingData): void {
  if (!formElement) return;
  
  // Try to get config for custom field name
  const config = getStoredConfig();
  const customFieldName = config?.customFormFieldName || 'product_slug';
  
  // Common field names to look for in different form systems
  const fieldMappings = {
    listingId: ['listing_id', 'listingId', 'source_id', 'sourceId', 'item_id', 'itemId'],
    listingTitle: ['listing_title', 'listingTitle', 'source_name', 'sourceName', 'item_name', 'itemName'],
    listingCategory: ['listing_category', 'listingCategory', 'category', 'product_category'],
    // Add the custom field name to the listingSlug field options
    listingSlug: ['listing_slug', 'listingSlug', 'slug', 'product_slug', customFieldName]
  };
  
  // Find and populate all possible field names for each data type
  Object.entries(fieldMappings).forEach(([dataType, fieldNames]) => {
    let value = '';
    
    // Determine the value based on the data type
    switch (dataType) {
      case 'listingId':
        value = listing.id.toString();
        break;
      case 'listingTitle':
        value = listing.title;
        break;
      case 'listingCategory':
        value = listing.category || '';
        break;
      case 'listingSlug':
        value = listing.slug;
        break;
    }
    
    // Try to find and populate each possible field name
    fieldNames.forEach(fieldName => {
      // Look for input fields with matching name or id
      const inputField = formElement.querySelector(`input[name="${fieldName}"], input#${fieldName}`);
      if (inputField instanceof HTMLInputElement) {
        inputField.value = value;
      }
      
      // Look for hidden fields with matching name or id
      const hiddenField = formElement.querySelector(`input[type="hidden"][name="${fieldName}"], input[type="hidden"]#${fieldName}`);
      if (hiddenField instanceof HTMLInputElement) {
        hiddenField.value = value;
      }
    });
  });
  
  // Ensure the custom field name is always added if it doesn't exist
  if (!formElement.querySelector(`input[name="${customFieldName}"]`)) {
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = customFieldName;
    hiddenField.value = listing.slug;
    formElement.appendChild(hiddenField);
    console.log(`Added custom field '${customFieldName}' to form with value:`, listing.slug);
  }
  
  // Add data attributes to the form for easier identification
  formElement.dataset.listingId = listing.id.toString();
  formElement.dataset.listingTitle = listing.title;
  formElement.dataset.listingSlug = listing.slug;
  formElement.dataset.fieldNameUsed = customFieldName;
}

/**
 * Stores the current listing in sessionStorage for access across windows
 */
export function storeListingInSession(listing: ListingData): void {
  try {
    sessionStorage.setItem('current_listing', JSON.stringify({
      id: listing.id.toString(),
      title: listing.title,
      slug: listing.slug,
      category: listing.category,
      location: listing.location,
      timestamp: Date.now()
    }));
  } catch (error: unknown) {
    console.error('Error storing listing in session:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Retrieves the listing stored in sessionStorage
 */
export function getListingFromSession(): ListingData | null {
  try {
    const storedListing = sessionStorage.getItem('current_listing');
    return storedListing ? JSON.parse(storedListing) : null;
  } catch (error: unknown) {
    console.error('Error retrieving listing from session:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Creates a custom field in Go HighLevel via the API
 * This is called when the user enables the "Create Field in GHL" option
 */
export async function createCustomFieldInGHL(
  fieldName: string, 
  fieldLabel: string, 
  fieldType: string = 'text',
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  if (!accessToken) {
    console.warn('No Go HighLevel access token provided for API call');
    return { 
      success: false, 
      message: 'No Go HighLevel access token provided. Please connect your GHL account in settings.'
    };
  }
  
  try {
    // Prepare the request to Go HighLevel API
    const response = await fetch('https://api.gohighlevel.com/oauth/customFields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: fieldName,
        displayName: fieldLabel,
        dataType: fieldType.toUpperCase(),
        fieldType: fieldType === 'hidden' ? 'HIDDEN' : 'STANDARD',
        required: false,
        active: true,
        showOnForms: fieldType !== 'hidden'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating custom field in GHL:', errorData);
      return {
        success: false,
        message: `Failed to create custom field: ${errorData.message || response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('Successfully created custom field in GHL:', data);
    return {
      success: true,
      message: `Successfully created custom field "${fieldLabel}" in Go HighLevel`
    };
  } catch (error: unknown) {
    console.error('Exception creating custom field in GHL:', error);
    return {
      success: false,
      message: `Error creating custom field: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}