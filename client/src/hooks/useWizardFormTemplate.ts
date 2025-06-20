import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface WizardFormTemplateData {
  directoryName: string;
  templateName: string;
  wizardConfig: {
    showDescription: boolean;
    showMetadata: boolean;
    showMaps: boolean;
    showPrice: boolean;
    showQuantitySelector: boolean;
    integrationMethod: string;
    buttonText: string;
    buttonColor: string;
    directoryName: string;
  };
  formFields: Array<{
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required: boolean;
    description?: string;
  }>;
  integrationConfig: {
    buttonType: string;
    buttonText: string;
    buttonColor: string;
    embedCode?: string;
    fieldName?: string;
  };
  headerCode?: string;
  footerCode?: string;
  cssCode?: string;
}

export function useWizardFormTemplate(directoryName?: string) {
  const queryClient = useQueryClient();

  // Get template for directory
  const { data: template, isLoading } = useQuery({
    queryKey: ['/api/wizard-templates', directoryName],
    queryFn: () => apiRequest(`/api/wizard-templates/${directoryName}`),
    enabled: !!directoryName,
  });

  // Save wizard template
  const saveTemplateMutation = useMutation({
    mutationFn: (data: WizardFormTemplateData) => 
      apiRequest('/api/wizard-templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizard-templates'] });
    },
  });

  // Update template
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WizardFormTemplateData> }) =>
      apiRequest(`/api/wizard-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizard-templates'] });
    },
  });

  return {
    template,
    isLoading,
    saveTemplate: saveTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    isSaving: saveTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
  };
}