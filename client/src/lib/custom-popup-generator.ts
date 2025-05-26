/**
 * Custom Action Button Popup Generator
 * Creates popup code specifically for GoHighLevel pages
 */

export interface ActionButtonConfig {
  buttonText: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  customFieldName: string;
  formUrl: string;
  showBuyNowButton?: boolean;
  showAddToCartButton?: boolean;
  showQuantitySelector?: boolean;
}

export interface PopupCodeResult {
  headerCode: string;
  footerCode: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extract form URL from GoHighLevel iframe embed code
 */
function extractFormUrl(embedCode: string): string | null {
  const srcMatch = embedCode.match(/src="([^"]+)"/);
  return srcMatch ? srcMatch[1] : null;
}

/**
 * Generate custom popup code for action button
 */
export function generateActionButtonPopup(config: ActionButtonConfig): PopupCodeResult {
  const formUrl = extractFormUrl(config.formUrl);
  
  if (!formUrl) {
    return {
      headerCode: '',
      footerCode: '',
      isValid: false,
      error: 'Could not extract form URL from embed code'
    };
  }

  const headerCode = createHeaderCode(config);
  const footerCode = createFooterCode(config, formUrl);

  return {
    headerCode,
    footerCode,
    isValid: true
  };
}

/**
 * Create header CSS styling
 */
function createHeaderCode(config: ActionButtonConfig): string {
  return `<style>
/* No custom button styling needed - using native GoHighLevel classes */

/* Popup Styling */
.popup-backdrop {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
}

.popup-container {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 700px;
  height: 600px;
  z-index: 10000;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.popup-close {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 30px;
  height: 30px;
  background: #000;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
}
</style>`;
}

/**
 * Create footer JavaScript and HTML
 */
function createFooterCode(config: ActionButtonConfig, formUrl: string): string {
  return `<!-- Popup Elements -->
<div class="popup-backdrop" id="popupBackdrop" onclick="closePopup()"></div>
<div class="popup-container" id="popupContainer">
  <button class="popup-close" onclick="closePopup()">×</button>
  <iframe class="popup-iframe" id="popupFrame" src=""></iframe>
</div>

<script>
function getPageSlug() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(segment => segment.length > 0);
  return segments[segments.length - 1] || 'unknown';
}

function openPopup() {
  const slug = getPageSlug();
  const finalUrl = "${formUrl}?${config.customFieldName}=" + encodeURIComponent(slug) + "&utm_source=directory";
  
  document.getElementById('popupFrame').src = finalUrl;
  document.getElementById('popupBackdrop').style.display = 'block';
  document.getElementById('popupContainer').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  document.getElementById('popupBackdrop').style.display = 'none';
  document.getElementById('popupContainer').style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('popupFrame').src = '';
}

function addActionButton() {
  // Look for quantity selector elements in GoHighLevel pages
  const quantitySelectors = [
    '.quantity-container',
    '.hl-quantity-input-container',
    '.pdp-quantity-container',
    '.hl-product-detail-selectors',
    '[class*="quantity"]',
    'input[type="number"]'
  ];
  
  let quantityElement = null;
  for (const selector of quantitySelectors) {
    quantityElement = document.querySelector(selector);
    if (quantityElement) break;
  }
  
  // If no quantity element found, fallback to price element
  if (!quantityElement) {
    const priceSelectors = [
      '.hl-product-detail-product-price',
      '.ecomm-price-desktop-container', 
      '.price-container',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      quantityElement = document.querySelector(selector);
      if (quantityElement) break;
    }
  }
  
  // If still no element found, try to find any container
  if (!quantityElement) {
    quantityElement = document.querySelector('.fullSection .inner') || document.body;
  }
  
  // Check if button already exists
  if (document.querySelector('#custom-action-btn')) return;
  
  // Create and insert button matching the exact Add to Cart structure
  const button = document.createElement('button');
  button.id = 'custom-action-btn';
  button.className = 'primary-btn';
  button.textContent = '${config.buttonText}';
  button.onclick = openPopup;
  
  // Copy the exact inline styles from Add to Cart button with proper width
  button.style.cssText = \`
    background-color: ${config.buttonColor} !important;
    color: ${config.buttonTextColor} !important;
    border-radius: ${config.buttonBorderRadius}px !important;
    padding: 10px 16px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    border: 1px solid transparent !important;
    cursor: pointer !important;
    display: inline-block !important;
    text-align: center !important;
    vertical-align: middle !important;
    white-space: nowrap !important;
    line-height: 1.42857143 !important;
    margin: 5px 5px 0 0 !important;
    width: 460px !important;
    min-width: 460px !important;
  \`;
  
  // Insert after quantity element or append to container
  if (quantityElement.parentNode) {
    quantityElement.parentNode.insertBefore(button, quantityElement.nextSibling);
  } else {
    quantityElement.appendChild(button);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', addActionButton);

// Also check for dynamic content
const observer = new MutationObserver(addActionButton);
observer.observe(document.body, { childList: true, subtree: true });
</script>`;
}