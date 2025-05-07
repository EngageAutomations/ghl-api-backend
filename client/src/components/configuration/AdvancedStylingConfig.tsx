import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfigCard } from "../ui/config-card";

export default function AdvancedStylingConfig() {
  const { config, updateConfig } = useConfig();
  
  return (
    <ConfigCard 
      title="Site Builder Styling Code"
      description="Copy this code to customize your directory listings"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Copy this CSS code and paste it into your site builder's custom code or CSS section to style your listings
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="custom-css-code" className="font-medium">CSS Code</Label>
          <Textarea 
            id="custom-css-code"
            value={config.customCssCode || ""}
            onChange={(e) => updateConfig({ customCssCode: e.target.value })}
            placeholder=".product-price { display: none; }
.product-description { font-size: 16px; }
.product-title { color: #336699; }"
            className="font-mono text-sm"
            rows={10}
          />
          <p className="text-xs text-slate-500">
            This code will help customize your directory listings with the settings you've selected above.
          </p>
        </div>
      </div>
    </ConfigCard>
  );
}