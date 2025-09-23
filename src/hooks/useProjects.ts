import { useState, useEffect } from 'react';
import { Project } from '@/types/project';

const STORAGE_KEY = 'infoprodutos-projects';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🔒 PROTEÇÃO: Load projects from localStorage with safety checks
  useEffect(() => {
    console.log('[useProjects] Loading projects safely...');
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedProjects = JSON.parse(stored);
        if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
          setProjects(parsedProjects);
          if (!activeProjectId && parsedProjects.length > 0) {
            setActiveProjectId(parsedProjects[0].id);
          }
          console.log('[useProjects] Projects loaded successfully:', parsedProjects.length);
        }
      } catch (error) {
        console.error('[useProjects] Error parsing projects:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // 🔒 PROTEÇÃO: Save only when we have actual data and are loaded
  useEffect(() => {
    if (!isLoaded) {
      console.log('[useProjects] Skipping save - not loaded yet');
      return;
    }
    
    if (projects.length === 0) {
      console.warn('[useProjects] WARNING: Attempting to save empty projects array - BLOCKED');
      return;
    }
    
    console.log('[useProjects] Saving projects:', projects.length);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, isLoaded]);

  const createProject = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const newProject: Project = {
      id: Date.now().toString(),
      name,
      slug,
      createdAt: new Date(),
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    return newProject;
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
    
    const dataKey = `project-data-${projectId}`;
    localStorage.removeItem(dataKey);
  };

  const getActiveProject = () => {
    return projects.find(p => p.id === activeProjectId) || null;
  };

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
    getActiveProject,
  };
};