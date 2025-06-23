/**
 * React Hook for Product Creation
 * Manages the complete product creation workflow with Railway proxy
 */

import { useMutation } from '@tanstack/react-query';
import { createProductWithImages } from '@/lib/railwayAPI';
import { useToast } from '@/hooks/use-toast';

interface CreateProductData {
  name: string;
  description: string;
  price: string;
  productType: 'PHYSICAL' | 'DIGITAL';
  images: File[];
  locationId: string;
}

export function useCreateProduct() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const result = await createProductWithImages(
        data.locationId,
        {
          name: data.name,
          description: data.description,
          price: data.price,
          productType: data.productType
        },
        data.images
      );
      
      return {
        product: result.product,
        imageUrls: result.imageUrls,
        totalImages: result.imageUrls.length
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Product Created Successfully",
        description: `${result.product.name} has been added to GoHighLevel with ${result.totalImages} images`,
      });
    },
    onError: (error: any) => {
      console.error('Product creation failed:', error);
      
      let errorMessage = "There was an error creating the product";
      
      // Handle specific Railway proxy errors
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid product data";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed - please try again";
      } else if (error.response?.status === 404) {
        errorMessage = "Location not found - please check location ID";
      } else if (error.response?.status === 413) {
        errorMessage = "Image too large - max 25MB per image";
      } else if (error.response?.status === 429) {
        errorMessage = "Rate limited - please wait and try again";
      }
      
      toast({
        title: "Product Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}