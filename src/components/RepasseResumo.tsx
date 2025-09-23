import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/mockData';
import { useProjects } from '@/hooks/useProjects';
import { calculateKPIs } from '@/lib/kpiCalculator';
import { DashboardData } from '@/types/project';

interface ProjectSummary {
  projectId: string;
  projectName: string;
  period: string;
  data: DashboardData;
}

export function RepasseResumo() {
  const { projects } = useProjects();
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [projectsSummary, setProjectsSummary] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailablePeriods();
  }, [projects]);

  useEffect(() => {
    if (selectedPeriod) {
      loadPeriodSummary();
    }
  }, [selectedPeriod, projects]);

  const loadAvailablePeriods = () => {
    const allPeriods = new Set<string>();
    
    projects.forEach(project => {
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

    for (const project of projects) {
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
    const midtafyTax = data.kpis.totalRevenueNet * 0.06; // 6%
    const participation = 1.0; // 100%
    return (grossProfit - midtafyTax) * participation;
  };

  const totalPartnershipProfit = projectsSummary.reduce((sum, project) => 
    sum + calculatePartnershipProfit(project.data), 0
  );

  if (availablePeriods.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Repasse Geral dos Projetos</h2>
          <p className="text-sm text-muted-foreground">Resumo financeiro por projeto</p>
        </div>
        
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
      </div>

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
            const midtafyTax = project.data.kpis.totalRevenueNet * 0.06;
            
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
                      <span className="text-muted-foreground">% Participação:</span>
                      <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imposto MIDIAFY:</span>
                      <span className="font-medium">{formatCurrency(midtafyTax)}</span>
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
                <h3 className="font-medium text-sm">Repasse Geral dos Projetos</h3>
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