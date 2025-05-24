/**
 * Form Validation Test Runner
 * Executes comprehensive form generation tests
 */

const fs = require('fs');
const path = require('path');
const { 
  validateFormPreview, 
  validateEmbedCode, 
  mockGenerateFormPreview, 
  mockGenerateEmbedCode 
} = require('./form-validator');

/**
 * Runs all form validation test cases
 */
function runFormTests() {
  console.log('🧪 FORM VALIDATION TEST SUITE\n');
  console.log('=====================================\n');

  // Load test cases
  const testCasesPath = path.join(__dirname, 'form-test-cases.json');
  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

  const results = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    details: []
  };

  testCases.forEach((testCase, index) => {
    console.log(`📋 Test ${index + 1}: ${testCase.name}`);
    console.log(`   ${testCase.description}`);

    try {
      // Generate form preview HTML
      const formPreviewHTML = mockGenerateFormPreview(testCase.config);
      
      // Generate embed code if applicable
      const embedCode = mockGenerateEmbedCode(testCase.config);

      // Run form preview validation
      const previewValidation = validateFormPreview(
        testCase.config, 
        formPreviewHTML, 
        testCase.expectations
      );

      // Run embed code validation if embed/popup features are enabled
      let embedValidation = { passed: true, failures: [], details: {} };
      if (testCase.config.enableEmbeddedForm || testCase.config.enableActionButton) {
        embedValidation = validateEmbedCode(
          testCase.config, 
          embedCode, 
          testCase.expectations
        );
      }

      // Combine validation results
      const overallPassed = previewValidation.passed && embedValidation.passed;
      const allFailures = [...previewValidation.failures, ...embedValidation.failures];

      if (overallPassed) {
        console.log('   ✅ PASS\n');
        results.passed++;
      } else {
        console.log('   ❌ FAIL');
        console.log('   Validation errors:', allFailures.map(f => `${f.test}: Expected ${f.expected}, got ${f.actual}`));
        console.log('');
        results.failed++;
      }

      // Store detailed results
      results.details.push({
        testCase: testCase.name,
        id: testCase.id,
        passed: overallPassed,
        previewValidation,
        embedValidation,
        generatedFormHTML: formPreviewHTML,
        generatedEmbedCode: embedCode
      });

    } catch (error) {
      console.log('   ❌ FAIL');
      console.log('   Error:', error.message);
      console.log('');
      results.failed++;

      results.details.push({
        testCase: testCase.name,
        id: testCase.id,
        passed: false,
        error: error.message
      });
    }
  });

  // Summary
  console.log('=====================================');
  console.log('📊 FORM TEST SUMMARY');
  console.log('=====================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('');

  // Generate detailed report
  const reportPath = path.join(__dirname, `form-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  return results;
}

/**
 * Run individual form test case
 */
function runSingleFormTest(testId) {
  const testCasesPath = path.join(__dirname, 'form-test-cases.json');
  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  
  const testCase = testCases.find(tc => tc.id === testId);
  if (!testCase) {
    console.log(`❌ Test case '${testId}' not found`);
    return null;
  }

  console.log(`🧪 Running Form Test: ${testCase.name}\n`);

  try {
    const formPreviewHTML = mockGenerateFormPreview(testCase.config);
    const embedCode = mockGenerateEmbedCode(testCase.config);

    const previewValidation = validateFormPreview(
      testCase.config, 
      formPreviewHTML, 
      testCase.expectations
    );

    let embedValidation = { passed: true, failures: [], details: {} };
    if (testCase.config.enableEmbeddedForm || testCase.config.enableActionButton) {
      embedValidation = validateEmbedCode(
        testCase.config, 
        embedCode, 
        testCase.expectations
      );
    }

    const overallPassed = previewValidation.passed && embedValidation.passed;
    const allFailures = [...previewValidation.failures, ...embedValidation.failures];

    console.log('📋 Form Preview Validation:', previewValidation.passed ? '✅ PASS' : '❌ FAIL');
    if (!previewValidation.passed) {
      console.log('   Preview Failures:', previewValidation.failures);
    }

    console.log('📋 Embed Code Validation:', embedValidation.passed ? '✅ PASS' : '❌ FAIL');
    if (!embedValidation.passed) {
      console.log('   Embed Failures:', embedValidation.failures);
    }

    console.log('\n📄 Generated Form HTML:');
    console.log('---');
    console.log(formPreviewHTML);
    console.log('---');

    if (embedCode) {
      console.log('\n📄 Generated Embed Code:');
      console.log('---');
      console.log(embedCode);
      console.log('---');
    }

    return {
      passed: overallPassed,
      previewValidation,
      embedValidation,
      formPreviewHTML,
      embedCode
    };

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return { passed: false, error: error.message };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific test
    runSingleFormTest(args[0]);
  } else {
    // Run all tests
    runFormTests();
  }
}

module.exports = { runFormTests, runSingleFormTest };