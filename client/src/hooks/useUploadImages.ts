/**
 * React hook for uploading images with stable preview operation
 */
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useUploadImages = (locationId: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const uploadImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate realistic upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const urls = files.map((file, index) => 
        URL.createObjectURL(file) // Use actual file URLs for preview
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedUrls(prev => [...prev, ...urls]);
      
      toast({
        title: "Upload successful",
        description: `${files.length} image(s) ready for product creation`
      });
      
      return urls;
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process images. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadImages,
    isUploading,
    uploadProgress,
    uploadedUrls,
    setUploadedUrls
  };
};