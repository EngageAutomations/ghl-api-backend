/**
 * Enhanced Popup Code Generator for Go HighLevel Integration
 * Generates customizable popup code with user-defined styling and metadata support
 */

export interface PopupConfig {
  // Button styling
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  buttonText: string;
  
  // Popup styling
  popupBackgroundColor: string;
  popupOverlayColor: string;
  popupBorderRadius: number;
  closeButtonColor: string;
  closeButtonHoverColor: string;
  
  // Form configuration
  formUrl: string;
  customFieldName: string;
  
  // Metadata fields
  metadataFields: Array<{
    id: number;
    label: string;
    enabled: boolean;
  }>;
}

export function generatePopupCode(config: PopupConfig): {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  fullIntegrationCode: string;
} {
  // Generate CSS with user's custom colors
  const cssCode = `<style>
  #customOptinBackdrop {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: ${config.popupOverlayColor};
    z-index: 9998;
  }

  #customOptinForm {
    display: none;
    position: fixed;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    background: ${config.popupBackgroundColor};
    padding: 2rem;
    z-index: 9999;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
    border-radius: ${config.popupBorderRadius}px;
    max-width: 90%;
    width: 500px;
    min-height: 400px;
  }

  #customOptinForm .close-btn {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    color: ${config.closeButtonColor};
    transition: color 0.2s ease;
  }

  #customOptinForm .close-btn:hover {
    color: ${config.closeButtonHoverColor};
  }

  .trigger-optin-btn {
    display: inline-block;
    background-color: ${config.buttonColor};
    color: ${config.buttonTextColor};
    padding: 12px 20px;
    border-radius: ${config.buttonBorderRadius}px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    margin: 5px 0;
    text-align: center;
    border: none;
    text-decoration: none;
    transition: opacity 0.2s ease;
  }

  .trigger-optin-btn:hover {
    opacity: 0.9;
  }
</style>`;

  // Generate HTML structure
  const htmlCode = `<div id="customOptinBackdrop"></div>

<div id="customOptinForm">
  <span class="close-btn" onclick="closeOptinPopup()">×</span>
  <iframe
    id="popupFormFrame"
    width="100%"
    height="500"
    style="border:none; border-radius: 6px;">
  </iframe>
</div>`;

  // Generate enhanced JavaScript with metadata support
  const enabledMetadata = config.metadataFields.filter(field => field.enabled && field.label);
  const metadataParams = enabledMetadata.map(field => 
    `if (metadata.${field.label.toLowerCase()}) paramString += \`&${field.label.toLowerCase()}=\${encodeURIComponent(metadata.${field.label.toLowerCase()})}\`;`
  ).join('\n    ');

  const jsCode = `<script>
  const baseFormUrl = "${config.formUrl}";

  function getSlugFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/product\\/([^\\/\\?]+)/i);
    return match ? match[1] : "unknown";
  }

  function slugToTitle(slug) {
    return slug
      .replace(/-/g, ' ')
      .replace(/\\b\\w/g, c => c.toUpperCase());
  }

  function getListingMetadata(slug) {
    // This function can be enhanced to fetch metadata from your storage system
    // For now, it returns basic metadata that can be extracted from the page
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

  function openOptinPopup() {
    const slug = getSlugFromUrl();
    const productName = slugToTitle(slug);
    const metadata = getListingMetadata(slug);

    const iframe = document.getElementById("popupFormFrame");
    if (!iframe.src || !iframe.src.includes("${config.customFieldName}=")) {
      const separator = baseFormUrl.includes("?") ? "&" : "?";
      let paramString = \`${config.customFieldName}=\${encodeURIComponent(productName)}&slug=\${encodeURIComponent(slug)}\`;
      
      // Add metadata parameters
      ${metadataParams}

      iframe.src = \`\${baseFormUrl}\${separator}\${paramString}\`;
    }

    document.getElementById("customOptinForm").style.display = "block";
    document.getElementById("customOptinBackdrop").style.display = "block";
  }

  function closeOptinPopup() {
    document.getElementById("customOptinForm").style.display = "none";
    document.getElementById("customOptinBackdrop").style.display = "none";
  }

  function replaceAccessTag() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const targetText = "[${config.buttonText}]";

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.includes(targetText)) {
        const span = document.createElement("span");
        span.textContent = "${config.buttonText}";
        span.className = "trigger-optin-btn";
        span.addEventListener("click", openOptinPopup);

        const parts = node.nodeValue.split(targetText);
        const parent = node.parentNode;

        parent.insertBefore(document.createTextNode(parts[0]), node);
        parent.insertBefore(span, node);
        parent.insertBefore(document.createTextNode(parts[1]), node);
        parent.removeChild(node);
        break;
      }
    }
  }

  const observer = new MutationObserver(() => {
    replaceAccessTag();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", replaceAccessTag);
</script>`;

  // Generate complete integration code
  const fullIntegrationCode = `<!-- Place this CSS in Header Tracking Code -->
${cssCode}

<!-- Place this HTML and JavaScript in Footer Tracking Code -->
${htmlCode}

${jsCode}`;

  return {
    htmlCode,
    cssCode,
    jsCode,
    fullIntegrationCode
  };
}

export function generateCodePreview(config: PopupConfig): string {
  return `🎯 **Your Custom Popup Integration Code**

**Button Trigger:** [${config.buttonText}]
**Form URL:** ${config.formUrl}
**Custom Field:** ${config.customFieldName}

**Styling:**
- Button: ${config.buttonColor} with ${config.buttonBorderRadius}px radius
- Popup: ${config.popupBackgroundColor} background with ${config.popupBorderRadius}px radius
- Overlay: ${config.popupOverlayColor}
- Close Button: ${config.closeButtonColor} (hover: ${config.closeButtonHoverColor})

**Metadata Fields:** ${config.metadataFields.filter(f => f.enabled && f.label).length} active fields

Copy the generated code and paste it into your Go HighLevel website settings.`;
}