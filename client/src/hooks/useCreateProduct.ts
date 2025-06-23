import { useMutation } from '@tanstack/react-query';
import { createProduct, attachGallery } from '@/lib/ghlProducts';

interface CreateProductArgs {
  formValues: {
    name: string;
    description: string;
    price: string;
    productType: string;
  };
  urls: string[];
}

export const useCreateProduct = (locationId: string) =>
  useMutation({
    mutationFn: async ({ formValues, urls }: CreateProductArgs) => {
      const [thumb, ...gallery] = urls;
      
      // Create product with thumbnail image
      const productData = {
        ...formValues,
        price: formValues.price ? parseFloat(formValues.price) : undefined,
        imageUrl: thumb,
        availabilityType: 'AVAILABLE_NOW'
      };
      
      const product = await createProduct(locationId, productData);
      
      // Attach gallery images if more than one image
      if (gallery.length > 0) {
        await attachGallery(locationId, product.id, gallery);
      }
      
      return product;
    },
    onError: (error) => {
      console.error('Product creation failed:', error);
    }
  });