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

  const target = document.querySelector('#description');
  if (!target) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'description-form-flexwrap';

  const descriptionClone = target.cloneNode(true);
  wrapper.appendChild(descriptionClone);

  const iframe = document.createElement('iframe');
  iframe.className = 'inline-listing-form';
  
  // Build URL with metadata parameters
  const metadata = getListingMetadata();
  let paramString = \`${config.customFieldName}=\${encodeURIComponent(title)}&slug=\${encodeURIComponent(slug)}\`;
  
  // Add metadata parameters
  ${metadataParams}

  const separator = "${config.formUrl}".includes("?") ? "&" : "?";
  iframe.src = \`${config.formUrl}\${separator}\${paramString}\`;
  
  iframe.width = '100%';
  iframe.height = '500';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '${config.borderRadius}px';
  iframe.style.boxShadow = '${config.boxShadow}';
  wrapper.appendChild(iframe);

  target.replaceWith(wrapper);
  document.body.classList.add('form-injected', '${config.animationType === "fade-squeeze" ? "option-1" : "option-2"}');
})();
</script>`;

  // Generate CSS based on animation type
  const fadeSqueezeCSS = `/* 🅰️ Option 1: Fade-In with Layout Squeeze */
.description-form-flexwrap > #description {
  width: 100% !important;
  transition: width 1.5s ease;
}

.description-form-flexwrap > .inline-listing-form {
  width: 0 !important;
  opacity: 0;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 1.5s ease, opacity 0.8s ease 0.5s;
}

body.form-injected.option-1 .description-form-flexwrap > #description {
  width: 52% !important;
}

body.form-injected.option-1 .description-form-flexwrap > .inline-listing-form {
  width: 46% !important;
  opacity: 1;
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