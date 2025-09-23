import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, PiggyBank, Edit3, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/mockData';
import { useProjects } from '@/hooks/useProjects';
import { calculateKPIs } from '@/lib/kpiCalculator';
import { DashboardData } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

interface ProjectSummary {
  projectId: string;
  projectName: string;
  period: string;
  data: DashboardData;
}

interface EditableSettings {
  platformTax: number; // %
  tax: number; // %
  participation: number; // %
}

interface EditableRepasseResumoProps {
  projectId?: string; // Se fornecido, filtra apenas este projeto
  showTitle?: boolean; // Se deve mostrar o título
}

export function EditableRepasseResumo({ projectId, showTitle = true }: EditableRepasseResumoProps = {}) {
  const { projects } = useProjects();
  const { toast } = useToast();
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [projectsSummary, setProjectsSummary] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableSettings, setEditableSettings] = useState<EditableSettings>({
    platformTax: 6, // 6%
    tax: 0,
    participation: 100 // 100%
  });

  useEffect(() => {
    loadAvailablePeriods();
    loadSettings();
  }, [projects, projectId]); // Adiciona projectId como dependência

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodSummary();
    }
  }, [selectedPeriod, projects, projectId]); // Adiciona projectId como dependência

  const loadSettings = () => {
    const stored = localStorage.getItem('repasse-settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        setEditableSettings(settings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  };

  const saveSettings = () => {
    localStorage.setItem('repasse-settings', JSON.stringify(editableSettings));
    setIsEditing(false);
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };

  const loadAvailablePeriods = () => {
    const allPeriods = new Set<string>();
    
    // Filtra projetos se projectId for fornecido
    const projectsToProcess = projectId 
      ? projects.filter(p => p.id === projectId)
      : projects;
    
    projectsToProcess.forEach(project => {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          projectData.periods?.forEach((period: any) => {
            allPeriods.add(`${period.year}-${period.month}`);
          });
        } catch (error) {
          console.error(`Error loading periods for project ${project.id}:`, error);
        }
      }
    });

    const sortedPeriods = Array.from(allPeriods).sort().reverse();
    setAvailablePeriods(sortedPeriods);
    
    if (sortedPeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(sortedPeriods[0]);
    }
  };

  const loadPeriodSummary = async () => {
    if (!selectedPeriod) return;
    
    setLoading(true);
    const [year, month] = selectedPeriod.split('-');
    const summaryData: ProjectSummary[] = [];

    // Filtra projetos se projectId for fornecido
    const projectsToProcess = projectId 
      ? projects.filter(p => p.id === projectId)
      : projects;

    for (const project of projectsToProcess) {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          const period = projectData.periods?.find(
            (p: any) => p.year === year && p.month === month
          );

          if (period) {
            const metaAds = period.metaAds || [];
            const sales = period.sales || [];
            
            if (metaAds.length > 0 || sales.length > 0) {
              const dashboardData = calculateKPIs(metaAds, sales);
              
              summaryData.push({
                projectId: project.id,
                projectName: project.name,
                period: selectedPeriod,
                data: dashboardData
              });
            }
          }
        } catch (error) {
          console.error(`Error loading data for project ${project.id}:`, error);
        }
      }
    }

    setProjectsSummary(summaryData);
    setLoading(false);
  };

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  const calculatePartnershipProfit = (data: DashboardData) => {
    const grossProfit = data.kpis.profit; // totalRevenueNet - totalInvestment
    const platformTax = data.kpis.totalRevenueNet * (editableSettings.platformTax / 100);
    const tax = grossProfit * (editableSettings.tax / 100);
    const participation = editableSettings.participation / 100;
    return (grossProfit - platformTax - tax) * participation;
  };

  const totalPartnershipProfit = projectsSummary.reduce((sum, project) => 
    sum + calculatePartnershipProfit(project.data), 0
  );

  if (availablePeriods.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {projectId ? `Repasse do Projeto` : 'Repasse Geral dos Projetos'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {projectId ? 'Resumo financeiro do projeto selecionado' : 'Resumo financeiro por projeto'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48 bg-white shadow-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map(period => (
                  <SelectItem key={period} value={period}>
                    {formatPeriodLabel(period)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar % do Projeto
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!showTitle && (
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48 bg-white shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map(period => (
                <SelectItem key={period} value={period}>
                  {formatPeriodLabel(period)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar % do Projeto
              </>
            )}
          </Button>
        </div>
      )}

      {/* Configurações Editáveis */}
      {isEditing && (
        <Card className="p-4 bg-white shadow-card">
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Configurações de Cálculo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformTax">Taxa de Plataforma (%)</Label>
                <Input
                  id="platformTax"
                  type="number"
                  step="0.1"
                  value={editableSettings.platformTax}
                  onChange={(e) => setEditableSettings(prev => ({
                    ...prev,
                    platformTax: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">Imposto (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.1"
                  value={editableSettings.tax}
                  onChange={(e) => setEditableSettings(prev => ({
                    ...prev,
                    tax: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participation">% de Participação</Label>
                <Input
                  id="participation"
                  type="number"
                  step="0.1"
                  max="100"
                  value={editableSettings.participation}
                  onChange={(e) => setEditableSettings(prev => ({
                    ...prev,
                    participation: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveSettings} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando resumo...</p>
          </div>
        </div>
      ) : projectsSummary.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum projeto encontrado para o período selecionado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload de dados nos projetos para visualizar o resumo
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {projectsSummary.map(project => {
            const partnershipProfit = calculatePartnershipProfit(project.data);
            const platformTax = project.data.kpis.totalRevenueNet * (editableSettings.platformTax / 100);
            const tax = project.data.kpis.profit * (editableSettings.tax / 100);
            
            return (
              <Card key={project.projectId} className="p-4 bg-white shadow-card">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{project.projectName}</h3>
                    <p className="text-xs text-muted-foreground">{formatPeriodLabel(project.period)}</p>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturamento líquido:</span>
                      <span className="font-medium">{formatCurrency(project.data.kpis.totalRevenueNet)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investimento ADS:</span>
                      <span className="font-medium">{formatCurrency(project.data.kpis.totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lucro Bruto:</span>
                      <span className="font-medium">{formatCurrency(project.data.kpis.profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Plataforma ({editableSettings.platformTax}%):</span>
                      <span className="font-medium">{formatCurrency(platformTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imposto ({editableSettings.tax}%):</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">% Participação:</span>
                      <span className="text-xs text-muted-foreground">{editableSettings.participation}%</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground font-medium">Lucro líquido:</span>
                      <span className={`font-semibold ${partnershipProfit > 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(partnershipProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Card do Total Geral */}
          <Card className="p-4 bg-gradient-primary text-primary-foreground shadow-card">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <PiggyBank className="h-4 w-4" />
                <h3 className="font-medium text-sm">{projectId ? 'Repasse do Projeto' : 'Repasse Geral dos Projetos'}</h3>
              </div>
              <div>
                <p className="text-xs opacity-90">{formatPeriodLabel(selectedPeriod)}</p>
                <p className="text-lg font-bold mt-1">
                  {formatCurrency(totalPartnershipProfit)}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Total de {projectsSummary.length} projeto{projectsSummary.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}