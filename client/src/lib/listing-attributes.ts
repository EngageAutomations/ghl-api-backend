/**
 * Helper functions to manage HTML listing data attributes
 * These functions add/manage data attributes for CSS selector-based styling
 */

import { ListingData } from './listing-utils';

/**
 * Adds data attributes to the product container for CSS selector-based styling
 * This operates as a fallback when the page doesn't already have data attributes
 */
export function addListingDataAttributes(listing: ListingData): void {
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
    console.warn('Could not find container to add listing data attributes');
    return;
  }
  
  // Set data attributes based on listing properties
  container.setAttribute('data-listing-slug', listing.slug);
  
  if (listing.category) {
    // Convert category to kebab case for CSS selector compatibility
    const categoryValue = listing.category.toLowerCase().replace(/\s+/g, '-');
    container.setAttribute('data-listing-category', categoryValue);
  }
  
  if (listing.location) {
    // Convert location to kebab case for CSS selector compatibility
    const locationValue = listing.location.toLowerCase().replace(/\s+/g, '-');
    container.setAttribute('data-listing-location', locationValue);
  }
  
  // Check listing title for priority indicators
  const title = listing.title.toLowerCase();
  if (title.includes('featured') || title.includes('premium') || title.includes('deluxe')) {
    container.setAttribute('data-listing-priority', 'featured');
  } else {
    container.setAttribute('data-listing-priority', 'standard');
  }
  
  console.log('Added listing data attributes to container:', {
    slug: listing.slug,
    category: listing.category,
    location: listing.location
  });
}

/**
 * Checks if a container already has listing data attributes
 */
export function hasListingDataAttributes(container: Element): boolean {
  return container.hasAttribute('data-listing-slug');
}

/**
 * Gets listing data attributes from a container
 */
export function getListingDataFromAttributes(container: Element): Partial<ListingData> {
  return {
    slug: container.getAttribute('data-listing-slug') || '',
    category: container.getAttribute('data-listing-category') || '',
    location: container.getAttribute('data-listing-location') || ''
  };
}