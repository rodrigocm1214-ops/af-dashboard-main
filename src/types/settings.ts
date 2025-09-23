export interface ProjectSettings {
  projectId: string;
  platformTax: number; // %
  tax: number; // %
  participation: number; // %
}

export interface GlobalSettings {
  defaultPlatformTax: number; // %
  defaultTax: number; // %
  defaultParticipation: number; // %
  reportTemplate: 'standard' | 'detailed' | 'minimal';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'BRL' | 'USD' | 'EUR';
  theme: 'light' | 'dark' | 'auto';
  companyName: string;
  companyLogo?: string;
  reportSignature: string;
  exportFormat: 'PDF' | 'Excel' | 'JSON';
}

export interface AppSettings extends GlobalSettings {
  projectSettings: ProjectSettings[];
}