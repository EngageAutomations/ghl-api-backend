import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PricingData {
  type: 'one-time' | 'recurring';
  amount: string;
  compareAtPrice?: string;
  billingPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trialPeriod?: number;
  numberOfPayments?: number;
  setupFee?: string;
}

interface PricingTypeFieldProps {
  value?: PricingData;
  onChange: (value: PricingData) => void;
  fieldName: string;
  fieldLabel: string;
  isRequired?: boolean;
  className?: string;
}

export function PricingTypeField({ 
  value, 
  onChange, 
  fieldName, 
  fieldLabel, 
  isRequired,
  className 
}: PricingTypeFieldProps) {
  const [pricingData, setPricingData] = useState<PricingData>(
    value || {
      type: 'one-time',
      amount: '',
      compareAtPrice: '',
      billingPeriod: 'monthly',
      trialPeriod: 0,
      numberOfPayments: 0,
      setupFee: ''
    }
  );

  useEffect(() => {
    onChange(pricingData);
  }, [pricingData, onChange]);

  const handleFieldChange = (field: keyof PricingData, newValue: any) => {
    setPricingData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue ? `$${numericValue}` : '';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-sm font-medium">
        {fieldLabel}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Pricing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${fieldName}-type`} className="text-sm">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={pricingData.type} 
                onValueChange={(value) => handleFieldChange('type', value as 'one-time' | 'recurring')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor={`${fieldName}-amount`} className="text-sm">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`${fieldName}-amount`}
                type="text"
                placeholder="$0.00"
                value={pricingData.amount}
                onChange={(e) => handleFieldChange('amount', formatCurrency(e.target.value))}
                className="text-right"
              />
            </div>
          </div>

          {/* Compare at Price */}
          <div>
            <Label htmlFor={`${fieldName}-compare`} className="text-sm">
              Compare at Price (Optional)
            </Label>
            <Input
              id={`${fieldName}-compare`}
              type="text"
              placeholder="$0.00"
              value={pricingData.compareAtPrice || ''}
              onChange={(e) => handleFieldChange('compareAtPrice', formatCurrency(e.target.value))}
              className="text-right"
            />
            <p className="text-xs text-gray-500 mt-1">
              Show customers the original price to highlight savings
            </p>
          </div>

          {/* Recurring Options */}
          {pricingData.type === 'recurring' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-800">Recurring Payment Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${fieldName}-billing`} className="text-sm">
                      Billing Period
                    </Label>
                    <Select 
                      value={pricingData.billingPeriod} 
                      onValueChange={(value) => handleFieldChange('billingPeriod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`${fieldName}-trial`} className="text-sm">
                      Trial Period (Days)
                    </Label>
                    <Input
                      id={`${fieldName}-trial`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={pricingData.trialPeriod || ''}
                      onChange={(e) => handleFieldChange('trialPeriod', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${fieldName}-payments`} className="text-sm">
                      Number of Payments
                    </Label>
                    <Input
                      id={`${fieldName}-payments`}
                      type="number"
                      min="0"
                      placeholder="0 = Unlimited"
                      value={pricingData.numberOfPayments || ''}
                      onChange={(e) => handleFieldChange('numberOfPayments', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave 0 for unlimited payments
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor={`${fieldName}-setup`} className="text-sm">
                      Setup Fee
                    </Label>
                    <Input
                      id={`${fieldName}-setup`}
                      type="text"
                      placeholder="$0.00"
                      value={pricingData.setupFee || ''}
                      onChange={(e) => handleFieldChange('setupFee', formatCurrency(e.target.value))}
                      className="text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={fieldName}
        value={JSON.stringify(pricingData)}
      />
    </div>
  );
}