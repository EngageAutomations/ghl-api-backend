import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface WizardFormTemplate {
  id?: number;
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
    required: boolean;
    placeholder?: string;
    description?: string;
  }>;
  integrationConfig: {
    buttonType: 'popup' | 'redirect' | 'download';
    buttonText: string;
    buttonColor: string;
    embedCode?: string;
    fieldName: string;
  };
  headerCode?: string;
  footerCode?: string;
  cssCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function useWizardFormTemplate(directoryName: string) {
  return useQuery({
    queryKey: ['/api/wizard-templates', directoryName],
    queryFn: async () => {
      const response = await apiRequest(`/api/wizard-templates/${directoryName}`);
      return response as WizardFormTemplate;
    },
    enabled: !!directoryName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}