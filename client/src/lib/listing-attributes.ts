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
 */
export function applyUtmParametersToLinks(slug: string): void {
  if (!slug) return;
  
  // Apply to all links on the page
  document.querySelectorAll('a').forEach(link => {
    if (!link.href.includes('utm_')) {
      // Add UTM parameters based on current product
      const separator = link.href.includes('?') ? '&' : '?';
      link.href = link.href + separator + 'utm_source=directory&utm_medium=product&utm_campaign=' + slug;
    }
  });
  
  console.log('Applied UTM parameters to links with slug:', slug);
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
 */
export function setupDownloadButtons(slug: string): void {
  if (!slug) return;
  
  // Handle download buttons if present
  document.querySelectorAll('.download-button, [data-action="download"]').forEach(button => {
    // Ensure correct download URL for this product
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const baseDownloadUrl = button.getAttribute('data-download-url') || '';
      if (baseDownloadUrl) {
        // Redirect to the download with product tracking
        window.location.href = baseDownloadUrl + '?product=' + slug;
      }
    });
  });
  
  console.log('Setup download buttons with slug:', slug);
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
  
  // Get the custom parameter names from config, or use defaults
  const popupParamName = config?.popupParamName || 'listing_id';
  const formParamName = config?.formParamName || 'listing_id';
  
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
        
        // Choose the appropriate parameter name based on context
        const paramName = isInPopup ? popupParamName : 
                          isInEmbeddedForm ? formParamName : 
                          isGHLForm ? formParamName :  // Default to form parameter for GHL
                          'listing_id'; // default if can't determine
        
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
 * Fetches configuration if available to use custom field names
 */
export function applySlugBasedFunctionality(): void {
  const slug = getSlugFromUrl();
  
  if (!slug) {
    console.warn('Could not extract slug from URL');
    return;
  }
  
  // Try to get config from localStorage
  const config = getStoredConfig();
  
  console.log('---- UTM Parameter & Form Tracking Setup ----');
  console.log(`Detected listing slug: ${slug}`);
  
  if (config) {
    console.log('Configuration found:');
    console.log(`- Custom field name: ${config.customFormFieldName || 'Not set (using default: product_slug)'}`);
    console.log(`- Popup parameter name: ${config.popupParamName || 'Not set (using default: listing_id)'}`);
    console.log(`- Form parameter name: ${config.formParamName || 'Not set (using default: listing_id)'}`);
    console.log(`- Form position: ${config.formPosition || 'Default position'}`);
  } else {
    console.log('No configuration found, using default settings');
  }
  
  // Apply all slug-based functionality with config if available
  applyUtmParametersToLinks(slug);
  addHiddenFieldsToForms(slug, config);
  addParamsToIframes(slug, config);
  setupDownloadButtons(slug);
  
  // Store in sessionStorage for access by other scripts
  sessionStorage.setItem('current_listing_slug', slug);
  
  // Store the field names used for easier access by other scripts
  const fieldName = config?.customFormFieldName || 'product_slug';
  sessionStorage.setItem('listing_field_name', fieldName);
  
  const popupParamName = config?.popupParamName || 'listing_id';
  sessionStorage.setItem('popup_param_name', popupParamName);
  
  const formParamName = config?.formParamName || 'listing_id';
  sessionStorage.setItem('form_param_name', formParamName);
  
  // Track page visit in console
  console.log('----------------------------------------');
  console.log(`Listing Page Tracking Active | Slug: ${slug}`);
  console.log(`Custom Field Name: ${fieldName}`);
  console.log(`Popup Parameter Name: ${popupParamName}`);
  console.log(`Form Parameter Name: ${formParamName}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('----------------------------------------');
}