/**
 * Enhanced Popup Code Generator with Embed Parsing
 * Generates custom popup forms with dynamic iframe and close button
 */

import { parseEmbedCode, validateEmbedSource, type ParsedEmbedData } from './embed-parser';

export interface PopupConfig {
  embedCode: string;
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  customFieldName: string;
  closeButtonSize?: number;
  closeButtonColor?: string;
  closeButtonBackground?: string;
}

export interface PopupGenerationResult {
  headerCode: string;
  footerCode: string;
  fullIntegrationCode: string;
  parsedData: ParsedEmbedData | null;
  isValid: boolean;
  error?: string;
}

/**
 * Generates enhanced popup code with custom iframe and close button
 */
export function generateEnhancedPopupCode(config: PopupConfig): PopupGenerationResult {
  // Parse the embed code
  const parsedData = parseEmbedCode(config.embedCode);
  
  if (!parsedData) {
    return {
      headerCode: '',
      footerCode: '',
      fullIntegrationCode: '',
      parsedData: null,
      isValid: false,
      error: 'Unable to parse embed code. Please ensure you have pasted a valid GoHighLevel iframe embed code.'
    };
  }

  // Validate the embed source
  if (!validateEmbedSource(parsedData)) {
    return {
      headerCode: '',
      footerCode: '',
      fullIntegrationCode: '',
      parsedData,
      isValid: false,
      error: 'Embed code must be from a supported GoHighLevel domain.'
    };
  }

  const headerCode = generatePopupHeaderCode(config, parsedData);
  const footerCode = generatePopupFooterCode(config, parsedData);
  const fullIntegrationCode = headerCode + '\n' + footerCode;

  return {
    headerCode,
    footerCode,
    fullIntegrationCode,
    parsedData,
    isValid: true
  };
}

/**
 * Generates the header CSS code for the popup
 */
function generatePopupHeaderCode(config: PopupConfig, parsedData: ParsedEmbedData): string {
  const closeButtonSize = config.closeButtonSize || 28;
  const closeButtonColor = config.closeButtonColor || 'white';
  const closeButtonBackground = config.closeButtonBackground || 'black';

  return `<style>
  /* Action Button Styling with Margin and Border Radius */
  .trigger-optin-btn {
    display: inline-block;
    background-color: ${config.buttonColor};       /* ← customizable */
    color: ${config.buttonTextColor};                    /* ← customizable */
    padding: 12px 20px;
    border-radius: ${config.buttonBorderRadius}px;              /* ← customizable */
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    margin-top: 16px;
    margin-bottom: 16px;
    text-align: center;
    transition: all 0.2s ease;
  }

  /* Buy Now and Add to Cart Button Radius Synchronization */
  body:not(.hl-builder) .cstore-product-detail button,
  body:not(.hl-builder) .hl-product-buy-button,
  body:not(.hl-builder) [class*="buy-now"],
  body:not(.hl-builder) #buy-now-btn,
  body:not(.hl-builder) .secondary-btn,
  body:not(.hl-builder) .hl-product-cart-button,
  body:not(.hl-builder) [class*="add-cart"],
  body:not(.hl-builder) #add-to-cart-btn,
  body:not(.hl-builder) .primary-btn {
    border-radius: ${config.buttonBorderRadius}px !important;
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
    background: rgba(0, 0, 0, 0.6);  /* ← customizable */
    z-index: 9998;
  }

  /* Popup Container */
  #customOptinForm {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;                /* ← customizable */
    padding: 40px;
    border-radius: 10px;             /* ← customizable */
    z-index: 9999;
    width: 100%;
    max-width: 660px;
    height: 570px;                   /* iframe + spacing */
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Close Button */
  #customOptinForm .close-btn {
    position: absolute;
    top: -16px;
    right: -16px;
    background: black;              /* ← customizable */
    color: white;                   /* ← customizable */
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
</style>`;
}

/**
 * Generates the footer JavaScript code for the popup
 */
function generatePopupFooterCode(config: PopupConfig, parsedData: ParsedEmbedData): string {
  const popupWidth = parsedData.width + 100;
  const popupHeight = parsedData.height + 100;
  
  return `<!-- Backdrop -->
<div id="customOptinBackdrop" style="
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
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
  background: #fff;
  padding: 50px; /* 100px total (50px top + 50px bottom) */
  border-radius: 10px;
  width: 100%;
  max-width: ${popupWidth}px; /* ${parsedData.width}px iframe + 100px */
  height: ${popupHeight}px;     /* ${parsedData.height}px iframe + 100px */
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
    background-color: #000;
    color: #fff;
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
    const formUrl = "${parsedData.src}?${config.customFieldName}=" + encodeURIComponent(slug) + "&utm_source=directory";

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

    const btn = document.createElement("button");
    btn.className = "trigger-optin-btn";
    btn.textContent = "${config.buttonText}";
    btn.onclick = openOptinPopup;

    priceElement.parentNode.insertBefore(btn, priceElement.nextSibling);
  }

  document.addEventListener("DOMContentLoaded", insertPopupButton);
  new MutationObserver(insertPopupButton).observe(document.body, { childList: true, subtree: true });
</script>`;
}