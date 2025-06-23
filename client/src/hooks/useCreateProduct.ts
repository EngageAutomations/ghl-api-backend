import { useMutation } from '@tanstack/react-query';

interface CreateProductData {
  name: string;
  description: string;
  price: string;
  productType: 'DIGITAL' | 'PHYSICAL';
  images: File[];
  locationId: string;
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      // Step 1: Get JWT for Railway proxy authentication
      const authResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'product-creation' })
      });
      
      if (!authResponse.ok) {
        throw new Error('Failed to authenticate with Railway proxy');
      }
      
      const { jwt } = await authResponse.json();
      
      // Step 2: Upload images via Railway proxy (Railway handles GHL OAuth)
      const imageUploadPromises = data.images.map(async (image) => {
        const formData = new FormData();
        formData.append('file', image);
        
        const response = await fetch(`/api/ghl/locations/${data.locationId}/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.url;
        }
        return null;
      });
      
      const imageUrls = (await Promise.all(imageUploadPromises)).filter(Boolean);
      
      // Step 3: Create product via Railway proxy (Railway handles GHL OAuth)
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        productType: data.productType,
        availabilityType: 'AVAILABLE_NOW',
        image: imageUrls[0] || ''
      };
      
      const productResponse = await fetch(`/api/ghl/locations/${data.locationId}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.message || `HTTP ${productResponse.status}`);
      }
      
      const result = await productResponse.json();
      
      return {
        product: result.product || result,
        imageUrls,
        totalImages: imageUrls.length
      };
    },
  });
}