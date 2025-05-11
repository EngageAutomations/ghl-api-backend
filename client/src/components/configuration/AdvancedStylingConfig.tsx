import React, { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfigCard } from "../ui/config-card";
import { Switch } from "@/components/ui/switch";
import { CustomSwitch } from "../ui/custom-switch";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  generateAttributeBasedCSS, 
  DEFAULT_CATEGORY_STYLES, 
  DEFAULT_PRIORITY_STYLES 
} from "@/lib/listing-css-generator";

// Core CSS - always applied
const CORE_CSS = `/* --- Core Layout, Spacing & Text Behavior Fixes --- */

/* Ensure image container grows with content */
.hl-product-image-container {
    min-height: 1200px !important;
}

/* Ensure description shows full content without truncation or collapse */
#description {
    max-height: none !important;
    overflow: visible !important;
    margin-bottom: 60px;
}

/* Add spacing between product image and description section */
div.c-product-details {
    margin-top: 60px !important;
}

/* Remove truncation and ellipsis from product name */
.hl-product-detail-product-name {
    width: 900px !important;
    display: block;
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: unset !important;
}

/* Globally override truncation utility class */
.truncate-text {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: unset !important;
}

/* Remove built-in "Show More" button */
.show-more {
    display: none !important;
}
`;

// Hide price and quantity CSS
const HIDE_PRICE_CSS = `
/* Hide price and quantity controls */

/* Hide price on product detail page */
.hl-product-detail-product-price {
    display: none !important;
}

/* Hide price in "You May Also Like" */
.hl-product-list-product-price {
    display: none !important;
}

/* Hide the quantity selector */
.quantity-container {
    display: none !important;
}
`;

// Action Button CSS Template (using variables for dynamic values)
const getActionButtonCSS = (config: any) => {
  // Default fallback values
  const buttonColor = config.buttonColor || "#4F46E5";
  const buttonTextColor = config.buttonTextColor || "#FFFFFF";
  const borderRadius = (config.buttonBorderRadius || 4) + "px";
  const buttonType = config.buttonType || "popup";
  
  // Generate the appropriate comment header based on button type
  let commentHeader = "";
  if (buttonType === "download") {
    commentHeader = "/* --- Direct Download Action Button Styling --- */";
  } else if (buttonType === "link" || buttonType === "url") {
    commentHeader = "/* --- URL Action Button Styling --- */";
  } else if (buttonType === "popup") {
    commentHeader = "/* --- Popup Action Button Styling --- */";
  } else {
    commentHeader = "/* --- Action Button Styling --- */";
  }
  
  return `
${commentHeader}
.directory-action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: ${buttonColor};
    color: ${buttonTextColor};
    border-radius: ${borderRadius};
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    margin-top: 1rem;
    text-decoration: none;
}

.directory-action-button:hover {
    opacity: 0.9;
}

/* Position for the action button */
.directory-action-container {
    display: flex;
    justify-content: flex-start;
    margin: 1.5rem 0;
}

/* Slug-based selector styling for listing-specific buttons */
[data-listing-slug] .directory-action-button {
    /* Apply default styles from above plus any listing-specific attributes */
    display: inline-flex !important;
}

/* Common category-based styling examples */
[data-listing-category="electronics"] .directory-action-button {
    background-color: #2563eb !important; /* Adjust for electronics */
}

[data-listing-category="clothing"] .directory-action-button {
    background-color: #7c3aed !important; /* Adjust for clothing */
}

[data-listing-category="home-decor"] .directory-action-button {
    background-color: #0d9488 !important; /* Adjust for home decor */
}
`;
};

