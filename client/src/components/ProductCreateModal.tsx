/**
 * Enhanced Product Creation Modal with Railway Multi-API Integration
 */
import { useState, useEffect } from 'react';
import { useUploadImages } from '@/hooks/useUploadImages';
import { useCreateProduct } from '@/hooks/useCreateProduct';
import { CheckCircle, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/RichTextEditor';

interface ProductCreateModalProps {
  locationId: string;
  directoryName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProductCreateModal({ locationId, directoryName, onClose, onSuccess }: ProductCreateModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [formValues, setFormValues] = useState<any>({
    name: '',
    description: '',
    expanded_description: '',
    price: '',
    address: '',
    seo_title: '',
    seo_description: '',
    metadata_text_0: '',
    metadata_text_font: 'Arial'
  });
  const [phase, setPhase] = useState<'idle'|'upload'|'create'|'gallery'|'done'|'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { toast } = useToast();
  const uploadMut = useUploadImages(locationId);
  const createMut = useCreateProduct(locationId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file size and type
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 25MB limit`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 images
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formValues.name || !formValues.description || files.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please provide name, description, and at least one image",
        variant: "destructive",
      });
      return;
    }

    setPhase('upload');
    setErrorMessage('');
    
    try {
      // Phase 1: Upload images
      const urls = await uploadMut.mutateAsync(files);
      
      // Phase 2: Create product with first image as thumbnail
      setPhase('create');
      const productData = {
        ...formValues,
        imageUrl: urls[0],
        productType: 'DIGITAL',
        locationId
      };
      
      await createMut.mutateAsync({ formValues: productData, urls });
      
      // Phase 3: Success
      setPhase('done');
      
      toast({
        title: "Product Created Successfully",
        description: `${formValues.name} has been created in GoHighLevel with ${urls.length} images`,
      });
      
      // Auto-close after success
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
      
    } catch (error: any) {
      console.error('Product creation failed:', error);
      setPhase('error');
      setErrorMessage(error.message || 'Failed to create product. Please retry.');
      
      toast({
        title: "Product Creation Failed",
        description: error.message || 'Please check your connection and try again',
        variant: "destructive",
      });
    }
  };

  const spinning = phase === 'upload' || phase === 'create' || phase === 'gallery';
  const canSubmit = formValues.name && formValues.description && files.length > 0 && !spinning;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Product in {directoryName}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formValues.name}
              onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              value={formValues.price}
              onChange={(e) => setFormValues(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Enter price (optional)"
            />
          </div>

          {/* Basic Description */}
          <div>
            <Label htmlFor="description">Product Description *</Label>
            <Textarea
              id="description"
              value={formValues.description}
              onChange={(e) => setFormValues(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief product description"
              rows={3}
            />
          </div>

          {/* Detailed Description (Rich Text) */}
          <div>
            <Label htmlFor="expanded_description">Detailed Description</Label>
            <RichTextEditor
              value={formValues.expanded_description}
              onChange={(content) => setFormValues(prev => ({ ...prev, expanded_description: content }))}
              placeholder="Detailed product information with rich formatting..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Product Images * (Max 10, 25MB each)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload images</span>
              </label>
            </div>
            
            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{files.length} image(s) selected</p>
              </div>
            )}
          </div>

          {/* Address for Maps */}
          <div>
            <Label htmlFor="address">Map Embed Address (Google)</Label>
            <Input
              id="address"
              value={formValues.address}
              onChange={(e) => setFormValues(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St, City, State"
            />
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formValues.seo_title}
                onChange={(e) => setFormValues(prev => ({ ...prev, seo_title: e.target.value }))}
                placeholder="SEO optimized title"
              />
            </div>
            <div>
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formValues.seo_description}
                onChange={(e) => setFormValues(prev => ({ ...prev, seo_description: e.target.value }))}
                placeholder="Brief SEO description"
                rows={2}
              />
            </div>
          </div>

          {/* Status Messages */}
          {phase === 'upload' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-blue-700 text-sm">Uploading images to GoHighLevel...</p>
            </div>
          )}
          
          {phase === 'create' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-blue-700 text-sm">Creating product in GoHighLevel...</p>
            </div>
          )}
          
          {phase === 'done' && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-green-700 text-sm">Product created successfully! Closing...</p>
            </div>
          )}

          {phase === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={spinning}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit} 
            className="flex items-center gap-2"
          >
            {spinning && <Loader2 className="animate-spin h-4 w-4" />}
            {phase === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {spinning ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>
    </div>
  );
}