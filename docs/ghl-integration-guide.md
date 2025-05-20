# Go HighLevel Integration Guide

This guide explains how to integrate your Marketplace Directory with Go HighLevel forms for proper tracking and data collection.

## Overview

The integration allows you to:

1. Track which listing/product a form submission came from
2. Pass listing details to Go HighLevel as custom fields
3. Use dynamic URLs with parameter tracking
4. Support both embedded forms and popup forms

## Setup Instructions

### Step 1: Configure Your Directory Settings

1. In your directory management dashboard, set the following:
   - **GHL Custom Field Name**: The field name in Go HighLevel that will store the listing ID (e.g., `listing_id`)
   - **Enable Embedded Form**: Turn on if you want forms directly on listing pages
   - **Form Embed URL**: Your Go HighLevel form URL (can include tokens like `{product_name}`)

### Step 2: Set Up Go HighLevel Form

1. In Go HighLevel, create a new form or edit an existing one
2. Add a **Custom Field** with:
   - Field name matching your GHL Custom Field Name from Step 1
   - Recommended field type: Hidden
3. Enable "**Capture URL Parameters**" in the form settings
4. Save your form and get the embed code

### Step 3: Add Integration Code

#### Option A: Use Our Script Tag (Recommended)

Add this script to your Go HighLevel pages or website:

```html
<!-- Directory to GHL Integration -->
<script id="ghl-directory-config" type="application/json">
{
  "customFormFieldName": "listing_id",
  "enableEmbeddedForm": true
}
</script>
<script src="https://YOUR-REPLIT-APP.replit.app/ghl-embed-code.js"></script>
```

Replace `YOUR-REPLIT-APP.replit.app` with your actual Replit app URL.

#### Option B: Copy Full Embed Code

If you prefer, you can copy the full embed code from `client/src/lib/ghl-embed-code.js` and paste it directly into your Go HighLevel page HTML.

Make sure to update these variables at the top:
- `API_BASE_URL`: Your Replit app URL
- `DEFAULT_FORM_URL`: Your default GHL form URL

### Step 4: Test Your Integration

1. Visit one of your listing pages (e.g., `/product-details/product/your-listing-slug`)
2. Right-click and "View Page Source" to verify parameters are added to the URL
3. Submit a test form and check in Go HighLevel that the custom field contains your listing ID

## How It Works

The integration script:

1. Extracts the listing slug from the current URL
2. Fetches listing data from your Replit API
3. Updates the page URL with tracking parameters for Go HighLevel to read
4. Modifies any existing GHL form iframes to include these parameters
5. Optionally creates and injects a GHL form if one doesn't exist

## Supported URL Formats

The integration works with the following URL structures:

- `/product-details/product/your-product-slug` (default)
- `/your-product-slug` (simplified)
- `?slug=your-product-slug` (query parameter)

## Troubleshooting

### Common Issues

- **Form not capturing listing ID**: Ensure "Capture URL Parameters" is enabled in GHL
- **Custom field not appearing**: Verify the field name matches exactly in both systems
- **Script not loading**: Check console for errors and ensure paths are correct
- **Listing data not found**: Confirm your API endpoint is accessible

### Testing Your Setup

You can test if parameters are being passed correctly by:

1. Adding `console.log("Params:", params);` to the script
2. Looking at your browser's console while visiting a listing page
3. Submitting a test form and checking the values in Go HighLevel

## Advanced Configuration

### Custom Styling

Add CSS for your embedded forms:

```css
.directory-embedded-form {
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
}

.directory-embedded-form iframe {
  width: 100%;
  min-height: 500px;
  border: none;
}
```

### Multiple Form Types

If you have different form types, you can specify them in your config:

```html
<script id="ghl-directory-config" type="application/json">
{
  "customFormFieldName": "listing_id",
  "enableEmbeddedForm": true,
  "formTypes": {
    "contact": "https://forms.gohighlevel.com/contact-form",
    "quote": "https://forms.gohighlevel.com/quote-form"
  }
}
</script>
```

### Token Replacement

The integration supports replacing tokens in your URLs:

- `{product_name}` - Replaced with the listing title
- `{slug}` - Replaced with the listing slug
- `{category}` - Replaced with the listing category

For example: `https://forms.gohighlevel.com/form?product={product_name}`