// Embedded Form CSS Template
const EMBEDDED_FORM_CSS = `
/* --- Embedded Form Styling --- */
.directory-embedded-form {
    margin: 2rem 0;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background-color: #f8fafc;
}

.directory-embedded-form iframe {
    width: 100%;
    min-height: 400px;
    border: none;
}

.directory-form-fallback {
    padding: 1rem;
    text-align: center;
    color: #64748b;
    font-style: italic;
}

/* --- Listing-Specific Form Styling via Selectors --- */

/* Slug-based form styling */
[data-listing-slug] .directory-embedded-form {
    /* Base styling remains, but ensure it's applied consistently */
    display: block !important;
}

/* Category-specific form styling examples */
[data-listing-category="electronics"] .directory-embedded-form {
    border-color: #2563eb !important;
    background-color: #eff6ff !important;
}

[data-listing-category="clothing"] .directory-embedded-form {
    border-color: #7c3aed !important;
    background-color: #f5f3ff !important;
}

[data-listing-category="home-decor"] .directory-embedded-form {
    border-color: #0d9488 !important;
    background-color: #f0fdfa !important;
}

/* Priority-based form styling examples */
[data-listing-priority="high"] .directory-embedded-form {
    border-width: 2px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

/* Location-based styling examples */
[data-listing-location*="new-york"] .directory-embedded-form {
    border-left: 4px solid #2563eb !important;
}

[data-listing-location*="los-angeles"] .directory-embedded-form {
    border-left: 4px solid #7c3aed !important;
}
`;



import { cssUpdateEmitter } from "@/lib/events";

