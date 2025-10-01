import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Download, Calendar, TrendingUp, DollarSign, Target, PiggyBank, Filter, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/mockData';
import { useProjectsContext } from '@/contexts/ProjectsContext';
import { calculateKPIs } from '@/lib/kpiCalculator';
import { DashboardData } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { EditableRepasseResumo } from '@/components/EditableRepasseResumo';
import { UserMenu } from '@/components/UserMenu';

/**
 * DASHBOARD COMPARATIVO ISOLADO
 * 
 * ⚠️ ATENÇÃO: Este componente é COMPLETAMENTE ISOLADO do estado global dos projetos.
 * 
 * NUNCA deve modificar:
 * - Estado global de projetos (setProjects, setActiveProject, etc.)
 * - Dados de projetos em localStorage (apenas leitura)
 * - Estados de outros componentes
 * 
 * COMPORTAMENTO ESPERADO:
 * - Apenas LEITURA dos dados existentes no localStorage
 * - Estado local isolado para seleções e comparações
 * - Ao sair desta tela, todos os dados dos projetos devem estar preservados
 */

interface ProjectPeriodData {
  projectId: string;
  projectName: string;
  period: string;
  data: DashboardData;
}

interface ComparativeData {
  project: string;
  period: string;
  faturamento: number;
  investimento: number;
  lucro_liquido: number;
  roas: number;
}

