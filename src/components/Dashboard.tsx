import { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Target,
  Calendar,
  Upload,
  Download,
  Trash2,
  Plus,
  FileText,
  BarChart3
} from 'lucide-react';
import { useTrendAnalysis } from '@/hooks/useTrendAnalysis';
import { KPICard } from './KPICard';
import { EditableRepasseResumo } from './EditableRepasseResumo';
import { DashboardData } from '@/types/project';
import { formatCurrency, formatNumber } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DashboardProps {
  projectName: string;
  data: DashboardData;
  selectedPeriod: string;
  availablePeriods: string[];
  onPeriodChange: (period: string) => void;
  onUploadClick: () => void;
  onManualSaleClick: () => void;
  onManualSalesHistoryClick?: () => void;
  onSummaryClick: () => void;
  onComparisonClick: () => void;
  onClearData: (type: 'period' | 'all') => void;
  getDataForPeriod: (period: string) => DashboardData;
}

export function Dashboard({ 
  projectName, 
  data, 
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  onUploadClick,
  onManualSaleClick,
  onManualSalesHistoryClick,
  onSummaryClick,
  onComparisonClick,
  onClearData,
  getDataForPeriod
}: DashboardProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Calculate trends using the new hook
  const trends = useTrendAnalysis({
    currentData: data,
    currentPeriod: selectedPeriod,
    availablePeriods,
    getDataForPeriod
  });

  const { kpis, productKpis, dailyKpis } = data;

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6 bg-gradient-surface min-h-screen">
      {/* Repasse Resumo */}
      <EditableRepasseResumo />
      
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
            {projectName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Dashboard de KPIs e Performance
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {availablePeriods.length > 0 ? (
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-full sm:w-48 bg-white shadow-sm">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {formatPeriodLabel(period)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
              Nenhum período disponível
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onUploadClick} className="flex-1 sm:flex-none">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload</span>
            </Button>

            <Button variant="outline" size="sm" onClick={onManualSaleClick} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Venda</span>
            </Button>

            {onManualSalesHistoryClick && (
              <Button variant="outline" size="sm" onClick={onManualSalesHistoryClick} className="flex-1 sm:flex-none">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Histórico</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onSummaryClick} className="flex-1 sm:flex-none">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Resumo</span>
            </Button>

            <Button variant="outline" size="sm" onClick={onComparisonClick} className="flex-1 sm:flex-none">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Comparar</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowClearDialog(true)}
              className="text-danger hover:text-danger flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Receita Líquida"
          value={formatCurrency(kpis.totalRevenueNet)}
          icon={DollarSign}
          trend={trends.revenue.trend}
          trendValue={trends.revenue.value}
        />
        <KPICard
          title="Investimento Total"
          value={formatCurrency(kpis.totalInvestment)}
          icon={Target}
          trend={trends.investment.trend}
          trendValue={trends.investment.value}
        />
        <KPICard
          title="ROAS"
          value={`${formatNumber(kpis.roas, 2)}x`}
          icon={TrendingUp}
          trend={trends.roas.trend}
          trendValue={trends.roas.value}
        />
        <KPICard
          title="Lucro Líquido"
          value={formatCurrency(kpis.profit)}
          icon={ShoppingCart}
          trend={trends.profit.trend}
          trendValue={trends.profit.value}
        />
      </div>

      {/* Products Performance */}
      <Card className="p-4 md:p-6 shadow-card bg-white">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Performance por Produto
        </h3>
        {productKpis.length > 0 ? (
          <div className="space-y-3">
            {productKpis.map((product, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-surface-secondary/50">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {product.product}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <span>{product.sales} vendas</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.classification === 'Principal' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-info/10 text-info'
                    }`}>
                      {product.classification}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(product.revenueNet)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ticket: {formatCurrency(product.averageTicket)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum produto encontrado</p>
            <p className="text-sm mt-1">Faça upload de uma planilha de vendas para ver os produtos</p>
          </div>
        )}
      </Card>

      {/* Daily Performance Table */}
      <Card className="p-4 md:p-6 shadow-card bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Performance Diária
          </h3>
          {dailyKpis.length > 0 && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          )}
        </div>
        
        {dailyKpis.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Data</TableHead>
                  <TableHead className="text-right min-w-[120px]">Investimento</TableHead>
                  <TableHead className="text-right min-w-[80px]">Vendas</TableHead>
                  <TableHead className="text-right min-w-[120px]">Faturamento</TableHead>
                  <TableHead className="text-right min-w-[80px]">ROAS</TableHead>
                  <TableHead className="text-right min-w-[100px]">CAC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyKpis.map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium whitespace-nowrap">{day.date}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatCurrency(day.investment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(day.sales)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatCurrency(day.revenue)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      day.roas > 1.5 ? 'text-success' : day.roas > 1 ? 'text-info' : 'text-danger'
                    }`}>
                      {formatNumber(day.roas, 2)}x
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatCurrency(day.cac)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum dado diário disponível</p>
            <p className="text-sm mt-1">Faça upload das planilhas para ver a performance diária</p>
          </div>
        )}
      </Card>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha o que deseja limpar. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearData('period');
                setShowClearDialog(false);
              }}
              className="bg-warning hover:bg-warning/90 text-warning-foreground mr-2"
            >
              Limpar Período Atual
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                onClearData('all');
                setShowClearDialog(false);
              }}
              className="bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              Limpar Todos os Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}