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
      parsedData,
      isValid: false,
      error: 'Embed code must be from a supported GoHighLevel domain.'
    };
  }

  const headerCode = generatePopupHeaderCode(config, parsedData);
  const footerCode = generatePopupFooterCode(config, parsedData);

  return {
    headerCode,
    footerCode,
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
  .trigger-optin-btn {
    background-color: ${config.buttonColor};
    color: ${config.buttonTextColor};
    padding: 12px 20px;
    border-radius: ${config.buttonBorderRadius}px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    display: inline-block;
    margin-top: 20px;
    text-align: center;
    border: none;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .trigger-optin-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  #customOptinBackdrop {
    display: none;
    position: fixed;
    top: 0; 
    left: 0;
    width: 100vw; 
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9998;
    backdrop-filter: blur(2px);
  }

  #customOptinForm {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    padding: 40px;
    border-radius: 10px;
    z-index: 9999;
    width: 100%;
    max-width: ${parsedData.width + 100}px;
    height: ${parsedData.height + 100}px;
    box-sizing: border-box;
    overflow: hidden;
  }

  #customOptinForm .close-btn {
    position: absolute;
    top: -16px;
    right: -16px;
    background: black;
    color: white;
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

  #customOptinForm .close-btn:hover {
    opacity: 0.8;
    transform: scale(1.1);
  }

  #popupIframeContainer {
    width: 100%;
    height: ${parsedData.height}px;
    overflow: hidden;
    border-radius: 6px;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    #customOptinForm {
      width: 95%;
      padding: 20px;
      max-height: 85vh;
    }
    
    #popupIframeContainer {
      height: ${Math.min(parsedData.height, 400)}px;
    }
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
<div id="customOptinBackdrop"></div>

<!-- Popup Container -->
<div id="customOptinForm">
  <span class="close-btn" onclick="closeOptinPopup()">×</span>
  <div id="popupIframeContainer">
    <iframe
      id="popupFormFrame"
      src=""
      scrolling="no"
      allowfullscreen
      title="Get Access Form"
    ></iframe>
  </div>
</div>

<script>
  // Enhanced popup functionality with slug tracking
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

  function insertAccessButton() {
    const priceContainer = document.querySelector(".ecomm-price-desktop-container");
    if (!priceContainer || document.querySelector(".trigger-optin-btn")) return;

    const btn = document.createElement("button");
    btn.className = "trigger-optin-btn";
    btn.textContent = "${config.buttonText}";
    btn.onclick = openOptinPopup;

    priceContainer.parentNode.insertBefore(btn, priceContainer.nextSibling);
  }

  document.addEventListener("DOMContentLoaded", insertAccessButton);
  new MutationObserver(insertAccessButton).observe(document.body, { childList: true, subtree: true });

  window.openOptinPopup = openOptinPopup;
  window.closeOptinPopup = closeOptinPopup;
</script>`;
}