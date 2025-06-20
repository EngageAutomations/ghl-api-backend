import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { generateFormHTML, generateFormCSS } from '@/lib/dynamic-form-generator';
import { X } from 'lucide-react';

interface DirectoryFormRendererProps {
  config: any;
  onClose: () => void;
}

export function DirectoryFormRenderer({ config, onClose }: DirectoryFormRendererProps) {
  const [formHTML, setFormHTML] = useState('');
  const [formCSS, setFormCSS] = useState('');

  useEffect(() => {
    // Generate the form based on directory configuration
    if (config) {
      try {
        // Transform the config to match the expected format
        const formConfig = {
          customFieldName: config.form?.fieldName || 'listing',
          showDescription: config.features?.showDescription || false,
          showMetadata: config.features?.showMetadata || false,
          showMaps: config.features?.showMaps || false,
          showPrice: config.features?.showPrice || false,
          metadataFields: config.metadataFields || [],
          formEmbedUrl: config.form?.embedCode || '',
          buttonType: config.button?.type || 'popup'
        };

        const html = generateFormHTML(formConfig);
        const css = generateFormCSS();
        
        setFormHTML(html);
        setFormCSS(css);
      } catch (error) {
        console.error('Error generating form:', error);
        setFormHTML('<p>Error generating form. Please check the directory configuration.</p>');
      }
    }
  }, [config]);

  return (
    <div className="space-y-6">
      {/* Header with close button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Generated Directory Form</h3>
          <p className="text-sm text-gray-600">
            This is the form that will be displayed when users click the directory button
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Form Configuration</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Description:</span>{' '}
            <span className="text-blue-900">
              {config.features?.showDescription ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Metadata:</span>{' '}
            <span className="text-blue-900">
              {config.features?.showMetadata ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Maps:</span>{' '}
            <span className="text-blue-900">
              {config.features?.showMaps ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Price:</span>{' '}
            <span className="text-blue-900">
              {config.features?.showPrice ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Button Type:</span>{' '}
            <span className="text-blue-900">
              {config.button?.type || 'popup'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Field Name:</span>{' '}
            <span className="text-blue-900">
              {config.form?.fieldName || 'listing'}
            </span>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-medium text-gray-900">Form Preview</h4>
        </div>
        
        {/* Render the generated form */}
        <div className="p-6 bg-white">
          <style dangerouslySetInnerHTML={{ __html: formCSS }} />
          <div 
            dangerouslySetInnerHTML={{ __html: formHTML }}
            className="directory-form-container"
          />
        </div>
      </div>

      {/* Integration Code */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Integration Code</h4>
        
        {/* CSS Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">CSS (Header Code)</label>
          <div className="bg-gray-50 border rounded p-3">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
              {config.generatedCode?.headerCode || '/* No CSS code generated */'}
            </pre>
          </div>
        </div>

        {/* JavaScript Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">JavaScript (Footer Code)</label>
          <div className="bg-gray-50 border rounded p-3">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
              {config.generatedCode?.footerCode || '/* No JavaScript code generated */'}
            </pre>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={() => {
            // Copy integration code to clipboard
            const fullCode = `${config.generatedCode?.headerCode || ''}\n\n${formHTML}\n\n${config.generatedCode?.footerCode || ''}`;
            navigator.clipboard.writeText(fullCode);
          }}
        >
          Copy Full Code
        </Button>
      </div>
    </div>
  );
}