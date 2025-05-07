import { useConfig } from "@/context/ConfigContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfigCard } from "../ui/config-card";

export default function StylingConfig() {
  const { config, updateConfig } = useConfig();
  
  return (
    <ConfigCard 
      title="Styling Configuration"
      description="Customize the appearance of your directory listings"
    >
      <div className="space-y-6">
        <h3 className="text-base font-medium text-slate-800">Hide HighLevel eCommerce Elements</h3>
        <p className="text-sm text-slate-500 mb-4">
          Select which standard eCommerce elements you want to hide on your directory listings
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hide-price"
              checked={config.hidePrice}
              onCheckedChange={(checked) => 
                updateConfig({ hidePrice: checked === true })
              }
            />
            <Label 
              htmlFor="hide-price" 
              className="text-sm font-normal"
            >
              Hide Price
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hide-cart-icon"
              checked={config.hideCartIcon}
              onCheckedChange={(checked) => 
                updateConfig({ hideCartIcon: checked === true })
              }
            />
            <Label 
              htmlFor="hide-cart-icon" 
              className="text-sm font-normal"
            >
              Hide Cart Icon
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="hide-add-to-cart"
              checked={config.hideAddToCartButton}
              onCheckedChange={(checked) => 
                updateConfig({ hideAddToCartButton: checked === true })
              }
            />
            <Label 
              htmlFor="hide-add-to-cart" 
              className="text-sm font-normal"
            >
              Hide Add-to-Cart Button
            </Label>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-base font-medium text-slate-800 mb-4">Custom CSS</h3>
          <div className="space-y-2">
            <Label htmlFor="custom-css-code">Add custom CSS for your listings</Label>
            <Textarea 
              id="custom-css-code"
              value={config.customCssCode || ""}
              onChange={(e) => updateConfig({ customCssCode: e.target.value })}
              placeholder=".product-price { display: none; }"
              className="font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-slate-500">
              Advanced: Add custom CSS to further customize your directory listings
            </p>
          </div>
        </div>
      </div>
    </ConfigCard>
  );
}
