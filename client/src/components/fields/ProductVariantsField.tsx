import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Trash2 } from "lucide-react";

interface VariantOption {
  name: string;
  values: string[];
}

interface VariantCombination {
  id: string;
  combination: Record<string, string>;
  price: string;
  compareAtPrice: string;
  quantity: number;
  enabled: boolean;
}

interface ProductVariantsData {
  options: VariantOption[];
  trackInventory: boolean;
  continueSellingWhenOutOfStock: boolean;
  combinations: VariantCombination[];
}

interface ProductVariantsFieldProps {
  value?: ProductVariantsData;
  onChange: (value: ProductVariantsData) => void;
  fieldName: string;
  fieldLabel: string;
  isRequired?: boolean;
  className?: string;
}

export function ProductVariantsField({ 
  value, 
  onChange, 
  fieldName, 
  fieldLabel, 
  isRequired,
  className 
}: ProductVariantsFieldProps) {
  const [variantsData, setVariantsData] = useState<ProductVariantsData>(
    value || {
      options: [],
      trackInventory: false,
      continueSellingWhenOutOfStock: false,
      combinations: []
    }
  );

  const [newOption, setNewOption] = useState({ name: '', values: [''] });

  useEffect(() => {
    onChange(variantsData);
  }, [variantsData, onChange]);

  useEffect(() => {
    // Generate combinations when options change
    if (variantsData.options.length > 0) {
      const combinations = generateCombinations();
      setVariantsData(prev => ({
        ...prev,
        combinations: combinations.map(combo => {
          const existing = prev.combinations.find(c => c.id === combo.id);
          return existing || combo;
        })
      }));
    }
  }, [variantsData.options]);

  const generateCombinations = (): VariantCombination[] => {
    if (variantsData.options.length === 0) return [];

    const generateCartesianProduct = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>((acc, curr) => 
        acc.flatMap(a => curr.map(c => [...a, c])), [[]]
      );
    };

    const optionNames = variantsData.options.map(opt => opt.name);
    const optionValues = variantsData.options.map(opt => opt.values.filter(v => v.trim()));
    
    const cartesianProduct = generateCartesianProduct(optionValues);
    
    return cartesianProduct.map(combination => {
      const combinationObj = optionNames.reduce((acc, name, index) => {
        acc[name] = combination[index];
        return acc;
      }, {} as Record<string, string>);
      
      const id = Object.values(combinationObj).join('-').toLowerCase().replace(/\s+/g, '-');
      
      return {
        id,
        combination: combinationObj,
        price: '',
        compareAtPrice: '',
        quantity: 0,
        enabled: true
      };
    });
  };

  const addVariantOption = () => {
    if (newOption.name.trim() && newOption.values.some(v => v.trim())) {
      const filteredValues = newOption.values.filter(v => v.trim());
      setVariantsData(prev => ({
        ...prev,
        options: [...prev.options, { name: newOption.name.trim(), values: filteredValues }]
      }));
      setNewOption({ name: '', values: [''] });
    }
  };

  const removeVariantOption = (index: number) => {
    setVariantsData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addValueToNewOption = () => {
    setNewOption(prev => ({
      ...prev,
      values: [...prev.values, '']
    }));
  };

  const updateNewOptionValue = (index: number, value: string) => {
    setNewOption(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? value : v)
    }));
  };

  const removeValueFromNewOption = (index: number) => {
    setNewOption(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const updateCombination = (id: string, field: keyof VariantCombination, value: any) => {
    setVariantsData(prev => ({
      ...prev,
      combinations: prev.combinations.map(combo => 
        combo.id === id ? { ...combo, [field]: value } : combo
      )
    }));
  };

  const removeCombination = (id: string) => {
    setVariantsData(prev => ({
      ...prev,
      combinations: prev.combinations.filter(combo => combo.id !== id)
    }));
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue ? `$${numericValue}` : '';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Label className="text-sm font-medium">
        {fieldLabel}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Add Variant Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Options */}
          {variantsData.options.map((option, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{option.name}:</span>
                <span className="ml-2 text-gray-600">{option.values.join(', ')}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeVariantOption(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}

          {/* Add New Option */}
          <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div>
              <Label htmlFor="option-name" className="text-sm">Option Name</Label>
              <Input
                id="option-name"
                placeholder="e.g., Size, Color, Material"
                value={newOption.name}
                onChange={(e) => setNewOption(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label className="text-sm">Option Values</Label>
              {newOption.values.map((value, index) => (
                <div key={index} className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="e.g., Small, Medium, Large"
                    value={value}
                    onChange={(e) => updateNewOptionValue(index, e.target.value)}
                  />
                  {newOption.values.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeValueFromNewOption(index)}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addValueToNewOption}
                className="mt-2"
              >
                <Plus size={16} className="mr-1" />
                Add Value
              </Button>
            </div>
            
            <Button onClick={addVariantOption} disabled={!newOption.name.trim()}>
              Add Variant Option
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management */}
      {variantsData.options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="track-inventory"
                checked={variantsData.trackInventory}
                onCheckedChange={(checked) => 
                  setVariantsData(prev => ({ ...prev, trackInventory: checked as boolean }))
                }
              />
              <Label htmlFor="track-inventory">Track inventory quantities</Label>
            </div>
            
            {variantsData.trackInventory && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox
                  id="continue-selling"
                  checked={variantsData.continueSellingWhenOutOfStock}
                  onCheckedChange={(checked) => 
                    setVariantsData(prev => ({ ...prev, continueSellingWhenOutOfStock: checked as boolean }))
                  }
                />
                <Label htmlFor="continue-selling">Continue selling when out of stock</Label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Variant Combinations Table */}
      {variantsData.combinations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variant Combinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Variant</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Compare At</th>
                    {variantsData.trackInventory && (
                      <th className="text-left p-2">Quantity</th>
                    )}
                    <th className="text-left p-2">Enabled</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variantsData.combinations.map((combination) => (
                    <tr key={combination.id} className="border-b">
                      <td className="p-2">
                        {Object.entries(combination.combination).map(([key, value]) => (
                          <span key={key} className="text-sm">
                            {key}: <strong>{value}</strong>{' '}
                          </span>
                        ))}
                      </td>
                      <td className="p-2">
                        <Input
                          type="text"
                          placeholder="$0.00"
                          value={combination.price}
                          onChange={(e) => 
                            updateCombination(combination.id, 'price', formatCurrency(e.target.value))
                          }
                          className="w-24 text-right"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="text"
                          placeholder="$0.00"
                          value={combination.compareAtPrice}
                          onChange={(e) => 
                            updateCombination(combination.id, 'compareAtPrice', formatCurrency(e.target.value))
                          }
                          className="w-24 text-right"
                        />
                      </td>
                      {variantsData.trackInventory && (
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={combination.quantity}
                            onChange={(e) => 
                              updateCombination(combination.id, 'quantity', parseInt(e.target.value) || 0)
                            }
                            className="w-20"
                          />
                        </td>
                      )}
                      <td className="p-2">
                        <Checkbox
                          checked={combination.enabled}
                          onCheckedChange={(checked) => 
                            updateCombination(combination.id, 'enabled', checked as boolean)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCombination(combination.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={fieldName}
        value={JSON.stringify(variantsData)}
      />
    </div>
  );
}