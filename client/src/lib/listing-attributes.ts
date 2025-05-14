/**
 * Helper functions for URL slug-based listing association
 * These functions manage the extraction and application of URL slugs
 * for tracking parameters, form fields, and download links
 * 
 * Go HighLevel integration: Uses configuration to apply custom field names
 * for proper tracking in Go HighLevel forms
 */

import { ListingData } from './listing-utils';
import { getSlugFromUrl } from './listing-utils';
import { DesignerConfig } from '@shared/schema';

/**
 * Applies UTM parameters to all links on the page based on current listing slug
 * Also adds the GHL custom field name parameter for consistent tracking
 * @param slug The listing slug
 * @param config Optional designer configuration
 * @param listingData Optional full listing data (if available)
 */
export function applyUtmParametersToLinks(
  slug: string, 
  config?: DesignerConfig, 
  listingData?: ListingData
): void {
  if (!slug) return;
  
  // Get the custom field name from config, or use default
  const customFieldName = config?.customFormFieldName || 'listing_id';
  
  // Use provided listing data or create a minimal listing object from the slug
  const listing = listingData || {
    id: 0,
    slug: slug,
    title: 'Product',
    category: '',
    userId: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Process action buttons with data attributes (these are our custom action buttons)
  document.querySelectorAll('.directory-action-button').forEach(button => {
    // Check if this is a link button
    if (button instanceof HTMLAnchorElement) {
      const urlTemplate = button.getAttribute('href') || '';
      if (urlTemplate && !urlTemplate.startsWith('#')) {
        try {
          // Use the listing data from the URL slug to process the button URL
          // Apply full URL processing with tokens and parameters
          const url = new URL(urlTemplate, window.location.origin);
          
          // Add our tracking parameters
          url.searchParams.set('utm_source', 'directory');
          url.searchParams.set('utm_medium', 'action_button');
          url.searchParams.set('utm_campaign', slug);
          url.searchParams.set(customFieldName, slug);
          
          button.href = url.toString();
          
          console.log('Updated action button URL with tracking parameters:', button.href);
        } catch (error) {
          console.error('Error processing action button URL:', error);
        }
      }
    }
  });
  
  // Apply to all regular links on the page
  document.querySelectorAll('a').forEach(link => {
    // Skip action buttons, as we've already processed them
    if (link.classList.contains('directory-action-button')) return;
    
    if (!link.href.includes('utm_')) {
      try {
        // Create URL object for proper parameter handling
        const url = new URL(link.href, window.location.origin);
        
        // Add standard UTM parameters
        url.searchParams.set('utm_source', 'directory');
        url.searchParams.set('utm_medium', 'product');
        url.searchParams.set('utm_campaign', slug);
        
        // Also add the custom field parameter for consistent tracking
        url.searchParams.set(customFieldName, slug);
        
        // Update the link href
        link.href = url.toString();
      } catch (error: unknown) {
        console.error('Error processing link:', link.href, error instanceof Error ? error.message : String(error));
        
        // Fallback to basic string concatenation if URL parsing fails
        const separator = link.href.includes('?') ? '&' : '?';
        link.href = link.href + separator + 'utm_source=directory&utm_medium=product&utm_campaign=' + slug + 
                   '&' + customFieldName + '=' + slug;
      }
    }
  });
  
  console.log(`Applied UTM parameters and ${customFieldName} parameter to links with slug:`, slug);
}

/**
 * Adds hidden fields to forms for tracking submissions by listing
 * Uses custom field name from config if provided, otherwise defaults to 'product_slug'
 */
export function addHiddenFieldsToForms(slug: string, config?: DesignerConfig): void {
  if (!slug) return;
  
  // Get the custom field name from config, or use default
  const fieldName = config?.customFormFieldName || 'product_slug';
  
  // Handle form submissions
  document.querySelectorAll('form').forEach(form => {
    // Check if field already exists (using the configured field name)
    if (!form.querySelector(`input[name="${fieldName}"]`)) {
      // Add hidden field for product tracking
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = fieldName;
      hiddenField.value = slug;
      form.appendChild(hiddenField);
      
      // Add data attribute for easier debugging/tracking
      form.setAttribute('data-listing-source', slug);
      
      // Add timestamp for when the form was accessed
      const timestampField = document.createElement('input');
      timestampField.type = 'hidden';
      timestampField.name = 'access_timestamp';
      timestampField.value = new Date().toISOString();
      form.appendChild(timestampField);
      
      // Add the full URL as a reference
      const urlField = document.createElement('input');
      urlField.type = 'hidden';
      urlField.name = 'listing_url';
      urlField.value = window.location.href;
      form.appendChild(urlField);
      
      console.log('Enhanced form tracking with timestamps and URL data');
    }
  });
  
  console.log(`Added hidden fields (${fieldName}) to forms with slug:`, slug);
}

/**
 * Configures download buttons with proper download URLs
 * Uses the custom field name for tracking downloads
 */
export function setupDownloadButtons(slug: string, config?: DesignerConfig): void {
  if (!slug) return;
  
  // Get the custom field name for consistency across all tracking methods
  const customFieldName = config?.customFormFieldName || 'listing_id';
  
  // Handle download buttons if present
  document.querySelectorAll('.download-button, [data-action="download"]').forEach(button => {
    // Ensure correct download URL for this product
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const baseDownloadUrl = button.getAttribute('data-download-url') || '';
      if (baseDownloadUrl) {
        // Redirect to the download with product tracking using the custom field name
        try {
          const url = new URL(baseDownloadUrl, window.location.origin);
          url.searchParams.set(customFieldName, slug);
          url.searchParams.set('timestamp', Date.now().toString());
          window.location.href = url.toString();
        } catch (error: unknown) {
          // Fallback to simple string concatenation if URL parsing fails
          console.warn('Error parsing download URL:', error instanceof Error ? error.message : String(error));
          const separator = baseDownloadUrl.includes('?') ? '&' : '?';
          window.location.href = baseDownloadUrl + separator + customFieldName + '=' + slug;
        }
      }
    });
  });
  
  console.log(`Setup download buttons with slug ${slug} using parameter ${customFieldName}`);
}

