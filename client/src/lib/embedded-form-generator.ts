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
  // Header code - complete CSS and JavaScript implementation
  const cssCode = `<!-- 🔧 HEAD STYLE BLOCK -->
<style>
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
  box-shadow: none; /* 🔧 Shadow removed */
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
</style>

<!-- 📄 SCRIPT BLOCK (place before </body>) -->
<script>
  function getSlugFromUrl() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || "unknown";
  }

  function injectEmbeddedForm() {
    if (document.querySelector('.description-form-flexwrap')) return;

    const desc = document.getElementById('description');
    if (!desc) return;

    const slug = getSlugFromUrl();
    const formId = '${config.formUrl}'; // 🔁 Replace with your actual form ID
    const embedUrl = \`https://app.makerexpress3d.com/widget/form/\${formId}?${config.customFieldName}=\${encodeURIComponent(slug)}&utm_source=directory\`;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'description-form-flexwrap';

    // Insert wrapper before the description, then move description into it
    desc.parentNode.insertBefore(wrapper, desc);
    wrapper.appendChild(desc);

    // Create iframe (initially hidden)
    const iframe = document.createElement('iframe');
    iframe.className = 'inline-listing-form';
    iframe.src = embedUrl;

    iframe.onload = () => {
      iframe.classList.add('visible');
    };

    wrapper.appendChild(iframe);
    document.body.classList.add('form-injected');
  }

  document.addEventListener("DOMContentLoaded", injectEmbeddedForm);
  new MutationObserver(injectEmbeddedForm).observe(document.body, { childList: true, subtree: true });
</script>`;

  // Footer script with fully configurable parameters
  const jsCode = `<script>
  // 🔧 Auto-grabs the last URL segment as a fallback slug
  function getSlugFromUrl() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || "unknown";
  }

  // 💡 Main injection function using user-provided config
  function injectCustomForm({
    baseDomain = 'https://app.makerexpress3d.com', // [EDITABLE] 🟢 Set user domain
    formId = '',                                   // [EDITABLE] 🟢 Set form ID
    height = 470,                                  // [EDITABLE] 🟢 Set base form height
    paramName = 'listing',                         // [EDITABLE] 🟢 Set custom query key
    paramValue = '',                               // [EDITABLE] 🟢 Optional: override slug
    utm = 'directory'                              // [EDITABLE] 🟢 Optional UTM tag
  } = {}) {
    // ✅ Safety checks
    if (!formId || !paramName || document.querySelector('.description-form-flexwrap')) return;

    const desc = document.getElementById('description');
    if (!desc) return;

    const finalValue = paramValue || getSlugFromUrl(); // fallback to slug if paramValue is blank

    // 🔗 Construct query string dynamically
    const queryParams = new URLSearchParams({
      [paramName]: finalValue,
      utm_source: utm
    });

    // 🔨 Build full embed URL
    const embedUrl = \`\${baseDomain}/widget/form/\${formId}?\${queryParams.toString()}\`;

    // 🧱 Layout wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'description-form-flexwrap';
    desc.parentNode.insertBefore(wrapper, desc);
    wrapper.appendChild(desc);

    // 🖼️ Iframe setup with fade-in
    const iframe = document.createElement('iframe');
    iframe.className = 'inline-listing-form';
    iframe.src = embedUrl;
    iframe.style.height = \`\${height + 100}px\`; // [EDITABLE] ⬆ Adds padding
    iframe.style.opacity = '0';
    iframe.style.transition = 'opacity 0.6s ease';
    iframe.style.pointerEvents = 'none';

    iframe.onload = () => {
      iframe.classList.add('visible');
      iframe.style.opacity = '1';
      iframe.style.pointerEvents = 'auto';
    };

    wrapper.appendChild(iframe);
    document.body.classList.add('form-injected');
  }

  // 🚀 Config Example (set dynamically from Replit)
  const parsedEmbedData = {
    baseDomain: 'https://app.makerexpress3d.com',      // [EDITABLE] 🟢 User's white-labeled domain
    formId: '${config.formUrl}',                        // [EDITABLE] 🟢 Replace with actual form ID
    height: 470,                                        // [EDITABLE] 🟢 Custom height if needed
    paramName: '${config.customFieldName}',             // [EDITABLE] 🟢 Custom parameter name
    paramValue: '',                                     // [EDITABLE] 🟢 Optional, uses slug if blank
    utm: 'directory'                                    // [EDITABLE] 🟢 Optional UTM tag
  };

  // 🧩 Inject on page load and re-check via DOM observer
  document.addEventListener("DOMContentLoaded", () => injectCustomForm(parsedEmbedData));
  new MutationObserver(() => injectCustomForm(parsedEmbedData)).observe(document.body, { childList: true, subtree: true });
</script>`.replace(/\$\{config\.formUrl\}/g, config.formUrl)
   .replace(/\$\{config\.customFieldName\}/g, config.customFieldName);

  // HTML is empty since this is a script-only implementation
  const htmlCode = '';

  // Combined integration code for easy copy-paste
  const fullIntegrationCode = `${cssCode}\n\n${jsCode}`;

  return {
    htmlCode,
    cssCode: cssCode, // Complete header with CSS + JavaScript  
    jsCode: jsCode, // Footer script with enhanced config
    fullIntegrationCode: `${cssCode}\n\n${jsCode}`
  };
}