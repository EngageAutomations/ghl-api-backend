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

  // Find the actual product details container from GoHighLevel structure
  const productDetailsContainer = document.querySelector('[class*="cstore-product-detail"], .product-detail-container, .c-product-details');
  if (!productDetailsContainer) return;

  // Create two-column wrapper for entire product details + form
  const wrapperContainer = document.createElement('div');
  wrapperContainer.className = 'product-details-with-form-wrapper';

  // Clone the entire product details and add to wrapper
  const productDetailsClone = productDetailsContainer.cloneNode(true);
  wrapperContainer.appendChild(productDetailsClone);

  // Create form container
  const formContainer = document.createElement('div');
  formContainer.className = 'product-details-form-container';

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
  iframe.className = 'product-details-inline-form';
  
  // Build URL with UTM injection
  const metadata = getListingMetadata();
  let paramString = \`listing=\${encodeURIComponent(slug)}&utm_source=directory\`;
  
  // Add custom field and metadata parameters
  paramString += \`&${config.customFieldName}=\${encodeURIComponent(title)}\`;
  
  // Add metadata parameters
  ${metadataParams}

  const separator = "${config.formUrl}".includes("?") ? "&" : "?";
  iframe.src = \`${config.formUrl}\${separator}\${paramString}\`;
  
  // Set dimensions for product details alignment
  iframe.width = '100%';
  iframe.height = '500'; // Height for product details alignment
  iframe.style.border = 'none';
  iframe.style.borderRadius = '${config.borderRadius}px';
  iframe.style.boxShadow = '${config.boxShadow}';
  formContainer.appendChild(iframe);

  // Add form to wrapper container
  wrapperContainer.appendChild(formContainer);

  // Replace original product details with wrapper
  productDetailsContainer.parentNode.insertBefore(wrapperContainer, productDetailsContainer);
  productDetailsContainer.remove();
  
  // Force layout reflow to prevent positioning issues
  wrapperContainer.offsetHeight;
  document.body.classList.add('form-injected');
})();
</script>`;

  // Generate CSS for product details + form wrapper (higher-level approach)
  const fadeSqueezeCSS = `/* Product Details + Form Two-Column Layout */
.product-details-with-form-wrapper {
  display: flex !important;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
}

.product-details-with-form-wrapper > [class*="cstore-product-detail"],
.product-details-with-form-wrapper > .product-detail-container,
.product-details-with-form-wrapper > .c-product-details {
  flex: 1;
  min-width: 0;
  max-width: none !important;
}

.product-details-form-container {
  width: 320px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 1.2s ease;
}

body.form-injected .product-details-form-container {
  opacity: 1;
}

.product-details-inline-form {
  width: 100% !important;
  height: 500px !important;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Ensure parent containers don't override our layout */
body.form-injected .product-details-with-form-wrapper {
  display: flex !important;
  flex-wrap: nowrap !important;
}

/* Mobile Layout - Stack vertically */
@media screen and (max-width: 768px) {
  .product-details-with-form-wrapper {
    flex-direction: column !important;
  }
  
  .product-details-form-container {
    width: 100% !important;
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