# Directory Configuration Options

## Overview
The directory system provides a comprehensive set of configuration options that allow users to customize their listing display, form integration, and tracking setup to meet specific business needs.

## Core Configuration Areas

### Directory Settings
- **Directory Name**: Sets the primary name of the directory for branding and SEO
- **Logo**: Upload a custom logo to display in the directory header
- **Favicon**: Control browser tab icon and mobile home screen icon

### Listing Opt-In Configuration
The system supports two primary methods for visitor engagement:

#### 1. Action Button
- **Button Text**: Customizable call-to-action text
- **Button Type**:
  - Popup Form: Opens a GHL form in a modal overlay
  - URL Link: Redirects to an external page
  - Download: Enables file downloads with tracking
- **Button Styling**:
  - Color: Full color picker for background
  - Text Color: Separate control for optimal contrast
  - Border Radius: Slider for rounded corner adjustment

#### 2. Embedded Form
- **Form URL**: Direct embed from Go HighLevel
- **Height Control**: Adjust vertical space for form display
- **Border Styling**: Customize the form container appearance

### Listing Component Display
Toggle visibility for specific listing elements:

- **Price Display**: Show/hide pricing information
- **Extended Description**: Toggle longer product descriptions
- **Google Maps Widget**: Display location information visually
- **Metadata Bar**: Show categories, tags, and attributes

### Metadata Configuration
When enabled, the metadata system supports:

- **Custom Fields**: Up to 5 different metadata types
- **Icons**: Upload custom icons for each metadata type
- **Display Order**: Arrange metadata fields in priority order

### Tracking Integration
- **Field Name**: Customize the GHL field name (default: "listing")
- **Parameter Format**: Control how the slug appears in the URL
- **UTM Parameters**: Add additional tracking parameters for analytics

## Code Generation Options

The system generates code in four separated components:

1. **CSS Selectors**: Style definitions for directory elements
2. **Header Code**: Configuration variables and setup
3. **Footer Code**: DOM manipulation and form integration
4. **Form Embed**: HTML for embedding forms on listing pages

## Implementation Example

A typical configuration might include:

```json
{
  "directory": {
    "name": "Software Marketplace",
    "logo": "https://example.com/logo.png"
  },
  "optIn": {
    "type": "action-button",
    "text": "Request Demo",
    "style": {
      "color": "#4f46e5",
      "textColor": "#ffffff",
      "borderRadius": 8
    }
  },
  "components": {
    "showPrice": true,
    "showDescription": true,
    "showMaps": false,
    "showMetadata": true
  },
  "tracking": {
    "fieldName": "listing",
    "addUtmParameters": true
  }
}
```

## Best Practices for Configuration

1. **Button Clarity**: Use action-oriented text that clearly indicates purpose
2. **Color Consistency**: Maintain brand colors across button styling
3. **Component Selection**: Only enable components that add value to listings
4. **Metadata Strategy**: Design a consistent metadata taxonomy
5. **Form Integration**: Verify field names match exactly with GHL setup

## User Experience Guidelines

1. **Mobile Optimization**: Test all configurations on mobile devices
2. **Loading Performance**: Minimize form embed height for faster loading
3. **Visual Hierarchy**: Ensure the opt-in call-to-action stands out
4. **Consistent Metadata**: Use the same metadata fields across all listings
5. **Clear Value Proposition**: Configure components to highlight key selling points