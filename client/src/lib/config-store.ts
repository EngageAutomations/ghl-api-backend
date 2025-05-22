/**
 * Configuration Store
 * Manages persistence and retrieval of wizard configuration
 */

import { DesignerConfig } from "@shared/schema";

// Default configuration values
export const defaultConfig: Partial<DesignerConfig> & {
  metadataLabels: string[];
  metadataCount: number;
} = {
  id: 0,
  userId: 0,
  directoryName: "My Directory",
  enableActionButton: true,
  buttonType: "popup",
  buttonLabel: "Contact Us",
  buttonColor: "#4F46E5",
  buttonTextColor: "#FFFFFF",
  buttonBorderRadius: 4,
  formEmbedUrl: "https://forms.gohighlevel.com/your-form-url",
  customFormFieldName: "listing", 
  enablePriceDisplay: true,
  enableExpandedDescription: true,
  enableLocationMap: true,
  enableMetadataDisplay: true,
  // Collections for organizing listings
  collections: [],
  // Additional fields not in the DB schema but needed for UI
  metadataLabels: ["Category", "Location", "Version", "Type", "Brand"],
  metadataCount: 2,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Storage key
const CONFIG_STORAGE_KEY = "directory_wizard_config";

/**
 * Save configuration to local storage
 */
export function saveConfig(config: Partial<DesignerConfig>): void {
  const currentConfig = getConfig();
  const updatedConfig = {
    ...currentConfig,
    ...config,
    updatedAt: new Date()
  };
  
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
}

/**
 * Get configuration from local storage
 */
export function getConfig(): DesignerConfig {
  const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!storedConfig) {
    return defaultConfig;
  }
  
  try {
    return JSON.parse(storedConfig);
  } catch (error) {
    console.error("Error parsing stored config:", error);
    return defaultConfig;
  }
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

/**
 * Export configuration as JSON file
 */
export function exportConfig(): void {
  const config = getConfig();
  const configString = JSON.stringify(config, null, 2);
  const blob = new Blob([configString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "directory_config.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import configuration from JSON file
 */
export async function importConfig(file: File): Promise<DesignerConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const config = JSON.parse(result);
          saveConfig(config);
          resolve(config);
        } else {
          reject(new Error("Invalid file content"));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
}