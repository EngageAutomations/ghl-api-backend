/**
 * Dynamic Product Workflow Service
 * Handles product creation workflows based on wizard-generated form configurations
 */

import { productWorkflowService } from './product-workflow-service';
import { storage } from './storage';

interface WizardFormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

interface WizardConfig {
  showDescription: boolean;
  showMetadata: boolean;
  showMaps: boolean;
  showPrice: boolean;
  showQuantitySelector: boolean;
  integrationMethod: string;
  buttonText: string;
  buttonColor: string;
  directoryName: string;
  metadataFields?: string[];
  fieldName?: string;
  embedCode?: string;
  buttonType?: string;
}

interface DynamicWorkflowInput {
  installationId: string;
  directoryName: string;
  formData: Record<string, any>;
  imageFile?: Express.Multer.File;
}

interface FormMappingConfig {
  titleField: string;
  descriptionField: string;
  priceField: string;
  seoTitleField?: string;
  seoDescriptionField?: string;
  seoKeywordsField?: string;
}

export class DynamicWorkflowService {
  
  /**
   * Get wizard configuration for a directory
   */
  private async getWizardConfig(directoryName: string): Promise<WizardConfig | null> {
    try {
      const wizardTemplate = await storage.getWizardFormTemplateByDirectory(directoryName);
      
      if (!wizardTemplate?.wizardConfig) {
        console.log(`No wizard template found for directory: ${directoryName}`);
        return null;
      }
      
      return wizardTemplate.wizardConfig as WizardConfig;
    } catch (error) {
      console.error('Failed to get wizard config:', error);
      return null;
    }
  }

  /**
   * Generate form field mapping for GoHighLevel product creation
   * Only maps essential fields: title, price, description, SEO fields
   */
  private generateFieldMapping(wizardConfig: WizardConfig): FormMappingConfig {
    // Standard field mapping for GoHighLevel
    const mapping: FormMappingConfig = {
      titleField: 'name',           // Main product title
      descriptionField: 'description', // Product description
      priceField: 'price',          // Product price
      seoTitleField: 'seoTitle',    // SEO title (optional)
      seoDescriptionField: 'seoDescription', // SEO meta description (optional)
      seoKeywordsField: 'seoKeywords' // SEO keywords (optional)
    };

    // Customize field names based on wizard configuration
    if (wizardConfig.fieldName) {
      mapping.titleField = wizardConfig.fieldName;
    }

    // Handle different directory naming conventions
    const directoryType = wizardConfig.directoryName.toLowerCase();
    
    if (directoryType.includes('service')) {
      mapping.titleField = 'serviceName';
      mapping.descriptionField = 'serviceDescription';
    } else if (directoryType.includes('business')) {
      mapping.titleField = 'businessName';
      mapping.descriptionField = 'businessDescription';
    }

    return mapping;
  }

  /**
   * Extract GoHighLevel product data from form submission
   * Only extracts: title, description, price, SEO fields
   */
  private extractProductData(
    formData: Record<string, any>, 
    mapping: FormMappingConfig,
    wizardConfig: WizardConfig
  ) {
    // Extract title (required)
    const title = formData[mapping.titleField] || 
                  formData.name || 
                  formData.title;
    
    // Extract description (required)
    const description = formData[mapping.descriptionField] || 
                       formData.description;

    // Extract price (required)
    let priceAmount = formData[mapping.priceField] || 
                     formData.price;

    // Handle different price formats
    if (typeof priceAmount === 'string') {
      // Remove currency symbols and convert to number
      priceAmount = parseFloat(priceAmount.replace(/[$,€£¥]/g, ''));
    }

    // Extract optional SEO fields
    const seoTitle = formData[mapping.seoTitleField || ''] || formData.seoTitle;
    const seoDescription = formData[mapping.seoDescriptionField || ''] || formData.seoDescription;
    const seoKeywords = formData[mapping.seoKeywordsField || ''] || formData.seoKeywords;

    // Default to one-time product (GoHighLevel standard)
    const productType: 'one_time' | 'recurring' = 'one_time';

    return {
      product: {
        name: title,
        description: description,
        type: productType,
        // Add SEO fields if provided
        ...(seoTitle && { seoTitle }),
        ...(seoDescription && { seoDescription }),
        ...(seoKeywords && { seoKeywords })
      },
      price: {
        amount: Math.round((priceAmount || 0) * 100), // Convert to cents
        currency: 'USD', // Standard currency for GoHighLevel
        type: 'one_time' as const
      }
    };
  }

