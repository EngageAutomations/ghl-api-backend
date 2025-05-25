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
    "FORM_HEIGHT": "Extracted from iframe height attribute"
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
  
  // CSS Template with scoped styling to prevent conflicts
  cssTemplate: `<style>
/* Scoped Action Button Popup Styles */
.engage-directory-popup-system {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.engage-directory-popup-system .engage-action-btn {
  background-color: {{buttonColor}};
  color: {{buttonTextColor}};
  padding: 12px 24px;
  border-radius: {{buttonRadius}};
  border: none;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  display: inline-block;
  margin-top: 15px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.engage-directory-popup-system .engage-action-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.engage-directory-popup-system .engage-popup-backdrop {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: {{overlayColor}};
  z-index: 999998;
  backdrop-filter: blur(2px);
}

.engage-directory-popup-system .engage-popup-container {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: {{popupBackgroundColor}};
  padding: 30px;
  border-radius: {{popupBorderRadius}};
  z-index: 999999;
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.engage-directory-popup-system .engage-close-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  background: {{closeButtonBackgroundColor}};
  color: {{closeButtonTextColor}};
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1000000;
}

.engage-directory-popup-system .engage-close-btn:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

.engage-directory-popup-system .engage-iframe-container {
  width: 100%;
  height: {{FORM_HEIGHT}}px;
  overflow: hidden;
  border-radius: 6px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .engage-directory-popup-system .engage-popup-container {
    width: 95%;
    padding: 20px;
    max-height: 85vh;
  }
  
  .engage-directory-popup-system .engage-iframe-container {
    height: 400px;
  }
}
</style>`,

  // Footer Template with scoped HTML and JavaScript
  footerTemplate: `<!-- Engage Directory Popup System -->
<div class="engage-directory-popup-system">
  <!-- Popup Backdrop -->
  <div class="engage-popup-backdrop" id="engagePopupBackdrop" onclick="engageClosePopup()"></div>
  
  <!-- Popup Container -->
  <div class="engage-popup-container" id="engagePopupContainer">
    <button class="engage-close-btn" onclick="engageClosePopup()">&times;</button>
    <div class="engage-iframe-container">
      <iframe
        id="engagePopupFrame"
        src=""
        style="width: 100%; height: {{FORM_HEIGHT}}px; border: none; border-radius: 6px;"
        scrolling="no"
        allowfullscreen
        title="Contact Form"
      ></iframe>
    </div>
  </div>
</div>

<script>
(function() {
  'use strict';
  
  // Scoped popup functionality
  window.engageOpenPopup = function(formUrl, listingSlug) {
    const backdrop = document.getElementById('engagePopupBackdrop');
    const container = document.getElementById('engagePopupContainer');
    const iframe = document.getElementById('engagePopupFrame');
    
    if (backdrop && container && iframe) {
      // Add tracking parameters
      const separator = formUrl.includes('?') ? '&' : '?';
      const trackingUrl = formUrl + separator + 'listing=' + encodeURIComponent(listingSlug) + '&utm_source=directory';
      
      iframe.src = trackingUrl;
      backdrop.style.display = 'block';
      container.style.display = 'block';
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  };
  
  window.engageClosePopup = function() {
    const backdrop = document.getElementById('engagePopupBackdrop');
    const container = document.getElementById('engagePopupContainer');
    const iframe = document.getElementById('engagePopupFrame');
    
    if (backdrop && container && iframe) {
      backdrop.style.display = 'none';
      container.style.display = 'none';
      iframe.src = '';
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  };
  
  // ESC key handler
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      engageClosePopup();
    }
  });
  
  // Auto-inject action button after page load
  function injectActionButton() {
    const targetSelectors = [
      '.price-container',
      '.product-price', 
      '.listing-price',
      '.price-section'
    ];
    
    for (const selector of targetSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const buttonHtml = '<button class="engage-action-btn" onclick="engageOpenPopup(\'{{YOUR_FORM_ID}}\', \'{{LISTING_SLUG}}\')">Get Access</button>';
        element.insertAdjacentHTML('afterend', buttonHtml);
        break;
      }
    }
  }
  
  // Wait for DOM and try injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectActionButton);
  } else {
    injectActionButton();
  }
  
  // Fallback with mutation observer
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        injectActionButton();
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
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