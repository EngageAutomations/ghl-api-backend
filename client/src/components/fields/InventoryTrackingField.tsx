import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryData {
  trackInventory: boolean;
  currentStock: number;
  lowStockThreshold: number;
  continueSellingWhenOutOfStock: boolean;
  allowBackorders: boolean;
  sku: string;
  barcode: string;
  weight: string;
  weightUnit: 'lb' | 'kg' | 'oz' | 'g';
  requiresShipping: boolean;
}

interface InventoryTrackingFieldProps {
  value?: InventoryData;
  onChange: (value: InventoryData) => void;
  fieldName: string;
  fieldLabel: string;
  isRequired?: boolean;
  className?: string;
}

export function InventoryTrackingField({ 
  value, 
  onChange, 
  fieldName, 
  fieldLabel, 
  isRequired,
  className 
}: InventoryTrackingFieldProps) {
  const [inventoryData, setInventoryData] = useState<InventoryData>(
    value || {
      trackInventory: false,
      currentStock: 0,
      lowStockThreshold: 5,
      continueSellingWhenOutOfStock: false,
      allowBackorders: false,
      sku: '',
      barcode: '',
      weight: '',
      weightUnit: 'lb',
      requiresShipping: true
    }
  );

  useEffect(() => {
    onChange(inventoryData);
  }, [inventoryData, onChange]);

  const handleFieldChange = (field: keyof InventoryData, newValue: any) => {
    setInventoryData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const getStockStatus = () => {
    if (!inventoryData.trackInventory) return null;
    
    if (inventoryData.currentStock === 0) {
      return { status: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    } else if (inventoryData.currentStock <= inventoryData.lowStockThreshold) {
      return { status: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
    } else {
      return { status: 'In Stock', color: 'text-green-600 bg-green-50' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-sm font-medium">
        {fieldLabel}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Inventory Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Track Inventory Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${fieldName}-track`}
              checked={inventoryData.trackInventory}
              onCheckedChange={(checked) => handleFieldChange('trackInventory', checked as boolean)}
            />
            <Label htmlFor={`${fieldName}-track`} className="text-sm font-medium">
              Track inventory quantities for this product
            </Label>
          </div>

          {/* Inventory Details */}
          {inventoryData.trackInventory && (
            <div className="space-y-6">
              {/* Stock Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${fieldName}-stock`} className="text-sm">
                    Current Stock <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`${fieldName}-stock`}
                    type="number"
                    min="0"
                    value={inventoryData.currentStock}
                    onChange={(e) => handleFieldChange('currentStock', parseInt(e.target.value) || 0)}
                  />
                  {stockStatus && (
                    <div className={`inline-flex items-center px-2 py-1 mt-2 text-xs font-medium rounded-full ${stockStatus.color}`}>
                      {stockStatus.status}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`${fieldName}-threshold`} className="text-sm">
                    Low Stock Threshold
                  </Label>
                  <Input
                    id={`${fieldName}-threshold`}
                    type="number"
                    min="0"
                    value={inventoryData.lowStockThreshold}
                    onChange={(e) => handleFieldChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when stock falls below this number
                  </p>
                </div>
              </div>

              {/* Stock Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldName}-continue-selling`}
                    checked={inventoryData.continueSellingWhenOutOfStock}
                    onCheckedChange={(checked) => handleFieldChange('continueSellingWhenOutOfStock', checked as boolean)}
                  />
                  <Label htmlFor={`${fieldName}-continue-selling`} className="text-sm">
                    Continue selling when out of stock
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldName}-backorders`}
                    checked={inventoryData.allowBackorders}
                    onCheckedChange={(checked) => handleFieldChange('allowBackorders', checked as boolean)}
                  />
                  <Label htmlFor={`${fieldName}-backorders`} className="text-sm">
                    Allow customers to purchase on backorder
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Product Identification */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Product Identification</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${fieldName}-sku`} className="text-sm">
                  SKU (Stock Keeping Unit)
                </Label>
                <Input
                  id={`${fieldName}-sku`}
                  placeholder="e.g., SHIRT-BLU-L"
                  value={inventoryData.sku}
                  onChange={(e) => handleFieldChange('sku', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor={`${fieldName}-barcode`} className="text-sm">
                  Barcode (UPC/EAN)
                </Label>
                <Input
                  id={`${fieldName}-barcode`}
                  placeholder="e.g., 123456789012"
                  value={inventoryData.barcode}
                  onChange={(e) => handleFieldChange('barcode', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${fieldName}-shipping`}
                checked={inventoryData.requiresShipping}
                onCheckedChange={(checked) => handleFieldChange('requiresShipping', checked as boolean)}
              />
              <Label htmlFor={`${fieldName}-shipping`} className="text-sm font-medium">
                This product requires shipping
              </Label>
            </div>

            {inventoryData.requiresShipping && (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor={`${fieldName}-weight`} className="text-sm">
                    Weight
                  </Label>
                  <Input
                    id={`${fieldName}-weight`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={inventoryData.weight}
                    onChange={(e) => handleFieldChange('weight', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`${fieldName}-weight-unit`} className="text-sm">
                    Unit
                  </Label>
                  <Select 
                    value={inventoryData.weightUnit} 
                    onValueChange={(value) => handleFieldChange('weightUnit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">Pounds (lb)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                      <SelectItem value="g">Grams (g)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={fieldName}
        value={JSON.stringify(inventoryData)}
      />
    </div>
  );
}