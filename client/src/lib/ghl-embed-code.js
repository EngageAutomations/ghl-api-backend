/**
 * Go HighLevel Embed Code for Marketplace Directory Integration
 * 
 * This script extracts listing information from the URL slug and passes it to Go HighLevel forms.
 * It handles parameter passing via window.location and iframe modification for proper tracking.
 */

(async function() {
  // Configuration variables - modify these based on your setup
  const API_BASE_URL = "{{YOUR_REPLIT_API_URL}}"; // Replace with your actual API URL (e.g. https://your-app.replit.app)
  const DEFAULT_FORM_URL = "{{YOUR_DEFAULT_GHL_FORM_URL}}"; // Replace with your default GHL form URL
  const CONFIG_ELEMENT_ID = "ghl-directory-config"; // ID of element containing config (optional)

  /**
   * Extract slug from the current URL
   * Format supported: 
   * - /product-details/product/your-product-slug
   * - /your-product-slug
   * - ?slug=your-product-slug
   */
  function getSlugFromUrl() {
    const url = new URL(window.location.href);
    
    // First check if slug is provided as a query parameter
    const slugParam = url.searchParams.get("slug");
    if (slugParam) return slugParam;
    
    // Then check for URL path formats
    const path = window.location.pathname;
    
    // Check for /product-details/product/[slug] format
    const productDetailsMatch = path.match(/\/product-details\/product\/([^\/\?#]+)/);
    if (productDetailsMatch && productDetailsMatch[1]) {
      return productDetailsMatch[1];
    }
    
    // Fallback: get the last segment of the URL path
    const segments = path.split('/').filter(segment => segment.length > 0);
    return segments.length > 0 ? segments[segments.length - 1] : '';
  }

  /**
   * Get configuration options from page element or defaults
   */
  function getConfig() {
    try {
      // Try to get config from config element if it exists
      const configElement = document.getElementById(CONFIG_ELEMENT_ID);
      if (configElement && configElement.textContent) {
        return JSON.parse(configElement.textContent);
      }
      
      // Try to get config from localStorage (synced with your app)
      const storedConfig = localStorage.getItem('designer_config');
      if (storedConfig) {
        return JSON.parse(storedConfig);
      }
    } catch (error) {
      console.warn("Error parsing configuration:", error);
    }
    
    // Default configuration if none found
    return {
      customFormFieldName: "listing_id",
      customFormFieldLabel: "Source Listing"
    };
  }

  /**
   * Fetch listing data from API
   */
  async function getListingData(slug) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/listings/by-slug/${slug}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching listing data:", error);
      // Return fallback data with the slug
      return {
        slug: slug,
        title: slug.replace(/-/g, ' '),
        category: ''
      };
    }
  }

  /**
   * Add parameters to URL for GHL scraping
   */
  function updatePageUrlWithParams(params) {
    try {
      const url = new URL(window.location.href);
      
      // Add each parameter to the URL
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
      
      // Update the URL without reloading the page
      window.history.replaceState({}, document.title, url);
      console.log("Updated URL with parameters for GHL tracking");
    } catch (error) {
      console.error("Error updating URL parameters:", error);
    }
  }

  /**
   * Update any GHL form iframes with parameters
   */
  function updateGhlIframes(params, config) {
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach(iframe => {
      try {
        if (!iframe.src) return;
        
        // Only modify GHL iframes
        if (!iframe.src.includes('gohighlevel.com') && 
            !iframe.src.includes('engageautomations.com')) {
          return;
        }
        
        const iframeSrc = new URL(iframe.src);
        
        // Add each parameter to the iframe src
        Object.entries(params).forEach(([key, value]) => {
          if (value) iframeSrc.searchParams.set(key, value);
        });
        
        // Update the iframe src
        iframe.src = iframeSrc.toString();
        console.log("Updated GHL iframe with tracking parameters");
      } catch (error) {
        console.error("Error updating iframe:", error);
      }
    });
  }

  /**
   * Create and inject a GHL form if none exists
   */
  function createGhlForm(formUrl, containerId = "ghl-form-container") {
    // Check if a container exists, create one if not
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.className = "directory-embedded-form";
      
      // Find a suitable place to insert the form
      const contentArea = document.querySelector(".content-area") || 
                         document.querySelector("main") || 
                         document.querySelector("body");
      
      if (contentArea) {
        contentArea.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }
    
    // Create iframe for the form
    const iframe = document.createElement("iframe");
    iframe.src = formUrl;
    iframe.style = "width:100%;height:600px;border:none;border-radius:4px;";
    iframe.title = "Contact Form";
    
    // Clear the container and add the iframe
    container.innerHTML = "";
    container.appendChild(iframe);
    
    return container;
  }

  /**
   * Main execution function
   */
  async function init() {
    console.log("Starting GHL Directory Integration");
    
    // Get the slug from the URL
    const slug = getSlugFromUrl();
    if (!slug) {
      console.warn("No slug found in URL");
      return;
    }
    
    console.log(`Found slug: ${slug}`);
    
    // Get configuration
    const config = getConfig();
    console.log("Config loaded:", config);
    
    // Get listing data
    const listing = await getListingData(slug);
    console.log("Listing data:", listing);
    
    // Prepare parameters for GHL tracking
    const customFieldName = config.customFormFieldName || "listing_id";
    
    const params = {
      [customFieldName]: slug,
      "utm_source": "directory",
      "utm_medium": "marketplace",
      "utm_campaign": listing.directoryName || config.directoryName || "listing",
      "utm_content": slug,
      "listing_title": listing.title || "",
      "listing_category": listing.category || ""
    };
    
    // Update URL parameters for GHL form scraping
    updatePageUrlWithParams(params);
    
    // Update any existing GHL iframes
    updateGhlIframes(params, config);
    
    // If embedded form is enabled and no form exists yet, create one
    if (config.enableEmbeddedForm && config.formEmbedUrl) {
      // Replace any tokens in the URL
      let formUrl = config.formEmbedUrl;
      formUrl = formUrl.replace("{product_name}", encodeURIComponent(listing.title || slug));
      formUrl = formUrl.replace("{slug}", encodeURIComponent(slug));
      
      // Add parameters to the form URL
      const formUrlObj = new URL(formUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value) formUrlObj.searchParams.set(key, value);
      });
      
      // Create and inject the form
      createGhlForm(formUrlObj.toString());
    }
    
    console.log("GHL Directory Integration complete");
  }

  // Start the integration
  init();
})();