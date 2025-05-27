/**
 * Embedded Form Code Generator for Go HighLevel Integration
 * Generates customizable embedded form code with animation options
 */

export interface EmbeddedFormConfig {
  formUrl: string;
  animationType: "fade-squeeze" | "slide-right";
  borderRadius: number;
  boxShadow: string;
  customFieldName: string;
  metadataFields: Array<{
    id: number;
    label: string;
    enabled: boolean;
  }>;
}

export function generateEmbeddedFormCode(config: EmbeddedFormConfig): {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  fullIntegrationCode: string;
} {
  // Header code - empty, ready for new implementation
  const cssCode = '';

  // Footer script - empty, ready for new implementation
  const jsCode = '';

  // HTML is empty since this is a script-only implementation
  const htmlCode = '';

  // Combined integration code for easy copy-paste
  const fullIntegrationCode = `${cssCode}\n\n${jsCode}`;

  return {
    htmlCode,
    cssCode: cssCode, // Complete header with CSS + JavaScript
    jsCode: jsCode, // Footer script with config object approach
    fullIntegrationCode: `${cssCode}\n\n${jsCode}`
  };
}