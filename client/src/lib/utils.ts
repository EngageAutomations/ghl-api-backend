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
