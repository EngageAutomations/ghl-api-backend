import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a subdomain string for display
export function formatSubdomain(subdomain: string): string {
  return subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

// Replace tokens in a URL string
export function replaceTokens(url: string, tokens: Record<string, string>): string {
  let result = url;
  
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`{${key}}`, "g"), encodeURIComponent(value));
  }
  
  return result;
}

// Generate CSS code to hide HighLevel eCommerce elements
export function generateHideCss(options: {
  hidePrice: boolean;
  hideCartIcon: boolean;
  hideAddToCartButton: boolean;
}): string {
  const cssRules = [];
  
  if (options.hidePrice) {
    cssRules.push(".product-price { display: none !important; }");
  }
  
  if (options.hideCartIcon) {
    cssRules.push(".cart-icon { display: none !important; }");
  }
  
  if (options.hideAddToCartButton) {
    cssRules.push(".add-to-cart-button { display: none !important; }");
  }
  
  return cssRules.join("\n");
}

// Parse URL parameters
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

// Build UTM parameters from product info
export function buildUtmParams(product: {
  name: string;
  slug?: string;
}): Record<string, string> {
  return {
    utm_source: "highlevel",
    utm_medium: "directory",
    utm_campaign: "product",
    utm_content: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
  };
}

// Add UTM parameters to a URL
export function addUtmParams(url: string, params: Record<string, string>): string {
  const urlObj = new URL(url);
  
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.set(key, value);
  }
  
  return urlObj.toString();
}

/**
 * Converts a cloud storage link to a direct download link
 * @param url The original URL from Google Drive, Dropbox, etc.
 * @returns Object containing the converted URL and conversion status
 */
export function convertToDirectDownloadLink(url: string): { 
  convertedUrl: string; 
  wasConverted: boolean;
  provider?: string;
} {
  if (!url) {
    return { convertedUrl: url, wasConverted: false };
  }

  try {
    const urlObj = new URL(url);
    
    // Google Drive conversion
    if (urlObj.hostname.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        return {
          convertedUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
          wasConverted: true,
          provider: 'Google Drive'
        };
      }
    }
    
    // Dropbox conversion (change dl=0 to dl=1)
    if (urlObj.hostname.includes('dropbox.com')) {
      const newUrl = url.replace(/[?&]dl=0/, '?dl=1');
      if (newUrl !== url) {
        return {
          convertedUrl: newUrl,
          wasConverted: true,
          provider: 'Dropbox'
        };
      } else if (!url.includes('dl=')) {
        // If dl parameter doesn't exist, add it
        const separator = url.includes('?') ? '&' : '?';
        return {
          convertedUrl: `${url}${separator}dl=1`,
          wasConverted: true,
          provider: 'Dropbox'
        };
      }
    }

    // OneDrive conversion (less reliable, may need testing)
    if (urlObj.hostname.includes('onedrive.live.com') || urlObj.hostname.includes('1drv.ms')) {
      if (!url.includes('download=1')) {
        const separator = url.includes('?') ? '&' : '?';
        return {
          convertedUrl: `${url}${separator}download=1`,
          wasConverted: true,
          provider: 'OneDrive'
        };
      }
    }
    
    // Default case - couldn't convert, return original URL
    return { 
      convertedUrl: url, 
      wasConverted: false,
      provider: urlObj.hostname.split('.').slice(-2, -1)[0] // Extract domain name without TLD
    };
  } catch (e) {
    // If URL parsing fails, return the original
    return { convertedUrl: url, wasConverted: false };
  }
}
