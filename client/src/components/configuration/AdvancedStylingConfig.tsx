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
  
  return `
/* --- Action Button Styling --- */
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
`;



// Create a simple event emitter for component communication
export const cssUpdateEmitter = {
  listeners: [] as Function[],
  
  subscribe(callback: Function) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  },
  
  emit() {
    this.listeners.forEach(listener => listener());
  }
};

export default function AdvancedStylingConfig() {
  const { config, updateConfig } = useConfig();
  const [cssCode, setCssCode] = useState(CORE_CSS);
  const [hidePriceEnabled, setHidePriceEnabled] = useState(config.hidePrice || false);
  
  // Listen to direct update events from other components
  useEffect(() => {
    const unsubscribe = cssUpdateEmitter.subscribe(() => {
      console.log("CSS Update event received, regenerating CSS");
      const generatedCss = generateCss();
      setCssCode(generatedCss);
      updateConfig({ customCssCode: generatedCss });
    });
    
    return unsubscribe;
  }, []);
  
  // Generate CSS based on config options
  const generateCss = () => {
    console.log("Generating CSS with config:", {
      hidePriceEnabled,
      enableActionButton: config.enableActionButton,
      enableEmbeddedForm: config.enableEmbeddedForm,
      buttonType: config.buttonType,
      buttonColor: config.buttonColor,
      buttonTextColor: config.buttonTextColor,
      buttonBorderRadius: config.buttonBorderRadius
    });
    
    let css = CORE_CSS;
    
    // Add optional CSS based on local toggle states
    if (hidePriceEnabled) {
      css += "\n" + HIDE_PRICE_CSS;
    }
    
    // Add Action Button CSS if enabled
    if (config.enableActionButton) {
      css += "\n" + getActionButtonCSS(config);
      console.log("Added Action Button CSS");
    }
    
    // Add Embedded Form CSS if enabled
    if (config.enableEmbeddedForm) {
      css += "\n" + EMBEDDED_FORM_CSS;
      console.log("Added Embedded Form CSS");
    }
    
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
              This code includes all the styling options you've selected above.
            </p>
          </div>
        </div>
      </div>
    </ConfigCard>
  );
}