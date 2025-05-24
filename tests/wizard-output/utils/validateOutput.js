/**
 * Code Generation Validation Utilities
 * Validates that wizard output matches expected configuration
 */

/**
 * Validates the generated code output against expected results
 * @param {Object} config - The wizard configuration
 * @param {Object} output - The generated code output {headerCode, footerCode}
 * @param {Object} expectations - Expected validation results
 * @returns {Object} Validation result with pass/fail status and details
 */
function validateCodeOutput(config, output, expectations) {
  const results = {
    passed: true,
    failures: [],
    details: {}
  };

  // Helper function to add failure
  const addFailure = (test, expected, actual, message) => {
    results.passed = false;
    results.failures.push({
      test,
      expected,
      actual,
      message
    });
  };

  // Test 1: Header Code Presence
  const hasHeaderCode = output.headerCode && output.headerCode.trim().length > 0;
  results.details.hasHeader = hasHeaderCode;
  
  if (expectations.header !== hasHeaderCode) {
    addFailure(
      'header',
      expectations.header,
      hasHeaderCode,
      `Expected header code to be ${expectations.header ? 'present' : 'absent'}`
    );
  }

  // Test 2: Footer Code Presence
  const hasFooterCode = output.footerCode && output.footerCode.trim().length > 0;
  results.details.hasFooter = hasFooterCode;
  
  if (expectations.footer !== hasFooterCode) {
    addFailure(
      'footer',
      expectations.footer,
      hasFooterCode,
      `Expected footer code to be ${expectations.footer ? 'present' : 'absent'}`
    );
  }

  // Test 3: Extended Descriptions
  const hasExtendedDescriptions = output.footerCode?.includes('/api/descriptions') || false;
  results.details.hasExtendedDescriptions = hasExtendedDescriptions;
  
  if (expectations.hasExtendedDescriptions !== hasExtendedDescriptions) {
    addFailure(
      'extendedDescriptions',
      expectations.hasExtendedDescriptions,
      hasExtendedDescriptions,
      'Extended descriptions API call mismatch'
    );
  }

  // Test 4: Metadata Bar
  const hasMetadataBar = output.footerCode?.includes('/api/metadata') || false;
  results.details.hasMetadataBar = hasMetadataBar;
  
  if (expectations.hasMetadataBar !== hasMetadataBar) {
    addFailure(
      'metadataBar',
      expectations.hasMetadataBar,
      hasMetadataBar,
      'Metadata bar API call mismatch'
    );
  }

  // Test 5: Google Maps
  const hasGoogleMaps = output.footerCode?.includes('/api/map') || false;
  results.details.hasGoogleMaps = hasGoogleMaps;
  
  if (expectations.hasGoogleMaps !== hasGoogleMaps) {
    addFailure(
      'googleMaps',
      expectations.hasGoogleMaps,
      hasGoogleMaps,
      'Google Maps API call mismatch'
    );
  }

  // Test 6: Custom CSS
  // Check for any feature-specific CSS beyond basic container styles
  const hasFeatureCSS = output.headerCode?.includes('Action Button') || 
                        output.headerCode?.includes('Extended Descriptions') || 
                        output.headerCode?.includes('Metadata Bar') || 
                        output.headerCode?.includes('Google Maps') ||
                        output.headerCode?.includes('embedded-form') ||
                        output.headerCode?.includes('ghl-form') ||
                        config.enableEmbeddedForm || false;
  
  results.details.hasCustomCSS = hasFeatureCSS;
  
  if (expectations.hasCustomCSS !== hasFeatureCSS) {
    addFailure(
      'customCSS',
      expectations.hasCustomCSS,
      hasFeatureCSS,
      'Custom CSS inclusion mismatch'
    );
  }

  // Test 7: HTML Trigger (e.g., [Get Access] for popups)
  const htmlTrigger = extractHtmlTrigger(output);
  results.details.htmlTrigger = htmlTrigger;
  
  if (expectations.htmlTrigger !== htmlTrigger) {
    addFailure(
      'htmlTrigger',
      expectations.htmlTrigger,
      htmlTrigger,
      'HTML trigger content mismatch'
    );
  }

  // Test 8: Custom Field Name
  if (expectations.customField) {
    const hasCustomField = (output.headerCode + output.footerCode).includes(expectations.customField);
    results.details.hasCustomField = hasCustomField;
    
    if (!hasCustomField) {
      addFailure(
        'customField',
        true,
        false,
        `Custom field "${expectations.customField}" not found in generated code`
      );
    }
  }

  return results;
}

