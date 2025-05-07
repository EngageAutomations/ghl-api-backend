import { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { ConfigCard } from "../ui/config-card";
import { replaceTokens } from "@/lib/utils";
import PopupModal from "../modals/PopupModal";

export default function PreviewSection() {
  const { config } = useConfig();
  const [showPopup, setShowPopup] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refreshPreview = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  const productName = "Professional Consulting Services";
  const encodedProductName = encodeURIComponent(productName);
  
  const getUrlWithProductName = () => {
    if (!config.buttonUrl) return "";
    return replaceTokens(config.buttonUrl, {
      product_name: productName
    });
  };
  
  const getButtonClass = () => {
    switch (config.buttonStyle) {
      case "primary":
        return "bg-primary-500 hover:bg-primary-600 text-white";
      case "secondary":
        return "bg-accent-500 hover:bg-accent-600 text-white";
      case "outline":
        return "bg-white border border-primary-500 text-primary-500 hover:bg-primary-50";
      case "custom":
        return config.customCss || "";
      default:
        return "bg-primary-500 hover:bg-primary-600 text-white";
    }
  };
  
  return (
    <ConfigCard 
      title="Live Preview"
      titleRight={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPreview}
          className="h-8"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      }
    >
      <div key={refreshKey} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <div className="max-w-xl mx-auto">
          {/* Product Preview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Product Image */}
            <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden">
              <div className="text-primary-300 text-xl font-semibold">Product Image</div>
            </div>
            
            {/* Product Details */}
            <div className="p-4">
              <h3 className="text-lg font-medium text-slate-800">{productName}</h3>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                Comprehensive business consulting and advisory services for small to medium enterprises looking to scale operations.
              </p>
              
              <div className="mt-4 flex items-center justify-between">
                {!config.hidePrice && (
                  <div className="text-lg font-medium text-slate-900">$249.00</div>
                )}
                {!config.hidePrice && !config.hideAddToCartButton && (
                  <div className="flex-1"></div>
                )}
                <div className="flex space-x-2">
                  {!config.hideAddToCartButton && (
                    <button 
                      type="button" 
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Add to Cart
                    </button>
                  )}
                  
                  {config.enableActionButton && (
                    <button 
                      type="button" 
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${getButtonClass()}`}
                      onClick={() => {
                        if (config.buttonType === "popup") {
                          setShowPopup(true);
                        } else if (config.buttonType === "link" && config.buttonUrl) {
                          window.open(getUrlWithProductName(), "_blank");
                        } else if (config.buttonType === "download" && config.buttonUrl) {
                          const a = document.createElement("a");
                          a.href = getUrlWithProductName();
                          a.download = "";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }}
                    >
                      {config.buttonLabel || "Contact Us"}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Embedded Form Preview (if enabled) */}
              {config.enableEmbeddedForm && config.formPosition === "Below Product Description" && (
                <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="text-center text-slate-500">
                    <div className="border-2 border-dashed border-slate-300 p-4 rounded">
                      <p className="mb-2 font-medium">Embedded Form</p>
                      <p className="text-xs">
                        Form will load from: {config.formEmbedUrl ? replaceTokens(config.formEmbedUrl, { product_name: productName }) : "No URL configured"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Popup Preview */}
          {showPopup && (
            <PopupModal
              url={getUrlWithProductName()}
              width={config.popupWidth || 600}
              height={config.popupHeight || 500}
              title="Contact Form Popup"
              onClose={() => setShowPopup(false)}
            />
          )}
        </div>
      </div>
    </ConfigCard>
  );
}
