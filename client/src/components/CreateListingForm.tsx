import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import RichTextEditor from '@/components/RichTextEditor';
import { Plus } from 'lucide-react';

interface CreateListingFormProps {
  directoryName: string;
  directoryConfig: any;
  onSuccess: () => void;
  onCancel: () => void;
  editingListing?: any;
  editingAddons?: any[];
}

export function CreateListingForm({ directoryName, directoryConfig, onSuccess, onCancel, editingListing, editingAddons }: CreateListingFormProps) {
  const isEditing = !!editingListing;
  
  const [formData, setFormData] = useState({
    title: editingListing?.title || '',
    description: editingListing?.description || '',
    imageUrl: editingListing?.imageUrl || '',
    price: editingListing?.price || '',
    location: editingListing?.location || '',
    slug: editingListing?.slug || '',
    userId: editingListing?.userId || 1,
    directoryName: directoryName,
    isActive: editingListing?.isActive ?? true,
  });
  
  // Separate state for extended fields that will be saved as addons
  const expandedDescriptionAddon = editingAddons?.find((addon: any) => addon.type === 'expanded_description');
  const metadataAddon = editingAddons?.find((addon: any) => addon.type === 'metadata_bar');
  
  const [expandedDescription, setExpandedDescription] = useState(expandedDescriptionAddon?.content || '');
  const [metadataFields, setMetadataFields] = useState(
    metadataAddon ? JSON.parse(metadataAddon.content || '[]') : [{ icon: '', text: '' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const features = directoryConfig?.features || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let listingId: number;
      
      if (isEditing) {
        // Update existing listing
        const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingData = { ...formData, slug, directoryName };
        
        await apiRequest(`/api/listings/id/${editingListing.id}`, {
          method: 'PATCH',
          data: listingData
        });
        
        listingId = editingListing.id;
      } else {
        // Create new listing
        const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingData = { ...formData, slug, directoryName };

        const response = await apiRequest('/api/listings', {
          method: 'POST',
          data: listingData
        });

        const responseData = await response.json();
        console.log('Listing creation response:', responseData);
        listingId = responseData.id;
        console.log('Created listing with ID:', listingId);
        
        if (!listingId) {
          throw new Error('Failed to get listing ID from response');
        }
      }
      
      if (features.showDescription && expandedDescription) {
        console.log('Creating expanded description addon for listing:', listingId);
        console.log('Expanded description content length:', expandedDescription.length);
        try {
          await apiRequest('/api/listing-addons', {
            method: 'POST',
            data: {
              listingId,
              type: 'expanded_description',
              title: 'Expanded Description',
              content: expandedDescription,
              enabled: true,
              displayOrder: 1,
            }
          });
          console.log('Expanded description addon created successfully');
        } catch (addonError) {
          console.error('Failed to create expanded description addon:', addonError);
          throw addonError;
        }
      }

      if (features.showMetadata && metadataFields.some(field => field.icon || field.text)) {
        await apiRequest('/api/listing-addons', {
          method: 'POST',
          data: {
            listingId,
            type: 'metadata_bar',
            title: 'Metadata Bar',
            content: JSON.stringify(metadataFields.filter(field => field.icon || field.text)),
            enabled: true,
            displayOrder: 2,
          }
        });
      }

      toast({
        title: "Success",
        description: "Listing created successfully!",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating listing:', error);
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

  const handleMetadataChange = (index: number, field: 'icon' | 'text', value: string) => {
    setMetadataFields(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addMetadataField = () => {
    if (metadataFields.length < 8) {
      setMetadataFields(prev => [...prev, { icon: '', text: '' }]);
    }
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
        {/* Form fields matching wizard preview exactly */}
        <div className="space-y-4">
          {/* 1. Listing Title - Always show */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 block text-left">Listing Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              placeholder="Enter listing title"
              className="mt-1"
            />
          </div>

          {/* 2. Listing Price - Show field or placeholder */}
          <div>
            <Label htmlFor="price" className="text-sm font-medium text-gray-700 block text-left">
              Listing Price {features.showPrice === false && <span className="text-xs text-gray-500">(Hidden from display)</span>}
            </Label>
            <Input
              id="price"
              type="text"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder={features.showPrice !== false ? "$50,000" : "$1 (placeholder value)"}
              className="mt-1"
              style={features.showPrice === false ? { backgroundColor: '#f9fafb', color: '#6b7280' } : {}}
            />
          </div>

          {/* 3. Basic Description with AI Summarizer */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 block text-left">Description</Label>
            <div className="mt-1 space-y-2">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your listing"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                🤖 Generate AI Bullet Points
              </Button>
            </div>
          </div>

          {/* 4. Expanded Description - If enabled */}
          {features.showDescription && (
            <div>
              <Label className="text-sm font-medium text-gray-700 block text-left">Expanded Description (Rich Text)</Label>
              <div className="mt-1">
                <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500">
                  <span>🎨 Rich Text Editor</span>
                  <span>•</span>
                  <span>Drag & Drop Images</span>
                  <span>•</span>
                  <span>Text Alignment</span>
                  <span>•</span>
                  <span>HTML Support</span>
                </div>
                <RichTextEditor
                  value={expandedDescription}
                  onChange={(value) => setExpandedDescription(value)}
                  placeholder="Enter rich content with drag & drop images and text alignment..."
                  className="w-full"
                  disabled={false}
                />
              </div>
            </div>
          )}

          {/* 5. Image URL */}
          <div>
            <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700 block text-left">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>

          {/* 6. Address for Google Maps - If enabled */}
          {features.showMaps && (
            <div>
              <Label htmlFor="location" className="text-sm font-medium text-gray-700 block text-left">Address for Google Maps</Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="123 Main St, City, State 12345"
                className="mt-1"
              />
            </div>
          )}

          {/* 7. Metadata Bar Fields - If enabled */}
          {features.showMetadata && (
            <div>
              <Label className="text-sm font-medium text-gray-700 block text-left">Metadata Bar Fields</Label>
              <div className="mt-1 space-y-3 border border-gray-300 rounded-md p-3 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2">Add up to 8 icon + text pairs (Default: 1 field)</div>
                
                {metadataFields.map((field, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="w-16">
                      <Label className="text-xs text-gray-600">Icon</Label>
                      <Input
                        value={field.icon}
                        onChange={(e) => handleMetadataChange(index, 'icon', e.target.value)}
                        placeholder="📞"
                        className="w-16 h-10 text-center text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">Display Text</Label>
                      <Input
                        value={field.text}
                        onChange={(e) => handleMetadataChange(index, 'text', e.target.value)}
                        placeholder="Contact information"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
                
                {metadataFields.length < 8 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addMetadataField}
                    className="text-xs w-full"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Additional Field (up to 8 total)
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>



        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.title}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Listing' : 'Create Listing')}
          </Button>
        </div>
      </form>
    </div>
  );
}