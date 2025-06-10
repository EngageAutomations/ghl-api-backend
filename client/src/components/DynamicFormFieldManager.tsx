import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Link
} from "lucide-react";

interface FormField {
  id?: number;
  formConfigId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldPlaceholder?: string;
  isRequired: boolean;
  isVisible: boolean;
  displayOrder: number;
  validationRules?: any;
  fieldOptions?: any;
  defaultValue?: string;
  ghlCustomFieldId?: string;
  ghlFieldMapping?: string;
  listingFieldMapping?: string;
}

interface DynamicFormFieldManagerProps {
  formConfigId: number;
  onFieldsChange?: (fields: FormField[]) => void;
}

const FIELD_TYPES = [
  // Basic Fields
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Number" },
  { value: "textarea", label: "Text Area" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown Select" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date Picker" },
  { value: "time", label: "Time Picker" },
  { value: "datetime", label: "Date & Time" },
  { value: "file", label: "File Upload" },
  { value: "image", label: "Image Upload" },
  { value: "url", label: "URL" },
  { value: "color", label: "Color Picker" },
  { value: "range", label: "Range Slider" },
  { value: "rating", label: "Star Rating" },
  { value: "multi-select", label: "Multi-Select Dropdown" },
  { value: "tags", label: "Tag Input" },
  { value: "address", label: "Address Lookup" },
  { value: "hidden", label: "Hidden Field" },
  
  // E-commerce Specialized Fields
  { value: "pricing-type", label: "Pricing Configuration" },
  { value: "product-variants", label: "Product Variations" },
  { value: "inventory-tracking", label: "Inventory Management" }
];

const LISTING_FIELD_MAPPINGS = [
  { value: "", label: "No Mapping" },
  { value: "title", label: "Listing Title" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "location", label: "Location" },
  { value: "price", label: "Price" },
  { value: "linkUrl", label: "Website URL" },
  { value: "popupUrl", label: "Contact URL" },
  { value: "imageUrl", label: "Image URL" }
];

const GHL_FIELD_MAPPINGS = [
  { value: "", label: "No Mapping" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "companyName", label: "Company Name" },
  { value: "address1", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "postalCode", label: "Postal Code" },
  { value: "website", label: "Website" }
];

