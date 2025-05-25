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
  hideBuyNowButton?: boolean;
  hideAddToCartButton?: boolean;
  hideQuantitySelector?: boolean;
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
/* GoHighLevel Page Customizations */

/* Prevent text truncation in price/title with specific GoHighLevel selectors */
.hl-product-price,
.hl-product-title,
.hl-product-detail-product-price,
.hl-product-detail-title,
.cstore-product-detail h1,
.cstore-product-detail h2,
.cstore-product-detail h3,
.product-detail-container h1,
.product-detail-container h2,
.product-detail-container h3,
.product-title,
.product-name,
[class*="product-title"],
[class*="product-name"],
.hl-product-price *,
.hl-product-title *,
.hl-product-detail-product-price *,
.hl-product-detail-title *,
.cstore-product-detail * {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  display: block !important;
  max-height: none !important;
  height: auto !important;
  -webkit-line-clamp: unset !important;
  word-wrap: break-word !important;
  text-overflow: clip !important;
}

/* Force containers to expand - specific to your structure */
.hl-product-price-container,
.hl-product-title-container,
.cstore-product-detail,
.product-detail-container,
[class*="price-container"],
[class*="title-container"],
[class*="product-detail"] {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* Remove description truncation and show more button */
.hl-product-detail-product-description,
[class*="product-description"],
[class*="description"] {
  white-space: normal !important;
  text-overflow: unset !important;
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
  -webkit-line-clamp: unset !important;
  display: block !important;
}

/* Hide show more buttons */
.show-more-btn,
.read-more,
.show-more,
[class*="show-more"],
[class*="read-more"],
.hl-product-detail-product-description + button,
.hl-product-detail-product-description + div button {
  display: none !important;
}

/* Optional: Hide Buy Now and Add to Cart buttons */
${config.hideBuyNowButton ? `
.buy-now-button,
.btn-buy-now,
[class*="buy-now"],
[class*="purchase"],
.hl-product-buy-button,
.product-buy-button {
  display: none !important;
}` : ''}

${config.hideAddToCartButton ? `
.add-to-cart-button,
.btn-add-cart,
[class*="add-cart"],
[class*="cart"],
.hl-product-cart-button,
.product-cart-button {
  display: none !important;
}` : ''}

${config.hideQuantitySelector ? `
.quantity-selector,
.qty-selector,
.product-quantity,
[class*="quantity"],
[class*="qty"],
.hl-product-quantity,
.product-qty,
input[type="number"][name*="quantity"],
input[type="number"][name*="qty"] {
  display: none !important;
}` : ''}

/* Remove any text truncation styles completely */
* {
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
}

/* Specific nuclear option for stubborn truncation */
h1, h2, h3, h4, h5, h6, p, span, div {
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  white-space: normal !important;
  overflow: visible !important;
}

/* Custom Action Button Styling */
.custom-action-button {
  background-color: ${config.buttonColor};
  color: ${config.buttonTextColor};
  padding: 12px 24px;
  border-radius: ${config.buttonBorderRadius}px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  border: none;
  margin: 15px 0;
  display: inline-block;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.custom-action-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

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
  // Look for price elements in GoHighLevel pages
  const priceSelectors = [
    '.hl-product-detail-product-price',
    '.ecomm-price-desktop-container', 
    '.price-container',
    '[class*="price"]'
  ];
  
  let priceElement = null;
  for (const selector of priceSelectors) {
    priceElement = document.querySelector(selector);
    if (priceElement) break;
  }
  
  // If no price element found, try to find any container
  if (!priceElement) {
    priceElement = document.querySelector('.fullSection .inner') || document.body;
  }
  
  // Check if button already exists
  if (document.querySelector('.custom-action-button')) return;
  
  // Create and insert button
  const button = document.createElement('button');
  button.className = 'custom-action-button';
  button.textContent = '${config.buttonText}';
  button.onclick = openPopup;
  
  // Insert after price element or append to container
  if (priceElement.parentNode) {
    priceElement.parentNode.insertBefore(button, priceElement.nextSibling);
  } else {
    priceElement.appendChild(button);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', addActionButton);

// Also check for dynamic content
const observer = new MutationObserver(addActionButton);
observer.observe(document.body, { childList: true, subtree: true });
</script>`;
}