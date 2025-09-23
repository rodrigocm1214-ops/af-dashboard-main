import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Calendar, DollarSign, Target, TrendingUp, ShoppingCart, Package, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/lib/mockData';

interface PublishedReport {
  id: string;
  title: string;
  description: string;
  projectId: string;
  availablePeriods: string[];
  period: string;
  data: {
    totalRevenue: number;
    totalInvestment: number;
    totalProfit: number;
    roas: number;
  };
  fullData?: {
    kpis: any;
    productKpis: any[];
    dailyKpis: any[];
  };
  isPublic: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export default function EnhancedPublicReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const { toast } = useToast();
  const [report, setReport] = useState<PublishedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = () => {
    if (!reportId) {
      setError('ID do relatório não encontrado');
      setLoading(false);
      return;
    }

    try {
      const reports = JSON.parse(localStorage.getItem('published-reports') || '[]');
      const foundReport = reports.find((r: PublishedReport) => r.id === reportId);

      if (!foundReport) {
        setError('Relatório não encontrado');
        setLoading(false);
        return;
      }

      if (!foundReport.isPublic) {
        setError('Este relatório não está público');
        setLoading(false);
        return;
      }

      if (foundReport.expiresAt && new Date(foundReport.expiresAt) < new Date()) {
        setError('Este relatório expirou');
        setLoading(false);
        return;
      }

      // Convert date strings back to Date objects
      foundReport.createdAt = new Date(foundReport.createdAt);
      if (foundReport.expiresAt) {
        foundReport.expiresAt = new Date(foundReport.expiresAt);
      }

      setReport(foundReport);
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Erro ao carregar relatório');
    } finally {
      setLoading(false);
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

  const exportData = () => {
    if (!report) return;
    
    const exportContent = {
      title: report.title,
      period: formatPeriodLabel(report.period),
      data: report.data,
      fullData: report.fullData,
      generatedAt: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(exportContent, null, 2));
    
    toast({
      title: "Dados exportados!",
      description: "Os dados do relatório foram copiados para a área de transferência.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="h-6 w-6 text-danger" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Relatório não encontrado</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { data, fullData } = report;
  const roi = data.totalInvestment > 0 ? ((data.totalProfit / data.totalInvestment) * 100) : 0;
  const profitMargin = data.totalRevenue > 0 ? ((data.totalProfit / data.totalRevenue) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{report.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatPeriodLabel(report.period)}
                </Badge>
                <Badge variant="secondary">Relatório Público</Badge>
                {report.expiresAt && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Expira em: {report.expiresAt.toLocaleDateString()}
                  </Badge>
                )}
              </div>
              {report.description && (
                <p className="text-muted-foreground mt-3 max-w-2xl">{report.description}</p>
              )}
            </div>
            
            <Button onClick={exportData} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(data.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Investimento</CardTitle>
              <Target className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(data.totalInvestment)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {formatNumber(data.roas, 2)}x
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Lucro</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(data.totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance por Produto */}
        {fullData?.productKpis && fullData.productKpis.length > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Performance por Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fullData.productKpis.map((product: any, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-surface-secondary/30">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium text-foreground">{product.product}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>{product.sales} vendas</span>
                        <Badge variant={product.classification === 'Principal' ? 'default' : 'secondary'} className="text-xs">
                          {product.classification}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1">
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
            </CardContent>
          </Card>
        )}

        {/* Performance Diária */}
        {fullData?.dailyKpis && fullData.dailyKpis.length > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Diária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Investimento</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                      <TableHead className="text-right">CAC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fullData.dailyKpis.map((day: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.investment)}</TableCell>
                        <TableCell className="text-right">{formatNumber(day.sales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.averageTicket)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(day.cac)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Financeiro */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Período Analisado</p>
                <p className="text-lg font-semibold">{formatPeriodLabel(report.period)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className={`text-lg font-semibold ${roi >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatNumber(roi, 1)}%
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className={`text-lg font-semibold ${profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatNumber(profitMargin, 1)}%
                </p>
              </div>
            </div>
            
            {fullData?.kpis && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total de Vendas</p>
                    <p className="font-medium">{formatNumber(fullData.kpis.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ticket Médio</p>
                    <p className="font-medium">{formatCurrency(fullData.kpis.averageTicket)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dias Analisados</p>
                    <p className="font-medium">{fullData.kpis.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Receita Bruta</p>
                    <p className="font-medium">{formatCurrency(fullData.kpis.totalRevenueGross)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 border-t border-border text-sm text-muted-foreground">
          <p>Relatório gerado em {report.createdAt.toLocaleDateString()} • A-FONTE Dashboard</p>
        </div>
      </div>
    </div>
  );
}