export default function DynamicFormFieldManager({ formConfigId, onFieldsChange }: DynamicFormFieldManagerProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFields();
  }, [formConfigId]);

  const loadFields = async () => {
    try {
      const response = await fetch(`/api/form-fields/${formConfigId}`);
      if (response.ok) {
        const data = await response.json();
        setFields(data.sort((a: FormField, b: FormField) => a.displayOrder - b.displayOrder));
        onFieldsChange?.(data);
      }
    } catch (error) {
      console.error("Failed to load fields:", error);
      toast({
        title: "Error",
        description: "Failed to load form fields",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createField = () => {
    const newField: FormField = {
      formConfigId,
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      fieldPlaceholder: "",
      isRequired: false,
      isVisible: true,
      displayOrder: fields.length,
      validationRules: {},
      fieldOptions: {},
      defaultValue: "",
      ghlFieldMapping: "",
      listingFieldMapping: ""
    };
    setEditingField(newField);
    setIsDialogOpen(true);
  };

  const editField = (field: FormField) => {
    setEditingField({ ...field });
    setIsDialogOpen(true);
  };

  const saveField = async () => {
    if (!editingField) return;

    try {
      const isNew = !editingField.id;
      const url = isNew ? "/api/form-fields" : `/api/form-fields/${editingField.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingField)
      });

      if (response.ok) {
        await loadFields();
        setIsDialogOpen(false);
        setEditingField(null);
        toast({
          title: "Success",
          description: `Field ${isNew ? "created" : "updated"} successfully`
        });
      }
    } catch (error) {
      console.error("Failed to save field:", error);
      toast({
        title: "Error",
        description: "Failed to save field",
        variant: "destructive"
      });
    }
  };

  const deleteField = async (fieldId: number) => {
    try {
      const response = await fetch(`/api/form-fields/${fieldId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await loadFields();
        toast({
          title: "Success",
          description: "Field deleted successfully"
        });
      }
    } catch (error) {
      console.error("Failed to delete field:", error);
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive"
      });
    }
  };

  const duplicateField = async (fieldId: number) => {
    try {
      const response = await fetch(`/api/form-fields/duplicate/${fieldId}`, {
        method: "POST"
      });

      if (response.ok) {
        await loadFields();
        toast({
          title: "Success",
          description: "Field duplicated successfully"
        });
      }
    } catch (error) {
      console.error("Failed to duplicate field:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate field",
        variant: "destructive"
      });
    }
  };

  const toggleVisibility = async (field: FormField) => {
    try {
      const response = await fetch(`/api/form-fields/${field.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...field, isVisible: !field.isVisible })
      });

      if (response.ok) {
        await loadFields();
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  const moveField = async (fieldId: number, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    
    // Update display orders
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      displayOrder: index
    }));

    setFields(updatedFields);

    try {
      const fieldIds = updatedFields.map(f => f.id);
      await fetch("/api/form-fields/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldIds })
      });
    } catch (error) {
      console.error("Failed to reorder fields:", error);
      await loadFields(); // Revert on error
    }
  };

  if (loading) {
    return <div className="p-4">Loading form fields...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Dynamic Form Fields</h3>
          <p className="text-sm text-gray-500">
            Configure custom fields that will appear in your form and map to listings
          </p>
        </div>
        <Button onClick={createField} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <Card
            key={field.id}
            className={`transition-opacity ${!field.isVisible ? 'opacity-50' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(field.id!, 'up')}
                      disabled={index === 0}
                      className="h-4 w-6 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(field.id!, 'down')}
                      disabled={index === fields.length - 1}
                      className="h-4 w-6 p-0"
                    >
                      ↓
                    </Button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{field.fieldLabel}</h4>
                      <Badge variant="secondary">{field.fieldType}</Badge>
                      {field.isRequired && <Badge variant="destructive">Required</Badge>}
                      {field.ghlCustomFieldId && <Badge variant="outline">
                        <Link className="h-3 w-3 mr-1" />
                        GHL
                      </Badge>}
                    </div>
                    <p className="text-sm text-gray-500">
                      {field.fieldName} • Order: {field.displayOrder}
                      {field.listingFieldMapping && ` • Maps to: ${field.listingFieldMapping}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVisibility(field)}
                  >
                    {field.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editField(field)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateField(field.id!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteField(field.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {fields.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No custom fields configured yet</p>
              <Button onClick={createField} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Field
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingField?.id ? "Edit Field" : "Create Field"}
            </DialogTitle>
          </DialogHeader>

          {editingField && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fieldLabel">Field Label *</Label>
                  <Input
                    id="fieldLabel"
                    value={editingField.fieldLabel}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      fieldLabel: e.target.value,
                      fieldName: editingField.fieldName || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
                    })}
                    placeholder="Business Category"
                  />
                </div>

                <div>
                  <Label htmlFor="fieldName">Field Name *</Label>
                  <Input
                    id="fieldName"
                    value={editingField.fieldName}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      fieldName: e.target.value
                    })}
                    placeholder="business_category"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fieldType">Field Type *</Label>
                  <Select
                    value={editingField.fieldType}
                    onValueChange={(value) => setEditingField({
                      ...editingField,
                      fieldType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                  <Input
                    id="fieldPlaceholder"
                    value={editingField.fieldPlaceholder || ""}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      fieldPlaceholder: e.target.value
                    })}
                    placeholder="Select your business category..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="listingMapping">Listing Field Mapping</Label>
                  <Select
                    value={editingField.listingFieldMapping || ""}
                    onValueChange={(value) => setEditingField({
                      ...editingField,
                      listingFieldMapping: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mapping..." />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_FIELD_MAPPINGS.map(mapping => (
                        <SelectItem key={mapping.value} value={mapping.value}>
                          {mapping.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ghlMapping">GHL Field Mapping</Label>
                  <Select
                    value={editingField.ghlFieldMapping || ""}
                    onValueChange={(value) => setEditingField({
                      ...editingField,
                      ghlFieldMapping: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GHL mapping..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GHL_FIELD_MAPPINGS.map(mapping => (
                        <SelectItem key={mapping.value} value={mapping.value}>
                          {mapping.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(editingField.fieldType === "select" || editingField.fieldType === "radio") && (
                <div>
                  <Label htmlFor="fieldOptions">Options (one per line)</Label>
                  <Textarea
                    id="fieldOptions"
                    value={editingField.fieldOptions?.options?.join('\n') || ""}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      fieldOptions: {
                        options: e.target.value.split('\n').filter(opt => opt.trim())
                      }
                    })}
                    placeholder="Restaurant&#10;Retail Store&#10;Professional Service&#10;Healthcare"
                    className="min-h-[100px]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={editingField.isRequired}
                    onCheckedChange={(checked) => setEditingField({
                      ...editingField,
                      isRequired: checked
                    })}
                  />
                  <Label htmlFor="isRequired">Required Field</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVisible"
                    checked={editingField.isVisible}
                    onCheckedChange={(checked) => setEditingField({
                      ...editingField,
                      isVisible: checked
                    })}
                  />
                  <Label htmlFor="isVisible">Visible</Label>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveField}>
                  {editingField.id ? "Update Field" : "Create Field"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}