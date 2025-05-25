/**
 * Simple Popup Generator - Clean approach
 * Generates working popup code using straightforward string templates
 */

export interface SimplePopupConfig {
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  customFieldName: string;
  embedCode: string;
}

export interface SimplePopupResult {
  headerCode: string;
  footerCode: string;
  isValid: boolean;
  error?: string;
}

/**
 * Generate popup code using simple string templates
 */
export function generateSimplePopup(config: SimplePopupConfig): SimplePopupResult {
  try {
    // Extract iframe src from embed code
    const iframeSrcMatch = config.embedCode.match(/src="([^"]+)"/);
    if (!iframeSrcMatch) {
      return {
        headerCode: '',
        footerCode: '',
        isValid: false,
        error: 'Could not find iframe src in embed code'
      };
    }

    const formUrl = iframeSrcMatch[1];
    
    const headerCode = generateHeaderCSS(config);
    const footerCode = generateFooterJS(config, formUrl);

    return {
      headerCode,
      footerCode,
      isValid: true
    };
  } catch (error) {
    return {
      headerCode: '',
      footerCode: '',
      isValid: false,
      error: `Generation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function generateHeaderCSS(config: SimplePopupConfig): string {
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
  margin: 20px 0;
  text-align: center;
  border: none;
  transition: all 0.2s ease;
}

.trigger-optin-btn:hover {
  opacity: 0.9;
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
  max-width: 660px;
  height: 570px;
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
</style>`;
}

function generateFooterJS(config: SimplePopupConfig, formUrl: string): string {
  return `<!-- Backdrop -->
<div id="customOptinBackdrop" onclick="closeOptinPopup()"></div>

<!-- Popup Container -->
<div id="customOptinForm">
  <span class="close-btn" onclick="closeOptinPopup()">×</span>
  <div id="popupIframeContainer">
    <iframe
      id="popupFormFrame"
      src=""
      style="width: 100%; height: 100%; border: none; border-radius: 6px;"
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
  const finalUrl = "${formUrl}?${config.customFieldName}=" + encodeURIComponent(slug) + "&utm_source=directory";
  
  document.getElementById("popupFormFrame").src = finalUrl;
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