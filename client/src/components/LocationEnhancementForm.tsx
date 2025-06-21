import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { validateLocationId, validateDirectoryName, ValidationErrors } from '@/utils/validators';
import { useLocationEnhancements } from '@/hooks/useLocationEnhancements';
import { useDebouncedCallback } from 'use-debounce';

const enhancementSchema = z.object({
  ghlLocationId: z.string().min(1, 'Location ID is required').refine(validateLocationId, ValidationErrors.INVALID_LOCATION_ID),
  directoryName: z.string().min(1, 'Directory name is required').refine(validateDirectoryName, ValidationErrors.INVALID_DIRECTORY_NAME),
  enhancementConfig: z.object({
    metadataBar: z.object({
      enabled: z.boolean(),
      fields: z.array(z.string()),
      theme: z.string()
    }),
    googleMaps: z.object({
      enabled: z.boolean(),
      position: z.string()
    }),
    expandedDescription: z.object({
      enabled: z.boolean(),
      layout: z.string()
    })
  })
});

type EnhancementFormData = z.infer<typeof enhancementSchema>;

interface LocationEnhancementFormProps {
  userId: number;
  onSuccess?: () => void;
  initialData?: Partial<EnhancementFormData>;
}

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
}

export const LocationEnhancementForm: React.FC<LocationEnhancementFormProps> = ({
  userId,
  onSuccess,
  initialData
}) => {
  const { toast } = useToast();
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationAccess, setLocationAccess] = useState<{ [key: string]: boolean }>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const { createEnhancement, updateEnhancement } = useLocationEnhancements();

  const form = useForm<EnhancementFormData>({
    resolver: zodResolver(enhancementSchema),
    defaultValues: {
      ghlLocationId: '',
      directoryName: '',
      enhancementConfig: {
        metadataBar: {
          enabled: false,
          fields: [],
          theme: 'default'
        },
        googleMaps: {
          enabled: false,
          position: 'sidebar'
        },
        expandedDescription: {
          enabled: false,
          layout: 'inline'
        }
      },
      ...initialData
    }
  });

  const { watch, setValue, formState: { errors, isValid } } = form;
  const watchedValues = watch();

  // Auto-save functionality with debouncing
  const debouncedSave = useDebouncedCallback(async (data: EnhancementFormData) => {
    if (!isValid) return;
    
    try {
      setIsAutoSaving(true);
      if (initialData?.ghlLocationId) {
        await updateEnhancement.mutateAsync({
          ghlLocationId: data.ghlLocationId,
          directoryName: data.directoryName,
          updates: { enhancementConfig: data.enhancementConfig }
        });
      } else {
        await createEnhancement.mutateAsync({
          ghlLocationId: data.ghlLocationId,
          directoryName: data.directoryName,
          userId,
          enhancementConfig: data.enhancementConfig,
          isActive: true
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, 3000);

  // Trigger auto-save when form values change
  useEffect(() => {
    if (isValid && watchedValues.ghlLocationId && watchedValues.directoryName) {
      debouncedSave(watchedValues);
    }
  }, [watchedValues, isValid, debouncedSave]);

  // Search locations with debouncing
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/support/locations?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setLocationSuggestions(data.locations || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search locations. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  }, 500);

  // Check location access
  const checkLocationAccess = async (locationId: string) => {
    if (!validateLocationId(locationId)) return;

    try {
      const response = await fetch(`/api/support/locations/${locationId}/ping`);
      const data = await response.json();
      setLocationAccess(prev => ({ ...prev, [locationId]: data.hasAccess }));
      
      if (!data.hasAccess) {
        toast({
          title: 'Access Denied',
          description: ValidationErrors.UNAUTHORIZED_LOCATION,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking location access:', error);
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setValue('ghlLocationId', suggestion.id);
    setShowSuggestions(false);
    checkLocationAccess(suggestion.id);
  };

  const handleSubmit = async (data: EnhancementFormData) => {
    try {
      if (initialData?.ghlLocationId) {
        await updateEnhancement.mutateAsync({
          ghlLocationId: data.ghlLocationId,
          directoryName: data.directoryName,
          updates: { enhancementConfig: data.enhancementConfig }
        });
        toast({
          title: 'Success',
          description: 'Location enhancement updated successfully'
        });
      } else {
        await createEnhancement.mutateAsync({
          ghlLocationId: data.ghlLocationId,
          directoryName: data.directoryName,
          userId,
          enhancementConfig: data.enhancementConfig,
          isActive: true
        });
        toast({
          title: 'Success',
          description: 'Location enhancement created successfully'
        });
      }
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save location enhancement. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Location Enhancement Configuration
          {isAutoSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Configure directory enhancements for specific GoHighLevel locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Location ID Field with Autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="locationId">GoHighLevel Location ID</Label>
            <div className="relative">
              <Input
                id="locationId"
                placeholder="Start typing location name..."
                value={watchedValues.ghlLocationId}
                onChange={(e) => {
                  setValue('ghlLocationId', e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className={errors.ghlLocationId ? 'border-red-500' : ''}
              />
              {isSearching && (
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
              {watchedValues.ghlLocationId && locationAccess[watchedValues.ghlLocationId] !== undefined && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {locationAccess[watchedValues.ghlLocationId] ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              )}
              
              {/* Location Suggestions Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleLocationSelect(suggestion)}
                    >
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-gray-600">{suggestion.address}</div>
                      <div className="text-xs text-gray-400 font-mono">{suggestion.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.ghlLocationId && (
              <Alert variant="destructive">
                <AlertDescription>{errors.ghlLocationId.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Directory Name Field */}
          <div className="space-y-2">
            <Label htmlFor="directoryName">Directory Name</Label>
            <Input
              id="directoryName"
              placeholder="contractors"
              value={watchedValues.directoryName}
              onChange={(e) => setValue('directoryName', e.target.value)}
              className={errors.directoryName ? 'border-red-500' : ''}
            />
            {errors.directoryName && (
              <Alert variant="destructive">
                <AlertDescription>{errors.directoryName.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Enhancement Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enhancement Settings</h3>
            
            {/* Metadata Bar */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Metadata Bar</CardTitle>
                  <Switch
                    checked={watchedValues.enhancementConfig.metadataBar.enabled}
                    onCheckedChange={(checked) => 
                      setValue('enhancementConfig.metadataBar.enabled', checked)
                    }
                  />
                </div>
              </CardHeader>
              {watchedValues.enhancementConfig.metadataBar.enabled && (
                <CardContent className="space-y-3">
                  <div>
                    <Label>Theme</Label>
                    <Select
                      value={watchedValues.enhancementConfig.metadataBar.theme}
                      onValueChange={(value) => setValue('enhancementConfig.metadataBar.theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Google Maps */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Google Maps Widget</CardTitle>
                  <Switch
                    checked={watchedValues.enhancementConfig.googleMaps.enabled}
                    onCheckedChange={(checked) => 
                      setValue('enhancementConfig.googleMaps.enabled', checked)
                    }
                  />
                </div>
              </CardHeader>
              {watchedValues.enhancementConfig.googleMaps.enabled && (
                <CardContent>
                  <div>
                    <Label>Position</Label>
                    <Select
                      value={watchedValues.enhancementConfig.googleMaps.position}
                      onValueChange={(value) => setValue('enhancementConfig.googleMaps.position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                        <SelectItem value="inline">Inline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Expanded Description */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Expanded Description</CardTitle>
                  <Switch
                    checked={watchedValues.enhancementConfig.expandedDescription.enabled}
                    onCheckedChange={(checked) => 
                      setValue('enhancementConfig.expandedDescription.enabled', checked)
                    }
                  />
                </div>
              </CardHeader>
              {watchedValues.enhancementConfig.expandedDescription.enabled && (
                <CardContent>
                  <div>
                    <Label>Layout</Label>
                    <Select
                      value={watchedValues.enhancementConfig.expandedDescription.layout}
                      onValueChange={(value) => setValue('enhancementConfig.expandedDescription.layout', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inline">Inline</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="modal">Modal</SelectItem>
                        <SelectItem value="accordion">Accordion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || createEnhancement.isPending || updateEnhancement.isPending}
            className="w-full"
          >
            {(createEnhancement.isPending || updateEnhancement.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData?.ghlLocationId ? 'Update Enhancement' : 'Save Enhancement'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};