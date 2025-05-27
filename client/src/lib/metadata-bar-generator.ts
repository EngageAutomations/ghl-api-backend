/**
 * Metadata Bar Generator for GoHighLevel Integration
 * Adds business information bars with URL-based content
 */

export interface MetadataBarConfig {
  enabled: boolean;
  position: 'top' | 'bottom';
  fields: MetadataField[];
  customClass: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
}

export interface MetadataField {
  id: string;
  label: string;
  icon: string;
  defaultValue: string;
}

export function generateMetadataBarCode(config: MetadataBarConfig): {
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

  // CSS for metadata bar styling
  const cssCode = `<style>
/* Metadata Bar Styling */
.${config.customClass} {
  background: transparent;
  color: ${config.textColor};
  padding: 20px 0;
  margin: 80px 0 10px 0;
  border-radius: 0;
  box-shadow: none;
  border: none;
  font-size: 14px;
  line-height: 1.5;
}

.${config.customClass} .metadata-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 100%;
}

.${config.customClass} .metadata-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  min-width: 80px;
  max-width: 120px;
}

.${config.customClass} .metadata-icon {
  width: 24px !important;
  height: 24px !important;
  opacity: 0.8;
  flex-shrink: 0;
}

.${config.customClass} .metadata-label {
  font-weight: 600;
  font-size: 18px !important;
  line-height: 1.2;
  margin: 0;
}

.${config.customClass} .metadata-value {
  color: inherit;
  opacity: 0.9;
  font-size: 18px !important;
  line-height: 1.2;
  margin: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .${config.customClass} {
    padding: 12px 16px;
    margin: 16px 0;
  }
  
  .${config.customClass} .metadata-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>`;

  // JavaScript for injecting metadata bar
  const jsCode = `<script>
// Metadata Content Map (URL-based)
const metadataContent = {
  // Add your listing-specific metadata here
  // 'listing-slug': {
  //   phone: '(555) 123-4567',
  //   hours: 'Mon-Fri 9AM-6PM',
  //   location: '123 Main St, City, State',
  //   website: 'https://example.com'
  // },
  
  // Default fallback metadata
  'default': {
${config.fields.map(field => `    ${field.id}: '${field.defaultValue}'`).join(',\n')}
  }
};

function getMetadataForListing() {
  // Extract slug from URL
  const url = new URL(window.location.href);
  const slug = url.searchParams.get('slug') || 
               url.pathname.split('/').pop() || 
               url.pathname.split('/').filter(part => part.length > 0).pop();
  
  // Return specific metadata for this listing or default
  return metadataContent[slug] || metadataContent['default'];
}

function injectMetadataBar() {
  // Prevent duplicate injection
  if (document.querySelector('.${config.customClass}')) {
    return;
  }

  // Find the product detail container
  const productContainer = document.querySelector('.product-detail-container');
  if (!productContainer) {
    return;
  }

  // Get metadata for this listing
  const metadata = getMetadataForListing();
  
  // Create metadata bar element
  const metadataBar = document.createElement('div');
  metadataBar.className = '${config.customClass}';
  
  const metadataGrid = document.createElement('div');
  metadataGrid.className = 'metadata-grid';
  
  // Add metadata items (maximum of 8, center aligned)
  const fieldsToShow = [${config.fields.slice(0, 8).map(field => `
    { id: '${field.id}', label: '${field.label}', icon: '${field.icon}' }`).join(',')}
  ];
  
  fieldsToShow.forEach(field => {
    if (metadata[field.id]) {
      const item = document.createElement('div');
      item.className = 'metadata-item';
      item.innerHTML = \`
        <svg class="metadata-icon" fill="currentColor" viewBox="0 0 20 20" style="width: 24px !important; height: 24px !important;">
          \${field.icon}
        </svg>
        <div class="metadata-text">
          <div class="metadata-label">\${field.label}</div>
          <div class="metadata-value">\${metadata[field.id]}</div>
        </div>
      \`;
      metadataGrid.appendChild(item);
    }
  });
  
  metadataBar.appendChild(metadataGrid);

  // Insert based on position
  if ('${config.position}' === 'top') {
    productContainer.parentNode.insertBefore(metadataBar, productContainer);
  } else {
    productContainer.parentNode.insertBefore(metadataBar, productContainer.nextSibling);
  }
}

// Inject on page load and DOM changes
document.addEventListener('DOMContentLoaded', injectMetadataBar);
new MutationObserver(injectMetadataBar).observe(document.body, { 
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