/**
 * Extracts HTML trigger content from generated code
 * @param {Object} output - Generated code output
 * @returns {string|null} Extracted trigger content or null
 */
function extractHtmlTrigger(output) {
  const combinedCode = (output.headerCode || '') + (output.footerCode || '');
  
  // Look for [Get Access] pattern
  const getAccessMatch = combinedCode.match(/\[Get Access\]/);
  if (getAccessMatch) {
    return '[Get Access]';
  }
  
  // Look for other trigger patterns
  const triggerPatterns = [
    /\[Download\]/,
    /\[Contact\]/,
    /\[Learn More\]/
  ];
  
  for (const pattern of triggerPatterns) {
    const match = combinedCode.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Validates feature-specific code generation
 * @param {Object} config - Wizard configuration
 * @param {Object} output - Generated code output
 * @returns {Object} Feature validation results
 */
function validateFeatureSpecificCode(config, output) {
  const results = {
    features: {},
    issues: []
  };

  // Extended Descriptions Feature
  if (config.showDescription) {
    const hasAPI = output.footerCode?.includes('/api/descriptions');
    const hasCSS = output.headerCode?.includes('.extended-description');
    
    results.features.extendedDescriptions = {
      hasAPI,
      hasCSS,
      complete: hasAPI && hasCSS
    };
    
    if (!hasAPI) {
      results.issues.push('Extended descriptions enabled but API call missing');
    }
    if (!hasCSS) {
      results.issues.push('Extended descriptions enabled but CSS styling missing');
    }
  }

  // Metadata Bar Feature
  if (config.showMetadata) {
    const hasAPI = output.footerCode?.includes('/api/metadata');
    const hasCSS = output.headerCode?.includes('.metadata-bar');
    
    results.features.metadataBar = {
      hasAPI,
      hasCSS,
      complete: hasAPI && hasCSS
    };
    
    if (!hasAPI) {
      results.issues.push('Metadata bar enabled but API call missing');
    }
    if (!hasCSS) {
      results.issues.push('Metadata bar enabled but CSS styling missing');
    }
  }

  // Google Maps Feature
  if (config.showMaps) {
    const hasAPI = output.footerCode?.includes('/api/map');
    const hasCSS = output.headerCode?.includes('.map-wrapper');
    
    results.features.googleMaps = {
      hasAPI,
      hasCSS,
      complete: hasAPI && hasCSS
    };
    
    if (!hasAPI) {
      results.issues.push('Google Maps enabled but API call missing');
    }
    if (!hasCSS) {
      results.issues.push('Google Maps enabled but CSS styling missing');
    }
  }

  return results;
}

/**
 * Validates code structure and syntax
 * @param {Object} output - Generated code output
 * @returns {Object} Structure validation results
 */
function validateCodeStructure(output) {
  const results = {
    valid: true,
    issues: []
  };

  // Check for balanced HTML tags in header
  if (output.headerCode) {
    const scriptTags = (output.headerCode.match(/<script>/g) || []).length;
    const scriptCloseTags = (output.headerCode.match(/<\/script>/g) || []).length;
    
    if (scriptTags !== scriptCloseTags) {
      results.valid = false;
      results.issues.push('Unbalanced <script> tags in header code');
    }
    
    const styleTags = (output.headerCode.match(/<style>/g) || []).length;
    const styleCloseTags = (output.headerCode.match(/<\/style>/g) || []).length;
    
    if (styleTags !== styleCloseTags) {
      results.valid = false;
      results.issues.push('Unbalanced <style> tags in header code');
    }
  }

  // Check for balanced HTML tags in footer
  if (output.footerCode) {
    const scriptTags = (output.footerCode.match(/<script>/g) || []).length;
    const scriptCloseTags = (output.footerCode.match(/<\/script>/g) || []).length;
    
    if (scriptTags !== scriptCloseTags) {
      results.valid = false;
      results.issues.push('Unbalanced <script> tags in footer code');
    }
  }

  // Check for common syntax issues
  const combinedCode = (output.headerCode || '') + (output.footerCode || '');
  
  // Check for unescaped quotes in JavaScript
  const jsStringRegex = /"[^"]*"/g;
  const jsStrings = combinedCode.match(jsStringRegex) || [];
  
  jsStrings.forEach((str, index) => {
    if (str.includes('\n') && !str.includes('\\n')) {
      results.valid = false;
      results.issues.push(`Potential unescaped newline in JavaScript string at position ${index}`);
    }
  });

  return results;
}

module.exports = {
  validateCodeOutput,
  validateFeatureSpecificCode,
  validateCodeStructure,
  extractHtmlTrigger
};