/**
 * Fetches the current configuration
 * Attempts to get it from localStorage if available
 */
function getStoredConfig(): DesignerConfig | undefined {
  try {
    const configStr = localStorage.getItem('designer_config');
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('Error parsing stored config:', error);
  }
  return undefined;
}

/**
 * Adds UTM parameters to iframes in popup embeds and embedded forms
 * Uses configured parameter names from config
 */
export function addParamsToIframes(slug: string, config?: DesignerConfig): void {
  if (!slug) return;
  
  // Get all iframes on the page
  const iframes = document.querySelectorAll('iframe');
  if (!iframes || iframes.length === 0) {
    console.log('No iframes found for parameter tracking');
    return;
  }
  
  // Get the GHL custom field name from config, or use default
  // This will be used for all GHL forms (both popup and embedded)
  const ghlFieldName = config?.customFormFieldName || 'listing_id';
  
  // Process each iframe to add the parameter to the src URL
  iframes.forEach(iframe => {
    if (iframe.src) {
      try {
        const srcUrl = new URL(iframe.src);
        
        // Determine if this is a popup iframe or form iframe
        // by looking at the parent element or container
        const isInPopup = iframe.closest('[data-popup]') !== null;
        const isInEmbeddedForm = iframe.closest('[data-embedded-form]') !== null;
        
        // For Go HighLevel iframes, we need to check for common patterns in the src URL
        const isGHLForm = iframe.src.includes('app.gohighlevel.com') || 
                          iframe.src.includes('forms.gohighlevel.com') ||
                          iframe.src.includes('marketplace.gohighlevel.com');
        
        // Use the same GHL field name for all contexts - consistency is key
        const paramName = ghlFieldName; // Use the custom field name set in the configuration
        
        console.log('Processing iframe:', {
          src: iframe.src,
          isPopup: isInPopup,
          isEmbedded: isInEmbeddedForm,
          isGHL: isGHLForm,
          paramName: paramName
        });
        
        // Only add if not already present
        if (!srcUrl.searchParams.has(paramName)) {
          srcUrl.searchParams.set(paramName, slug);
          iframe.src = srcUrl.toString();
          console.log(`Added parameter ${paramName}=${slug} to iframe src`, {
            oldSrc: iframe.src,
            newSrc: srcUrl.toString()
          });
        }
        
        // Also add a timestamp for tracking purposes
        if (!srcUrl.searchParams.has('timestamp')) {
          srcUrl.searchParams.set('timestamp', new Date().toISOString());
          iframe.src = srcUrl.toString();
          console.log('Added timestamp parameter to iframe');
        }
        
        // Add data attributes for debugging
        iframe.setAttribute('data-tracking-param', paramName);
        iframe.setAttribute('data-tracking-slug', slug);
        
      } catch (error) {
        console.error('Error processing iframe src URL:', error);
      }
    }
  });
  
  console.log(`Added parameters to iframes with slug:`, slug);
}

