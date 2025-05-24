/**
 * URL Token Replacement Utility
 * Handles token replacement for URL and download button tracking
 */

export interface TokenData {
  slug: string;
  listing_title?: string;
  listing_category?: string;
  listing_location?: string;
  listing_price?: string;
  customFieldName?: string;
}

/**
 * Replace tokens in URLs with actual listing data and add tracking parameters
 */
export function processUrlWithTokens(
  baseUrl: string, 
  tokenData: TokenData,
  addTrackingParam: boolean = true
): string {
  if (!baseUrl) return '';
  
  let processedUrl = baseUrl;
  
  // Replace common tokens
  const tokenMap = {
    '{slug}': tokenData.slug || '',
    '{listing_title}': tokenData.listing_title || '',
    '{listing_category}': tokenData.listing_category || '',
    '{listing_location}': tokenData.listing_location || '',
    '{listing_price}': tokenData.listing_price || '',
    '{product_name}': tokenData.listing_title || '', // Legacy compatibility
  };
  
  // Perform token replacement
  Object.entries(tokenMap).forEach(([token, value]) => {
    processedUrl = processedUrl.replace(new RegExp(escapeRegExp(token), 'g'), encodeURIComponent(value));
  });
  
  // Add tracking parameter if enabled and customFieldName is provided
  if (addTrackingParam && tokenData.customFieldName && tokenData.slug) {
    const separator = processedUrl.includes('?') ? '&' : '?';
    processedUrl += `${separator}${tokenData.customFieldName}=${encodeURIComponent(tokenData.slug)}`;
  }
  
  return processedUrl;
}

/**
 * Generate JavaScript code for client-side URL processing
 */
export function generateUrlProcessingCode(customFieldName: string): string {
  return `
// URL Token Replacement and Tracking
window.GHLDirectory = window.GHLDirectory || {};

window.GHLDirectory.processUrl = function(baseUrl, listingData) {
  if (!baseUrl) return '';
  
  let processedUrl = baseUrl;
  
  // Replace tokens with listing data
  const tokenMap = {
    '{slug}': listingData.slug || '',
    '{listing_title}': listingData.title || '',
    '{listing_category}': listingData.category || '',
    '{listing_location}': listingData.location || '',
    '{listing_price}': listingData.price || '',
    '{product_name}': listingData.title || '' // Legacy compatibility
  };
  
  Object.entries(tokenMap).forEach(([token, value]) => {
    processedUrl = processedUrl.replace(new RegExp(token.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), encodeURIComponent(value));
  });
  
  // Add tracking parameter
  if ('${customFieldName}' && listingData.slug) {
    const separator = processedUrl.includes('?') ? '&' : '?';
    processedUrl += separator + '${customFieldName}=' + encodeURIComponent(listingData.slug);
  }
  
  return processedUrl;
};

window.GHLDirectory.addParameter = function(url, paramName, paramValue) {
  if (!url || !paramName || !paramValue) return url;
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + paramName + '=' + encodeURIComponent(paramValue);
};`;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert download URL for tracking (maintains compatibility with existing converter)
 */
export function convertDownloadUrl(originalUrl: string, tokenData: TokenData): {
  convertedUrl: string;
  wasConverted: boolean;
} {
  if (!originalUrl) {
    return { convertedUrl: '', wasConverted: false };
  }
  
  const processedUrl = processUrlWithTokens(originalUrl, tokenData, true);
  
  return {
    convertedUrl: processedUrl,
    wasConverted: true
  };
}