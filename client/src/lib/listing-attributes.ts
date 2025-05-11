/**
 * Helper functions to manage HTML listing data attributes
 * These functions add/manage data attributes for CSS selector-based styling
 * Simplified to focus only on the slug extraction from URL
 */

import { ListingData } from './listing-utils';
import { getSlugFromUrl } from './listing-utils';

/**
 * Adds the data-listing-slug attribute to the product container
 * This allows the CSS to apply specific styling based on the URL slug
 */
export function addListingSlugAttribute(): void {
  // Target common page containers that might wrap product content
  const possibleContainers = [
    document.querySelector('.product-container'),
    document.querySelector('.product-detail'),
    document.querySelector('.hl-product-detail'),
    document.querySelector('.c-product-details'),
    document.querySelector('main'),
    document.body
  ];
  
  // Find the first valid container
  const container = possibleContainers.find(el => el !== null);
  
  if (!container) {
    console.warn('Could not find container to add listing slug attribute');
    return;
  }
  
  // Extract slug from the current URL
  const slug = getSlugFromUrl();
  
  if (!slug) {
    console.warn('Could not extract slug from URL');
    return;
  }
  
  // Set the data-listing-slug attribute
  container.setAttribute('data-listing-slug', slug);
  
  console.log('Added data-listing-slug attribute:', slug);
}

/**
 * Checks if a container already has the listing slug attribute
 */
export function hasSlugAttribute(container: Element): boolean {
  return container.hasAttribute('data-listing-slug');
}

/**
 * Gets the slug from a container's data attribute
 */
export function getSlugFromAttribute(container: Element): string {
  return container.getAttribute('data-listing-slug') || '';
}