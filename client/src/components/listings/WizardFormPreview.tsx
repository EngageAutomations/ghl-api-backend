import React from 'react';
import { Collection } from '@/components/ui/collection-manager';

// Type for the wizard form preview component props
interface WizardFormPreviewProps {
  directoryName: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  collections: Collection[];
  showPrice: boolean;
  showDescription: boolean;
  showMaps: boolean;
  showMetadata: boolean;
  metadataFields: {label: string, enabled: boolean}[];
  customFieldName: string;
  logoText?: string;
  logo?: string;
}

/**
 * Wizard Form Preview Component
 * 
 * Displays a preview of how the listing creation form will appear
 * based on the current wizard configuration settings.
 */
export function WizardFormPreview({
  directoryName,
  buttonColor,
  buttonTextColor,
  buttonBorderRadius,
  collections,
  showPrice,
  showDescription,
  showMaps,
  showMetadata,
  metadataFields,
  customFieldName,
  logoText,
  logo
}: WizardFormPreviewProps) {
  // Get enabled metadata labels
  const metadataLabels = metadataFields
    .filter(field => field.enabled)
    .map(field => field.label);

  // Generate the HTML for the form preview
  const generateFormPreview = () => {
    // Build the HTML for the listing creation form
    const html = `
      <div class="listing-form" style="font-family: system-ui, -apple-system, sans-serif; max-width: 100%;">
        <form style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Company Logo from user configuration -->
          <div style="text-align: center; margin-bottom: 20px;">
            ${logo ? 
              `<img src="${logo}" alt="Company Logo" style="max-height: 60px; max-width: 200px; margin: 0 auto;">` : 
              `<div style="display: inline-flex; justify-content: center; align-items: center; height: 60px; width: 180px; background-color: ${buttonColor || '#4F46E5'}; border-radius: 8px; margin: 0 auto;">
                <span style="color: white; font-weight: bold; font-size: 18px;">${logoText || directoryName || 'Directory'}</span>
              </div>`
            }
          </div>
          
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1f2937; text-align: center;">Create New Listing</h2>
          
          <!-- Main fields - always required -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Title <span style="color: #ef4444;">*</span>
              <input type="text" name="title" required 
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Product or service title"
              />
            </label>
          </div>
          
          <!-- Subtitle field -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Subtitle
              <input type="text" name="subtitle"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Brief description or tagline"
              />
            </label>
          </div>
          
          <!-- Price field - conditionally shown -->
          ${showPrice ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Price
              <div style="display: flex; align-items: center; margin-top: 4px;">
                <span style="padding: 8px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-right: none; border-radius: 6px 0 0 6px; color: #6b7280;">$</span>
                <input type="text" name="price"
                  style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 0 6px 6px 0; font-size: 14px;"
                  placeholder="99.99"
                />
              </div>
            </label>
          </div>
          ` : ''}
          
          <!-- Description field -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Description ${showDescription ? '<span style="color: #ef4444;">*</span>' : ''}
              <textarea name="description" ${showDescription ? 'required' : ''}
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; min-height: 120px; font-size: 14px; resize: vertical;"
                placeholder="Detailed description of the product or service"
              ></textarea>
            </label>
          </div>
          
          <!-- Company field -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Company
              <input type="text" name="company"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Company or business name"
              />
            </label>
          </div>
          
          <!-- Address/Location fields - conditionally shown -->
          ${showMaps ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Address
              <input type="text" name="address"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Street address"
              />
            </label>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                City
                <input type="text" name="city"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="City"
                />
              </label>
              
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                State/Province
                <input type="text" name="state"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="State"
                />
              </label>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                ZIP/Postal Code
                <input type="text" name="postal_code"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="ZIP Code"
                />
              </label>
              
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                Country
                <input type="text" name="country"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="Country"
                />
              </label>
            </div>
          </div>
          ` : ''}
          
          <!-- Collection selection dropdown - if collections exist -->
          ${collections && collections.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Collection
              <select name="collection_id"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px; background-color: white;"
              >
                <option value="">Select a collection</option>
                ${collections.map((collection) => `
                  <option value="${collection.id}">${collection.name}</option>
                `).join('')}
              </select>
            </label>
          </div>
          ` : ''}
          
          <!-- Metadata fields - conditionally shown -->
          ${showMetadata && metadataLabels.length > 0 ? `
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #374151;">Additional Information</h3>
            
            <div style="display: grid; gap: 12px;">
              ${metadataLabels.map((label, index) => `
                <label style="font-weight: 500; font-size: 14px; color: #374151;">
                  ${label}
                  <input type="text" name="metadata_${index}"
                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                    placeholder="${label} value"
                  />
                </label>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Image upload field -->
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #374151;">Listing Images</h3>
            
            <div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 20px; text-align: center; background-color: #f9fafb;">
              <div style="margin-bottom: 12px; color: #6b7280;">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 8px auto;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <p style="margin: 0; font-size: 14px;">Drag and drop images here, or click to browse</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Accepts JPG, PNG, WEBP (Max: 5MB each)</p>
              </div>
              
              <button type="button"
                style="padding: 6px 12px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; color: #374151; cursor: pointer;"
              >
                Select Files
              </button>
            </div>
          </div>
          
          <!-- Submit button - styled based on button configuration -->
          <div style="margin-top: 24px;">
            <button type="submit"
              style="width: 100%; padding: 10px; background-color: ${buttonColor || '#4F46E5'}; color: ${buttonTextColor || '#FFFFFF'}; border: none; border-radius: ${buttonBorderRadius || '6'}px; font-size: 16px; font-weight: 500; cursor: pointer;"
            >
              Submit Listing
            </button>
          </div>
        </form>
      </div>
    `;
    
    return html;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-medium">Form Appearance Preview</h3>
          <p className="text-sm text-slate-500 mt-1">
            This is how your listing creation form will appear to users
          </p>
        </div>
        
        <div className="p-4 border rounded-md bg-white">
          {/* Form Preview */}
          <div
            className="form-preview"
            dangerouslySetInnerHTML={{ __html: generateFormPreview() }}
          />
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 mb-4">
          This preview updates automatically based on your configuration settings
        </p>
      </div>
    </div>
  );
}