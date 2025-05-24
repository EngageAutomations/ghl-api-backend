import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  config: any;
  issues?: string[];
  duration?: number;
}

/**
 * Run test suite and stream results
 */
export async function runTestSuite(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // Load test cases
    const testCasesPath = path.join(process.cwd(), 'tests/wizard-output/cases.json');
    const testCases = JSON.parse(await fs.readFile(testCasesPath, 'utf-8'));
    
    let passedTests = 0;
    let totalTests = testCases.length;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      // Send test start event
      res.write(JSON.stringify({
        type: 'test_start',
        testName: testCase.name
      }) + '\n');

      const startTime = Date.now();
      
      try {
        // Run individual test (simulate test execution)
        const result = await runSingleTest(testCase);
        const duration = Date.now() - startTime;
        
        if (result.status === 'pass') {
          passedTests++;
        }

        // Send test result
        res.write(JSON.stringify({
          type: 'test_result',
          result: { ...result, duration },
          progress: ((i + 1) / totalTests) * 100
        }) + '\n');

      } catch (error) {
        res.write(JSON.stringify({
          type: 'test_result',
          result: {
            name: testCase.name,
            description: testCase.description,
            status: 'fail',
            config: testCase.config,
            issues: [`Test execution failed: ${error.message}`],
            duration: Date.now() - startTime
          },
          progress: ((i + 1) / totalTests) * 100
        }) + '\n');
      }

      // Small delay for UI smoothness
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Send final summary
    res.write(JSON.stringify({
      type: 'summary',
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: Math.round((passedTests / totalTests) * 100)
      }
    }) + '\n');

  } catch (error) {
    res.write(JSON.stringify({
      type: 'error',
      message: error.message
    }) + '\n');
  }

  res.end();
}

/**
 * Validate generated output
 */
