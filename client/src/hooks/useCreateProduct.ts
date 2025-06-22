/**
 * React Hook for Product Creation
 * Manages the complete product creation workflow with images
 */

import { useMutation } from '@tanstack/react-query';
import { createProductWithImages } from '@/lib/ghlProducts';
import { ProductData } from '@/lib/ghlProducts';

interface CreateProductParams {
  formValues: ProductData;
  imageUrls: string[];
}

export const useCreateProduct = (locationId: string) =>
  useMutation({
    mutationFn: async ({ formValues, imageUrls }: CreateProductParams) => {
      return createProductWithImages(locationId, formValues, imageUrls);
    },
    onError: (error) => {
      console.error('Product creation failed:', error);
    },
  });