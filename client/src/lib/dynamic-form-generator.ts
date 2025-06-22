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
  options?: string[];
}

export function generateFormFields(config: DirectoryConfig): FormField[] {
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Title',
      type: 'text',
      required: true,
      placeholder: 'Enter the name of your product or service',
      description: 'This will be displayed as the main title in the directory'
    }
  ];

  // Add price right after product name if enabled
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

  // Add description fields
  fields.push({
    name: 'description',
    label: 'Product Description',
    type: 'textarea',
    required: true,
    placeholder: 'Describe your product or service...',
    description: 'Provide a detailed description of your product or service'
  });

  // Add detailed description right after product description
  if (config.showDescription) {
    fields.push({
      name: 'expanded_description',
      label: 'Detailed Description',
      type: 'richtext',
      required: false,
      placeholder: 'Provide detailed information...',
      description: 'Enhanced content for detailed listings'
    });
  }

  // Add image after description fields
  fields.push({
    name: 'image',
    label: 'Product Image',
    type: 'url',
    required: true,
    placeholder: 'Upload image',
    description: 'Upload to GoHighLevel Media Library'
  });

  if (config.showMaps) {
    fields.push({
      name: 'address',
      label: 'Map Embed Address (Google)',
      type: 'text',
      required: false,
      placeholder: '123 Main St, City, State 12345',
      description: 'Full address for Google Maps integration'
    });
  }

  // Add metadata bar fields (icon + text pairs) - Start with 1, allow up to 8
  if (config.showMetadata) {
    // Always start with just 1 metadata field pair
    fields.push({
      name: `metadata_icon_0`,
      label: 'Icon',
      type: 'icon_upload',
      required: true,
      placeholder: 'Upload icon',
      description: 'Upload icon for metadata display'
    });
    fields.push({
      name: `metadata_text_0`,
      label: 'Display Text',
      type: 'text',
      required: true,
      placeholder: 'Enter display text',
      description: 'Text to display next to icon'
    });
    
    // Add font selection field within metadata section
    fields.push({
      name: 'metadata_text_font',
      label: 'Text Font',
      type: 'select',
      required: false,
      placeholder: 'Select font family',
      description: 'Choose font for text display',
      options: [
        'Arial',
        'Helvetica',
        'Georgia',
        'Times New Roman',
        'Verdana',
        'Trebuchet MS',
        'Impact',
        'Comic Sans MS',
        'Palatino',
        'Garamond'
      ]
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