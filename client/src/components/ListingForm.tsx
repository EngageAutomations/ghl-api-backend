import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertListingSchema, type Listing, type InsertListing } from "@shared/schema";

const BUSINESS_CATEGORIES = [
  "Healthcare",
  "Home & Garden", 
  "Technology",
  "Health & Fitness",
  "Food & Beverage",
  "Education",
  "Finance",
  "Professional Services",
  "Entertainment",
  "Automotive",
  "Retail",
  "Real Estate",
  "Travel",
  "Manufacturing",
  "Other"
];

interface ListingFormProps {
  directoryName: string;
  listing?: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ListingForm({ directoryName, listing, onClose, onSuccess }: ListingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertListing>({
    resolver: zodResolver(insertListingSchema.extend({
      title: insertListingSchema.shape.title,
      slug: insertListingSchema.shape.slug,
    })),
    defaultValues: {
      title: listing?.title || "",
      slug: listing?.slug || "",
      directoryName: listing?.directoryName || directoryName,
      category: listing?.category || "",
      location: listing?.location || "",
      description: listing?.description || "",
      price: listing?.price || "",
      downloadUrl: listing?.downloadUrl || "",
      linkUrl: listing?.linkUrl || "",
      popupUrl: listing?.popupUrl || "",
      embedFormUrl: listing?.embedFormUrl || "",
      imageUrl: listing?.imageUrl || "",
      isActive: listing?.isActive ?? true,
      userId: 1, // This should come from user context
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertListing) => {
      if (listing) {
        return apiRequest(`/api/listings/${listing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        return apiRequest('/api/listings', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: listing ? "Listing updated" : "Listing created",
        description: listing 
          ? "The listing has been successfully updated."
          : "The listing has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertListing) => {
    mutation.mutate(data);
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    form.setValue('title', value);
    if (!listing) {
      const slug = generateSlug(value);
      form.setValue('slug', slug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
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
                        <Input {...field} value={field.value || ""} placeholder="auto-generated-from-title" />
                      </FormControl>
                      <FormDescription>
                        This creates the URL for your listing. Auto-generated from title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BUSINESS_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Input {...field} value={field.value || ""} placeholder="City, State" />
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
                          value={field.value || ""} 
                          placeholder="Describe your listing"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="$99.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://example.com/image.jpg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Action Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="popupUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Popup Form URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="GoHighLevel form URL for popup" />
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
                        <Input {...field} value={field.value || ""} placeholder="https://example.com" />
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
                        <Input {...field} value={field.value || ""} placeholder="https://example.com/file.pdf" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Embedded Form</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="embedFormUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Embedded Form URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="GoHighLevel embed form URL" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Listing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <FormDescription>
                          Make this listing visible to visitors
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

                <FormField
                  control={form.control}
                  name="directoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Directory</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} readOnly disabled />
                      </FormControl>
                      <FormDescription>
                        This listing belongs to the "{directoryName}" directory
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending 
              ? (listing ? "Updating..." : "Creating...") 
              : (listing ? "Update Listing" : "Create Listing")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}