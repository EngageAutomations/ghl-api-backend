import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const collectionFormSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100, 'Name must be 100 characters or less'),
  slug: z.string().min(1, 'URL slug is required').max(100, 'Slug must be 100 characters or less'),
  description: z.string().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  seoTitle: z.string().max(60, 'SEO title should be 60 characters or less').optional(),
  seoDescription: z.string().max(160, 'SEO description should be 160 characters or less').optional(),
  directoryName: z.string().min(1, 'Directory is required'),
  isActive: z.boolean().default(true),
  syncStatus: z.string().default('pending')
});

type CollectionFormData = z.infer<typeof collectionFormSchema>;

interface CreateCollectionFormProps {
  collection?: any;
  onSubmit: (data: CollectionFormData) => void;
  onCancel: () => void;
}

export default function CreateCollectionForm({ 
  collection, 
  onSubmit, 
  onCancel 
}: CreateCollectionFormProps) {
  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: collection?.name || '',
      slug: collection?.slug || '',
      description: collection?.description || '',
      imageUrl: collection?.imageUrl || '',
      seoTitle: collection?.seoTitle || '',
      seoDescription: collection?.seoDescription || '',
      directoryName: collection?.directoryName || '',
      isActive: collection?.isActive ?? true,
      syncStatus: collection?.syncStatus || 'pending'
    }
  });

  // Fetch directories for selection
  const { data: directories = [] } = useQuery({
    queryKey: ['/api/designer-configs'],
    select: (data: any[]) => {
      const uniqueDirectories = Array.from(
        new Set(data.map(config => config.directoryName).filter(Boolean))
      );
      return uniqueDirectories.map(name => ({ name, value: name }));
    }
  });

  const handleSubmit = (data: CollectionFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Collection Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-left block">Collection Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter collection name..." 
                    {...field} 
                    className="text-left"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* URL Slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-left block">URL Slug</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., my-collection-slug" 
                    {...field} 
                    className="text-left"
                  />
                </FormControl>
                <FormDescription className="text-left">
                  URL-friendly version of the collection name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Directory Selection */}
          <FormField
            control={form.control}
            name="directoryName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-left block">Directory</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-left">
                      <SelectValue placeholder="Select directory..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {directories.map((directory: any) => (
                      <SelectItem key={directory.value} value={directory.value}>
                        {directory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image URL */}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-left block">Collection Image URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    {...field} 
                    className="text-left"
                    type="url"
                  />
                </FormControl>
                <FormDescription className="text-left">
                  Optional image to represent this collection
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-left block">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Optional description for this collection..."
                  rows={3}
                  {...field}
                  className="text-left"
                />
              </FormControl>
              <FormDescription className="text-left">
                Provide a brief description of what this collection contains
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 text-left">
                <FormLabel className="text-base">Active Collection</FormLabel>
                <FormDescription>
                  Active collections will be synced with GoHighLevel
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting 
              ? (collection ? 'Updating...' : 'Creating...') 
              : (collection ? 'Update Collection' : 'Create Collection')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}