  /**
   * Validate required GoHighLevel fields
   */
  private validateFormData(
    formData: Record<string, any>, 
    mapping: FormMappingConfig,
    wizardConfig: WizardConfig
  ): string[] {
    const errors: string[] = [];

    // Check required title
    const title = formData[mapping.titleField] || formData.name || formData.title;
    if (!title) {
      errors.push(`Title is required (field: ${mapping.titleField})`);
    }

    // Check required description if enabled in wizard
    if (wizardConfig.showDescription) {
      const description = formData[mapping.descriptionField] || formData.description;
      if (!description) {
        errors.push(`Description is required (field: ${mapping.descriptionField})`);
      }
    }

    // Check required price if enabled in wizard
    if (wizardConfig.showPrice) {
      const price = formData[mapping.priceField] || formData.price;
      if (!price && price !== 0) {
        errors.push(`Price is required (field: ${mapping.priceField})`);
      }
    }

    return errors;
  }

  /**
   * Process dynamic workflow based on directory configuration
   */
  public async processDynamicWorkflow(input: DynamicWorkflowInput) {
    const { installationId, directoryName, formData, imageFile } = input;

    try {
      console.log(`🔧 Processing dynamic workflow for directory: ${directoryName}`);
      
      // Get wizard configuration
      const wizardConfig = await this.getWizardConfig(directoryName);
      if (!wizardConfig) {
        throw new Error(`No wizard configuration found for directory: ${directoryName}`);
      }

      console.log('📋 Wizard config loaded:', {
        directoryName,
        showDescription: wizardConfig.showDescription,
        showPrice: wizardConfig.showPrice,
        showMetadata: wizardConfig.showMetadata,
        fieldName: wizardConfig.fieldName
      });

      // Generate field mapping
      const fieldMapping = this.generateFieldMapping(wizardConfig);
      console.log('🗺️ Field mapping generated:', fieldMapping);

      // Validate form data
      const validationErrors = this.validateFormData(formData, fieldMapping, wizardConfig);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Extract product data
      const { product, price } = this.extractProductData(formData, fieldMapping, wizardConfig);
      console.log('📦 Product data extracted:', { product, price });

      // Validate image file if required
      if (!imageFile && wizardConfig.showMetadata) {
        throw new Error('Image file is required for this directory configuration');
      }

      // Process the workflow using the standard service
      if (imageFile) {
        const result = await productWorkflowService.createCompleteProduct(
          installationId,
          imageFile.path,
          product,
          price
        );

        return {
          ...result,
          directoryName,
          wizardConfig: {
            showDescription: wizardConfig.showDescription,
            showPrice: wizardConfig.showPrice,
            showMetadata: wizardConfig.showMetadata
          },
          fieldMapping,
          extractedData: { product, price }
        };
      } else {
        // Handle workflow without image upload
        throw new Error('Image file is required for product creation workflow');
      }

    } catch (error: any) {
      console.error('❌ Dynamic workflow failed:', error.message);
      return {
        success: false,
        error: error.message,
        directoryName,
        steps: {
          imageUpload: { success: false, error: 'Workflow not started' },
          productCreation: { success: false, error: 'Workflow not started' },
          imageAttachment: { success: false, error: 'Workflow not started' },
          priceCreation: { success: false, error: 'Workflow not started' }
        }
      };
    }
  }

  /**
   * Get example form structure for a directory
   */
  public async getDirectoryFormExample(directoryName: string) {
    try {
      const wizardConfig = await this.getWizardConfig(directoryName);
      if (!wizardConfig) {
        return {
          error: `No wizard configuration found for directory: ${directoryName}`,
          suggestion: 'Create a directory configuration first using the wizard'
        };
      }

      const fieldMapping = this.generateFieldMapping(wizardConfig);
      
      const exampleForm = {
        directoryName,
        requiredFields: [],
        optionalFields: [],
        fieldMapping,
        wizardConfig: {
          showDescription: wizardConfig.showDescription,
          showPrice: wizardConfig.showPrice,
          showMetadata: wizardConfig.showMetadata,
          showMaps: wizardConfig.showMaps
        }
      };

      // Add required fields based on wizard config
      exampleForm.requiredFields.push(fieldMapping.titleField);
      
      if (wizardConfig.showDescription) {
        exampleForm.requiredFields.push(fieldMapping.descriptionField);
      }
      
      if (wizardConfig.showPrice) {
        exampleForm.requiredFields.push(fieldMapping.priceField);
      }

      // Add optional SEO fields
      if (fieldMapping.seoTitleField) {
        exampleForm.optionalFields.push(fieldMapping.seoTitleField);
      }
      if (fieldMapping.seoDescriptionField) {
        exampleForm.optionalFields.push(fieldMapping.seoDescriptionField);
      }
      if (fieldMapping.seoKeywordsField) {
        exampleForm.optionalFields.push(fieldMapping.seoKeywordsField);
      }

      if (wizardConfig.showMetadata) {
        exampleForm.requiredFields.push('image');
        if (wizardConfig.metadataFields) {
          exampleForm.optionalFields.push(...wizardConfig.metadataFields);
        }
      }

      return exampleForm;

    } catch (error: any) {
      return {
        error: error.message,
        directoryName
      };
    }
  }
}

export const dynamicWorkflowService = new DynamicWorkflowService();