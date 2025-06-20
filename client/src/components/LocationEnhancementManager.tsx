import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Map, BarChart3, FileText, Settings, Save, Plus, Trash2 } from "lucide-react";
import type { LocationEnhancement, InsertLocationEnhancement } from "@shared/schema";

interface LocationEnhancementManagerProps {
  ghlLocationId: string;
  directoryName: string;
  userId: number;
}

export function LocationEnhancementManager({ 
  ghlLocationId, 
  directoryName, 
  userId 
}: LocationEnhancementManagerProps) {
  const [enhancement, setEnhancement] = useState<LocationEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<InsertLocationEnhancement>>({
    ghlLocationId,
    directoryName,
    userId,
    metadataBarEnabled: false,
    googleMapsEnabled: false,
    expandedDescriptionEnabled: false,
    metadataFields: [],
    mapsConfig: {},
    descriptionConfig: {},
    enhancementTheme: "default",
    layoutPosition: "sidebar",
    isActive: true
  });

  const [metadataField, setMetadataField] = useState({ label: "", value: "", type: "text" });

  useEffect(() => {
    loadEnhancement();
  }, [ghlLocationId, directoryName]);

  const loadEnhancement = async () => {
    try {
      const response = await fetch(`/api/location-enhancements/${ghlLocationId}/${directoryName}`);
      if (response.ok) {
        const data = await response.json();
        setEnhancement(data);
        setFormData(data);
      } else if (response.status === 404) {
        // No enhancement exists yet, use default form data
        setEnhancement(null);
      }
    } catch (error) {
      console.error('Error loading location enhancement:', error);
      toast({
        title: "Error",
        description: "Failed to load location enhancement settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEnhancement = async () => {
    setIsSaving(true);
    try {
      const url = enhancement 
        ? `/api/location-enhancements/${enhancement.id}`
        : '/api/location-enhancements';
      
      const method = enhancement ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedEnhancement = await response.json();
        setEnhancement(savedEnhancement);
        setFormData(savedEnhancement);
        toast({
          title: "Success",
          description: "Location enhancement settings saved successfully"
        });
      } else {
        throw new Error('Failed to save enhancement');
      }
    } catch (error) {
      console.error('Error saving location enhancement:', error);
      toast({
        title: "Error",
        description: "Failed to save location enhancement settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addMetadataField = () => {
    if (metadataField.label && metadataField.value) {
      const newFields = [...(formData.metadataFields as any[] || []), metadataField];
      setFormData({ ...formData, metadataFields: newFields });
      setMetadataField({ label: "", value: "", type: "text" });
    }
  };

  const removeMetadataField = (index: number) => {
    const newFields = (formData.metadataFields as any[] || []).filter((_, i) => i !== index);
    setFormData({ ...formData, metadataFields: newFields });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Enhancement Settings</CardTitle>
          <CardDescription>Loading enhancement configuration...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Location Enhancement Settings
        </CardTitle>
        <CardDescription>
          Configure directory enhancements for location: {ghlLocationId} in {directoryName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhancement Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Metadata Bar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.metadataBarEnabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, metadataBarEnabled: checked })
                  }
                />
                <Label>Enable metadata display</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Map className="h-4 w-4" />
                Google Maps Widget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.googleMapsEnabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, googleMapsEnabled: checked })
                  }
                />
                <Label>Enable maps integration</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Expanded Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.expandedDescriptionEnabled}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, expandedDescriptionEnabled: checked })
                  }
                />
                <Label>Enable rich descriptions</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Metadata Fields Configuration */}
        {formData.metadataBarEnabled && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadata Fields</h3>
            
            {/* Add New Field */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Field Label"
                value={metadataField.label}
                onChange={(e) => setMetadataField({ ...metadataField, label: e.target.value })}
              />
              <Input
                placeholder="Field Value"
                value={metadataField.value}
                onChange={(e) => setMetadataField({ ...metadataField, value: e.target.value })}
              />
              <Select 
                value={metadataField.type} 
                onValueChange={(value) => setMetadataField({ ...metadataField, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addMetadataField} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing Fields */}
            <div className="space-y-2">
              {(formData.metadataFields as any[] || []).map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Badge variant="outline">{field.type}</Badge>
                  <span className="font-medium">{field.label}:</span>
                  <span>{field.value}</span>
                  <Button
                    onClick={() => removeMetadataField(index)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Enhancement Theme</Label>
            <Select 
              value={formData.enhancementTheme} 
              onValueChange={(value) => setFormData({ ...formData, enhancementTheme: value })}
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

          <div className="space-y-2">
            <Label>Layout Position</Label>
            <Select 
              value={formData.layoutPosition} 
              onValueChange={(value) => setFormData({ ...formData, layoutPosition: value })}
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
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveEnhancement} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Enhancement Settings'}
          </Button>
        </div>

        {/* Status */}
        {enhancement && (
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(enhancement.updatedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}