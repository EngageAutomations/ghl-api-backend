# Configuration Matrix - Code Generation Requirements

This document outlines what code components are generated for each configuration option in the directory integration system.

## Complete Configuration Matrix

| Feature                     | Needs Header Code? | Needs Footer Code? | Injects HTML? | Needs Custom CSS? | Notes                           |
| --------------------------- | ------------------ | ------------------ | ------------- | ----------------- | ------------------------------- |
| **Core Integration**        | ✓ Yes              | ✓ Yes              | No            | No                | Base tracking & slug detection  |
| **Action Button - URL**     | No                 | No                 | No            | ✓ Yes             | CSS-only trigger                |
| **Action Button - Download** | No                 | No                 | No            | ✓ Yes             | Uses native `<a download>`      |
| **Action Button - Popup**   | ✓ Yes              | ✓ Yes              | ✓ Yes (popup) | ✓ Yes             | Needs popup overlay & handling  |
| **Embedded Form**           | ✓ Yes              | No                 | ✓ Yes (iframe)| ✓ Yes             | Injects iframe below content    |
| **Extended Descriptions**   | ✓ Yes (CSS)        | ✓ Yes (API)        | ✓ Yes (div)   | ✓ Yes             | Fetches from /api/descriptions  |
| **Metadata Bar**            | ✓ Yes (CSS)        | ✓ Yes (API)        | ✓ Yes (div)   | ✓ Yes             | Fetches from /api/metadata      |
| **Google Maps Widget**      | ✓ Yes (CSS)        | ✓ Yes (API)        | ✓ Yes (iframe)| ✓ Yes             | Fetches from /api/map           |
| **Button Styling**          | ✓ Yes (CSS)        | No                 | No            | ✓ Yes             | Dynamic CSS generation          |
| **Form Field Tracking**     | No                 | ✓ Yes              | ✓ Yes (hidden)| No                | Injects hidden fields in forms |
| **Google Analytics**        | No                 | ✓ Yes              | No            | No                | Event tracking integration      |
| **Download Tracking**       | No                 | ✓ Yes              | No            | No                | URL parameter injection         |

## Code Generation Patterns

### Header Code Requirements

**Always Generated:**
- Base configuration variables (`window.GHLDirectory`)
- Slug detection utility functions
- Parameter injection helpers

**Conditionally Generated:**
- CSS styling for visual features
- Popup overlay HTML structure
- Custom styling based on user preferences

### Footer Code Requirements

**Always Generated:**
- DOM ready event handler
- Basic form field injection
- Slug detection and processing

**Conditionally Generated:**
- API calls for dynamic content loading
- Event tracking integration
- Download URL parameter handling
- Custom DOM manipulation

### HTML Injection Points

Different features inject content at specific DOM locations:

| Feature | Injection Target | Injection Method | Content Type |
|---------|------------------|------------------|--------------|
| Extended Descriptions | `#description` | `insertAdjacentElement('afterend')` | `<div class="extended-description">` |
| Metadata Bar | `#description` | `insertAdjacentElement('afterend')` | `<div class="metadata-bar">` |
| Google Maps | `.metadata-bar` | `insertAdjacentElement('afterend')` | `<div class="map-wrapper">` |
| Form Tracking | All `<form>` elements | `appendChild()` | `<input type="hidden">` |
| Popup Forms | `<body>` | `appendChild()` | Overlay modal structure |

### CSS Generation Patterns

**Visual Features Requiring CSS:**
- Action buttons - styling, colors, hover effects, border radius
- Embedded forms - iframe responsive styling and container layout
- Extended descriptions - typography, spacing, and image handling
- Metadata bar - flexbox layout, icon styling, and responsive design
- Google Maps - container styling, shadows, and border radius
- Button customization - dynamic colors, borders, and dimensions

**Features Without CSS:**
- Core tracking logic and JavaScript utilities
- Hidden form field injection functionality
- Analytics event tracking and parameter handling
- Download URL parameter processing

## Smart Code Generation

The system uses conditional logic to only generate code for enabled features:

```typescript
// Example: Only add extended descriptions code if enabled
if (showDescription) {
  footerCode += `
    // Extended Descriptions Loading
    fetch('${apiEndpoint}?slug=' + encodeURIComponent(slug))
      .then(res => res.json())
      .then(data => {
        // DOM manipulation logic
      });`;
      
  headerCode += `
    <style>
    .extended-description {
      /* CSS styling */
    }
    </style>`;
}
```

This approach ensures:
- ✅ Optimized file sizes
- ✅ Clean, readable code output
- ✅ No unnecessary CSS or JavaScript
- ✅ Faster page load times
- ✅ Easier debugging and maintenance

## API Dependencies

Features requiring backend API endpoints:

| Feature | Endpoint | Expected Response Format |
|---------|----------|-------------------------|
| Extended Descriptions | `/api/descriptions?slug=...` | `{ "html": "content" }` |
| Metadata Bar | `/api/metadata?slug=...` | `{ "metadata": [{"icon": "url", "text": "value"}] }` |
| Google Maps | `/api/map?slug=...` | `{ "address": "full address" }` |

## Integration Best Practices

1. **Progressive Enhancement**: Core functionality works without JavaScript
2. **Error Handling**: All API calls include `.catch()` error handling
3. **Performance**: Only load what's needed based on configuration
4. **Accessibility**: Generated HTML includes proper ARIA attributes
5. **SEO Friendly**: Content injection doesn't interfere with search engines