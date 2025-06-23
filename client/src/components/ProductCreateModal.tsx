import { useState } from 'react';
import { useUploadImages } from '@/hooks/useUploadImages';
import { useCreateProduct } from '@/hooks/useCreateProduct';
import { CheckCircle, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ProductCreateModalProps {
  locationId: string;
  onClose: () => void;
}

export function ProductCreateModal({ locationId, onClose }: ProductCreateModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    price: '',
    productType: 'DIGITAL'
  });
  const [phase, setPhase] = useState<'idle' | 'upload' | 'create' | 'gallery' | 'done' | 'error'>('idle');
  
  const { toast } = useToast();
  const uploadMut = useUploadImages(locationId);
  const createMut = useCreateProduct(locationId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 25MB limit`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type", 
          description: `${file.name} is not an image`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formValues.name || !formValues.description || files.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please provide name, description, and at least one image",
        variant: "destructive"
      });
      return;
    }

    try {
      setPhase('upload');
      const urls = await uploadMut.mutateAsync(files);
      
      setPhase('create');
      await createMut.mutateAsync({ formValues, urls });
      
      setPhase('done');
      toast({
        title: "Product Created Successfully",
        description: `${formValues.name} created with ${files.length} images`,
      });
      
      setTimeout(() => onClose(), 2000); // Auto-close after success
      
    } catch (error) {
      console.error('Product creation failed:', error);
      setPhase('error');
      toast({
        title: "Product Creation Failed", 
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    }
  };

  const spinning = phase === 'upload' || phase === 'create' || phase === 'gallery';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create GoHighLevel Product</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Product Name *</label>
            <Input
              value={formValues.name}
              onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
              placeholder="AI Robot Assistant Pro"
              disabled={spinning}
            />
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              value={formValues.description}
              onChange={(e) => setFormValues(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Advanced AI automation assistant..."
              rows={3}
              disabled={spinning}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Price</label>
            <Input
              type="number"
              value={formValues.price}
              onChange={(e) => setFormValues(prev => ({ ...prev, price: e.target.value }))}
              placeholder="797.00"
              disabled={spinning}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Product Images * (Max 10, 25MB each)</label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={spinning}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" asChild disabled={spinning}>
                  <span>Select Images</span>
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Upload up to 10 images (JPG, PNG, WebP)
              </p>
            </div>

            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={spinning}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase Status */}
          {phase !== 'idle' && phase !== 'error' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                {spinning && <Loader2 className="animate-spin h-4 w-4" />}
                {phase === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
                <span className="text-sm font-medium">
                  {phase === 'upload' && 'Uploading images...'}
                  {phase === 'create' && 'Creating product...'}
                  {phase === 'gallery' && 'Attaching gallery...'}
                  {phase === 'done' && 'Product created successfully!'}
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {phase === 'error' && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-600 text-sm">Failed to create product. Please retry.</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={spinning}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={spinning} className="flex items-center gap-2">
              {spinning && <Loader2 className="animate-spin h-4 w-4" />}
              {phase === 'done' && <CheckCircle className="h-4 w-4" />}
              {spinning ? 'Processing...' : 'Create Product'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}