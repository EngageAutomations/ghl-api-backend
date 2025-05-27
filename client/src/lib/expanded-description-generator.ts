/**
 * Expanded Description Generator for GoHighLevel Integration
 * Adds rich text content below the product detail container
 */

export interface ExpandedDescriptionConfig {
  enabled: boolean;
  content: string;
  fadeInAnimation: boolean;
  customClass: string;
  useUrlBasedContent?: boolean;
  fallbackContent?: string;
  showMetadata?: boolean;
  showMaps?: boolean;
  metadataClass?: string;
}

export function generateExpandedDescriptionCode(config: ExpandedDescriptionConfig): {
  cssCode: string;
  jsCode: string;
  fullIntegrationCode: string;
} {
  if (!config.enabled) {
    return {
      cssCode: '',
      jsCode: '',
      fullIntegrationCode: ''
    };
  }

  // CSS for expanded description styling
  const cssCode = `<style>
/* Reduce product detail container bottom spacing for tighter layout */
.product-detail-container,
.cstore-product-detail {
  margin-bottom: -100px !important;
  padding-bottom: 0 !important;
}

/* Expanded Description Styling */
.${config.customClass || 'expanded-description'} {
  margin-top: 10px;
  margin-bottom: 20px;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  line-height: 1.6;
  font-size: 16px;
  color: #374151;
  position: relative;
  z-index: 1;
  width: 100%;
  clear: both;
  text-align: center;
}

.${config.customClass || 'expanded-description'} h1,
.${config.customClass || 'expanded-description'} h2,
.${config.customClass || 'expanded-description'} h3,
.${config.customClass || 'expanded-description'} h4,
.${config.customClass || 'expanded-description'} h5,
.${config.customClass || 'expanded-description'} h6 {
  margin-bottom: 16px;
  color: #111827;
  font-weight: 600;
}

.${config.customClass || 'expanded-description'} p {
  margin-bottom: 12px;
}

.${config.customClass || 'expanded-description'} ul,
.${config.customClass || 'expanded-description'} ol {
  margin-bottom: 16px;
  padding-left: 20px;
}

.${config.customClass || 'expanded-description'} li {
  margin-bottom: 4px;
}

.${config.customClass || 'expanded-description'} img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 16px 0;
}

.${config.customClass || 'expanded-description'} a {
  color: #3b82f6;
  text-decoration: underline;
}

.${config.customClass || 'expanded-description'} a:hover {
  color: #1d4ed8;
}

${config.fadeInAnimation ? `
/* Fade-in animation */
.${config.customClass || 'expanded-description'} {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.${config.customClass || 'expanded-description'}.visible {
  opacity: 1;
  transform: translateY(0);
}
` : ''}

/* Responsive design */
@media (max-width: 768px) {
  .${config.customClass || 'expanded-description'} {
    margin-top: 20px;
    padding: 16px;
    font-size: 14px;
  }
}
</style>`;

  // JavaScript for injecting expanded description
  const jsCode = `<script>
// Expanded Description Content Map (URL-based)
const expandedDescriptions = {
  // Add your listing-specific content here
  // 'listing-slug': '<h2>Custom Content</h2><p>Specific content for this listing...</p>',
  
  // Default fallback content
  'default': \`${(config.fallbackContent || config.content).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
};

function getExpandedDescriptionContent() {
  // Extract slug from URL
  const url = new URL(window.location.href);
  const slug = url.searchParams.get('slug') || 
               url.pathname.split('/').pop() || 
               url.pathname.split('/').filter(part => part.length > 0).pop();
  
  // Return specific content for this listing or default
  return expandedDescriptions[slug] || expandedDescriptions['default'];
}

function injectExpandedDescription() {
  // Prevent duplicate injection
  if (document.querySelector('.${config.customClass || 'expanded-description'}')) {
    return;
  }

  // Find the product detail container (try multiple GoHighLevel selectors)
  const productContainer = document.querySelector('.product-detail-container') ||
                           document.querySelector('.cstore-product-detail') ||
                           document.querySelector('[class*="product-detail"]');
  if (!productContainer) {
    return;
  }

  // Create expanded description element with smart ordering
  const expandedDesc = document.createElement('div');
  expandedDesc.className = '${config.customClass || 'expanded-description'}';
  
  // Build ordered content based on component settings
  let orderedContent = '';
  
  ${config.showMetadata ? `
  // Add metadata bar at the top if enabled
  const metadataBar = document.querySelector('.${config.metadataClass || 'listing-metadata-bar'}');
  if (metadataBar) {
    orderedContent += '<div class="metadata-section">' + metadataBar.outerHTML + '</div>';
  }
  ` : ''}
  
  ${config.showMaps ? `
  // Add Google Maps widget after metadata (or at top if no metadata)
  orderedContent += '<div class="google-maps-section" style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;"><h3 style="margin-bottom: 15px; color: #374151;">Location</h3><div style="background: #e5e7eb; height: 200px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #6b7280;"><p>Google Maps Widget<br><small>Integration will display interactive map here</small></p></div></div>';
  ` : ''}
  
  // Add user content last
  const userContent = getExpandedDescriptionContent();
  orderedContent += '<div class="user-content-section">' + userContent + '</div>';
  
  expandedDesc.innerHTML = orderedContent;

  // Insert after product detail container
  productContainer.parentNode.insertBefore(expandedDesc, productContainer.nextSibling);

  ${config.fadeInAnimation ? `
  // Add fade-in animation
  setTimeout(() => {
    expandedDesc.classList.add('visible');
  }, 100);
  ` : ''}
}

// Inject on page load and DOM changes
document.addEventListener('DOMContentLoaded', injectExpandedDescription);
new MutationObserver(injectExpandedDescription).observe(document.body, { 
  childList: true, 
  subtree: true 
});
</script>`;

  const fullIntegrationCode = `${cssCode}\n\n${jsCode}`;

  return {
    cssCode,
    jsCode,
    fullIntegrationCode
  };
}