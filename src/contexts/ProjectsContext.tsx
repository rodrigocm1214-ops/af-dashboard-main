import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/types/project';

interface ProjectsContextType {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (name: string) => Project;
  deleteProject: (projectId: string) => void;
  getActiveProject: () => Project | null;
  isLoaded: boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

const STORAGE_KEY = 'infoprodutos-projects';

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Debug function
  const debugLog = (action: string, data?: any) => {
    console.log(`[ProjectsContext] ${action}`, {
      timestamp: new Date().toISOString(),
      projects: projects.length,
      activeProjectId,
      isLoaded,
      data
    });
  };

  // Load projects from localStorage on mount
  useEffect(() => {
    debugLog('Loading projects from localStorage...');
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedProjects = JSON.parse(stored);
        debugLog('Projects loaded from localStorage', { count: parsedProjects.length });
        
        setProjects(parsedProjects);
        if (parsedProjects.length > 0 && !activeProjectId) {
          setActiveProjectId(parsedProjects[0].id);
          debugLog('Set active project to first project', { projectId: parsedProjects[0].id });
        }
      } catch (error) {
        debugLog('Error parsing projects from localStorage', error);
        setProjects([]);
      }
    } else {
      debugLog('No projects found in localStorage');
      setProjects([]);
    }
    
    setIsLoaded(true);
    debugLog('Projects context loaded successfully');
  }, []);

  // Save projects to localStorage whenever projects change (but only after initial load)
  useEffect(() => {
    if (!isLoaded) {
      debugLog('Skipping save - not yet loaded');
      return;
    }
    
    debugLog('Saving projects to localStorage', { count: projects.length });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, isLoaded]);

  const createProject = (name: string): Project => {
    debugLog('Creating new project', { name });
    
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      slug,
      createdAt: new Date(),
    };

    setProjects(prev => {
      const updated = [newProject, ...prev];
      debugLog('Project created', { newProject, totalProjects: updated.length });
      return updated;
    });
    
    setActiveProjectId(newProject.id);
    debugLog('Active project set to new project', { projectId: newProject.id });
    
    return newProject;
  };

  const deleteProject = (projectId: string) => {
    debugLog('Deleting project', { projectId });
    
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      debugLog('Project deleted', { projectId, remainingProjects: updated.length });
      return updated;
    });
    
    // If we deleted the active project, set to first remaining project
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      const newActiveId = remaining.length > 0 ? remaining[0].id : null;
      setActiveProjectId(newActiveId);
      debugLog('Active project changed after deletion', { newActiveId });
    }
    
    // Also remove project data from localStorage
    const dataKey = `project-data-${projectId}`;
    localStorage.removeItem(dataKey);
    debugLog('Project data removed from localStorage', { dataKey });
  };

  const getActiveProject = (): Project | null => {
    const active = projects.find(p => p.id === activeProjectId) || null;
    if (active) {
      debugLog('Active project retrieved', { project: active.name });
    }
    return active;
  };

  const value: ProjectsContextType = {
    projects,
    activeProjectId,
    setActiveProjectId: (id: string | null) => {
      debugLog('Setting active project', { from: activeProjectId, to: id });
      setActiveProjectId(id);
    },
    createProject,
    deleteProject,
    getActiveProject,
    isLoaded,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjectsContext = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return context;
};