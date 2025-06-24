// React hooks for Railway v1.4.3 API integration
import { useMutation } from '@tanstack/react-query';
import { uploadMedia, createProduct, type GhlUpload, type CreateProductBody } from '@/lib/railwayAPI';

export function useUploadMedia(locationId: string) {
  return useMutation({
    mutationFn: async (files: File[]) => {
      return await uploadMedia(locationId, files);
    },
    onError: (error: any) => {
      console.error('Media upload failed:', error);
      if (error.response?.status === 401) {
        sessionStorage.removeItem('jwt');
        throw new Error('Authentication expired. Please refresh the page.');
      }
      if (error.response?.status === 413) {
        throw new Error('File too large. Please use images under 25MB.');
      }
      throw new Error('Upload failed. Please try again.');
    }
  });
}

export function useCreateProduct(locationId: string) {
  return useMutation({
    mutationFn: async (body: CreateProductBody) => {
      return await createProduct(locationId, body);
    },
    onError: (error: any) => {
      console.error('Product creation failed:', error);
      if (error.response?.status === 401) {
        sessionStorage.removeItem('jwt');
        throw new Error('Authentication expired. Please refresh the page.');
      }
      if (error.response?.status === 404) {
        throw new Error('Location not found. Please reconnect the app in GoHighLevel.');
      }
      throw new Error('Product creation failed. Please try again.');
    }
  });
}

// Combined workflow hook
export function useProductWorkflow(locationId: string) {
  const uploadMutation = useUploadMedia(locationId);
  const createMutation = useCreateProduct(locationId);
  
  const createProductWithImages = async (productData: Omit<CreateProductBody, 'imageUrl'>, files: File[]) => {
    try {
      // Step 1: Upload images
      const uploads = files.length > 0 ? await uploadMutation.mutateAsync(files) : [];
      
      // Step 2: Create product with first image as thumbnail
      const product = await createMutation.mutateAsync({
        ...productData,
        imageUrl: uploads[0]?.fileUrl
      });
      
      return { product, uploads };
    } catch (error) {
      console.error('Product workflow failed:', error);
      throw error;
    }
  };
  
  return {
    createProductWithImages,
    isUploading: uploadMutation.isPending,
    isCreating: createMutation.isPending,
    isLoading: uploadMutation.isPending || createMutation.isPending
  };
}