/**
 * Master function that applies all slug-based functionality
 * Fetches configuration and listing data to use for URL tracking
 */
export function applySlugBasedFunctionality(): void {
  // First, expose our utility functions to the window object
  // so they can be used by GHL or other external scripts
  import('./listing-utils').then(utils => {
    if (typeof utils.exposeListingFunctionsToWindow === 'function') {
      utils.exposeListingFunctionsToWindow();
    }
  }).catch(error => {
    console.error('Failed to import listing utility functions:', error);
  });
  
  const slug = getSlugFromUrl();
  
  if (!slug) {
    console.warn('Could not extract slug from URL');
    return;
  }
  
  // Try to get config from localStorage
  const config = getStoredConfig();
  
  console.log('---- Go HighLevel Form Tracking Setup ----');
  console.log(`Detected listing slug: ${slug}`);
  
  if (config) {
    console.log('Configuration found:');
    console.log(`- GHL Custom field name: ${config.customFormFieldName || 'Not set (using default: listing_id)'}`);
    console.log(`- Form position: ${config.formPosition || 'Default position'}`);
  } else {
    console.log('No configuration found, using default settings');
  }
  
  // Fetch actual listing data by slug - this is the key change
  import('./listing-utils').then(async utils => {
    try {
      const listingData = await utils.getListingBySlug(slug);
      console.log('Fetched listing data:', listingData);
      
      // Now use the actual listing data for all functionality
      applyUtmParametersToLinks(slug, config, listingData);
      addHiddenFieldsToForms(slug, config, listingData);
      addParamsToIframes(slug, config, listingData);
      setupDownloadButtons(slug, config, listingData);
      
      // Store full listing data in sessionStorage for access by other scripts
      sessionStorage.setItem('current_listing_data', JSON.stringify(listingData));
      sessionStorage.setItem('current_listing_slug', slug);
      
      // Store the GHL field name for easier access by other scripts
      const ghlFieldName = config?.customFormFieldName || 'listing_id';
      sessionStorage.setItem('ghl_field_name', ghlFieldName);
      
      // Track page visit in console with listing info
      console.log('----------------------------------------');
      console.log(`Listing Page Tracking Active | Slug: ${slug}`);
      console.log(`Listing Title: ${listingData.title}`);
      console.log(`GHL Custom Field Name: ${ghlFieldName}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log('----------------------------------------');
    } catch (error) {
      console.error('Error applying slug-based functionality with listing data:', error);
      
      // Fallback to old behavior without listing data
      applyUtmParametersToLinks(slug, config);
      addHiddenFieldsToForms(slug, config);
      addParamsToIframes(slug, config);
      setupDownloadButtons(slug, config);
      
      // Still store the slug and config
      sessionStorage.setItem('current_listing_slug', slug);
      const ghlFieldName = config?.customFormFieldName || 'listing_id';
      sessionStorage.setItem('ghl_field_name', ghlFieldName);
    }
  }).catch(error => {
    console.error('Error importing listing utilities:', error);
  });
}