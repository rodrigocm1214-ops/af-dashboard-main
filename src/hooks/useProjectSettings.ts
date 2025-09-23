import { useState, useEffect } from 'react';
import { ProjectSettings, GlobalSettings } from '@/types/settings';

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultPlatformTax: 6, // 6%
  defaultTax: 0,
  defaultParticipation: 100,
  reportTemplate: 'standard',
  dateFormat: 'DD/MM/YYYY',
  currency: 'BRL',
  theme: 'light',
  companyName: 'A-FONTE Dashboard',
  reportSignature: 'Gerado automaticamente pelo A-FONTE Dashboard',
  exportFormat: 'PDF'
};

export const useProjectSettings = (projectId?: string) => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    
    // Load global settings
    const storedGlobal = localStorage.getItem('global-settings');
    if (storedGlobal) {
      try {
        const parsed = JSON.parse(storedGlobal);
        setGlobalSettings({ ...DEFAULT_GLOBAL_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading global settings:', error);
      }
    }

    // Load project-specific settings
    const storedProjects = localStorage.getItem('project-settings');
    if (storedProjects) {
      try {
        const parsed = JSON.parse(storedProjects);
        setProjectSettings(parsed);
      } catch (error) {
        console.error('Error loading project settings:', error);
      }
    }
    
    setLoading(false);
  };

  const saveGlobalSettings = (newSettings: Partial<GlobalSettings>) => {
    const updated = { ...globalSettings, ...newSettings };
    setGlobalSettings(updated);
    localStorage.setItem('global-settings', JSON.stringify(updated));
  };

  const saveProjectSettings = (settings: ProjectSettings) => {
    const updated = projectSettings.filter(ps => ps.projectId !== settings.projectId);
    updated.push(settings);
    setProjectSettings(updated);
    localStorage.setItem('project-settings', JSON.stringify(updated));
  };

  const getProjectSettings = (projectId: string): ProjectSettings => {
    const specific = projectSettings.find(ps => ps.projectId === projectId);
    if (specific) {
      return specific;
    }

    // Return settings based on global defaults
    return {
      projectId,
      platformTax: globalSettings.defaultPlatformTax,
      tax: globalSettings.defaultTax,
      participation: globalSettings.defaultParticipation
    };
  };

  const getEffectiveSettings = (projectId: string) => {
    return getProjectSettings(projectId);
  };

  return {
    globalSettings,
    projectSettings,
    loading,
    saveGlobalSettings,
    saveProjectSettings,
    getProjectSettings,
    getEffectiveSettings,
    loadSettings
  };
};