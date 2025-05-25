/**
 * Scalable JSON Configuration Schema for Directory Integration Features
 * Each feature is defined with its own code templates, styling variables, and requirements
 */

export interface ConfigTemplate {
  configName: string;
  fieldsUsed: {
    css: boolean;
    header: boolean;
    footer: boolean;
  };
  placeholders: Record<string, string>;
  stylingVariables: Record<string, string>;
  requiresIframeEmbedInput: boolean;
  autoParsedFromEmbedCode: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  cssTemplate?: string;
}

/**
 * Action Button (Popup) Configuration Template
 * Fully reviewed and finalized for production
 */
export const ACTION_BUTTON_POPUP_CONFIG: ConfigTemplate = {
  configName: "Action Button (Popup)",
  fieldsUsed: {
    css: true,
    header: true,
    footer: true
  },
  placeholders: {
    "YOUR_FORM_ID": "Parsed from iframe embed code input",
    "LISTING_SLUG": "Dynamic listing identifier", 
    "FORM_HEIGHT": "Extracted from iframe height attribute",
    "FORM_WIDTH": "Extracted from iframe width attribute",
    "POPUP_HEIGHT": "Form height + 100px padding",
    "MAX_WIDTH": "Form width + 100px padding"
  },
  stylingVariables: {
    "buttonColor": "#4CAF50",
    "buttonTextColor": "#ffffff", 
    "buttonRadius": "6px",
    "popupBackgroundColor": "#ffffff",
    "overlayColor": "rgba(0, 0, 0, 0.6)",
    "popupBorderRadius": "10px",
    "closeButtonTextColor": "#ffffff",
    "closeButtonBackgroundColor": "#000000"
  },
  requiresIframeEmbedInput: true,
  autoParsedFromEmbedCode: true,
  
  // Header CSS Template with customizable variables
  cssTemplate: `<style>
  /* Action Button Styling */
  .trigger-optin-btn {
    display: inline-block;
    background-color: {{buttonColor}};       /* customizable */
    color: {{buttonTextColor}};              /* customizable */
    padding: 12px 20px;
    border-radius: {{buttonRadius}};         /* customizable */
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    margin: 20px 0;
    text-align: center;
    transition: all 0.2s ease;
  }

  .trigger-optin-btn:hover {
    opacity: 0.9;
  }



  /* Popup Backdrop */
  #customOptinBackdrop {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: {{overlayColor}};  /* customizable */
    z-index: 9998;
  }

  /* Popup Container */
  #customOptinForm {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: {{popupBackgroundColor}};                /* customizable */
    padding: 40px;
    border-radius: {{popupBorderRadius}};             /* customizable */
    z-index: 9999;
    width: 100%;
    max-width: 660px;
    height: {{POPUP_HEIGHT}}px;                   /* iframe + 100px spacing */
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Close Button */
  #customOptinForm .close-btn {
    position: absolute;
    top: -16px;
    right: -16px;
    background: {{closeButtonBackgroundColor}};              /* customizable */
    color: {{closeButtonTextColor}};                   /* customizable */
    border-radius: 100%;
    width: 32px;
    height: 32px;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  }
</style>`,

  // Footer Template with exact specification from attached files
  footerTemplate: `<!-- Backdrop -->
<div id="customOptinBackdrop" style="
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: {{overlayColor}};
  display: none;
  z-index: 9998;
"></div>

<!-- Popup Container -->
<div id="customOptinForm" style="
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: {{popupBackgroundColor}};
  padding: 50px; /* 100px total (50px top + 50px bottom) */
  border-radius: {{popupBorderRadius}};
  width: 100%;
  max-width: {{MAX_WIDTH}}px; /* {{FORM_WIDTH}}px iframe + 100px */
  height: {{POPUP_HEIGHT}}px;     /* {{FORM_HEIGHT}}px iframe + 100px */
  box-sizing: border-box;
  overflow: hidden;
  z-index: 9999;
">

  <!-- Close Button (Inside Top-Right Corner) -->
  <span onclick="closeOptinPopup()" style="
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background-color: {{closeButtonBackgroundColor}};
    color: {{closeButtonTextColor}};
    border-radius: 50%;
    font-size: 20px;
    font-weight: bold;
    line-height: 36px;
    text-align: center;
    cursor: pointer;
    z-index: 10000;
  ">×</span>

  <!-- Custom Iframe Container -->
  <div id="popupIframeContainer" style="width: 100%; height: 100%;">
    <iframe
      id="popupFormFrame"
      src=""
      style="
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 6px;
        display: block;
      "
      scrolling="no"
      allowfullscreen
    ></iframe>
  </div>
</div>

<script>
  function getSlugFromUrl() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || "unknown";
  }

  function openOptinPopup() {
    const slug = getSlugFromUrl();
    const formUrl = "{{YOUR_FORM_ID}}?listing=" + encodeURIComponent(slug) + "&utm_source=directory";

    document.getElementById("popupFormFrame").src = formUrl;
    document.getElementById("customOptinBackdrop").style.display = "block";
    document.getElementById("customOptinForm").style.display = "block";
  }

  function closeOptinPopup() {
    document.getElementById("customOptinBackdrop").style.display = "none";
    document.getElementById("customOptinForm").style.display = "none";
  }

  function insertPopupButton() {
    const priceElement = document.querySelector(".hl-product-detail-product-price");
    if (!priceElement || document.querySelector(".trigger-optin-btn")) return;

    const btn = document.createElement("div");
    btn.className = "trigger-optin-btn";
    btn.textContent = "Get Access";
    btn.style.cssText = "display: inline-block; background-color: {{buttonColor}}; color: {{buttonTextColor}}; padding: 12px 20px; border-radius: {{buttonRadius}}; font-weight: bold; font-size: 16px; cursor: pointer; margin: 20px 0; text-align: center;";
    btn.addEventListener("click", openOptinPopup);

    priceElement.parentNode.insertBefore(btn, priceElement.nextSibling);
  }

  document.addEventListener("DOMContentLoaded", insertPopupButton);
  new MutationObserver(insertPopupButton).observe(document.body, { childList: true, subtree: true });
</script>`
};

/**
 * Registry of all available configuration templates
 */
export const CONFIG_TEMPLATES: Record<string, ConfigTemplate> = {
  'action-button-popup': ACTION_BUTTON_POPUP_CONFIG
};

/**
 * Get configuration template by key
 */
export function getConfigTemplate(key: string): ConfigTemplate | null {
  return CONFIG_TEMPLATES[key] || null;
}

/**
 * List all available configuration templates
 */
export function getAllConfigTemplates(): ConfigTemplate[] {
  return Object.values(CONFIG_TEMPLATES);
}