export default function AdvancedStylingConfig() {
  const { config, updateConfig } = useConfig();
  const [cssCode, setCssCode] = useState(CORE_CSS);
  const [hidePriceEnabled, setHidePriceEnabled] = useState(config.hidePrice || false);
  
  // Listen to direct update events from other components
  useEffect(() => {
    const unsubscribe = cssUpdateEmitter.subscribe((configOverrides: any) => {
      console.log("CSS Update event received, regenerating CSS with:", configOverrides);
      // Use the received config overrides if available
      const configToUse = configOverrides || config;
      const generatedCss = generateCss(configToUse);
      setCssCode(generatedCss);
      updateConfig({ customCssCode: generatedCss });
    });
    
    return unsubscribe;
  }, []);
  
  // Generate CSS based on config options
  const generateCss = (configOverride?: any) => {
    // Use override config if provided, otherwise use current config
    const configToUse = configOverride || config;
    
    console.log("Generating CSS with config:", {
      hidePriceEnabled,
      enableActionButton: configToUse.enableActionButton,
      enableEmbeddedForm: configToUse.enableEmbeddedForm,
      buttonType: configToUse.buttonType,
      buttonColor: configToUse.buttonColor,
      buttonTextColor: configToUse.buttonTextColor,
      buttonBorderRadius: configToUse.buttonBorderRadius
    });
    
    // Always include these in the generated CSS
    let css = CORE_CSS;
    
    // Add optional CSS based on local toggle states
    if (hidePriceEnabled) {
      css += "\n" + HIDE_PRICE_CSS;
    }
    
    // Add Action Button CSS if enabled
    if (configToUse.enableActionButton) {
      css += "\n" + getActionButtonCSS(configToUse);
      console.log("Added Action Button CSS");
    }
    
    // Add Embedded Form CSS if enabled
    if (configToUse.enableEmbeddedForm) {
      css += "\n" + EMBEDDED_FORM_CSS;
      console.log("Added Embedded Form CSS");
    }
    
    // Always include attribute-based CSS for URL slug-based listing association 
    // This ensure users get the selector-based styling without any extra steps
    css += `

/* ==========================================================================
   URL Slug-Based Listing Association System
   ========================================================================== */

/* --- Base Attribute Selectors --- */

/* Base styling for all listing containers */
[data-listing-slug] {
    position: relative; /* Ensure proper stacking context */
}

/* --- Category-specific Styling --- */

/* Category: electronics */
[data-listing-category="electronics"] {
    position: relative;
}

[data-listing-category="electronics"] .directory-action-button {
    background-color: #2563eb !important;
    color: #ffffff !important;
}

[data-listing-category="electronics"] .directory-embedded-form {
    border-left: 4px solid #93c5fd !important;
    padding-left: 16px;
}

[data-listing-category="electronics"] h1,
[data-listing-category="electronics"] h2,
[data-listing-category="electronics"] .category-accent {
    color: #1d4ed8 !important;
}

/* Category: clothing */
[data-listing-category="clothing"] {
    position: relative;
}

[data-listing-category="clothing"] .directory-action-button {
    background-color: #7c3aed !important;
    color: #ffffff !important;
}

/* Category: health */
[data-listing-category="health"] {
    position: relative;
}

[data-listing-category="health"] .directory-action-button {
    background-color: #16a34a !important;
    color: #ffffff !important;
}

/* --- Priority-based Styling --- */

/* Priority: featured */
[data-listing-priority="featured"] {
    position: relative;
}

[data-listing-priority="featured"]::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
}

/* Priority: premium */
[data-listing-priority="premium"]::after {
    content: "premium";
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: #7C3AED;
    color: white;
    z-index: 5;
}

/* --- Location-based Styling --- */

/* New York locations */
[data-listing-location*="new-york"] .directory-action-button {
    border-bottom: 3px solid #2563eb !important;
}

/* California locations */
[data-listing-location*="california"] .directory-action-button {
    border-bottom: 3px solid #16a34a !important;
}

/* Texas locations */
[data-listing-location*="texas"] .directory-action-button {
    border-bottom: 3px solid #dc2626 !important;
}`;
    
    console.log("Added URL slug-based listing association CSS");
    
    return css;
  };
  
  // Toggle handlers with immediate CSS update
  const handleToggleHidePrice = (checked: boolean) => {
    setHidePriceEnabled(checked);
    updateConfig({ hidePrice: checked });
  };
  
  // When the component first loads, set the initial CSS
  useEffect(() => {
    const generatedCss = generateCss();
    setCssCode(generatedCss);
    updateConfig({ customCssCode: generatedCss });
  }, []);
  
  // Update CSS when configuration changes
  useEffect(() => {
    console.log("AdvancedStylingConfig detected change in watched dependencies");
    const generatedCss = generateCss();
    setCssCode(generatedCss);
    updateConfig({ customCssCode: generatedCss });
  }, [
    hidePriceEnabled, 
    config.enableActionButton, 
    config.enableEmbeddedForm,
    config.buttonType,
    config.buttonColor,
    config.buttonTextColor,
    config.buttonBorderRadius,
    config.buttonLabel,
    config.buttonUrl
  ]);
  
  return (
    <ConfigCard 
      title="Site Builder Styling Code"
      description="Copy this code to customize your directory listings"
    >
      <div className="space-y-6">
        {/* Toggle Options */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-slate-800">Display Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="hide-price" 
                className="font-normal flex items-center gap-2"
              >
                Hide Price & Quantity
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Hide price displays and quantity selectors on product listings
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <CustomSwitch 
                checked={hidePriceEnabled}
                onCheckedChange={handleToggleHidePrice}
              />
            </div>
            

          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-slate-200"></div>
        
        {/* Data Attribute Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-slate-800">URL Slug-Based Listing Association</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">Automatic Styling with HTML Data Attributes</p>
            <p className="mb-2">
              The CSS we've generated <strong>automatically includes</strong> styling based on listing attributes. 
              This means you'll get category-specific and priority-based styling without any extra coding.
            </p>
            <p className="mb-2">
              Simply add these data attributes to the container element of each listing page:
            </p>
            <div className="bg-white p-2 rounded font-mono text-xs">
              &lt;div
              <br />&nbsp;&nbsp;data-listing-slug="product-name"
              <br />&nbsp;&nbsp;data-listing-category="electronics"
              <br />&nbsp;&nbsp;data-listing-priority="featured" 
              <br />&nbsp;&nbsp;data-listing-location="new-york"
              <br />&gt;
              <br />&nbsp;&nbsp;/* Listing content */
              <br />&lt;/div&gt;
            </div>
            <p className="mt-2">
              <strong>Pre-defined categories</strong> that will automatically receive custom styling: 
              <span className="font-semibold text-blue-700">electronics</span>, 
              <span className="font-semibold text-purple-700">clothing</span>, 
              <span className="font-semibold text-green-700">health</span>
            </p>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-slate-200 mt-4 pt-4"></div>
        
        {/* CSS Code Display */}
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Copy this CSS code and paste it into your site builder's custom code or CSS section to style your listings
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="custom-css-code" className="font-medium">CSS Code</Label>
            <Textarea 
              id="custom-css-code"
              value={cssCode}
              readOnly
              className="font-mono text-sm bg-slate-50"
              rows={12}
            />
            <p className="text-xs text-slate-500">
              This code includes all the styling options you've selected above plus category and priority-based styles.
            </p>
          </div>
        </div>
      </div>
    </ConfigCard>
  );
}