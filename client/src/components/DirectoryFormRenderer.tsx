import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DirectoryFormRendererProps {
  directoryName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DirectoryFormRenderer({ 
  directoryName, 
  onSuccess, 
  onCancel 
}: DirectoryFormRendererProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBulletPoints, setIsGeneratingBulletPoints] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    seo_title: '',
    seo_description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-generate SEO fields when name or description changes
  useEffect(() => {
    if (formData.name && !formData.seo_title) {
      setFormData(prev => ({
        ...prev,
        seo_title: `${prev.name} - ${directoryName} Directory`
      }));
    }
  }, [formData.name, directoryName]);

  useEffect(() => {
    if (formData.description && !formData.seo_description) {
      const shortDesc = formData.description.substring(0, 150);
      setFormData(prev => ({
        ...prev,
        seo_description: shortDesc + (formData.description.length > 150 ? '...' : '')
      }));
    }
  }, [formData.description]);

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('/api/railway/media/upload', {
        method: 'POST',
        data: formData,
      });
      
      if (response.url) {
        setUploadedImages(prev => [...prev, response.url]);
        toast({
          title: "Image Uploaded",
          description: "Image uploaded to GoHighLevel Media Library successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  // Generate AI bullet points
  const generateBulletPoints = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the product name and description first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBulletPoints(true);
    try {
      const response = await apiRequest('/api/ai/generate-bullet-points', {
        method: 'POST',
        data: {
          name: formData.name,
          description: formData.description,
          directoryName
        }
      });

      if (response && Array.isArray(response)) {
        setBulletPoints(response);
        toast({
          title: "Bullet Points Generated",
          description: "AI-powered bullet points created successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate bullet points",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBulletPoints(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Product name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (uploadedImages.length === 0) newErrors.image = 'At least one image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const listingData = {
        directoryName,
        title: formData.name,
        description: formData.description,
        price: formData.price || '',
        imageUrl: uploadedImages[0] || '',
        images: uploadedImages,
        seoTitle: formData.seo_title,
        seoDescription: formData.seo_description,
        bulletPoints,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isActive: true
      };

      const response = await apiRequest('/api/listings', {
        method: 'POST',
        data: listingData
      });

      if (response) {
        toast({
          title: "Product Created",
          description: "Your product has been created successfully!",
        });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-2 shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Create GoHighLevel Product
              </h2>
              <p className="text-gray-600">
                Add a new product to your {directoryName} directory
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Product/Service Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Awesome Product"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  This will be displayed as the main title in the directory
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Product Image *
                </Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : errors.image 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isUploadingImage ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-blue-600">Uploading to GoHighLevel...</span>
                    </div>
                  ) : uploadedImages.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span>Image uploaded successfully!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {uploadedImages.map((url, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={url} 
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Drop your image here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Upload to GoHighLevel Media Library
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="text-sm text-red-600">{errors.image}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Product Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product or service..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  Provide a detailed description of your product or service
                </p>
              </div>

              {/* AI Bullet Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    AI-Generated Bullet Points
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateBulletPoints}
                    disabled={isGeneratingBulletPoints || !formData.name || !formData.description}
                    className="text-xs"
                  >
                    {isGeneratingBulletPoints ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                {bulletPoints.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="space-y-1">
                      {bulletPoints.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                  Price
                </Label>
                <Input
                  id="price"
                  type="text"
                  placeholder="$99.99"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Enter the price for your product or service
                </p>
              </div>

              {/* SEO Title */}
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="text-sm font-medium text-gray-700">
                  SEO Title
                </Label>
                <Input
                  id="seo_title"
                  type="text"
                  placeholder="SEO-optimized title for search engines"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Auto-fills from product name, customize for search optimization
                </p>
              </div>

              {/* SEO Description */}
              <div className="space-y-2">
                <Label htmlFor="seo_description" className="text-sm font-medium text-gray-700">
                  SEO Description
                </Label>
                <Textarea
                  id="seo_description"
                  placeholder="Brief description for search engines (150-160 characters)"
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Auto-fills from basic description, optimize for search results
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Product...
                    </>
                  ) : (
                    'Create GoHighLevel Product'
                  )}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}