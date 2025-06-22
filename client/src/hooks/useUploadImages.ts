/**
 * React Hook for Image Upload Management
 * Provides mutation for uploading multiple images to GoHighLevel
 */

import { useMutation } from '@tanstack/react-query';
import { uploadImages } from '@/lib/ghlMedia';

export const useUploadImages = (locationId: string) =>
  useMutation({
    mutationFn: (files: File[]) => uploadImages(locationId, files),
    onError: (error) => {
      console.error('Image upload failed:', error);
    },
  });