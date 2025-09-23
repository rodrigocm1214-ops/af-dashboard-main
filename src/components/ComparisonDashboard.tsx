import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Project } from '@/types/project';
import { formatCurrency, formatNumber } from '@/lib/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useComparativeDashboard } from '@/hooks/useComparativeDashboard';

interface ComparisonDashboardProps {
  projects: Project[];
}

export function ComparisonDashboard({ projects }: ComparisonDashboardProps) {
  const [comparisonType, setComparisonType] = useState<'periods' | 'projects'>('periods');
  
  const {
    availablePeriods,
    selectedProjects,
    selectedPeriods,
    projectsData,
    periodComparisonData,
    isLoading,
    setSelectedProjects,
    setSelectedPeriods,
    formatPeriodLabel,
  } = useComparativeDashboard(projects);

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, trend: 'neutral' as const };
    const percentage = ((current - previous) / previous) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    return { percentage: Math.abs(percentage), trend };
  };


  const ComparisonCard = ({ 
    title, 
    current, 
    previous, 
    formatter = (val: number) => val.toString(),
    icon: Icon 
  }: {
    title: string;
    current: number;
    previous: number;
    formatter?: (val: number) => string;
    icon: any;
  }) => {
    const variation = calculateVariation(current, previous);
    
    return (
      <Card className="p-4 bg-white shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
            variation.trend === 'up' 
              ? 'bg-success/10 text-success' 
              : variation.trend === 'down' 
                ? 'bg-danger/10 text-danger' 
                : 'bg-muted/10 text-muted-foreground'
          }`}>
            {variation.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {variation.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            <span>{variation.percentage.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Atual</p>
            <p className="text-lg font-semibold text-foreground">{formatter(current)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Anterior</p>
            <p className="text-sm text-muted-foreground">{formatter(previous)}</p>
          </div>
        </div>
      </Card>
    );
  };

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

  if (isLoading) {
    return (
      <Card className="p-6 bg-white shadow-card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Carregando dados comparativos...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Dashboard Comparativo</h2>
        </div>
        
        <Tabs value={comparisonType} onValueChange={(value) => setComparisonType(value as any)}>
          <TabsList>
            <TabsTrigger value="periods">Por Período</TabsTrigger>
            <TabsTrigger value="projects">Por Projeto</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={comparisonType} className="w-full">
        <TabsContent value="periods" className="space-y-6">
          {/* Filtros de Período */}
          <Card className="p-4 bg-white shadow-card">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Selecionar Períodos</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
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

          {periodComparisonData.length >= 2 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ComparisonCard
                title="Receita Líquida"
                current={periodComparisonData[0]?.kpis.totalRevenueNet || 0}
                previous={periodComparisonData[1]?.kpis.totalRevenueNet || 0}
                formatter={formatCurrency}
                icon={TrendingUp}
              />
              <ComparisonCard
                title="Investimento"
                current={periodComparisonData[0]?.kpis.totalInvestment || 0}
                previous={periodComparisonData[1]?.kpis.totalInvestment || 0}
                formatter={formatCurrency}
                icon={TrendingDown}
              />
              <ComparisonCard
                title="ROAS"
                current={periodComparisonData[0]?.kpis.roas || 0}
                previous={periodComparisonData[1]?.kpis.roas || 0}
                formatter={(val) => `${formatNumber(val, 2)}x`}
                icon={BarChart3}
              />
              <ComparisonCard
                title="Vendas"
                current={periodComparisonData[0]?.kpis.totalSales || 0}
                previous={periodComparisonData[1]?.kpis.totalSales || 0}
                formatter={(val) => formatNumber(val)}
                icon={Calendar}
              />
            </div>
          )}

          {periodComparisonData.length < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Dados Insuficientes</p>
              <p className="text-sm mt-2">
                Selecione pelo menos 2 períodos com dados para fazer comparações.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {/* Filtros de Projeto */}
          <Card className="p-4 bg-white shadow-card">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Selecionar Projetos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
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

          {projectsData.length >= 2 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {projectsData.slice(0, 2).map((project, index) => (
                <div key={project.projectId} className="space-y-4">
                  <h4 className="font-medium text-foreground">{project.projectName}</h4>
                  <div className="grid gap-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Receita: </span>
                      <span className="font-semibold">{formatCurrency(project.data.kpis.totalRevenueNet)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">ROAS: </span>
                      <span className="font-semibold">{formatNumber(project.data.kpis.roas, 2)}x</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Vendas: </span>
                      <span className="font-semibold">{formatNumber(project.data.kpis.totalSales)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {projectsData.length < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Dados Insuficientes</p>
              <p className="text-sm mt-2">
                Selecione pelo menos 2 projetos com dados para fazer comparações.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}