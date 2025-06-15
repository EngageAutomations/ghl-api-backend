import { GoHighLevelAPI, GHLProduct, GHLPrice } from './ghl-api';

interface PricingData {
  type: 'one-time' | 'recurring';
  amount: string;
  compareAtPrice?: string;
  billingPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trialPeriod?: number;
  numberOfPayments?: number;
  setupFee?: string;
}

interface ProductVariantsData {
  options: Array<{
    name: string;
    values: string[];
  }>;
  trackInventory: boolean;
  continueSellingWhenOutOfStock: boolean;
  combinations: Array<{
    id: string;
    combination: Record<string, string>;
    price: string;
    compareAtPrice: string;
    quantity: number;
    enabled: boolean;
  }>;
}

interface InventoryData {
  trackInventory: boolean;
  currentStock: number;
  lowStockThreshold: number;
  continueSellingWhenOutOfStock: boolean;
  allowBackorders: boolean;
  sku: string;
  barcode: string;
  weight: string;
  weightUnit: 'lb' | 'kg' | 'oz' | 'g';
  requiresShipping: boolean;
}

interface FormSubmissionData {
  [key: string]: any;
  // Common product fields
  product_name?: string;
  product_description?: string;
  product_image?: string;
  // E-commerce specialized fields
  pricing_config?: string; // JSON string
  product_variants?: string; // JSON string
  inventory_management?: string; // JSON string
}

export class GHLProductCreator {
  private ghlAPI: GoHighLevelAPI;

  constructor() {
    this.ghlAPI = new GoHighLevelAPI();
  }

