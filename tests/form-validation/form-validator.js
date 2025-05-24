/**
 * Form Preview and Generation Validation Framework
 * Tests form generation logic and validates output consistency
 */

/**
 * Validates form preview HTML output against configuration
 * @param {Object} config - Form configuration object
 * @param {string} formPreviewHTML - Generated form preview HTML
 * @param {Object} expectations - Expected validation results
 * @returns {Object} Validation result with pass/fail status and details
 */
function validateFormPreview(config, formPreviewHTML, expectations) {
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

  // Test 1: Name field validation
  const hasNameField = formPreviewHTML.includes('name="name"') && 
                       formPreviewHTML.includes('for="name"');
  results.details.hasNameField = hasNameField;
  
  if (expectations.hasNameField !== hasNameField) {
    addFailure(
      'nameField',
      expectations.hasNameField,
      hasNameField,
      'Name field presence mismatch'
    );
  }

  // Test 2: Email field validation
  const hasEmailField = formPreviewHTML.includes('name="email"') && 
                        formPreviewHTML.includes('type="email"');
  results.details.hasEmailField = hasEmailField;
  
  if (expectations.hasEmailField !== hasEmailField) {
    addFailure(
      'emailField',
      expectations.hasEmailField,
      hasEmailField,
      'Email field presence mismatch'
    );
  }

  // Test 3: Phone field validation
  const hasPhoneField = formPreviewHTML.includes('name="phone"') && 
                        formPreviewHTML.includes('type="tel"');
  results.details.hasPhoneField = hasPhoneField;
  
  if (expectations.hasPhoneField !== hasPhoneField) {
    addFailure(
      'phoneField',
      expectations.hasPhoneField,
      hasPhoneField,
      'Phone field presence mismatch'
    );
  }

  // Test 4: Company field validation
  const hasCompanyField = formPreviewHTML.includes('name="company"');
  results.details.hasCompanyField = hasCompanyField;
  
  if (expectations.hasCompanyField !== hasCompanyField) {
    addFailure(
      'companyField',
      expectations.hasCompanyField,
      hasCompanyField,
      'Company field presence mismatch'
    );
  }

  // Test 5: Address field validation
  const hasAddressField = formPreviewHTML.includes('name="address"');
  results.details.hasAddressField = hasAddressField;
  
  if (expectations.hasAddressField !== hasAddressField) {
    addFailure(
      'addressField',
      expectations.hasAddressField,
      hasAddressField,
      'Address field presence mismatch'
    );
  }

  // Test 6: Message field validation
  const hasMessageField = formPreviewHTML.includes('name="message"') && 
                          formPreviewHTML.includes('<textarea');
  results.details.hasMessageField = hasMessageField;
  
  if (expectations.hasMessageField !== hasMessageField) {
    addFailure(
      'messageField',
      expectations.hasMessageField,
      hasMessageField,
      'Message field presence mismatch'
    );
  }

  // Test 7: Hidden field validation
  const hasHiddenField = formPreviewHTML.includes('type="hidden"');
  results.details.hasHiddenField = hasHiddenField;
  
  if (expectations.hasHiddenField !== hasHiddenField) {
    addFailure(
      'hiddenField',
      expectations.hasHiddenField,
      hasHiddenField,
      'Hidden tracking field presence mismatch'
    );
  }

  // Test 8: Hidden field name validation
  if (expectations.hiddenFieldName && hasHiddenField) {
    const hiddenFieldNameRegex = new RegExp(`name="${expectations.hiddenFieldName}"`);
    const hasCorrectHiddenFieldName = hiddenFieldNameRegex.test(formPreviewHTML);
    results.details.hiddenFieldName = hasCorrectHiddenFieldName ? expectations.hiddenFieldName : 'incorrect';
    
    if (!hasCorrectHiddenFieldName) {
      addFailure(
        'hiddenFieldName',
        expectations.hiddenFieldName,
        'incorrect or missing',
        'Hidden field name does not match expected value'
      );
    }
  }

  // Test 9: Form method validation
  if (expectations.formMethod) {
    const formMethodRegex = new RegExp(`method="${expectations.formMethod}"`);
    const hasCorrectMethod = formMethodRegex.test(formPreviewHTML);
    results.details.formMethod = hasCorrectMethod ? expectations.formMethod : 'incorrect';
    
    if (!hasCorrectMethod) {
      addFailure(
        'formMethod',
        expectations.formMethod,
        'incorrect or missing',
        'Form method does not match expected value'
      );
    }
  }

  // Test 10: Form action validation
  if (expectations.formAction) {
    const hasCorrectAction = formPreviewHTML.includes(`action="${expectations.formAction}"`);
    results.details.formAction = hasCorrectAction ? expectations.formAction : 'incorrect';
    
    if (!hasCorrectAction) {
      addFailure(
        'formAction',
        expectations.formAction,
        'incorrect or missing',
        'Form action URL does not match expected value'
      );
    }
  }

  return results;
}

/**
 * Validates embedded form/popup configuration
 * @param {Object} config - Form configuration object
 * @param {string} generatedCode - Generated embed/popup code
 * @param {Object} expectations - Expected validation results
 * @returns {Object} Validation result with pass/fail status and details
 */
