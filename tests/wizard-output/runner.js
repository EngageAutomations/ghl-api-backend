/**
 * Automated Code Generation Test Runner
 * Executes test cases and validates wizard output
 */

const fs = require('fs');
const path = require('path');
const { validateCodeOutput, validateFeatureSpecificCode, validateCodeStructure } = require('./utils/validateOutput');

// Mock the code generation function based on your actual implementation
function mockGenerateFinalIntegrationCode(config) {
  let headerCode = `<!-- GHL Directory Header Script -->
<script>
  (function() {
    window.GHLDirectory = window.GHLDirectory || {};
    window.GHLDirectory.customField = "${config.customFieldName}";
    
    window.GHLDirectory.getSlug = function() {
      const url = new URL(window.location.href);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      return pathSegments[pathSegments.length - 1] || null;
    };
    
    window.GHLDirectory.addParameter = function(url, key, value) {
      const separator = url.includes('?') ? '&' : '?';
      return \`\${url}\${separator}\${key}=\${value}\`;
    };
  })();
</script>`;

  let footerCode = `<!-- GHL Directory Footer Script -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const slug = window.GHLDirectory.getSlug();
    if (!slug) return;
    
    // Basic form tracking
    document.querySelectorAll('form').forEach(form => {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = window.GHLDirectory.customField;
      hiddenField.value = slug;
      form.appendChild(hiddenField);
    });`;

  // Only add extended descriptions code if enabled
  if (config.showDescription) {
    footerCode += `
    
    // Extended Descriptions Loading
    fetch('/api/descriptions?slug=' + encodeURIComponent(slug))
      .then(res => res.json())
      .then(data => {
        if (data.html && data.html.trim()) {
          const targetEl = document.querySelector('#description');
          if (targetEl) {
            const wrapper = document.createElement('div');
            wrapper.className = 'extended-description';
            wrapper.innerHTML = data.html;
            targetEl.insertAdjacentElement('afterend', wrapper);
          }
        }
      })
      .catch(error => console.error('Error loading extended description:', error));`;
      
    // Add CSS for extended descriptions
    headerCode += `
<style>
.extended-description {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-family: inherit;
  color: #333;
  line-height: 1.6;
}

.extended-description img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  display: block;
  margin: 15px 0;
}
</style>`;
  }

  // Only add metadata code if enabled
  if (config.showMetadata) {
    footerCode += `
    
    // Dynamic Metadata Loading
    fetch('/api/metadata?slug=' + encodeURIComponent(slug))
      .then(res => res.json())
      .then(data => {
        if (data.metadata && Array.isArray(data.metadata)) {
          const bar = document.createElement('div');
          bar.className = 'metadata-bar';
          
          data.metadata.forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'meta-item';
            
            const img = document.createElement('img');
            img.src = item.icon;
            img.alt = '';
            img.className = 'meta-icon';
            
            const label = document.createElement('span');
            label.className = 'meta-text';
            label.textContent = item.text;
            
            entry.appendChild(img);
            entry.appendChild(label);
            bar.appendChild(entry);
          });
          
          document.querySelector('#description')?.insertAdjacentElement('afterend', bar);
        }
      })
      .catch(error => console.error('Error loading metadata:', error));`;
      
    // Add CSS for metadata
    headerCode += `
<style>
.metadata-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16px;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #eaeaea;
  border-bottom: 1px solid #eaeaea;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  font-family: inherit;
}

.meta-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
  background-color: #f4f4f4;
  padding: 4px;
  border-radius: 4px;
}

.meta-text {
  font-weight: 500;
  white-space: nowrap;
}
</style>`;
  }

  // Only add maps code if enabled
  if (config.showMaps) {
    footerCode += `
    
    // Google Maps Loading
    fetch('/api/map?slug=' + encodeURIComponent(slug))
      .then(res => res.json())
      .then(data => {
        if (data.address) {
          const mapWrapper = document.createElement('div');
          mapWrapper.className = 'map-wrapper';
          mapWrapper.innerHTML = \`
            <iframe
              class="gmap-embed"
              width="100%"
              height="300"
              style="border:0; border-radius: 8px;"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=\${encodeURIComponent(data.address)}&output=embed">
            </iframe>
          \`;
          
          document.querySelector('.metadata-bar')?.insertAdjacentElement('afterend', mapWrapper);
        }
      })
      .catch(error => console.error('Error loading map:', error));`;
      
    // Add CSS for maps
    headerCode += `
<style>
.map-wrapper {
  margin-top: 30px;
  width: 100%;
  box-shadow: 0 0 12px rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;
}

.gmap-embed {
  width: 100%;
  height: 300px;
  border: none;
  display: block;
  border-radius: 8px;
}
</style>`;
  }

  // Handle action buttons and embedded forms
  if (config.enableActionButton && config.buttonType === 'popup') {
    footerCode += `
    
    // Popup form handling
    if (document.querySelector('[Get Access]')) {
      // Setup popup functionality
    }`;
  }

  // Handle embedded forms
  if (config.enableEmbeddedForm) {
    headerCode += `
<style>
.ghl-form-container {
  margin-top: 20px;
  width: 100%;
}

.ghl-form-wrapper iframe {
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 8px;
}
</style>`;
  }

  // Add button styling for action buttons
  if (config.enableActionButton) {
    headerCode += `
<style>
.ghl-action-button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #4f46e5;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.ghl-action-button:hover {
  background-color: #4338ca;
  transform: translateY(-1px);
}
</style>`;
  }

  footerCode += `
  });
</script>`;

  // Return empty strings for features that shouldn't generate code
  if (config.enableActionButton && (config.buttonType === 'url' || config.buttonType === 'download')) {
    return {
      headerCode: headerCode.includes('<style>') ? headerCode : '',
      footerCode: ''
    };
  }

  return { headerCode, footerCode };
}

