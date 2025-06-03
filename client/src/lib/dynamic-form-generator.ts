/**
 * Dynamic Form Generator
 * Creates forms based on directory configuration with required and optional fields
 */

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'hidden';
  required: boolean;
  placeholder?: string;
  description?: string;
}

export interface DirectoryConfig {
  // Required fields - always included
  customFieldName: string;
  
  // Feature toggles
  showDescription: boolean;
  showMetadata: boolean;
  showMaps: boolean;
  
  // Metadata configuration
  metadataFields: string[];
  
  // Integration settings
  formEmbedUrl: string;
  buttonType: 'popup' | 'redirect' | 'download';
}

/**
 * Generate form fields based on directory configuration
 */
export function generateFormFields(config: DirectoryConfig): FormField[] {
  const fields: FormField[] = [];
  
  // REQUIRED FIELDS - Always included
  fields.push({
    name: 'name',
    label: 'Product/Service Name',
    type: 'text',
    required: true,
    placeholder: 'Enter the name of your product or service',
    description: 'This will be displayed as the main title in the directory'
  });
  
  fields.push({
    name: 'description',
    label: 'Basic Description',
    type: 'textarea',
    required: true,
    placeholder: 'Provide a brief description of your product or service',
    description: 'A concise overview that will appear in the directory listing'
  });
  
  fields.push({
    name: 'image',
    label: 'Product Image',
    type: 'url',
    required: true,
    placeholder: 'Google Drive URL for your product image',
    description: 'Upload your image to Google Drive and paste the shareable link here'
  });
  
  // SEO FIELDS - Always included for better search visibility
  fields.push({
    name: 'seo_title',
    label: 'SEO Title',
    type: 'text',
    required: true,
    placeholder: 'SEO-optimized title for search engines',
    description: 'This title will appear in search results and browser tabs'
  });
  
  fields.push({
    name: 'seo_description',
    label: 'SEO Description',
    type: 'textarea',
    required: true,
    placeholder: 'Brief description for search engines (150-160 characters)',
    description: 'This description will appear in search engine results'
  });
  
  fields.push({
    name: 'url_slug',
    label: 'URL Slug',
    type: 'text',
    required: true,
    placeholder: 'url-friendly-name',
    description: 'Used in the URL for this listing (lowercase, hyphens only)'
  });
  
  // OPTIONAL FIELDS - Based on configuration
  
  // Expanded Description
  if (config.showDescription) {
    fields.push({
      name: 'expanded_description',
      label: 'Detailed Description',
      type: 'textarea',
      required: false,
      placeholder: 'Provide detailed information about your product or service',
      description: 'Extended description with more details, features, and benefits'
    });
  }
  
  // Google Maps Address
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
  
  // Metadata Fields
  if (config.showMetadata && config.metadataFields.length > 0) {
    config.metadataFields.forEach((fieldLabel, index) => {
      fields.push({
        name: `metadata_${index + 1}`,
        label: fieldLabel,
        type: 'text',
        required: false,
        placeholder: `Enter ${fieldLabel.toLowerCase()}`,
        description: `Custom metadata field: ${fieldLabel}`
      });
    });
  }
  
  // Hidden tracking field
  fields.push({
    name: config.customFieldName,
    label: 'Listing Identifier',
    type: 'hidden',
    required: true,
    description: 'Automatic field for tracking form submissions'
  });
  
  return fields;
}

/**
 * Generate HTML form code based on configuration
 */
export function generateFormHTML(config: DirectoryConfig): string {
  const fields = generateFormFields(config);
  const formAction = extractFormAction(config.formEmbedUrl);
  
  let html = `<form method="POST" action="${formAction}" class="ghl-directory-form">\n`;
  
  // Add form fields
  fields.forEach(field => {
    if (field.type === 'hidden') {
      html += `  <input type="hidden" name="${field.name}" value="" id="${field.name}">\n`;
    } else {
      html += `  <div class="form-group">\n`;
      html += `    <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>\n`;
      
      if (field.type === 'textarea') {
        html += `    <textarea name="${field.name}" id="${field.name}"${field.required ? ' required' : ''} placeholder="${field.placeholder || ''}">${field.name === 'seo_description' ? '' : ''}</textarea>\n`;
      } else {
        html += `    <input type="${field.type}" name="${field.name}" id="${field.name}"${field.required ? ' required' : ''} placeholder="${field.placeholder || ''}">\n`;
      }
      
      if (field.description) {
        html += `    <small class="form-description">${field.description}</small>\n`;
      }
      html += `  </div>\n\n`;
    }
  });
  
  html += `  <button type="submit" class="submit-btn">Submit Listing</button>\n`;
  html += `</form>\n\n`;
  
  // Add JavaScript for form enhancement
  html += generateFormJavaScript(config);
  
  return html;
}

/**
 * Generate CSS for form styling
 */
export function generateFormCSS(): string {
  return `
/* Directory Form Styles */
.ghl-directory-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-description {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.submit-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background: #2563eb;
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
`;
}

/**
 * Generate JavaScript for form functionality
 */
function generateFormJavaScript(config: DirectoryConfig): string {
  return `
<script>
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.ghl-directory-form');
  const slugField = document.getElementById('url_slug');
  const nameField = document.getElementById('name');
  const hiddenField = document.getElementById('${config.customFieldName}');
  
  // Auto-generate slug from name
  if (nameField && slugField) {
    nameField.addEventListener('input', function() {
      const slug = this.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      slugField.value = slug;
      
      // Update hidden tracking field
      if (hiddenField) {
        hiddenField.value = slug;
      }
    });
  }
  
  // Form validation
  form.addEventListener('submit', function(e) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = '#ef4444';
      } else {
        field.style.borderColor = '#d1d5db';
      }
    });
    
    if (!isValid) {
      e.preventDefault();
      alert('Please fill in all required fields.');
    }
  });
});
</script>
`;
}

/**
 * Extract form action URL from GoHighLevel embed code
 */
function extractFormAction(embedUrl: string): string {
  if (!embedUrl) return '#';
  
  // If it's already a clean URL, use it
  if (embedUrl.startsWith('http')) {
    return embedUrl;
  }
  
  // Try to extract action URL from iframe src or form action
  const actionMatch = embedUrl.match(/action=["']([^"']+)["']/);
  if (actionMatch) {
    return actionMatch[1];
  }
  
  const srcMatch = embedUrl.match(/src=["']([^"']+)["']/);
  if (srcMatch) {
    return srcMatch[1];
  }
  
  // Fallback
  return embedUrl;
}

/**
 * Generate form field schema for validation
 */
export function generateFormSchema(config: DirectoryConfig) {
  const fields = generateFormFields(config);
  
  const schema: Record<string, any> = {};
  
  fields.forEach(field => {
    if (field.type !== 'hidden') {
      schema[field.name] = {
        type: field.type,
        required: field.required,
        label: field.label
      };
    }
  });
  
  return schema;
}