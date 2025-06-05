import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CreateListingFormProps {
  directoryName: string;
  directoryConfig: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateListingForm({ directoryName, directoryConfig, onSuccess, onCancel }: CreateListingFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    contactEmail: '',
    contactPhone: '',
    price: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const features = directoryConfig?.features || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest('/api/listings', {
        method: 'POST',
        data: {
          ...formData,
          directoryName,
          slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isActive: true,
        }
      });

      toast({
        title: "Success",
        description: "Listing created successfully!",
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Directory: {directoryName}</h4>
        <p className="text-sm text-blue-700">
          This form is configured based on your directory settings from the wizard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Always show basic fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Listing Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              placeholder="Enter listing title"
            />
          </div>

          {features.showDescription !== false && (
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your listing"
                rows={4}
              />
            </div>
          )}

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Conditional fields based on directory configuration */}
          {features.showPrice !== false && (
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="$50,000"
              />
            </div>
          )}

          {features.showMaps !== false && (
            <div>
              <Label htmlFor="location">Location/Address</Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
          )}
        </div>

        {/* Integration Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Button Preview</h4>
          <button
            type="button"
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: directoryConfig?.button?.color || '#3b82f6',
              color: directoryConfig?.button?.textColor || '#ffffff',
            }}
          >
            {directoryConfig?.button?.text || 'Get Info'}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This button will appear on your listing using your directory's style.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.title}>
            {isSubmitting ? 'Creating...' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}