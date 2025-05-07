import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { ConfigCard } from "../ui/config-card";
import { CustomSwitch } from "../ui/custom-switch";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function VisibilityOptionsConfig() {
  const { config, updateConfig } = useConfig();
  
  return (
    <ConfigCard 
      title="Visibility Options"
      description="Control which eCommerce elements appear on your listings"
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-500">
          Hide standard eCommerce elements to customize the appearance of your directory listings
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
    </ConfigCard>
  );
}