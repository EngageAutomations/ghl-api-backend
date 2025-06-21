export interface DirectoryConfig {
  customFieldName: string;
  showDescription: boolean;
  showMetadata: boolean;
  showMaps: boolean;
  showPrice: boolean;
  metadataFields: string[];
  formEmbedUrl: string;
  buttonType: 'popup' | 'redirect' | 'download';
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export function generateFormFields(config: DirectoryConfig): FormField[] {
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Product/Service Name',
      type: 'text',
      required: true,
      placeholder: 'Enter the name of your product or service',
      description: 'This will be displayed as the main title in the directory'
    },
    {
      name: 'description',
      label: 'Product Description',
      type: 'textarea',
      required: true,
      placeholder: 'Describe your product or service...',
      description: 'Provide a detailed description of your product or service'
    },
    {
      name: 'image',
      label: 'Product Image',
      type: 'url',
      required: true,
      placeholder: 'Upload image',
      description: 'Upload to GoHighLevel Media Library'
    }
  ];

  // Add conditional fields based on config
  if (config.showPrice) {
    fields.push({
      name: 'price',
      label: 'Price',
      type: 'text',
      required: false,
      placeholder: '$99.99',
      description: 'Enter the price for your product or service'
    });
  }

  if (config.showDescription) {
    fields.push({
      name: 'expanded_description',
      label: 'Detailed Description',
      type: 'textarea',
      required: false,
      placeholder: 'Provide detailed information...',
      description: 'Enhanced content for detailed listings'
    });
  }

  if (config.showMaps) {
    fields.push({
      name: 'address',
      label: 'Business Address',
      type: 'text',
      required: false,
      placeholder: '123 Main St, City, State 12345',
      description: 'Full address for Google Maps integration'
    });
  }

  // Add metadata fields
  if (config.showMetadata && config.metadataFields.length > 0) {
    config.metadataFields.forEach((fieldName, index) => {
      fields.push({
        name: `metadata_${fieldName.toLowerCase().replace(/\s+/g, '_')}`,
        label: fieldName,
        type: 'text',
        required: false,
        placeholder: `Enter ${fieldName.toLowerCase()}`,
        description: `Additional ${fieldName.toLowerCase()} information`
      });
    });
  }

  // Always add SEO fields
  fields.push(
    {
      name: 'seo_title',
      label: 'SEO Title',
      type: 'text',
      required: true,
      placeholder: 'SEO-optimized title for search engines',
      description: 'Auto-fills from product name, customize for search optimization'
    },
    {
      name: 'seo_description',
      label: 'SEO Description',
      type: 'textarea',
      required: true,
      placeholder: 'Brief description for search engines (150-160 characters)',
      description: 'Auto-fills from basic description, optimize for search results'
    }
  );

  return fields;
}