# Combined Listing Association Implementation

This guide demonstrates how our two complementary approaches work together:

1. **CSS Selector-Based Styling**: For immediate visual styling
2. **URL Slug-Based Token Substitution**: For dynamic content and functionality

## Integration Example

Here's a complete example showing both systems working together:

```javascript
// Sample implementation that combines both approaches

// 1. First, extract the slug from the URL (immediate, no delay)
const slug = getSlugFromUrl(); // Uses window.location.pathname

// 2. If a container exists with data attributes, we can apply CSS styling immediately
//    This happens as soon as the CSS loads, no JavaScript needed
//    (CSS selectors like [data-listing-slug="example-product"] .directory-action-button)

// 3. As a fallback, when JavaScript loads, we fetch the listing data
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch the listing data based on the slug
    const listing = await fetchListing(slug);
    
    // Add data attributes to container (fallback if not already present in HTML)
    addListingDataAttributes(listing);
    
    // Initialize any embedded forms with listing data
    const formElement = document.querySelector('.directory-embedded-form');
    if (formElement) {
      initializeForm(formElement, listing);
    }
    
    // Configure action buttons with proper URLs and token substitution
    const buttons = document.querySelectorAll('.directory-action-button');
    buttons.forEach(button => {
      configureActionButton(button, listing);
    });
    
    // Track page view for analytics
    trackOptInInteraction('page_view', listing);
  } catch (error) {
    console.error('Error initializing listing:', error);
  }
});

// Function to configure action buttons based on button type and listing data
function configureActionButton(button, listing) {
  const buttonType = button.getAttribute('data-button-type') || 'popup';
  
  switch (buttonType) {
    case 'url':
      const urlTemplate = button.getAttribute('data-url-template') || 'https://example.com?product={listing_title}';
      const finalUrl = replaceListingTokens(urlTemplate, listing);
      const trackingUrl = addUtmParams(finalUrl, {
        utm_source: 'directory',
        utm_medium: 'listing_button',
        utm_campaign: 'listings',
        utm_content: listing.slug
      });
      
      button.setAttribute('href', trackingUrl);
      button.addEventListener('click', () => {
        trackOptInInteraction('button_click', listing, { buttonType: 'url', destination: trackingUrl });
      });
      break;
      
    case 'download':
      const downloadUrl = convertToDirectDownloadLink(listing.downloadUrl || '').convertedUrl;
      
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        await trackOptInInteraction('download', listing);
        window.open(downloadUrl, '_blank');
      });
      break;
      
    case 'popup':
    default:
      button.addEventListener('click', () => {
        // Store the listing information for access in the popup
        storeListingInSession(listing);
        
        // Open popup with listing information
        const width = 600;
        const height = 500;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        const popup = window.open(
          `/popup?listing_id=${listing.id}&listing_slug=${listing.slug}`,
          'listingPopup',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        trackOptInInteraction('popup_open', listing);
      });
      break;
  }
}
```

## How The Two Systems Work Together

### CSS Selector System (Immediate)

1. When the page loads, CSS selectors immediately style elements based on data attributes:
   ```css
   [data-listing-category="electronics"] .directory-action-button {
       background-color: #2563eb !important;
   }
   ```

2. This works instantly if the HTML already includes the data attributes:
   ```html
   <div data-listing-slug="example-product" data-listing-category="electronics">
     <button class="directory-action-button">Contact Us</button>
   </div>
   ```

### URL-Based Token Substitution (Enhanced Functionality)

1. JavaScript code runs to extract the slug from the URL
2. If needed, it adds data attributes to the container (fallback)
3. It initializes forms and buttons with listing-specific data
4. It sets up tracking and event handlers

## Best Implementation Practices

For optimal performance:

1. **Server-Side Data Attributes**: Have the server include data attributes in the HTML
   ```html
   <div data-listing-slug="<?= $listing->slug ?>" 
        data-listing-category="<?= $listing->category ?>">
   ```

2. **CSS First**: Load CSS in the document head for immediate styling

3. **JavaScript Enhancement**: Use JavaScript to add functionality, not initial styling

4. **Token Substitution in URLs/Forms**: Use JavaScript for dynamic content like URLs and form fields

## Performance Considerations

- CSS selectors apply instantly (sub-millisecond)
- JavaScript token substitution has a slight delay (typically <100ms)
- Server-side inclusion of data attributes provides best performance
- Progressive enhancement ensures basic styling works even if JavaScript fails

By combining these approaches, we get the best of both worlds: immediate styling with CSS selectors, and enhanced functionality with JavaScript-based token substitution.