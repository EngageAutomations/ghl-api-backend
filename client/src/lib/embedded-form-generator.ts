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
  // Generate the universal header CSS
  const cssCode = `<style>
/* 👯 Wrapper for description + form */
.description-form-flexwrap {
  display: flex !important;
  flex-wrap: nowrap !important;
  justify-content: space-between;
  align-items: flex-start;
  column-gap: 1px;
  width: 100%;
  margin-top: 30px;
  box-sizing: border-box;
}

/* 📝 Description column */
.description-form-flexwrap > #description {
  flex: 1 1 52% !important;
  max-width: 52% !important;
  box-sizing: border-box;
  margin: 0 !important;
}

/* 📄 Iframe column - preload hidden */
.description-form-flexwrap > .inline-listing-form {
  flex: 1 1 46% !important;
  max-width: 46% !important;
  width: 100% !important;
  height: 800px !important;
  border: none;
  border-radius: 8px;
  box-shadow: none;
  overflow: hidden;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}

/* ✅ Fades in iframe after it loads */
.description-form-flexwrap > .inline-listing-form.visible {
  opacity: 1;
  pointer-events: auto;
}

/* 📱 Responsive layout */
@media screen and (max-width: 768px) {
  .description-form-flexwrap {
    flex-direction: column !important;
  }

  .description-form-flexwrap > #description,
  .description-form-flexwrap > .inline-listing-form {
    flex: 1 1 100% !important;
    max-width: 100% !important;
    margin-top: 20px !important;
    transition: none !important;
  }
}
</style>`;

  // Generate the universal footer script with templated form URL
  const jsCode = `<script>
  function getSlugFromUrl() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || "unknown";
  }

  function parseIframeSize(embedCode) {
    const widthMatch = embedCode.match(/width="([^"]+)"/);
    const heightMatch = embedCode.match(/height="([^"]+)"/);
    return {
      width: widthMatch ? widthMatch[1] : '100%',
      height: heightMatch ? heightMatch[1] : '800px'
    };
  }

  function injectEmbeddedForm() {
    if (document.querySelector('.description-form-flexwrap')) return;

    const desc = document.getElementById('description');
    if (!desc) return;

    const slug = getSlugFromUrl();
    const embedUrl = \`${config.formUrl}?${config.customFieldName}=\${encodeURIComponent(slug)}&utm_source=directory\`;
    
    // Parse original iframe dimensions from embed code
    const originalEmbedCode = \`${config.formUrl}\`;
    const dimensions = parseIframeSize(originalEmbedCode);

    const wrapper = document.createElement('div');
    wrapper.className = 'description-form-flexwrap';
    wrapper.appendChild(desc);

    const iframe = document.createElement('iframe');
    iframe.className = 'inline-listing-form';
    iframe.src = embedUrl;
    iframe.style.pointerEvents = 'none';
    
    // Apply parsed dimensions to iframe
    if (dimensions.width !== '100%') iframe.style.width = dimensions.width + 'px';
    if (dimensions.height !== '800px') iframe.style.height = dimensions.height + 'px';

    iframe.onload = () => {
      iframe.classList.add('visible');
      iframe.style.pointerEvents = 'auto';
    };

    wrapper.appendChild(iframe);
    desc.parentNode.insertBefore(wrapper, desc.nextSibling);
    document.body.classList.add('form-injected');
  }

  document.addEventListener("DOMContentLoaded", injectEmbeddedForm);
  new MutationObserver(injectEmbeddedForm).observe(document.body, { childList: true, subtree: true });
</script>`;

  // HTML is empty since this is a script-only implementation
  const htmlCode = '';

  // Combined integration code for easy copy-paste
  const fullIntegrationCode = `${cssCode}\n\n${jsCode}`;

  return {
    htmlCode,
    cssCode,
    jsCode,
    fullIntegrationCode
  };
}