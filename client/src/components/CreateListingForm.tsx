import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import RichTextEditor from '@/components/RichTextEditor';
import { ImageUploadManager } from '@/components/ImageUploadManager';
import { Plus, Upload, X, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    downloadUrl: editingListing?.downloadUrl || '',
  });

  // SEO fields state - auto-filled but independently editable
  const [seoFields, setSeoFields] = useState({
    metaTitle: editingListing?.metaTitle || editingListing?.title || '',
    metaDescription: editingListing?.metaDescription || editingListing?.description || '',
    seoKeywords: editingListing?.seoKeywords || '',
  });
  
  // Separate state for extended fields that will be saved as addons
  const expandedDescriptionAddon = editingAddons?.find((addon: any) => addon.type === 'expanded_description');
  const metadataAddon = editingAddons?.find((addon: any) => addon.type === 'metadata_bar');
  
  const [expandedDescription, setExpandedDescription] = useState(expandedDescriptionAddon?.content || '');
  const [metadataFields, setMetadataFields] = useState(
    metadataAddon ? JSON.parse(metadataAddon.content || '[]') : [{ icon: '', text: '' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<Array<{url: string; mediaId: string; filename: string; size: number}>>(
    editingListing?.imageUrls ? editingListing.imageUrls.map((url: string, index: number) => ({
      url,
      mediaId: editingListing.ghlMediaIds?.[index] || '',
      filename: `image-${index + 1}`,
      size: 0
    })) : []
  );
  const { toast } = useToast();

  // Auto-fill SEO fields when title or description changes
  const autoFillSEO = (field: 'title' | 'description', value: string) => {
    setSeoFields(prev => {
      const updates: any = {};
      
      if (field === 'title' && !prev.metaTitle.trim()) {
        updates.metaTitle = value;
      }
      
      if (field === 'description' && !prev.metaDescription.trim()) {
        // Truncate description for meta description (ideal length 150-160 chars)
        const cleanDescription = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        updates.metaDescription = cleanDescription.length > 155 
          ? cleanDescription.substring(0, 152) + '...'
          : cleanDescription;
      }
      
      return { ...prev, ...updates };
    });
  };



  const features = directoryConfig?.features || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let listingId: number;
      let ghlProductId: string | null = null;
      
      if (isEditing) {
        // Update existing listing
        const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingData = { 
          ...formData, 
          slug, 
          directoryName,
          // Include SEO fields
          metaTitle: seoFields.metaTitle,
          metaDescription: seoFields.metaDescription,
          seoKeywords: seoFields.seoKeywords
        };
        
        await apiRequest(`/api/listings/id/${editingListing.id}`, {
          method: 'PATCH',
          data: listingData
        });
        
        listingId = editingListing.id;
      } else {
        // Initialize variables for GoHighLevel integration
        let ghlResult = null;
        
        // First, create GoHighLevel product if not editing
        try {
          console.log('Creating GoHighLevel product for listing...');
          const ghlProductData = {
            installationId: 'install_1750252333303', // Railway installation with automatic token management
            name: formData.title,
            description: formData.description || '',
            productType: 'DIGITAL', // Required: DIGITAL, PHYSICAL, SERVICE, PHYSICAL/DIGITAL
            
            // Price - always required for GoHighLevel store availability
            // Use $100 default when pricing is disabled, otherwise parse user input
            price: features.showPrice === false ? 100 : 
                   (formData.price ? parseFloat(formData.price.replace(/[^0-9.-]/g, '')) || 100 : 100)
          };

          // Call Railway backend endpoint directly for reliable token management
          const ghlResponse = await fetch('https://dir.engageautomations.com/api/ghl/products/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(ghlProductData)
          });

          ghlResult = await ghlResponse.json();
          if (ghlResult.success) {
            console.log('GoHighLevel product created via Railway backend');
            console.log('Location ID:', ghlResult.locationId);
            
            toast({
              title: "GoHighLevel Product Created",
              description: `Product "${formData.title}" created in your GoHighLevel account`,
            });
          } else {
            console.warn('GoHighLevel product creation failed:', ghlResult.message);
            // Continue with local listing creation even if GHL fails
          }
        } catch (ghlError) {
          console.warn('GoHighLevel integration error:', ghlError);
          // Continue with local listing creation even if GHL fails
        }

        // Create new local listing
        const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const listingData = { 
          ...formData, 
          slug, 
          directoryName,
          ghlProductId, // Link to GoHighLevel product if created
          ghlLocationId: ghlResult?.success ? ghlResult.locationId : undefined,
          // Include image arrays from Railway backend uploads
          imageUrls: images.map(img => img.url),
          ghlMediaIds: images.map(img => img.mediaId),
          // Include SEO fields
          metaTitle: seoFields.metaTitle,
          metaDescription: seoFields.metaDescription,
          seoKeywords: seoFields.seoKeywords
        };

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
        title: "Product Created Successfully",
        description: ghlProductId 
          ? "Product created in GoHighLevel and added to your directory!"
          : "Product added to your directory!",
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
    
    // Auto-fill SEO fields when title or description changes
    if (field === 'title' || field === 'description') {
      autoFillSEO(field as 'title' | 'description', value);
    }
  };

  const handleAISummarize = async () => {
    if (!formData.description.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await apiRequest('/api/ai/summarize', {
        method: 'POST',
        data: { text: formData.description }
      });
      
      const data = await response.json();
      const bulletPoints = data.bulletPoints.join('\n');
      
      setFormData(prev => ({
        ...prev,
        description: bulletPoints
      }));
      
      toast({
        title: "AI Summary Generated",
        description: "Your description has been converted to bullet points.",
      });
    } catch (error) {
      console.error('AI summarization error:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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

  // Set main image URL for backward compatibility when images are uploaded
  const updateMainImageUrl = (newImages: typeof images) => {
    if (newImages.length > 0) {
      setFormData(prev => ({ ...prev, imageUrl: newImages[0].url }));
    } else {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleImagesChange = (newImages: typeof images) => {
    setImages(newImages);
    updateMainImageUrl(newImages);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium text-blue-900">Directory: {directoryName}</h4>
          <span className="px-2 py-1 bg-white border border-blue-300 rounded text-xs text-blue-600">GoHighLevel Integration</span>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          This form is configured based on your directory settings from the wizard and will create both a GoHighLevel product and local listing.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-600">
          <span className="flex items-center gap-1">
            <span className={features.showPrice !== false ? "text-green-600" : "text-orange-600"}>●</span>
            {features.showPrice !== false ? "Price Display" : "Price Hidden (Default $100)"}
          </span>
          <span className="flex items-center gap-1">
            <span className={features.showDescription ? "text-green-600" : "text-gray-400"}>●</span>
            Rich Description
          </span>
          <span className="flex items-center gap-1">
            <span className={features.showMetadata ? "text-green-600" : "text-gray-400"}>●</span>
            Metadata Fields
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-600">●</span>
            Image Upload
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields matching wizard preview exactly */}
        <div className="space-y-4">
          {/* 1. Enhanced Image Upload - Multiple images with Railway backend integration */}
          <ImageUploadManager
            images={images}
            onImagesChange={handleImagesChange}
            maxImages={5}
            allowMultiple={true}
            label="Listing Images"
            className="space-y-3"
          />

          {/* 2. Title field */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 block text-left">
              Listing Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                autoFillSEO('title', e.target.value);
              }}
              required
              placeholder="Enter listing title"
              className="mt-1"
            />
          </div>

          {/* 3. Description field */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 block text-left">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                autoFillSEO('description', e.target.value);
              }}
              required
              placeholder="Enter listing description"
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* 3. Listing Price - Show field only when pricing is enabled, hide completely when disabled */}
          {features.showPrice !== false && (
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-700 block text-left">
                Listing Price
              </Label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="e.g., $99, Free, Contact for pricing"
                className="mt-1"
              />
            </div>
          )}

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
                onClick={handleAISummarize}
                disabled={!formData.description.trim() || isGenerating}
              >
                {isGenerating ? 'Generating...' : '🤖 Generate AI Bullet Points'}
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

          {/* 6. Download URL - If action button download is selected */}
          {directoryConfig?.integrationMethod === 'download' && (
            <div>
              <Label htmlFor="downloadUrl" className="text-sm font-medium text-gray-700 block text-left">Download URL</Label>
              <div className="mt-1 space-y-2">
                <Input
                  id="downloadUrl"
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) => handleInputChange('downloadUrl', e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or https://dropbox.com/s/..."
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Google Drive links automatically converted to direct downloads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Dropbox links automatically converted to direct downloads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span>Direct download URLs supported as-is</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. Address for Google Maps - If enabled */}
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

          {/* 9. Metadata Bar Fields - If enabled */}
          {features.showMetadata && (
            <div>
              <Label className="text-sm font-medium text-gray-700 block text-left">Metadata Bar Fields</Label>
              <div className="mt-1 space-y-3 border border-gray-300 rounded-md p-3 bg-gray-50">
                <div className="text-xs text-gray-500 mb-2">Add up to 8 icon + text pairs (Default: 1 field)</div>
                
                {metadataFields.map((field, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="w-16">
                      <Label className="text-xs text-gray-600">Icon</Label>
                      <div 
                        className="w-16 h-10 border border-gray-300 rounded bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const result = e.target?.result as string;
                                handleMetadataChange(index, 'icon', result);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {field.icon ? (
                          field.icon.startsWith('data:') ? (
                            <img src={field.icon} alt="Icon" className="w-6 h-6 object-contain" />
                          ) : (
                            <span className="text-lg">{field.icon}</span>
                          )
                        ) : (
                          <div className="text-xs text-gray-400 text-center">
                            <Upload className="w-4 h-4 mx-auto mb-1" />
                            Click
                          </div>
                        )}
                      </div>
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

        {/* SEO Fields Section - Always show */}
        <div className="border-t pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">SEO Settings</h3>
            <p className="text-sm text-gray-600">These fields help search engines understand your listing. They auto-fill from your title and description but can be edited independently.</p>
          </div>
          
          <div className="space-y-4">
            {/* Meta Title */}
            <div>
              <Label htmlFor="metaTitle" className="text-sm font-medium text-gray-700 block text-left">
                SEO Title
                <span className="text-xs text-gray-500 ml-2">(Appears in search results)</span>
              </Label>
              <Input
                id="metaTitle"
                type="text"
                value={seoFields.metaTitle}
                onChange={(e) => setSeoFields(prev => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="Enter SEO title (auto-filled from listing title)"
                className="mt-1"
                maxLength={60}
              />
              <div className="text-xs text-gray-500 mt-1">
                {seoFields.metaTitle.length}/60 characters
                {seoFields.metaTitle.length > 60 && <span className="text-red-500 ml-2">Too long for optimal SEO</span>}
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <Label htmlFor="metaDescription" className="text-sm font-medium text-gray-700 block text-left">
                SEO Description
                <span className="text-xs text-gray-500 ml-2">(Appears under title in search results)</span>
              </Label>
              <Textarea
                id="metaDescription"
                value={seoFields.metaDescription}
                onChange={(e) => setSeoFields(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="Enter SEO description (auto-filled from listing description)"
                className="mt-1"
                rows={3}
                maxLength={160}
              />
              <div className="text-xs text-gray-500 mt-1">
                {seoFields.metaDescription.length}/160 characters
                {seoFields.metaDescription.length > 160 && <span className="text-red-500 ml-2">Too long for optimal SEO</span>}
                {seoFields.metaDescription.length < 120 && seoFields.metaDescription.length > 0 && <span className="text-yellow-600 ml-2">Consider adding more detail</span>}
              </div>
            </div>

            {/* SEO Keywords */}
            <div>
              <Label htmlFor="seoKeywords" className="text-sm font-medium text-gray-700 block text-left">
                SEO Keywords
                <span className="text-xs text-gray-500 ml-2">(Comma-separated, helps with search relevance)</span>
              </Label>
              <Input
                id="seoKeywords"
                type="text"
                value={seoFields.seoKeywords}
                onChange={(e) => setSeoFields(prev => ({ ...prev, seoKeywords: e.target.value }))}
                placeholder="e.g. software, productivity, automation, business tools"
                className="mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">
                Separate keywords with commas. Focus on terms your customers would search for.
              </div>
            </div>
          </div>
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