const ComparativoGeral = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projects } = useProjectsContext();
  
  // Debug: Log projects when component mounts or projects change
  useEffect(() => {
    console.log('=== COMPARATIVO GERAL - PROJETOS ===');
    console.log('Total de projetos:', projects.length);
    console.log('Projetos encontrados:', projects.map(p => ({ id: p.id, name: p.name })));
  }, [projects]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [projectsData, setProjectsData] = useState<ProjectPeriodData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'faturamento' | 'investimento' | 'lucro' | 'roas'>('faturamento');
  const [selectedDay, setSelectedDay] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'projects' | 'periods'>('projects');

  useEffect(() => {
    console.log('=== CARREGANDO PERÍODOS DISPONÍVEIS ===');
    console.log('Projetos recebidos:', projects.length);
    console.log('Projetos:', projects.map(p => ({ id: p.id, name: p.name })));
    loadAvailablePeriods();
  }, [projects]);

  useEffect(() => {
    loadComparativeData();
  }, [selectedProjects, selectedPeriods, projects, comparisonMode]);

  useEffect(() => {
    loadAvailableDays();
  }, [projectsData]);

  const loadAvailablePeriods = () => {
    console.log('=== CARREGANDO PERÍODOS DISPONÍVEIS ===');
    console.log('Projetos:', projects.map(p => ({ id: p.id, name: p.name })));
    
    const allPeriods = new Set<string>();
    const projectsWithData: string[] = [];
    
    projects.forEach(project => {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      console.log(`Projeto ${project.name} (${project.id}):`, stored ? 'TEM DADOS' : 'SEM DADOS');
      
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          console.log(`Dados do projeto ${project.name}:`, {
            periods: projectData.periods?.length || 0,
            periodsDetail: projectData.periods?.map((p: any) => ({
              period: `${p.year}-${p.month}`,
              metaAds: p.metaAds?.length || 0,
              sales: p.sales?.length || 0
            }))
          });
          
          if (projectData.periods?.length > 0) {
            projectsWithData.push(project.id);
            projectData.periods.forEach((period: any) => {
              allPeriods.add(`${period.year}-${period.month}`);
            });
          }
        } catch (error) {
          console.error(`Error loading periods for project ${project.id}:`, error);
        }
      }
    });

    const sortedPeriods = Array.from(allPeriods).sort().reverse();
    console.log('Períodos encontrados:', sortedPeriods);
    console.log('Projetos com dados:', projectsWithData);
    
    setAvailablePeriods(sortedPeriods);
    
    // Auto-select ONLY if nothing is currently selected AND we have data
    if (sortedPeriods.length > 0 && selectedPeriods.length === 0) {
      const periodsToSelect = sortedPeriods.slice(0, Math.min(3, sortedPeriods.length));
      console.log('Auto-selecionando períodos:', periodsToSelect);
      setSelectedPeriods(periodsToSelect);
    }
    
    if (projectsWithData.length > 0 && selectedProjects.length === 0) {
      const projectsToSelect = projectsWithData.slice(0, Math.min(3, projectsWithData.length));
      console.log('Auto-selecionando projetos:', projectsToSelect);
      setSelectedProjects(projectsToSelect);
    }
  };

  const loadComparativeData = async () => {
    console.log('=== CARREGANDO DADOS COMPARATIVOS ===');
    console.log('Modo de comparação:', comparisonMode);
    console.log('Projetos selecionados:', selectedProjects);
    console.log('Períodos selecionados:', selectedPeriods);
    
    // Só limpa os dados se realmente não há nada selecionado
    if (selectedProjects.length === 0 && selectedPeriods.length === 0) {
      console.log('Não há projetos nem períodos selecionados, limpando dados');
      setProjectsData([]);
      return;
    }
    
    setLoading(true);
    const periodData: ProjectPeriodData[] = [];

    const projectsToLoad = selectedProjects.length > 0 ? 
      projects.filter(p => selectedProjects.includes(p.id)) : 
      projects;
    
    const periodsToLoad = selectedPeriods.length > 0 ? 
      selectedPeriods :
      availablePeriods.slice(0, 3); // Usa até 3 períodos mais recentes se nenhum for selecionado

    console.log('Projetos para carregar:', projectsToLoad.map(p => p.name));
    console.log('Períodos para carregar:', periodsToLoad);

    for (const project of projectsToLoad) {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      
      console.log(`Carregando dados do projeto ${project.name}:`, stored ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          console.log(`Estrutura de dados do projeto ${project.name}:`, {
            periods: projectData.periods?.length || 0,
            periodsDetail: projectData.periods?.map((p: any) => `${p.year}-${p.month}`)
          });
          
          for (const periodStr of periodsToLoad) {
            const [year, month] = periodStr.split('-');
            const period = projectData.periods?.find(
              (p: any) => p.year === year && p.month === month
            );

            console.log(`Buscando período ${periodStr} no projeto ${project.name}:`, period ? 'ENCONTRADO' : 'NÃO ENCONTRADO');

            if (period) {
              const metaAds = period.metaAds || [];
              const sales = period.sales || [];
              
              console.log(`Dados do período ${periodStr} - ${project.name}:`, {
                metaAds: metaAds.length,
                sales: sales.length
              });
              
              if (metaAds.length > 0 || sales.length > 0) {
                const dashboardData = calculateKPIs(metaAds, sales);
                console.log(`KPIs calculados para ${project.name} - ${periodStr}:`, {
                  faturamento: dashboardData.kpis.totalRevenueNet,
                  investimento: dashboardData.kpis.totalInvestment,
                  lucro: dashboardData.kpis.profit
                });
                
                periodData.push({
                  projectId: project.id,
                  projectName: project.name,
                  period: periodStr,
                  data: dashboardData
                });
              } else {
                console.log(`Período ${periodStr} do projeto ${project.name} não tem dados válidos`);
              }
            }
          }
        } catch (error) {
          console.error(`Error loading data for project ${project.id}:`, error);
        }
      }
    }

    console.log('Dados finais carregados:', periodData.length, 'registros');
    console.log('Resumo dos dados:', periodData.map(p => ({
      projeto: p.projectName,
      periodo: p.period,
      faturamento: p.data.kpis.totalRevenueNet
    })));

    setProjectsData(periodData);
    setLoading(false);
  };

  const loadAvailableDays = () => {
    if (selectedPeriods.length === 0) return;

    const allDays = new Set<string>();
    
    projectsData.forEach(project => {
      project.data.dailyKpis.forEach(day => {
        allDays.add(day.date);
      });
    });

    const sortedDays = Array.from(allDays).sort();
    setAvailableDays(sortedDays);
    
    if (sortedDays.length > 0 && !selectedDay) {
      setSelectedDay(sortedDays[0]);
    }
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

  const exportComparativeData = () => {
    const comparativeData: ComparativeData[] = projectsData.map(project => ({
      project: project.projectName,
      period: project.period,
      faturamento: project.data.kpis.totalRevenueNet,
      investimento: project.data.kpis.totalInvestment,
      lucro_liquido: calculatePartnershipProfit(project.data),
      roas: project.data.kpis.roas
    }));

    const jsonData = {
      comparativo: comparativeData
    };

    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    toast({
      title: "JSON copiado!",
      description: "Os dados comparativos foram copiados para a área de transferência.",
    });
  };

  const getChartData = () => {
    return projectsData.map(project => ({
      projeto: project.projectName,
      faturamento: project.data.kpis.totalRevenueNet,
      investimento: project.data.kpis.totalInvestment,
      lucro: calculatePartnershipProfit(project.data),
      roas: project.data.kpis.roas
    }));
  };

  const getMetricLabel = (metric: string) => {
    const labels = {
      faturamento: 'Faturamento Líquido',
      investimento: 'Investimento',
      lucro: 'Lucro Líquido da Parceria',
      roas: 'ROAS'
    };
    return labels[metric as keyof typeof labels];
  };

  const getDailyProjectData = (projectData: ProjectPeriodData, date: string) => {
    const dayData = projectData.data.dailyKpis.find(d => d.date === date);
    return dayData || {
      date,
      investment: 0,
      sales: 0,
      revenue: 0,
      roas: 0,
      cac: 0,
      averageTicket: 0
    };
  };

  const totalPartnershipProfit = projectsData.reduce((sum, project) => 
    sum + calculatePartnershipProfit(project.data), 0
  );

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const handlePeriodSelection = (period: string, checked: boolean) => {
    if (checked) {
      setSelectedPeriods(prev => [...prev, period]);
    } else {
      setSelectedPeriods(prev => prev.filter(p => p !== period));
    }
  };

  const getTimeSeriesData = () => {
    if (comparisonMode === 'projects') {
      // Group by period, show projects
      const grouped: { [period: string]: any } = {};
      
      projectsData.forEach(project => {
        if (!grouped[project.period]) {
          grouped[project.period] = { period: formatPeriodLabel(project.period) };
        }
        grouped[project.period][project.projectName] = project.data.kpis.totalRevenueNet;
      });
      
      return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period));
    } else {
      // Group by project, show periods
      const grouped: { [project: string]: any } = {};
      
      projectsData.forEach(project => {
        if (!grouped[project.projectName]) {
          grouped[project.projectName] = { project: project.projectName };
        }
        grouped[project.projectName][formatPeriodLabel(project.period)] = project.data.kpis.totalRevenueNet;
      });
      
      return Object.values(grouped);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-surface">
        <ProjectSidebar
          projects={projects}
          activeProjectId={null}
          onProjectSelect={() => {}}
          onCreateProject={() => {}}
          onDeleteProject={() => {}}
        />
        
        <main className="flex-1">
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-white/80 backdrop-blur-sm px-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </div>
            <UserMenu />
            <h2 className="text-sm font-medium text-muted-foreground">
              Dashboard Comparativo Geral
            </h2>
          </header>

          <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Dashboard Comparativo Geral
                </h1>
                <p className="text-muted-foreground mt-1">
                  Compare a performance entre todos os projetos
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
                  <SelectTrigger className="w-full sm:w-48 bg-white shadow-sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Comparar Projetos</SelectItem>
                    <SelectItem value="periods">Comparar Períodos</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={exportComparativeData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Copiar JSON
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Carregando dados...</p>
                </div>
              </div>
            ) : projectsData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum projeto encontrado para o período selecionado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça upload de dados nos projetos para visualizar as comparações
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Filtros */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4 bg-white shadow-card">
                    <div className="flex items-center space-x-2 mb-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Filtrar Projetos</h3>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={(checked) => handleProjectSelection(project.id, !!checked)}
                          />
                          <label htmlFor={`project-${project.id}`} className="text-sm cursor-pointer">
                            {project.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-white shadow-card">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Filtrar Períodos</h3>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availablePeriods.map(period => (
                        <div key={period} className="flex items-center space-x-2">
                          <Checkbox
                            id={`period-${period}`}
                            checked={selectedPeriods.includes(period)}
                            onCheckedChange={(checked) => handlePeriodSelection(period, !!checked)}
                          />
                          <label htmlFor={`period-${period}`} className="text-sm cursor-pointer">
                            {formatPeriodLabel(period)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="repasse">Repasse Geral</TabsTrigger>
                  <TabsTrigger value="trends">Tendências</TabsTrigger>
                  <TabsTrigger value="detailed">Detalhado</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Cards de Resumo por Projeto */}
                  <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {projectsData.map(project => {
                      const partnershipProfit = calculatePartnershipProfit(project.data);
                      const midtafyTax = project.data.kpis.totalRevenueNet * 0.06;
                      
                      return (
                        <Card key={project.projectId} className="p-6 bg-white shadow-card">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold text-foreground">{project.projectName}</h3>
                              <p className="text-sm text-muted-foreground">{formatPeriodLabel(project.period)}</p>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Faturamento líquido:</span>
                                <span className="font-medium">{formatCurrency(project.data.kpis.totalRevenueNet)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Investimento em ADS:</span>
                                <span className="font-medium">{formatCurrency(project.data.kpis.totalInvestment)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Lucro Bruto:</span>
                                <span className="font-medium">{formatCurrency(project.data.kpis.profit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">% Participação:</span>
                                <span className="text-xs text-muted-foreground">100% (futuramente editável)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Imposto MIDIAFY (6%):</span>
                                <span className="font-medium">{formatCurrency(midtafyTax)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-sm font-medium">Lucro líquido da parceria:</span>
                                <span className={`font-semibold ${partnershipProfit > 0 ? 'text-success' : 'text-danger'}`}>
                                  {formatCurrency(partnershipProfit)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                    {/* Card do Repasse Geral */}
                    <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-card">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <PiggyBank className="h-5 w-5" />
                          <h3 className="font-semibold">Repasse Geral dos Projetos</h3>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">
                            {selectedPeriods.length > 0 ? formatPeriodLabel(selectedPeriods[0]) : 'Múltiplos períodos'}
                          </p>
                          <p className="text-2xl font-bold mt-2">
                            {formatCurrency(totalPartnershipProfit)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Tabela Comparativa */}
                  <Card className="p-6 bg-white shadow-card">
                    <h3 className="text-lg font-semibold mb-4">Comparação Lado a Lado</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Projeto</TableHead>
                            <TableHead className="text-right">Faturamento Líquido</TableHead>
                            <TableHead className="text-right">Investimento</TableHead>
                            <TableHead className="text-right">Lucro Bruto</TableHead>
                            <TableHead className="text-right">ROAS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectsData.map(project => (
                            <TableRow key={project.projectId}>
                              <TableCell className="font-medium">{project.projectName}</TableCell>
                              <TableCell className="text-right">{formatCurrency(project.data.kpis.totalRevenueNet)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(project.data.kpis.totalInvestment)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(project.data.kpis.profit)}</TableCell>
                              <TableCell className="text-right">{formatNumber(project.data.kpis.roas, 2)}x</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  {/* Gráfico de Barras */}
                  <Card className="p-6 bg-white shadow-card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 className="text-lg font-semibold">Comparação Visual</h3>
                      <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faturamento">Faturamento</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                          <SelectItem value="lucro">Lucro</SelectItem>
                          <SelectItem value="roas">ROAS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="projeto" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [
                              selectedMetric === 'roas' ? `${formatNumber(value, 2)}x` : formatCurrency(value),
                              getMetricLabel(selectedMetric)
                            ]}
                          />
                          <Bar 
                            dataKey={selectedMetric} 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="repasse" className="space-y-6">
                  <EditableRepasseResumo showTitle={true} />
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                  <Card className="p-6 bg-white shadow-card">
                    <h3 className="text-lg font-semibold mb-4">Análise de Tendências</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getTimeSeriesData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={comparisonMode === 'projects' ? 'period' : 'project'} />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [formatCurrency(value), 'Faturamento']} />
                          {comparisonMode === 'projects' ? 
                            selectedProjects.map((projectId, index) => {
                              const project = projects.find(p => p.id === projectId);
                              return project ? (
                                <Line 
                                  key={projectId}
                                  type="monotone" 
                                  dataKey={project.name} 
                                  stroke={`hsl(${index * 50}, 70%, 50%)`}
                                  strokeWidth={2}
                                />
                              ) : null;
                            }) :
                            selectedPeriods.map((period, index) => (
                              <Line 
                                key={period}
                                type="monotone" 
                                dataKey={formatPeriodLabel(period)} 
                                stroke={`hsl(${index * 50}, 70%, 50%)`}
                                strokeWidth={2}
                              />
                            ))
                          }
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-6">
                  {availableDays.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum dado diário disponível para o período selecionado</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-start">
                        <Select value={selectedDay} onValueChange={setSelectedDay}>
                          <SelectTrigger className="w-48 bg-white shadow-sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Selecione um dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDays.map(day => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedDay && (
                        <Card className="p-6 bg-white shadow-card">
                          <h3 className="text-lg font-semibold mb-4">Comparação Diária - {selectedDay}</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Projeto</TableHead>
                                  <TableHead className="text-right">Faturamento do Dia</TableHead>
                                  <TableHead className="text-right">Investimento do Dia</TableHead>
                                  <TableHead className="text-right">Lucro do Dia</TableHead>
                                  <TableHead className="text-right">ROAS do Dia</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {projectsData.map(project => {
                                  const dayData = getDailyProjectData(project, selectedDay);
                                  const dailyProfit = dayData.revenue - dayData.investment;
                                  
                                  return (
                                    <TableRow key={project.projectId}>
                                      <TableCell className="font-medium">{project.projectName}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(dayData.revenue)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(dayData.investment)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(dailyProfit)}</TableCell>
                                      <TableCell className="text-right">{formatNumber(dayData.roas, 2)}x</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                  {/* Tabela Detalhada */}
                  <Card className="p-6 bg-white shadow-card">
                    <h3 className="text-lg font-semibold mb-4">Dados Detalhados</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead className="text-right">Faturamento Líquido</TableHead>
                            <TableHead className="text-right">Investimento</TableHead>
                            <TableHead className="text-right">Lucro Bruto</TableHead>
                            <TableHead className="text-right">ROAS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectsData.map(project => (
                            <TableRow key={`${project.projectId}-${project.period}`}>
                              <TableCell className="font-medium">{project.projectName}</TableCell>
                              <TableCell>{formatPeriodLabel(project.period)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(project.data.kpis.totalRevenueNet)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(project.data.kpis.totalInvestment)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(project.data.kpis.profit)}</TableCell>
                              <TableCell className="text-right">{formatNumber(project.data.kpis.roas, 2)}x</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ComparativoGeral;