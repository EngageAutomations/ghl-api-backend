import { apiRequest } from './queryClient';
import type { Listing } from '@shared/schema';
import { addListingDataAttributes } from './listing-attributes';

/**
 * Interface representing listing data structure
 * This maps to our Listing type from the database schema
 */
export type ListingData = Listing;

/**
 * Extracts the slug from the current URL
 * Example: /product-details/product/open-frame-pc-case returns 'open-frame-pc-case'
 */
export function getSlugFromUrl(): string {
  const path = window.location.pathname;
  // Extract the slug from URL patterns like /product-details/product/[slug]
  const slugMatch = path.match(/\/product-details\/product\/([^\/]+)$/);
  
  if (slugMatch && slugMatch[1]) {
    return slugMatch[1];
  }
  
  // Fallback: try to get the last segment of any URL path
  const segments = path.split('/').filter(segment => segment.length > 0);
  return segments.length > 0 ? segments[segments.length - 1] : '';
}

/**
 * Fetches listing data based on the provided slug
 */
export async function fetchListing(slug: string): Promise<ListingData> {
  try {
    const url = `/api/listings/${slug}`;
    const response = await fetch(url, {
      credentials: "include"
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch listing: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching listing with slug "${slug}":`, error);
    return getSafeListing({ slug });
  }
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
 */
export function addUtmParams(url: string, params: Record<string, string> = {}): string {
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
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error adding UTM parameters to URL:', error);
    return url; // Return original URL if there's an error
  }
}

/**
 * Converts Google Drive and other cloud storage links to direct download URLs
 */
export function convertToDirectDownloadLink(url: string): { convertedUrl: string; isConverted: boolean } {
  if (!url) {
    return { convertedUrl: '', isConverted: false };
  }
  
  // Handle Google Drive links
  if (url.includes('drive.google.com/file/d/')) {
    // Convert from https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // to https://drive.google.com/uc?export=download&id=FILE_ID
    const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return {
        convertedUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        isConverted: true
      };
    }
  }
  
  // Handle Dropbox links
  if (url.includes('dropbox.com') && !url.includes('dl=1')) {
    // Convert standard share links to direct download links
    const separator = url.includes('?') ? '&' : '?';
    return {
      convertedUrl: `${url}${separator}dl=1`,
      isConverted: true
    };
  }
  
  // Handle OneDrive links (simplified approach)
  if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
    // For OneDrive, we'd need to implement more complex logic
    // This is a placeholder for future implementation
    console.log('OneDrive link detected - using original URL');
  }
  
  // Return original URL if no conversion was applied
  return { convertedUrl: url, isConverted: false };
}

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
  } catch (error) {
    console.error('Error tracking opt-in interaction:', error);
    // Don't throw - tracking errors shouldn't break user experience
  }
}

/**
 * Initializes an embedded form with listing data
 * Populates hidden fields with listing information
 */
export function initializeForm(formElement: HTMLElement, listing: ListingData): void {
  if (!formElement) return;
  
  // Common field names to look for in different form systems
  const fieldMappings = {
    listingId: ['listing_id', 'listingId', 'source_id', 'sourceId', 'item_id', 'itemId'],
    listingTitle: ['listing_title', 'listingTitle', 'source_name', 'sourceName', 'item_name', 'itemName'],
    listingCategory: ['listing_category', 'listingCategory', 'category', 'product_category'],
    listingSlug: ['listing_slug', 'listingSlug', 'slug', 'product_slug']
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
  
  // Add data attributes to the form for easier identification
  formElement.dataset.listingId = listing.id.toString();
  formElement.dataset.listingTitle = listing.title;
  formElement.dataset.listingSlug = listing.slug;
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
  } catch (error) {
    console.error('Error storing listing in session:', error);
  }
}

/**
 * Retrieves the listing stored in sessionStorage
 */
export function getListingFromSession(): ListingData | null {
  try {
    const storedListing = sessionStorage.getItem('current_listing');
    return storedListing ? JSON.parse(storedListing) : null;
  } catch (error) {
    console.error('Error retrieving listing from session:', error);
    return null;
  }
}