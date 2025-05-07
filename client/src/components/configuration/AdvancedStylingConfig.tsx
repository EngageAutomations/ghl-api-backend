import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfigCard } from "../ui/config-card";
import { CustomSwitch } from "../ui/custom-switch";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdvancedStylingConfig() {
  const { config, updateConfig } = useConfig();
  
  return (
    <ConfigCard 
      title="Styling Configuration"
      description="Customize the appearance of your directory listings"
    >
      <div className="space-y-8">
        {/* Visibility Options Section */}
        <div className="space-y-6">
          <h3 className="text-base font-medium text-slate-800">Visibility Settings</h3>
          <p className="text-sm text-slate-500">
            Control which eCommerce elements appear on your directory listings
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="hide-price" 
                className="font-normal flex items-center gap-2"
              >
                Price Display
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Hide the product price on your listings
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
                htmlFor="hide-cart-icon" 
                className="font-normal flex items-center gap-2"
              >
                Shopping Cart Icon
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Hide the cart icon from the navigation
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <CustomSwitch 
                checked={config.hideCartIcon || false}
                onCheckedChange={(checked) => updateConfig({ hideCartIcon: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="hide-add-to-cart" 
                className="font-normal flex items-center gap-2"
              >
                Add-to-Cart Button
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Hide the Add to Cart button on product listings
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <CustomSwitch 
                checked={config.hideAddToCartButton || false}
                onCheckedChange={(checked) => updateConfig({ hideAddToCartButton: checked })}
              />
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-slate-200"></div>
        
        {/* Custom CSS Section */}
        <div className="space-y-6">
          <h3 className="text-base font-medium text-slate-800">Custom CSS</h3>
          <p className="text-sm text-slate-500">
            Use custom CSS to precisely control the appearance of elements in your directory listings
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="custom-css-code" className="flex items-center gap-2">
              CSS Code
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Add CSS code to customize your listings beyond the standard options
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Textarea 
              id="custom-css-code"
              value={config.customCssCode || ""}
              onChange={(e) => updateConfig({ customCssCode: e.target.value })}
              placeholder=".product-price { display: none; }
.product-description { font-size: 16px; }
.product-title { color: #336699; }"
              className="font-mono text-sm"
              rows={8}
            />
            <p className="text-xs text-slate-500">
              Advanced: Use CSS to modify colors, fonts, sizes, and more. Changes apply to all listings.
            </p>
          </div>
        </div>
      </div>
    </ConfigCard>
  );
}