function validateEmbedCode(config, generatedCode, expectations) {
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

  // Test 1: Iframe presence for embedded forms
  if (expectations.hasIframe !== undefined) {
    const hasIframe = generatedCode.includes('<iframe');
    results.details.hasIframe = hasIframe;
    
    if (expectations.hasIframe !== hasIframe) {
      addFailure(
        'iframe',
        expectations.hasIframe,
        hasIframe,
        'Iframe presence mismatch for embedded form'
      );
    }
  }

  // Test 2: Button presence for popup forms
  if (expectations.hasButton !== undefined) {
    const hasButton = generatedCode.includes('<button') || generatedCode.includes('class="ghl-listing-button"');
    results.details.hasButton = hasButton;
    
    if (expectations.hasButton !== hasButton) {
      addFailure(
        'button',
        expectations.hasButton,
        hasButton,
        'Button presence mismatch for popup form'
      );
    }
  }

  // Test 3: JavaScript tracking validation
  if (expectations.hasJavaScriptTracking !== undefined) {
    const hasJSTracking = generatedCode.includes('getSlug()') && 
                         generatedCode.includes('addParameter');
    results.details.hasJavaScriptTracking = hasJSTracking;
    
    if (expectations.hasJavaScriptTracking !== hasJSTracking) {
      addFailure(
        'jsTracking',
        expectations.hasJavaScriptTracking,
        hasJSTracking,
        'JavaScript tracking code mismatch'
      );
    }
  }

  // Test 4: Parameter injection validation
  if (expectations.hasParameterInjection !== undefined) {
    const hasParamInjection = generatedCode.includes('addParameter') && 
                             generatedCode.includes(config.customFieldName);
    results.details.hasParameterInjection = hasParamInjection;
    
    if (expectations.hasParameterInjection !== hasParamInjection) {
      addFailure(
        'paramInjection',
        expectations.hasParameterInjection,
        hasParamInjection,
        'Parameter injection logic mismatch'
      );
    }
  }

  // Test 5: Button styling validation
  if (expectations.buttonColor && expectations.hasButton) {
    const hasCorrectColor = generatedCode.includes(expectations.buttonColor);
    results.details.buttonColor = hasCorrectColor ? expectations.buttonColor : 'incorrect';
    
    if (!hasCorrectColor) {
      addFailure(
        'buttonColor',
        expectations.buttonColor,
        'incorrect or missing',
        'Button color does not match expected value'
      );
    }
  }

  return results;
}

/**
 * Mock form preview generator for testing
 * (This should mirror the actual generateFormPreview function)
 */
function mockGenerateFormPreview(config) {
  // For embedded forms and popups, don't generate traditional form HTML
  if (config.enableEmbeddedForm || (config.enableActionButton && config.buttonType === 'popup')) {
    return mockGenerateEmbedCode(config);
  }
  
  let html = '<div class="ghl-custom-form-container">\n';
  html += `  <form id="ghl-directory-form" class="ghl-directory-form" action="${config.formEmbedUrl}" method="POST">\n`;
  
  // Hidden tracking field
  html += `    <input type="hidden" id="ghl-listing-field" name="${config.customFieldName}">\n`;
  
  // Form fields based on configuration
  if (config.formFields.name) {
    html += '    <div class="ghl-form-group">\n';
    html += '      <label for="name">Name</label>\n';
    html += '      <input type="text" id="name" name="name" required>\n';
    html += '    </div>\n';
  }
  
  if (config.formFields.email) {
    html += '    <div class="ghl-form-group">\n';
    html += '      <label for="email">Email</label>\n';
    html += '      <input type="email" id="email" name="email" required>\n';
    html += '    </div>\n';
  }
  
  if (config.formFields.phone) {
    html += '    <div class="ghl-form-group">\n';
    html += '      <label for="phone">Phone</label>\n';
    html += '      <input type="tel" id="phone" name="phone">\n';
    html += '    </div>\n';
  }
  
  if (config.formFields.company) {
    html += '    <div class="ghl-form-group">\n';
    html += '      <label for="company">Company</label>\n';
    html += '      <input type="text" id="company" name="company">\n';
    html += '    </div>\n';
  }
  
  if (config.formFields.address) {
    html += '    <div class="ghl-form-group">\n';
    html += '      <label for="address">Address</label>\n';
    html += '      <input type="text" id="address" name="address">\n';
    html += '    </div>\n';
  }
  
  if (config.formFields.message) {
    html += '    <div class="ghl-form-group">\n';
    html += '      <label for="message">Message</label>\n';
    html += '      <textarea id="message" name="message" rows="4"></textarea>\n';
    html += '    </div>\n';
  }
  
  html += '    <button type="submit" class="ghl-submit-button">Submit</button>\n';
  html += '  </form>\n';
  html += '</div>';
  
  return html;
}

/**
 * Mock embed code generator for testing
 */
function mockGenerateEmbedCode(config) {
  if (config.enableEmbeddedForm) {
    return `<div class="ghl-form-container">
  <div class="ghl-form-wrapper" data-form-type="embed">
    <iframe
      id="ghl-form-iframe"
      src=""
      width="100%"
      height="600px"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const slug = window.GHLDirectory.getSlug();
        const iframe = document.getElementById('ghl-form-iframe');
        let formUrl = '${config.formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${config.customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          iframe.src = formUrl;
        }
      });
    </script>
  </div>
</div>`;
  }
  
  if (config.enableActionButton && config.buttonType === 'popup') {
    return `<div class="ghl-form-container">
  <div class="ghl-form-wrapper" data-form-type="popup">
    <button class="ghl-listing-button" onclick="openGhlForm()" style="background-color: ${config.buttonColor}; color: ${config.buttonTextColor};">
      ${config.buttonLabel}
    </button>
    <script>
      function openGhlForm() {
        const slug = window.GHLDirectory.getSlug();
        let formUrl = '${config.formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${config.customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          window.open(formUrl, '_blank');
        }
      }
    </script>
  </div>
</div>`;
  }
  
  return '';
}

export {
  validateFormPreview,
  validateEmbedCode,
  mockGenerateFormPreview,
  mockGenerateEmbedCode
};