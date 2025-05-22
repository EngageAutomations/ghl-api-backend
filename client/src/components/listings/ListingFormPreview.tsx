import { useEffect, useState } from 'react';
import { DesignerConfig } from '@shared/schema';
import { getConfig, defaultConfig } from '@/lib/config-store';

// Extended config type that includes our UI-specific fields
type ExtendedConfig = Partial<DesignerConfig> & {
  metadataLabels?: string[];
  metadataCount?: number;
  enablePriceDisplay?: boolean;
  enableLocationMap?: boolean;
  enableMetadataDisplay?: boolean;
};

interface ListingFormPreviewProps {
  config?: ExtendedConfig;
}

export function ListingFormPreview({ config: propConfig }: ListingFormPreviewProps) {
  const [config, setConfig] = useState<ExtendedConfig | null>(null);
  
  // Load config from props or storage
  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
    } else {
      // Merge the database config with our UI additions
      const savedConfig = getConfig();
      setConfig(savedConfig as ExtendedConfig);
    }
  }, [propConfig]);

  if (!config) {
    return <div>Loading...</div>;
  }

  // For safety, use our UI fields with fallbacks
  const metadataLabels = config.metadataLabels || defaultConfig.metadataLabels;
  const metadataCount = config.metadataCount || defaultConfig.metadataCount;

  return (
    <div className="form-preview">
      <h4 className="text-lg font-medium mb-4">Listing Submission Form</h4>
      
      <div className="space-y-4">
        {/* Basic Fields - Always shown */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Listing Name</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border rounded-md" 
            placeholder="Enter listing name"
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Category</label>
          <select className="w-full px-3 py-2 border rounded-md bg-white" disabled>
            <option>Select a category</option>
            <option>Technology</option>
            <option>Finance</option>
            <option>Healthcare</option>
            <option>Education</option>
            <option>Other</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Short Description</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border rounded-md" 
            placeholder="Brief summary for listing cards"
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Detailed Description</label>
          <textarea 
            className="w-full px-3 py-2 border rounded-md h-20" 
            placeholder="Enter detailed description"
            disabled
          ></textarea>
        </div>
        
        {/* Conditional Price Field */}
        {config.enablePriceDisplay && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Price</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md" 
              placeholder="Enter product price"
              disabled
            />
          </div>
        )}
        
        {/* Conditional Google Maps Location */}
        {config.enableLocationMap && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Location</label>
            <div className="border rounded-md h-24 bg-slate-50 flex items-center justify-center">
              <div className="text-sm text-slate-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                Google Maps Location Field
              </div>
            </div>
          </div>
        )}
        
        {/* Metadata Fields */}
        {config.enableMetadataDisplay && metadataCount > 0 && (
          <div className="space-y-4 border-t pt-4 mt-4">
            <div className="text-sm font-medium">Metadata Fields</div>
            
            {Array.from({ length: metadataCount }).map((_, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium">
                  {metadataLabels[index] || `Metadata Field ${index + 1}`}
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md" 
                  placeholder={`Enter ${metadataLabels[index] || `metadata value`}`}
                  disabled
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Action Button - Conditional based on configuration */}
        {config.enableActionButton && (
          <div className="space-y-2 border-t pt-4 mt-4">
            <div className="text-sm font-medium">Action Button Configuration</div>
            <div className="p-3 border rounded-md bg-slate-50">
              <div className="flex items-center">
                <span className="text-sm text-slate-600 mr-3">Button Type:</span>
                <span className="text-sm font-medium capitalize">{config.buttonType}</span>
              </div>
              <div className="mt-2">
                <button 
                  className="px-4 py-2 rounded-md text-white"
                  style={{
                    backgroundColor: (config.buttonColor || defaultConfig.buttonColor) as string,
                    color: (config.buttonTextColor || defaultConfig.buttonTextColor) as string,
                    borderRadius: `${config.buttonBorderRadius || defaultConfig.buttonBorderRadius}px`
                  }}
                  disabled
                >
                  {config.buttonLabel || 'Contact Us'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="pt-4">
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md"
            style={{
              backgroundColor: (config.buttonColor || defaultConfig.buttonColor) as string,
              color: (config.buttonTextColor || defaultConfig.buttonTextColor) as string,
              borderRadius: `${config.buttonBorderRadius || defaultConfig.buttonBorderRadius}px`
            }}
            disabled
          >
            Submit Listing
          </button>
        </div>
      </div>
    </div>
  );
}