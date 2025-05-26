/**
 * Embedded Form Code Generator for Go HighLevel Integration
 * Generates customizable embedded form code with animation options
 */

export interface EmbeddedFormConfig {
  formUrl: string;
  animationType: "fade-squeeze" | "slide-right";
  borderRadius: number;
  boxShadow: string;
  customFieldName: string;
  metadataFields: Array<{
    id: number;
    label: string;
    enabled: boolean;
  }>;
}

export function generateEmbeddedFormCode(config: EmbeddedFormConfig): {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  fullIntegrationCode: string;
} {
  // Generate the universal footer script
  const enabledMetadata = config.metadataFields.filter(field => field.enabled && field.label);
  const metadataParams = enabledMetadata.map(field => 
    `if (metadata.${field.label.toLowerCase()}) paramString += \`&${field.label.toLowerCase()}=\${encodeURIComponent(metadata.${field.label.toLowerCase()})}\`;`
  ).join('\n  ');

  const jsCode = `<script>
(function() {
  const slug = window.location.pathname.split('/').pop();
  const title = slug.replace(/-/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());

  // Function to extract metadata from page elements
  function getListingMetadata() {
    try {
      const metadata = {};
      
      // Try to extract metadata from page elements or data attributes
      const titleElement = document.querySelector('h1, .product-title, .listing-title');
      if (titleElement) metadata.title = titleElement.textContent.trim();
      
      const categoryElement = document.querySelector('.category, .product-category, [data-category]');
      if (categoryElement) metadata.category = categoryElement.textContent.trim() || categoryElement.getAttribute('data-category');
      
      const locationElement = document.querySelector('.location, .product-location, [data-location]');
      if (locationElement) metadata.location = locationElement.textContent.trim() || locationElement.getAttribute('data-location');
      
      return metadata;
    } catch (error) {
      console.log('Could not extract metadata:', error);
      return {};
    }
  }

  // Find the title element to position form next to it
  const titleElement = document.querySelector('h1, .product-title, .listing-title, .hl-product-detail-product-name, [class*="product-name"]');
  if (!titleElement) return;

  // Create form container
  const formContainer = document.createElement('div');
  formContainer.className = 'title-form-container';

  // Parse original embed code to extract dimensions and form URL
  function parseEmbedCode(embedCode) {
    const srcMatch = embedCode.match(/src="([^"]+)"/);
    const widthMatch = embedCode.match(/width="([^"]+)"/);
    const heightMatch = embedCode.match(/height="([^"]+)"/);
    
    return {
      formUrl: srcMatch ? srcMatch[1] : "${config.formUrl}",
      width: widthMatch ? parseInt(widthMatch[1]) : 500,
      height: heightMatch ? parseInt(heightMatch[1]) : 500
    };
  }

  // Create iframe with parsed dimensions + 100px buffer
  const iframe = document.createElement('iframe');
  iframe.className = 'title-inline-form';
  
  // Build URL with UTM injection
  const metadata = getListingMetadata();
  let paramString = \`listing=\${encodeURIComponent(slug)}&utm_source=directory\`;
  
  // Add custom field and metadata parameters
  paramString += \`&${config.customFieldName}=\${encodeURIComponent(title)}\`;
  
  // Add metadata parameters
  ${metadataParams}

  const separator = "${config.formUrl}".includes("?") ? "&" : "?";
  iframe.src = \`${config.formUrl}\${separator}\${paramString}\`;
  
  // Set dimensions for title alignment
  iframe.width = '100%';
  iframe.height = '400'; // Compact height for title alignment
  iframe.style.border = 'none';
  iframe.style.borderRadius = '${config.borderRadius}px';
  iframe.style.boxShadow = '${config.boxShadow}';
  formContainer.appendChild(iframe);

  // Insert form container after title element
  titleElement.parentNode.insertBefore(formContainer, titleElement.nextSibling);
  document.body.classList.add('form-injected');
})();
</script>`;

  // Generate CSS for title-aligned form positioning
  const fadeSqueezeCSS = `/* Embedded Form Positioned Next to Title */
.title-form-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  z-index: 10;
  opacity: 0;
  transition: opacity 1.2s ease;
}

body.form-injected .title-form-container {
  opacity: 1;
}

.title-inline-form {
  width: 100% !important;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Make title container relative for absolute positioning */
body.form-injected h1,
body.form-injected .product-title,
body.form-injected .listing-title,
body.form-injected .hl-product-detail-product-name,
body.form-injected [class*="product-name"] {
  position: relative;
}

/* Mobile Layout - Stack below title */
@media screen and (max-width: 768px) {
  .title-form-container {
    position: static;
    width: 100% !important;
    margin-top: 20px;
    opacity: 1 !important;
  }
}`;

  const slideRightCSS = `/* 🅱️ Option 2: Slide-In from Right */
body.option-2 .description-form-flexwrap > .inline-listing-form {
  width: 46% !important;
  transform: translateX(100%);
  opacity: 0;
  flex-shrink: 0;
  overflow: hidden;
  transition: transform 0.8s ease, opacity 0.8s ease;
}

body.form-injected.option-2 .description-form-flexwrap > #description {
  width: 52% !important;
}

body.form-injected.option-2 .description-form-flexwrap > .inline-listing-form {
  transform: translateX(0);
  opacity: 1;
}`;

  const baseCSS = `/* 👯 Flex Wrapper + Mobile Responsiveness */
.description-form-flexwrap {
  display: flex !important;
  flex-wrap: nowrap !important;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 30px;
  column-gap: 1px;
  width: 100%;
  box-sizing: border-box;
}

@media screen and (max-width: 768px) {
  .description-form-flexwrap {
    flex-direction: column !important;
  }

  .description-form-flexwrap > #description,
  .description-form-flexwrap > .inline-listing-form {
    width: 100% !important;
    max-width: 100% !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}`;

  const cssCode = `<style>
${config.animationType === "fade-squeeze" ? fadeSqueezeCSS : slideRightCSS}

${baseCSS}
</style>`;

  // Generate complete integration code
  const fullIntegrationCode = `<!-- Place this CSS in Header Tracking Code -->
${cssCode}

<!-- Place this JavaScript in Footer Tracking Code -->
${jsCode}`;

  return {
    htmlCode: "",
    cssCode,
    jsCode,
    fullIntegrationCode
  };
}

export function generateEmbeddedFormPreview(config: EmbeddedFormConfig): string {
  return `🎯 **Your Custom Embedded Form Integration**

**Animation Style:** ${config.animationType === "fade-squeeze" ? "🅰️ Fade-In with Layout Squeeze" : "🅱️ Slide-In from Right"}
**Form URL:** ${config.formUrl}
**Custom Field:** ${config.customFieldName}

**Styling:**
- Border Radius: ${config.borderRadius}px
- Box Shadow: ${config.boxShadow === "none" ? "None" : config.boxShadow}

**Metadata Fields:** ${config.metadataFields.filter(f => f.enabled && f.label).length} active fields

Copy the generated code and paste it into your Go HighLevel website settings.`;
}