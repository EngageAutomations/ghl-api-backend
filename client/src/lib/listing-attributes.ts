/**
 * Helper functions for URL slug-based listing association
 * These functions manage the extraction and application of URL slugs
 * for tracking parameters, form fields, and download links
 */

import { ListingData } from './listing-utils';
import { getSlugFromUrl } from './listing-utils';

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
 */
export function addHiddenFieldsToForms(slug: string): void {
  if (!slug) return;
  
  // Handle form submissions
  document.querySelectorAll('form').forEach(form => {
    // Check if field already exists
    if (!form.querySelector('input[name="product_slug"]')) {
      // Add hidden field for product tracking
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = 'product_slug';
      hiddenField.value = slug;
      form.appendChild(hiddenField);
    }
  });
  
  console.log('Added hidden fields to forms with slug:', slug);
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
 * Master function that applies all slug-based functionality
 */
export function applySlugBasedFunctionality(): void {
  const slug = getSlugFromUrl();
  
  if (!slug) {
    console.warn('Could not extract slug from URL');
    return;
  }
  
  applyUtmParametersToLinks(slug);
  addHiddenFieldsToForms(slug);
  setupDownloadButtons(slug);
  
  // Store in sessionStorage for access by other scripts
  sessionStorage.setItem('current_listing_slug', slug);
  
  console.log('Applied all slug-based functionality for:', slug);
}