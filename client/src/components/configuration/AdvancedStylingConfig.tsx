import { useEffect } from "react";
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

// Download button styling
const DOWNLOAD_BUTTON_CSS = `
/* Turn plain anchor tags in description into styled buttons */
#description p > a {
    display: inline-block;
    background-color: #9966CC; /* Change this to your desired button color */
    color: #fff !important;
    padding: 10px 20px;
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
    transition: background-color 0.3s ease;
}

/* Hover effect */
#description p > a:hover {
    background-color: #0056b3; /* Hover color */
}
`;

// Script for changing link text (if needed)
const DOWNLOAD_BUTTON_SCRIPT = `
<script>
  const links = document.querySelectorAll('#description p > a');
  links.forEach(link => {
    if (link.innerText.length < 10) {
      link.innerText = "Download Now"; // Customize this text
    }
  });
</script>
`;

export default function AdvancedStylingConfig() {
  const { config, updateConfig } = useConfig();
  
  // Generate CSS based on config options
  const generateCss = () => {
    let css = CORE_CSS;
    
    // Add optional CSS based on configuration
    if (config.hidePrice) {
      css += "\n" + HIDE_PRICE_CSS;
    }
    
    if (config.enableDownloadButton) {
      css += "\n" + DOWNLOAD_BUTTON_CSS;
    }
    
    return css;
  };
  
  // Update CSS when config changes
  useEffect(() => {
    const generatedCss = generateCss();
    updateConfig({ customCssCode: generatedCss });
  }, [config.hidePrice, config.enableDownloadButton]);
  
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
                checked={config.hidePrice || false}
                onCheckedChange={(checked) => updateConfig({ hidePrice: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="enable-download-button" 
                className="font-normal flex items-center gap-2"
              >
                Style Download Links
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Convert regular links in description to styled download buttons
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <CustomSwitch 
                checked={config.enableDownloadButton || false}
                onCheckedChange={(checked) => updateConfig({ enableDownloadButton: checked })}
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
              value={config.customCssCode || ""}
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