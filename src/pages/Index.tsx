import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { Dashboard } from "@/components/Dashboard";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { FileUploadModal } from "@/components/FileUploadModal";
import { ManualSaleModal } from "@/components/ManualSaleModal";
import { ManualSalesHistoryModal } from "@/components/ManualSalesHistoryModal";
import { ProjectSummaryModal } from "@/components/ProjectSummaryModal";
import { ProjectComparisonDashboard } from "@/components/ProjectComparisonDashboard";
import { PublishedReportModal } from "@/components/PublishedReportModal";
import { ProjectSettingsModal } from "@/components/ProjectSettingsModal";
import { EditableRepasseResumo } from "@/components/EditableRepasseResumo";
import { useAllPeriodsData } from "@/hooks/useAllPeriodsData";
import { useProjectsContext } from "@/contexts/ProjectsContext";
import { useProjectData } from "@/hooks/useProjectData";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
    getActiveProject
  } = useProjectsContext();
  const {
    data,
    selectedPeriod,
    setSelectedPeriod,
    processFileUpload,
    addManualSale,
    removeManualSale,
    clearProjectData,
    clearPeriodData,
    getDataForPeriod,
    availablePeriods
  } = useProjectData(activeProjectId);
  const {
    allPeriodsData
  } = useAllPeriodsData(activeProjectId, availablePeriods);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  const [showManualSalesHistoryModal, setShowManualSalesHistoryModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showComparisonDashboard, setShowComparisonDashboard] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const activeProject = getActiveProject();
  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId);
  };
  const handleCreateProject = (name: string) => {
    try {
      createProject(name);
      toast({
        title: "Projeto criado com sucesso!",
        description: `O projeto "${name}" foi criado e está pronto para receber dados.`
      });
    } catch (error) {
      toast({
        title: "Erro ao criar projeto",
        description: "Ocorreu um erro ao criar o projeto. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      deleteProject(projectId);
      toast({
        title: "Projeto excluído",
        description: `O projeto "${project.name}" foi excluído com sucesso.`
      });
    }
  };
  const handleFileUpload = async (file: File, type: 'meta' | 'hotmart' | 'kiwify', headerRow?: number) => {
    if (!activeProject) {
      throw new Error('Nenhum projeto selecionado');
    }
    try {
      const recordsProcessed = await processFileUpload(file, type, headerRow);
      const typeLabel = type === 'meta' ? 'Meta Ads' : type === 'hotmart' ? 'Hotmart' : 'Kiwify';
      toast({
        title: "Upload realizado com sucesso!",
        description: `Planilha ${typeLabel} processada e KPIs atualizados. ${recordsProcessed} registros processados.`
      });
      return recordsProcessed;
    } catch (error) {
      throw error; // Re-throw to be handled by the upload modal
    }
  };
  const handleClearData = (type: 'period' | 'all') => {
    if (type === 'period') {
      clearPeriodData();
      toast({
        title: "Período limpo com sucesso",
        description: "Os dados do período selecionado foram removidos."
      });
    } else {
      clearProjectData();
      toast({
        title: "Dados limpos com sucesso",
        description: "Todos os dados do projeto foram removidos."
      });
    }
  };
  const handleManualSale = async (saleData: {
    date: string;
    product: string;
    net: number;
    gross: number;
  }) => {
    if (!activeProject) {
      throw new Error('Nenhum projeto selecionado');
    }
    try {
      await addManualSale(saleData);
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    }
  };
  return <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-surface">
        <ProjectSidebar projects={projects} activeProjectId={activeProjectId} onProjectSelect={handleProjectSelect} onCreateProject={() => setShowCreateModal(true)} onDeleteProject={handleDeleteProject} />
        
        <main className="flex-1">
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-white/80 backdrop-blur-sm px-6">
            <div className="flex items-center">
              <SidebarTrigger />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/comparativo-geral')}>
                Comparativo Geral
              </Button>
              {activeProject && (
                <span className="text-sm font-medium">{activeProject.name}</span>
              )}
              {activeProject && data.kpis.totalRevenueNet > 0 && <Button variant="outline" size="sm" onClick={() => setShowPublishModal(true)}>
                  Publicar Relatório
                </Button>}
              <h2 className="text-sm font-medium text-muted-foreground">
                A-FONTE Dashboard
              </h2>
            </div>
          </header>
          
          {activeProject ? <>
              {showComparisonDashboard ? <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      Dashboard Comparativo - {activeProject.name}
                    </h1>
                    <Button variant="outline" onClick={() => setShowComparisonDashboard(false)}>
                      Voltar ao Dashboard
                    </Button>
                  </div>
                  <ProjectComparisonDashboard projectName={activeProject.name} periodsData={allPeriodsData} availablePeriods={availablePeriods} />
                </div> : <div className="space-y-6">
                  <Dashboard projectName={activeProject.name} data={data} selectedPeriod={selectedPeriod} availablePeriods={availablePeriods} onPeriodChange={setSelectedPeriod} onUploadClick={() => setShowUploadModal(true)} onManualSaleClick={() => setShowManualSaleModal(true)} onManualSalesHistoryClick={() => setShowManualSalesHistoryModal(true)} onSummaryClick={() => setShowSummaryModal(true)} onComparisonClick={() => setShowComparisonDashboard(true)} onClearData={handleClearData} getDataForPeriod={getDataForPeriod} />
                  
                  {/* Seção de Repasse do Projeto */}
                  {data.kpis.totalRevenueNet > 0 && (
                    <div className="p-4 md:p-6">
                      <EditableRepasseResumo projectId={activeProject.id} showTitle={true} />
                    </div>
                  )}
                </div>}
            </> : <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Nenhum projeto selecionado</p>
                <button onClick={() => setShowCreateModal(true)} className="text-primary hover:text-primary/80 underline">
                  Criar seu primeiro projeto
                </button>
              </div>
            </div>}
        </main>
        
        {/* Modals */}
        <CreateProjectModal open={showCreateModal} onOpenChange={setShowCreateModal} onCreateProject={handleCreateProject} />
        
        {activeProject && <>
            <FileUploadModal open={showUploadModal} onOpenChange={setShowUploadModal} projectId={activeProject.id} projectName={activeProject.name} onFileUpload={handleFileUpload} />
            
            <ManualSaleModal open={showManualSaleModal} onOpenChange={setShowManualSaleModal} onAddSale={handleManualSale} />
            
            <ManualSalesHistoryModal open={showManualSalesHistoryModal} onOpenChange={setShowManualSalesHistoryModal} projectId={activeProject.id} onRemoveManualSale={removeManualSale} />
            
            <ProjectSummaryModal open={showSummaryModal} onOpenChange={setShowSummaryModal} projectName={activeProject.name} dashboardData={data} period={selectedPeriod} />
            
            <PublishedReportModal open={showPublishModal} onOpenChange={setShowPublishModal} projectId={activeProject.id} availablePeriods={availablePeriods} reportData={{
          period: selectedPeriod,
          totalRevenue: data.kpis.totalRevenueNet,
          totalInvestment: data.kpis.totalInvestment,
          totalProfit: data.kpis.profit,
          roas: data.kpis.roas
        }} fullDashboardData={data} />
            
            <ProjectSettingsModal projectId={activeProject.id} projectName={activeProject.name} open={showProjectSettingsModal} onOpenChange={setShowProjectSettingsModal} />
          </>}
      </div>
    </SidebarProvider>;
};
export default Index;