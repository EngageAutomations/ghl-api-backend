/**
 * Dynamic Code Generator using JSON Configuration Templates
 * Generates user-facing code based on chosen settings and templates
 */

import { ConfigTemplate } from './config-templates';
import { parseEmbedCode } from './embed-parser';

export interface GenerationConfig {
  template: ConfigTemplate;
  userSettings: Record<string, any>;
  embedCode?: string;
  listingSlug?: string;
}

export interface GeneratedCode {
  headerCode: string;
  footerCode: string;
  fullIntegrationCode: string;
  isValid: boolean;
  error?: string;
}

/**
 * Generate code using the new template system
 */
export function generateCodeFromTemplate(config: GenerationConfig): GeneratedCode {
  const { template, userSettings, embedCode, listingSlug } = config;

  try {
    // Parse embed code if required
    let parsedData = null;
    if (template.requiresIframeEmbedInput && embedCode) {
      parsedData = parseEmbedCode(embedCode);
      if (!parsedData) {
        return {
          headerCode: '',
          footerCode: '',
          fullIntegrationCode: '',
          isValid: false,
          error: 'Unable to parse embed code. Please ensure you have pasted a valid GoHighLevel iframe embed code.'
        };
      }
    }

    // Create placeholder replacements
    const replacements = createReplacements(template, userSettings, parsedData, listingSlug);

    // Generate header code (CSS)
    let headerCode = '';
    if (template.fieldsUsed.css && template.cssTemplate) {
      headerCode = replacePlaceholders(template.cssTemplate, replacements);
    }

    // Generate footer code (HTML + JS)
    let footerCode = '';
    if (template.fieldsUsed.footer && template.footerTemplate) {
      footerCode = replacePlaceholders(template.footerTemplate, replacements);
    }

    // Combine for full integration
    const fullIntegrationCode = headerCode + '\n\n' + footerCode;

    return {
      headerCode,
      footerCode,
      fullIntegrationCode,
      isValid: true
    };

  } catch (error) {
    return {
      headerCode: '',
      footerCode: '',
      fullIntegrationCode: '',
      isValid: false,
      error: `Code generation failed: ${error.message}`
    };
  }
}

/**
 * Create replacement map for placeholders and styling variables
 */
function createReplacements(
  template: ConfigTemplate,
  userSettings: Record<string, any>,
  parsedData: any,
  listingSlug?: string
): Record<string, string> {
  const replacements: Record<string, string> = {};

  // Add styling variables (with user overrides)
  Object.entries(template.stylingVariables).forEach(([key, defaultValue]) => {
    replacements[key] = userSettings[key] || defaultValue;
  });

  // Add placeholders
  Object.keys(template.placeholders).forEach(placeholder => {
    switch (placeholder) {
      case 'YOUR_FORM_ID':
        replacements[placeholder] = parsedData?.src || '';
        break;
      case 'FORM_HEIGHT':
        replacements[placeholder] = parsedData?.height?.toString() || '400';
        break;
      case 'LISTING_SLUG':
        replacements[placeholder] = listingSlug || 'default-listing';
        break;
      default:
        replacements[placeholder] = userSettings[placeholder] || '';
    }
  });

  return replacements;
}

/**
 * Replace all placeholders in template string
 */
function replacePlaceholders(template: string, replacements: Record<string, string>): string {
  let result = template;

  // Replace {{variable}} style placeholders
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Validate that all required fields are provided
 */
export function validateGenerationConfig(config: GenerationConfig): { isValid: boolean; error?: string } {
  const { template, userSettings, embedCode } = config;

  // Check if embed code is required but missing
  if (template.requiresIframeEmbedInput && !embedCode) {
    return {
      isValid: false,
      error: 'This configuration requires a GoHighLevel iframe embed code'
    };
  }

  // Check for required styling variables
  const missingVariables = Object.keys(template.stylingVariables).filter(
    key => !userSettings[key] && !template.stylingVariables[key]
  );

  if (missingVariables.length > 0) {
    return {
      isValid: false,
      error: `Missing required styling variables: ${missingVariables.join(', ')}`
    };
  }

  return { isValid: true };
}