  async createProductFromSubmission(
    formSubmission: FormSubmissionData,
    locationId: string,
    accessToken: string
  ): Promise<{ product: GHLProduct; prices: GHLPrice[]; success: boolean; errors: string[] }> {
    const errors: string[] = [];
    let product: GHLProduct | null = null;
    const prices: GHLPrice[] = [];

    try {
      // Parse e-commerce field data
      const pricingData = this.parsePricingData(formSubmission.pricing_config);
      const variantsData = this.parseVariantsData(formSubmission.product_variants);
      const inventoryData = this.parseInventoryData(formSubmission.inventory_management);

      // Create base product
      const productData = this.buildProductData(formSubmission, variantsData, inventoryData);
      product = await this.ghlAPI.createProduct(locationId, productData, accessToken);

      // Create pricing structures
      if (pricingData && product) {
        const basePrice = await this.createBasePricing(
          locationId,
          product.id,
          pricingData,
          accessToken
        );
        prices.push(basePrice);

        // Create variant-specific pricing if variants exist
        if (variantsData && variantsData.combinations.length > 0) {
          const variantPrices = await this.createVariantPricing(
            locationId,
            product.id,
            variantsData,
            pricingData,
            accessToken
          );
          prices.push(...variantPrices);
        }
      }

      // Include product in store by default
      if (product) {
        await this.ghlAPI.includeProductInStore(locationId, product.id, accessToken);
      }

      return {
        product: product!,
        prices,
        success: true,
        errors
      };

    } catch (error) {
      errors.push(`Product creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        product: product!,
        prices,
        success: false,
        errors
      };
    }
  }

  private parsePricingData(pricingJson?: string): PricingData | null {
    if (!pricingJson) return null;
    try {
      return JSON.parse(pricingJson) as PricingData;
    } catch {
      return null;
    }
  }

  private parseVariantsData(variantsJson?: string): ProductVariantsData | null {
    if (!variantsJson) return null;
    try {
      return JSON.parse(variantsJson) as ProductVariantsData;
    } catch {
      return null;
    }
  }

  private parseInventoryData(inventoryJson?: string): InventoryData | null {
    if (!inventoryJson) return null;
    try {
      return JSON.parse(inventoryJson) as InventoryData;
    } catch {
      return null;
    }
  }

  private buildProductData(
    submission: FormSubmissionData,
    variantsData: ProductVariantsData | null,
    inventoryData: InventoryData | null
  ): Omit<GHLProduct, 'id' | 'locationId' | 'createdAt' | 'updatedAt'> {
    // Convert weight unit to GHL format
    const convertWeightUnit = (unit: string): 'LB' | 'KG' => {
      if (unit === 'kg' || unit === 'g') return 'KG';
      return 'LB';
    };

    // Build variants array for GHL
    const variants = variantsData?.options.map(option => ({
      id: this.generateVariantId(option.name),
      name: option.name,
      values: option.values.filter(v => v.trim())
    })) || [];

    return {
      name: submission.product_name || 'Untitled Product',
      description: submission.product_description || '',
      image: submission.product_image || '',
      productType: 'PHYSICAL' as const,
      status: 'ACTIVE' as const,
      availableInStore: true,
      // Inventory management
      inventoryTracking: inventoryData?.trackInventory || false,
      allowOutOfStockPurchases: inventoryData?.continueSellingWhenOutOfStock || false,
      trackQuantity: inventoryData?.trackInventory || false,
      availableQuantity: inventoryData?.currentStock || 0,
      // Product identification
      sku: inventoryData?.sku || '',
      // Shipping
      requiresShipping: inventoryData?.requiresShipping !== false,
      weight: inventoryData?.weight ? parseFloat(inventoryData.weight) : undefined,
      weightUnit: inventoryData?.weightUnit ? convertWeightUnit(inventoryData.weightUnit) : undefined,
      // Variants
      variants: variants.length > 0 ? variants : undefined,
    };
  }

  private async createBasePricing(
    locationId: string,
    productId: string,
    pricingData: PricingData,
    accessToken: string
  ): Promise<GHLPrice> {
    const amount = this.parseAmount(pricingData.amount);
    const compareAtAmount = pricingData.compareAtPrice ? this.parseAmount(pricingData.compareAtPrice) : undefined;

    const priceData: Omit<GHLPrice, 'id' | 'productId' | 'createdAt' | 'updatedAt'> = {
      name: 'Base Price',
      currency: 'USD',
      amount,
      type: pricingData.type === 'recurring' ? 'RECURRING' : 'ONE_TIME',
      compareAtPrice: compareAtAmount,
    };

    // Add recurring configuration
    if (pricingData.type === 'recurring' && pricingData.billingPeriod) {
      priceData.recurring = {
        interval: this.convertBillingPeriod(pricingData.billingPeriod),
        intervalCount: 1,
      };
    }

    // Add trial configuration
    if (pricingData.trialPeriod && pricingData.trialPeriod > 0) {
      priceData.trial = {
        enabled: true,
        interval: 'DAY',
        intervalCount: pricingData.trialPeriod,
      };
    }

    // Add setup fee
    if (pricingData.setupFee) {
      const setupAmount = this.parseAmount(pricingData.setupFee);
      if (setupAmount > 0) {
        priceData.setup = {
          enabled: true,
          amount: setupAmount,
        };
      }
    }

    return await this.ghlAPI.createProductPrice(locationId, productId, priceData, accessToken);
  }

  private async createVariantPricing(
    locationId: string,
    productId: string,
    variantsData: ProductVariantsData,
    basePricing: PricingData,
    accessToken: string
  ): Promise<GHLPrice[]> {
    const prices: GHLPrice[] = [];

    for (const combination of variantsData.combinations) {
      if (!combination.enabled || !combination.price) continue;

      const amount = this.parseAmount(combination.price);
      const compareAtAmount = combination.compareAtPrice ? this.parseAmount(combination.compareAtPrice) : undefined;

      // Create variant name from combination
      const variantName = Object.entries(combination.combination)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' - ');

      const priceData: Omit<GHLPrice, 'id' | 'productId' | 'createdAt' | 'updatedAt'> = {
        name: variantName,
        currency: 'USD',
        amount,
        type: basePricing.type === 'recurring' ? 'RECURRING' : 'ONE_TIME',
        compareAtPrice: compareAtAmount,
      };

      // Copy recurring settings from base pricing
      if (basePricing.type === 'recurring' && basePricing.billingPeriod) {
        priceData.recurring = {
          interval: this.convertBillingPeriod(basePricing.billingPeriod),
          intervalCount: 1,
        };
      }

      // Copy trial settings from base pricing
      if (basePricing.trialPeriod && basePricing.trialPeriod > 0) {
        priceData.trial = {
          enabled: true,
          interval: 'DAY',
          intervalCount: basePricing.trialPeriod,
        };
      }

      try {
        const price = await this.ghlAPI.createProductPrice(locationId, productId, priceData, accessToken);
        prices.push(price);
      } catch (error) {
        console.error(`Failed to create variant price for ${variantName}:`, error);
      }
    }

    return prices;
  }

  private parseAmount(amountString: string): number {
    // Remove currency symbols and parse
    const cleaned = amountString.replace(/[$,\s]/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : Math.round(amount * 100); // Convert to cents
  }

  private convertBillingPeriod(period: string): 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' {
    switch (period.toLowerCase()) {
      case 'daily': return 'DAY';
      case 'weekly': return 'WEEK';
      case 'monthly': return 'MONTH';
      case 'yearly': return 'YEAR';
      default: return 'MONTH';
    }
  }

  private generateVariantId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  // Utility method to create product with error handling
  async createProductSafely(
    formSubmission: FormSubmissionData,
    locationId: string,
    accessToken: string
  ): Promise<{ success: boolean; productId?: string; errors: string[] }> {
    try {
      const result = await this.createProductFromSubmission(formSubmission, locationId, accessToken);
      
      if (result.success) {
        return {
          success: true,
          productId: result.product.id,
          errors: result.errors
        };
      } else {
        return {
          success: false,
          errors: result.errors
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Product creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

export const ghlProductCreator = new GHLProductCreator();