/**
 * React hook for creating products in GoHighLevel via Railway proxy
 */
import { useMutation } from '@tanstack/react-query';
import { createProduct, attachGallery } from '@/lib/ghlProducts';

export const useCreateProduct = (locationId: string) =>
  useMutation({
    mutationFn: async ({ formValues, urls }: { formValues: any; urls: string[] }) => {
      const [thumb, ...gallery] = urls;
      const product = await createProduct(locationId, { ...formValues, imageUrl: thumb });
      if (gallery.length) await attachGallery(locationId, product.id, gallery);
      return product;
    },
  });