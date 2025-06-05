import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Link as LinkIcon, Download, MousePointer } from 'lucide-react';
import { insertListingSchema, Listing, InsertListing } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ListingFormProps {
  directoryName: string;
  listing?: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
}

const actionTypes = [
  { value: 'popup', label: 'Popup Form', icon: MousePointer, description: 'Opens form in a popup overlay' },
  { value: 'link', label: 'External Link', icon: LinkIcon, description: 'Redirects to external URL' },
  { value: 'download', label: 'File Download', icon: Download, description: 'Downloads a file directly' },
];

export default function ListingForm({ directoryName, listing, onClose, onSuccess }: ListingFormProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(listing?.imageUrl || '');
  const [isDragOver, setIsDragOver] = useState(false);

  const form = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      userId: 1, // TODO: Get from auth context
      title: listing?.title || '',
      slug: listing?.slug || '',
      directoryName: directoryName,
      category: listing?.category || '',
      location: listing?.location || '',
      description: listing?.description || '',
      price: listing?.price || '',
      downloadUrl: listing?.downloadUrl || '',
      linkUrl: listing?.linkUrl || '',
      popupUrl: listing?.popupUrl || '',
      embedFormUrl: listing?.embedFormUrl || '',
      imageUrl: listing?.imageUrl || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertListing) => {
      const url = listing ? `/api/listings/${listing.id}` : '/api/listings';
      const method = listing ? 'PUT' : 'POST';
      return apiRequest(url, {
        method,
        data
      });
    },
    onSuccess: () => {
      toast({
        title: listing ? "Listing updated" : "Listing created",
        description: listing ? "Your listing has been updated successfully." : "Your new listing has been created.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setImageFile(imageFile);
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      form.setValue('imageUrl', url);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      form.setValue('imageUrl', url);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    form.setValue('title', title);
    if (!listing) {
      const slug = generateSlug(title);
      form.setValue('slug', slug);
    }
  };

  const onSubmit = (data: InsertListing) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDrop={handleImageDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                          form.setValue('imageUrl', '');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Drop an image here or click to upload</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>Choose Image</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Enter listing title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="url-friendly-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Services, Products" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City, State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="$99.00 or Contact for pricing" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your listing..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Configuration</CardTitle>
                <p className="text-sm text-gray-600">Configure what happens when users interact with this listing</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Action Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {actionTypes.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Card key={action.value} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <h3 className="font-medium">{action.label}</h3>
                          <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Action URLs */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="popupUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Popup Form URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="GoHighLevel form URL for popup" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Link URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="downloadUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Download File URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/file.pdf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="embedFormUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embedded Form URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="GoHighLevel embed form URL" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createMutation.isPending 
              ? (listing ? "Updating..." : "Creating...") 
              : (listing ? "Update Listing" : "Create Listing")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}