function validateOutput(generated: any, expected: any) {
  const errors: string[] = [];
  
  console.log('Validating output:', {
    hasHeaderCode: !!(generated.headerCode && generated.headerCode.trim()),
    hasFooterCode: !!(generated.footerCode && generated.footerCode.trim()),
    expected
  });
  
  // Check header code expectation
  if (expected.header !== undefined) {
    const hasHeader = !!(generated.headerCode && generated.headerCode.trim());
    if (expected.header !== hasHeader) {
      errors.push(`header: Expected ${expected.header}, got ${hasHeader}`);
    }
  }
  
  // Check footer code expectation
  if (expected.footer !== undefined) {
    const hasFooter = !!(generated.footerCode && generated.footerCode.trim());
    if (expected.footer !== hasFooter) {
      errors.push(`footer: Expected ${expected.footer}, got ${hasFooter}`);
    }
  }
  
  // Check other expectations
  if (expected.hasExtendedDescriptions !== undefined) {
    const hasDescriptions = generated.headerCode?.includes('Extended Descriptions') || false;
    if (expected.hasExtendedDescriptions !== hasDescriptions) {
      errors.push(`hasExtendedDescriptions: Expected ${expected.hasExtendedDescriptions}, got ${hasDescriptions}`);
    }
  }
  
  if (expected.hasMetadataBar !== undefined) {
    const hasMetadata = generated.headerCode?.includes('Metadata Bar') || false;
    if (expected.hasMetadataBar !== hasMetadata) {
      errors.push(`hasMetadataBar: Expected ${expected.hasMetadataBar}, got ${hasMetadata}`);
    }
  }
  
  if (expected.hasGoogleMaps !== undefined) {
    const hasMaps = generated.headerCode?.includes('Google Maps') || false;
    if (expected.hasGoogleMaps !== hasMaps) {
      errors.push(`hasGoogleMaps: Expected ${expected.hasGoogleMaps}, got ${hasMaps}`);
    }
  }
  
  if (expected.hasCustomCSS !== undefined) {
    // hasCustomCSS should be true if there are any style definitions beyond basic container
    const hasCustomCSS = generated.headerCode?.includes('Action Button') || 
                         generated.headerCode?.includes('Extended Descriptions') || 
                         generated.headerCode?.includes('Metadata Bar') || 
                         generated.headerCode?.includes('Google Maps') || false;
    if (expected.hasCustomCSS !== hasCustomCSS) {
      errors.push(`hasCustomCSS: Expected ${expected.hasCustomCSS}, got ${hasCustomCSS}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Run a single test case
 */
async function runSingleTest(testCase: any): Promise<TestResult> {
  try {
    console.log(`\n=== RUNNING TEST: ${testCase.name} ===`);
    console.log('Config:', JSON.stringify(testCase.config, null, 2));
    
    // Use the test runner logic directly
    const generated = mockGenerateFinalIntegrationCode(testCase.config);
    
    console.log('Generated output:');
    console.log('- Header present:', !!(generated.headerCode && generated.headerCode.trim()));
    console.log('- Footer present:', !!(generated.footerCode && generated.footerCode.trim()));
    console.log('- Header length:', generated.headerCode?.length || 0);
    console.log('- Footer length:', generated.footerCode?.length || 0);
    
    // Validate the output
    const validation = validateOutput(generated, testCase.expect);
    
    console.log('Validation errors:', validation.errors);
    console.log('Test result:', validation.isValid ? 'PASS' : 'FAIL');
    
    if (validation.isValid) {
      return {
        name: testCase.name,
        description: testCase.description,
        status: 'pass',
        config: testCase.config
      };
    } else {
      return {
        name: testCase.name,
        description: testCase.description,
        status: 'fail',
        config: testCase.config,
        issues: validation.errors
      };
    }
  } catch (error) {
    console.error(`Test execution error for ${testCase.name}:`, error);
    return {
      name: testCase.name,
      description: testCase.description,
      status: 'fail',
      config: testCase.config,
      issues: [`Execution error: ${error.message}`]
    };
  }
}

/**
 * Mock code generation (copied from test runner)
 */
function mockGenerateFinalIntegrationCode(config: any) {
  let headerCode = `
<style>
/* --- Go HighLevel Directory Integration Styles --- */
.ghl-directory-container {
    position: relative;
    max-width: 100%;
    margin: 0 auto;
}

.ghl-directory-content {
    padding: 1rem;
}`;

  let footerCode = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Initialize GHL Directory Integration
  window.GHLDirectory = window.GHLDirectory || {};
  window.GHLDirectory.customField = '${config.customFieldName || 'listing_id'}';
  
  // Get listing slug from URL
  const url = new URL(window.location.href);
  const slug = url.searchParams.get('listing') || url.searchParams.get('slug') || '';`;

  // Add feature-specific code based on configuration
  if (config.showDescription) {
    headerCode += `
    
/* --- Extended Descriptions Styling --- */
.extended-description {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    border: 1px solid #e9ecef;
}`;

    footerCode += `
    
    // Extended descriptions API call
    if (slug && document.querySelector('.extended-description-target')) {
      fetch('/api/listings/extended-description/' + slug)
        .then(response => response.json())
        .then(data => {
          if (data.description) {
            document.querySelector('.extended-description-target').innerHTML = data.description;
          }
        })
        .catch(error => console.error('Extended description error:', error));
    }`;
  }

  if (config.showMetadata) {
    headerCode += `
    
/* --- Metadata Bar Styling --- */
.metadata-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
    padding: 0.75rem;
    background-color: #f1f3f4;
    border-radius: 0.5rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.meta-icon {
    width: 1rem;
    height: 1rem;
    color: #6b7280;
}

.meta-text {
    color: #374151;
    font-weight: 500;
}`;

    footerCode += `
    
    // Metadata bar API call
    if (slug && document.querySelector('.metadata-bar-target')) {
      fetch('/api/listings/metadata/' + slug)
        .then(response => response.json())
        .then(data => {
          if (data.metadata && data.metadata.length > 0) {
            const metadataHtml = data.metadata.map(item => 
              '<div class="meta-item"><span class="meta-icon">' + item.icon + '</span><span class="meta-text">' + item.text + '</span></div>'
            ).join('');
            document.querySelector('.metadata-bar-target').innerHTML = metadataHtml;
          }
        })
        .catch(error => console.error('Metadata error:', error));
    }`;
  }

  if (config.showMaps) {
    headerCode += `
    
/* --- Google Maps Widget Styling --- */
.google-maps-widget {
    margin: 1rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    height: 300px;
}

.google-maps-widget iframe {
    width: 100%;
    height: 100%;
    border: 0;
}`;

    footerCode += `
    
    // Google Maps widget
    if (slug && document.querySelector('.google-maps-target')) {
      fetch('/api/listings/address/' + slug)
        .then(response => response.json())
        .then(data => {
          if (data.address) {
            const encodedAddress = encodeURIComponent(data.address);
            const mapHtml = '<iframe src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=' + encodedAddress + '" allowfullscreen></iframe>';
            document.querySelector('.google-maps-target').innerHTML = mapHtml;
          }
        })
        .catch(error => console.error('Maps error:', error));
    }`;
  }

  // Action button styling and functionality
  if (config.enableActionButton) {
    const buttonColor = config.buttonColor || "#4F46E5";
    const buttonTextColor = config.buttonTextColor || "#FFFFFF";
    const borderRadius = (config.buttonBorderRadius || 4) + "px";

    headerCode += `
    
/* --- Action Button Styling --- */
.ghl-action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: ${buttonColor};
    color: ${buttonTextColor};
    border-radius: ${borderRadius};
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    margin-top: 1rem;
    text-decoration: none;
}

.ghl-action-button:hover {
    opacity: 0.9;
}`;
  }

  // Add URL/Download button tracking
  if (config.enableActionButton && (config.buttonType === 'url' || config.buttonType === 'download')) {
    footerCode += `
    
    // Setup ${config.buttonType} button tracking
    document.querySelectorAll('.ghl-action-button').forEach(button => {
      button.addEventListener('click', function(e) {
        const baseUrl = this.getAttribute('data-${config.buttonType === 'url' ? 'url' : 'download-url'}');
        if (baseUrl && slug) {
          const trackedUrl = window.GHLDirectory.addParameter(baseUrl, window.GHLDirectory.customField, slug);
          if ('${config.buttonType}' === 'url') {
            window.open(trackedUrl, '_blank');
          } else {
            window.location.href = trackedUrl;
          }
          e.preventDefault();
        }
      });
    });`;
  }

  // Close styles
  headerCode += `
}
</style>`;

  footerCode += `
  });
</script>`;

  return { headerCode, footerCode };
}

/**
 * Validate generated output
 */
function validateOutput(generated: any, expected: any) {
  const errors: string[] = [];
  
  console.log('Validating output:', {
    hasHeaderCode: !!(generated.headerCode && generated.headerCode.trim()),
    hasFooterCode: !!(generated.footerCode && generated.footerCode.trim()),
    expected
  });
  
  // Check header code expectation
  if (expected.header !== undefined) {
    const hasHeader = !!(generated.headerCode && generated.headerCode.trim());
    if (expected.header !== hasHeader) {
      errors.push(`header: Expected ${expected.header}, got ${hasHeader}`);
    }
  }
  
  // Check footer code expectation
  if (expected.footer !== undefined) {
    const hasFooter = !!(generated.footerCode && generated.footerCode.trim());
    if (expected.footer !== hasFooter) {
      errors.push(`footer: Expected ${expected.footer}, got ${hasFooter}`);
    }
  }
  
  // Check other expectations
  if (expected.hasExtendedDescriptions !== undefined) {
    const hasDescriptions = generated.headerCode?.includes('Extended Descriptions') || false;
    if (expected.hasExtendedDescriptions !== hasDescriptions) {
      errors.push(`hasExtendedDescriptions: Expected ${expected.hasExtendedDescriptions}, got ${hasDescriptions}`);
    }
  }
  
  if (expected.hasMetadataBar !== undefined) {
    const hasMetadata = generated.headerCode?.includes('Metadata Bar') || false;
    if (expected.hasMetadataBar !== hasMetadata) {
      errors.push(`hasMetadataBar: Expected ${expected.hasMetadataBar}, got ${hasMetadata}`);
    }
  }
  
  if (expected.hasGoogleMaps !== undefined) {
    const hasMaps = generated.headerCode?.includes('Google Maps') || false;
    if (expected.hasGoogleMaps !== hasMaps) {
      errors.push(`hasGoogleMaps: Expected ${expected.hasGoogleMaps}, got ${hasMaps}`);
    }
  }
  
  if (expected.hasCustomCSS !== undefined) {
    // hasCustomCSS should be true if there are any style definitions beyond basic container
    const hasCustomCSS = generated.headerCode?.includes('Action Button') || 
                         generated.headerCode?.includes('Extended Descriptions') || 
                         generated.headerCode?.includes('Metadata Bar') || 
                         generated.headerCode?.includes('Google Maps') || false;
    if (expected.hasCustomCSS !== hasCustomCSS) {
      errors.push(`hasCustomCSS: Expected ${expected.hasCustomCSS}, got ${hasCustomCSS}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * AI-assisted code generation
 */
export async function generateCode(req: Request, res: Response) {
  try {
    const { feature, prompt, context } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please provide your OpenAI API key to use AI code generation.' 
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build context-aware prompt
    const systemPrompt = `You are an expert TypeScript/React developer working on a Go HighLevel marketplace extension wizard. 

Current context: ${context}
Feature to modify: ${feature}
User request: ${prompt}

Generate clean, production-ready TypeScript/React code that follows these patterns:
- Use shadcn/ui components
- Follow React hooks patterns
- Include proper TypeScript types
- Add helpful comments
- Ensure accessibility
- Use Tailwind CSS for styling

Provide only the code without explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate code for: ${prompt}` }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const generatedCode = completion.choices[0].message.content;

    res.json({ 
      code: generatedCode,
      feature,
      prompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate code',
      details: error.message 
    });
  }
}

/**
 * Get feature documentation
 */
export async function getFeatureDocumentation(req: Request, res: Response) {
  const { feature } = req.params;
  
  try {
    // Read relevant documentation files
    const docsPath = path.join(process.cwd(), 'docs');
    const files = await fs.readdir(docsPath);
    
    const documentation = {
      feature,
      files: [],
      examples: [],
      configuration: {}
    };

    // Look for relevant documentation
    for (const file of files) {
      if (file.includes(feature.toLowerCase().replace(/\s+/g, '-'))) {
        const content = await fs.readFile(path.join(docsPath, file), 'utf-8');
        documentation.files.push({
          name: file,
          content: content.substring(0, 1000) // First 1000 chars
        });
      }
    }

    res.json(documentation);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load documentation',
      details: error.message 
    });
  }
}

/**
 * Update configuration code
 */
export async function updateConfigurationCode(req: Request, res: Response) {
  const { feature, code, filePath } = req.body;
  
  try {
    // Validate file path for security
    if (!filePath.startsWith('client/src/') && !filePath.startsWith('server/')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const fullPath = path.join(process.cwd(), filePath);
    
    // Create backup
    const backupPath = `${fullPath}.backup.${Date.now()}`;
    const originalContent = await fs.readFile(fullPath, 'utf-8');
    await fs.writeFile(backupPath, originalContent);

    // Write new code
    await fs.writeFile(fullPath, code);

    res.json({ 
      success: true,
      message: `Updated ${feature} configuration`,
      backupPath: backupPath.replace(process.cwd(), '')
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update code',
      details: error.message 
    });
  }
}