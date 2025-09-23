import { useState } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Calendar, Trash2, BarChart3 } from 'lucide-react';
import { Project } from '@/types/project';
import { CalendarModal } from '@/components/CalendarModal';
import { AppSettingsModal } from '@/components/AppSettingsModal';
import { cn } from '@/lib/utils';

const getProjectColor = (index: number) => {
  const colors = [
    'hsl(var(--project-color-1))',
    'hsl(var(--project-color-2))',
    'hsl(var(--project-color-3))',
    'hsl(var(--project-color-4))',
    'hsl(var(--project-color-5))',
    'hsl(var(--project-color-6))',
    'hsl(var(--project-color-7))',
    'hsl(var(--project-color-8))',
  ];
  return colors[index % colors.length];
};

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectSidebar({ 
  projects, 
  activeProjectId, 
  onProjectSelect, 
  onCreateProject,
  onDeleteProject
}: ProjectSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  return (
    <>
      <Sidebar className="border-r border-border/50 bg-gradient-surface" collapsible="icon">
        <SidebarContent className="p-2">
          <div className="mb-4">
            <Button 
              onClick={onCreateProject}
              className={cn(
                "w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-card",
                isCollapsed ? "px-2" : "px-4"
              )}
              size={isCollapsed ? 'icon' : 'default'}
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Novo Projeto</span>}
            </Button>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className={cn(
              "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
              !isCollapsed ? "px-2" : "px-0"
            )}>
              {!isCollapsed && `Projetos (${projects.length})`}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {projects.map((project, index) => {
                  const projectColor = getProjectColor(index);
                  const isActive = activeProjectId === project.id;
                  
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        onClick={() => onProjectSelect(project.id)}
                        className={cn(
                          'flex items-center w-full transition-all duration-200 group relative',
                          'hover:bg-surface-accent hover:shadow-sm rounded-lg',
                          isActive && 'shadow-card ring-2 ring-offset-2',
                          isCollapsed ? 'p-2 justify-center' : 'p-3'
                        )}
                        style={isActive ? {
                          backgroundColor: `${projectColor}20`,
                          borderColor: projectColor,
                          color: projectColor
                        } : {}}
                        title={isCollapsed ? project.name : undefined}
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0 mr-3"
                          style={{ backgroundColor: projectColor }}
                        />
                        <BarChart3 className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <div className="ml-3 min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {project.name}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 h-6 w-6 hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!isCollapsed && (
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setShowCalendarModal(true)}
                      className="w-full justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Calendário</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setShowSettingsModal(true)}
                      className="w-full justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>

      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-danger hover:bg-danger/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CalendarModal
        open={showCalendarModal}
        onOpenChange={setShowCalendarModal}
        onPeriodSelect={(period) => console.log('Selected period:', period)}
      />

      <AppSettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </>
  );
}