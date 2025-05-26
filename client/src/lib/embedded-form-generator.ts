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

  // Wait for description element to render and use structural placeholder approach
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
    });
  }

  // Simple floating widget approach - more reliable than layout manipulation
  const formWidget = document.createElement('div');
  formWidget.id = 'directory-form-widget';
  formWidget.className = 'directory-floating-form';

  // Parse original embed code to extract form URL properly
  function parseEmbedCode(embedCode) {
    const srcMatch = embedCode.match(/src="([^"]+)"/);
    const widthMatch = embedCode.match(/width="([^"]+)"/);
    const heightMatch = embedCode.match(/height="([^"]+)"/);
    
    return {
      formUrl: srcMatch ? srcMatch[1] : embedCode,
      width: widthMatch ? parseInt(widthMatch[1]) : 500,
      height: heightMatch ? parseInt(heightMatch[1]) : 500
    };
  }

  // Parse the form URL properly
  const parsedForm = parseEmbedCode("${config.formUrl}");
  
  // Create iframe with proper URL handling
  const iframe = document.createElement('iframe');
  iframe.className = 'product-details-inline-form';
  
  // Build URL with UTM injection (use parsed form URL, not full embed code)
  const metadata = getListingMetadata();
  let paramString = \`listing=\${encodeURIComponent(slug)}&utm_source=directory\`;
  
  // Add custom field and metadata parameters
  paramString += \`&${config.customFieldName}=\${encodeURIComponent(title)}\`;
  
  // Add metadata parameters
  ${metadataParams}

  const separator = parsedForm.formUrl.includes("?") ? "&" : "?";
  iframe.src = \`\${parsedForm.formUrl}\${separator}\${paramString}\`;
  
  // Set dimensions for product details alignment
  iframe.width = '100%';
  iframe.height = '500'; // Height for product details alignment
  iframe.style.border = 'none';
  iframe.style.borderRadius = '${config.borderRadius}px';
  iframe.style.boxShadow = '${config.boxShadow}';
  formContainer.appendChild(iframe);

  // Add form to placeholder container
  placeholderContainer.appendChild(formContainer);

  // Find the parent container to inject properly  
  const targetContainer = descriptionElement.closest('[class*="c-product-details"], .product-detail-container') || descriptionElement.parentNode;
  
  // Insert placeholder container in the target location
  targetContainer.parentNode.insertBefore(placeholderContainer, targetContainer.nextSibling);
  
  // Force layout reflow and add CSS lock-in class
  placeholderContainer.offsetHeight;
  document.body.classList.add('form-injected', 'directory-embed-active');
})();
</script>`;

  // Generate CSS with structural placeholder and CSS lock-in
  const fadeSqueezeCSS = `/* Directory Embed Wrapper - CSS Lock-in Approach */
#listingEmbedFormContainer.directory-embed-wrapper {
  display: flex !important;
  gap: 20px !important;
  align-items: flex-start !important;
  width: 100% !important;
  box-sizing: border-box !important;
  position: relative !important;
}

#listingEmbedFormContainer.directory-embed-wrapper > #description,
#listingEmbedFormContainer.directory-embed-wrapper > [class*="description"],
#listingEmbedFormContainer.directory-embed-wrapper > .product-description {
  flex: 1 !important;
  min-width: 0 !important;
  max-width: none !important;
}

.product-details-form-container {
  width: 320px !important;
  flex-shrink: 0 !important;
  opacity: 0 !important;
  transition: opacity 1.2s ease !important;
  min-height: 500px !important;
}

body.directory-embed-active .product-details-form-container {
  opacity: 1 !important;
}

.product-details-inline-form {
  width: 100% !important;
  height: 500px !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: none !important;
  border: none !important;
}

/* Strong CSS override protection */
body.directory-embed-active #listingEmbedFormContainer.directory-embed-wrapper {
  display: flex !important;
  flex-wrap: nowrap !important;
}

/* Failover mode - stack layout if flex fails */
@media screen and (max-width: 768px) {
  #listingEmbedFormContainer.directory-embed-wrapper {
    flex-direction: column !important;
  }
  
  .product-details-form-container {
    width: 100% !important;
    opacity: 1 !important;
    margin-top: 20px !important;
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