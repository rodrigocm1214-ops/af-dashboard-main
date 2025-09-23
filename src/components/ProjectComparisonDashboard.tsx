import { useState, useMemo } from 'react';
import { BarChart3, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardData, KPIs } from '@/types/project';
import { formatCurrency, formatNumber } from '@/lib/mockData';

interface PeriodData {
  period: string;
  data: DashboardData;
}

interface ProjectComparisonDashboardProps {
  projectName: string;
  periodsData: PeriodData[];
  availablePeriods: string[];
}

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  formatter: (value: number) => string;
  unit?: string;
}

export function ProjectComparisonDashboard({ 
  projectName, 
  periodsData, 
  availablePeriods 
}: ProjectComparisonDashboardProps) {
  const [selectedPeriods, setSelectedPeriods] = useState<[string, string]>(['', '']);
  const [comparisonType, setComparisonType] = useState<'periods' | 'days'>('periods');

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, trend: 'neutral' as const };
    const percentage = ((current - previous) / previous) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    return { percentage: Math.abs(percentage), trend };
  };

  const getComparisonData = useMemo(() => {
    if (!selectedPeriods[0] || !selectedPeriods[1]) return null;

    const currentData = periodsData.find(p => p.period === selectedPeriods[0]);
    const previousData = periodsData.find(p => p.period === selectedPeriods[1]);

    if (!currentData || !previousData) return null;

    const metrics: ComparisonMetric[] = [
      {
        label: 'Receita Líquida',
        current: currentData.data.kpis.totalRevenueNet,
        previous: previousData.data.kpis.totalRevenueNet,
        formatter: formatCurrency
      },
      {
        label: 'Investimento',
        current: currentData.data.kpis.totalInvestment,
        previous: previousData.data.kpis.totalInvestment,
        formatter: formatCurrency
      },
      {
        label: 'ROAS',
        current: currentData.data.kpis.roas,
        previous: previousData.data.kpis.roas,
        formatter: (val) => `${formatNumber(val, 2)}x`
      },
      {
        label: 'Vendas',
        current: currentData.data.kpis.totalSales,
        previous: previousData.data.kpis.totalSales,
        formatter: (val) => formatNumber(val)
      },
      {
        label: 'Ticket Médio',
        current: currentData.data.kpis.averageTicket,
        previous: previousData.data.kpis.averageTicket,
        formatter: formatCurrency
      },
      {
        label: 'Lucro',
        current: currentData.data.kpis.profit,
        previous: previousData.data.kpis.profit,
        formatter: formatCurrency
      }
    ];

    return { currentData, previousData, metrics };
  }, [selectedPeriods, periodsData]);

  const getDailyComparison = useMemo(() => {
    if (!selectedPeriods[0]) return null;

    const periodData = periodsData.find(p => p.period === selectedPeriods[0]);
    if (!periodData || !periodData.data.dailyKpis.length) return null;

    // Compare each day with the previous day
    const dailyComparisons = periodData.data.dailyKpis.map((day, index) => {
      const previousDay = index > 0 ? periodData.data.dailyKpis[index - 1] : null;
      
      return {
        date: day.date,
        current: day,
        previous: previousDay,
        variations: previousDay ? {
          investment: calculateVariation(day.investment, previousDay.investment),
          sales: calculateVariation(day.sales, previousDay.sales),
          revenue: calculateVariation(day.revenue, previousDay.revenue),
          roas: calculateVariation(day.roas, previousDay.roas)
        } : null
      };
    });

    return dailyComparisons;
  }, [selectedPeriods, periodsData]);

  const VariationIndicator = ({ variation }: { variation: ReturnType<typeof calculateVariation> }) => {
    const colors = {
      up: 'text-success bg-success/10',
      down: 'text-danger bg-danger/10',
      neutral: 'text-muted-foreground bg-muted/10'
    };

    const icons = {
      up: ArrowUpRight,
      down: ArrowDownRight,
      neutral: Minus
    };

    const Icon = icons[variation.trend];

    return (
      <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${colors[variation.trend]}`}>
        <Icon className="h-3 w-3" />
        <span>{variation.percentage.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Análise Comparativa - {projectName}
          </h2>
        </div>
        
        <Tabs value={comparisonType} onValueChange={(value) => setComparisonType(value as any)}>
          <TabsList>
            <TabsTrigger value="periods">Entre Períodos</TabsTrigger>
            <TabsTrigger value="days">Dias do Período</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={comparisonType} className="w-full">
        <TabsContent value="periods" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Período Atual
              </label>
              <Select 
                value={selectedPeriods[0]} 
                onValueChange={(value) => setSelectedPeriods([value, selectedPeriods[1]])}
              >
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecionar período atual" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {formatPeriodLabel(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Período de Comparação
              </label>
              <Select 
                value={selectedPeriods[1]} 
                onValueChange={(value) => setSelectedPeriods([selectedPeriods[0], value])}
              >
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecionar período anterior" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.filter(p => p !== selectedPeriods[0]).map((period) => (
                    <SelectItem key={period} value={period}>
                      {formatPeriodLabel(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {getComparisonData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getComparisonData.metrics.map((metric, index) => {
                const variation = calculateVariation(metric.current, metric.previous);
                
                return (
                  <Card key={index} className="p-4 bg-gradient-surface border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </h3>
                      <VariationIndicator variation={variation} />
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {formatPeriodLabel(selectedPeriods[0])} (Atual)
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {metric.formatter(metric.current)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {formatPeriodLabel(selectedPeriods[1])} (Anterior)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {metric.formatter(metric.previous)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {(!selectedPeriods[0] || !selectedPeriods[1]) && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Selecione dois períodos para comparar</p>
              <p className="text-sm mt-2">
                Escolha o período atual e o período de comparação para ver as variações.
              </p>
            </div>
          )}

          {getComparisonData && !getComparisonData.currentData && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Dados não encontrados para os períodos selecionados.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="days" className="space-y-6">
          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Selecionar Período
            </label>
            <Select 
              value={selectedPeriods[0]} 
              onValueChange={(value) => setSelectedPeriods([value, selectedPeriods[1]])}
            >
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {formatPeriodLabel(period)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {getDailyComparison && getDailyComparison.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-center">Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getDailyComparison.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <span>{formatCurrency(day.current.investment)}</span>
                          {day.variations && (
                            <div className="flex justify-end">
                              <VariationIndicator variation={day.variations.investment} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <span>{day.current.sales}</span>
                          {day.variations && (
                            <div className="flex justify-end">
                              <VariationIndicator variation={day.variations.sales} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <span>{formatCurrency(day.current.revenue)}</span>
                          {day.variations && (
                            <div className="flex justify-end">
                              <VariationIndicator variation={day.variations.revenue} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <span className={`font-medium ${
                            day.current.roas > 2 ? 'text-success' : 
                            day.current.roas > 1 ? 'text-info' : 'text-danger'
                          }`}>
                            {formatNumber(day.current.roas, 2)}x
                          </span>
                          {day.variations && (
                            <div className="flex justify-end">
                              <VariationIndicator variation={day.variations.roas} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {!day.previous ? (
                          <Badge variant="secondary" className="text-xs">
                            Primeiro dia
                          </Badge>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            {day.variations?.roas.trend === 'up' && (
                              <Badge className="bg-success/10 text-success text-xs">
                                Melhorando
                              </Badge>
                            )}
                            {day.variations?.roas.trend === 'down' && (
                              <Badge className="bg-danger/10 text-danger text-xs">
                                Piorando
                              </Badge>
                            )}
                            {day.variations?.roas.trend === 'neutral' && (
                              <Badge variant="secondary" className="text-xs">
                                Estável
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : selectedPeriods[0] ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado diário encontrado para este período.</p>
              <p className="text-sm mt-2">
                Faça upload das planilhas para ver a comparação diária.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Selecione um período</p>
              <p className="text-sm mt-2">
                Escolha um período para ver a comparação entre os dias.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}