/**
 * Runs all test cases and generates a report
 */
function runTests() {
  console.log('🚀 Starting Automated Code Generation Tests\n');
  
  // Load test cases
  const casesPath = path.join(__dirname, 'cases.json');
  const testCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  
  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];
  
  testCases.forEach((testCase, index) => {
    totalTests++;
    console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
    console.log(`   ${testCase.description}`);
    
    // Generate code using the mock function
    const output = mockGenerateFinalIntegrationCode(testCase.config);
    
    // Validate the output
    const validation = validateCodeOutput(testCase.config, output, testCase.expect);
    const featureValidation = validateFeatureSpecificCode(testCase.config, output);
    const structureValidation = validateCodeStructure(output);
    
    if (validation.passed && structureValidation.valid) {
      console.log(`   ✅ PASS`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL`);
      failedTests.push({
        testCase,
        validation,
        featureValidation,
        structureValidation
      });
      
      // Show failure details
      if (validation.failures.length > 0) {
        console.log(`   Validation failures:`);
        validation.failures.forEach(failure => {
          console.log(`     - ${failure.test}: Expected ${failure.expected}, got ${failure.actual}`);
          console.log(`       ${failure.message}`);
        });
      }
      
      if (!structureValidation.valid) {
        console.log(`   Structure issues:`);
        structureValidation.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
      
      if (featureValidation.issues.length > 0) {
        console.log(`   Feature issues:`);
        featureValidation.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    }
  });
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests.length} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests.length > 0) {
    console.log('\n🔍 FAILED TEST DETAILS:');
    failedTests.forEach((failed, index) => {
      console.log(`\n${index + 1}. ${failed.testCase.name}`);
      console.log(`   Config: ${JSON.stringify(failed.testCase.config, null, 2).substring(0, 200)}...`);
      console.log(`   Issues: ${failed.validation.failures.length + failed.structureValidation.issues.length + failed.featureValidation.issues.length}`);
    });
  }
  
  console.log('\n🎯 Next Steps:');
  if (failedTests.length === 0) {
    console.log('   All tests passed! Your code generation is working correctly.');
  } else {
    console.log('   Review failed tests and update the code generation logic.');
    console.log('   Focus on the most critical failures first.');
  }
}

// Export for use in other modules
module.exports = {
  runTests,
  mockGenerateFinalIntegrationCode
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}