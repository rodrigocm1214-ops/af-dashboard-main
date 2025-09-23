import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Download, 
  Sparkles, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DashboardData } from '@/types/project';
import { formatCurrency, formatNumber } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const summarySchema = z.object({
  period: z.string(),
  highlights: z.string(),
  challenges: z.string(),
  nextSteps: z.string(),
  customMetrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
  }))
});

type SummaryFormData = z.infer<typeof summarySchema>;

interface SummaryData {
  period: string;
  highlights: string;
  challenges: string;
  nextSteps: string;
  customMetrics: Array<{
    label: string;
    value: string;
  }>;
}

interface PartnershipSummary {
  totalRevenue: number;
  midfyFee: number; // 6% fee
  netRevenue: number;
  period: string;
}

interface ProjectSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  dashboardData: DashboardData;
  period: string;
}

export function ProjectSummaryModal({ 
  open, 
  onOpenChange, 
  projectName, 
  dashboardData, 
  period 
}: ProjectSummaryModalProps) {
  const { toast } = useToast();

  const { register, handleSubmit, setValue, getValues, control } = useForm<SummaryFormData>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      period,
      highlights: '',
      challenges: '',
      nextSteps: '',
      customMetrics: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customMetrics',
  });

  const onSubmit = (data: SummaryFormData) => {
    console.log('Summary data:', data);
  };

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const generateSummary = () => {
    const { kpis } = dashboardData;
    
    // Generate highlights based on KPIs
    const highlights = `✅ Receita líquida de ${formatCurrency(kpis.totalRevenueNet)}
✅ ROAS de ${kpis.roas.toFixed(2)}x ${kpis.roas >= 3 ? '(Excelente)' : kpis.roas >= 2 ? '(Bom)' : '(Precisa melhorar)'}
✅ ${kpis.totalSales} vendas realizadas
✅ Ticket médio de ${formatCurrency(kpis.averageTicket)}
✅ Investimento total de ${formatCurrency(kpis.totalInvestment)}
✅ Lucro líquido de ${formatCurrency(kpis.profit)}`;

    // Generate challenges based on performance
    const challenges = kpis.roas < 2 
      ? "🔸 ROAS abaixo do ideal (< 2x)\n🔸 Necessário otimizar campanhas\n🔸 Revisar público-alvo e criativos"
      : kpis.profit < 0
      ? "🔸 Lucro negativo no período\n🔸 Custos de aquisição elevados\n🔸 Revisar estratégia de precificação"
      : "🔸 Manter consistência nos resultados\n🔸 Escalar campanhas de melhor performance\n🔸 Testar novos públicos";

    // Generate next steps
    const nextSteps = `📌 Análise detalhada das campanhas de melhor performance
📌 Implementar testes A/B em criativos
📌 Otimizar landing pages para aumentar conversão
📌 Acompanhar métricas semanalmente
📌 Revisar metas para o próximo período`;

    setValue('highlights', highlights);
    setValue('challenges', challenges);
    setValue('nextSteps', nextSteps);
  };

  const generatePartnershipSummary = (): PartnershipSummary => {
    const { kpis } = dashboardData;
    const midfyFeeRate = 0.06; // 6%
    const midfyFee = kpis.totalRevenueNet * midfyFeeRate;
    
    return {
      totalRevenue: kpis.totalRevenueNet,
      midfyFee,
      netRevenue: kpis.totalRevenueNet - midfyFee,
      period: formatPeriodLabel(period)
    };
  };

  const exportSummary = () => {
    const formData = getValues();
    const { kpis, productKpis } = dashboardData;
    const partnershipSummary = generatePartnershipSummary();
    
    const content = `RESUMO DO PROJETO - ${projectName}
Período: ${formatPeriodLabel(formData.period)}

=== KPIs PRINCIPAIS ===
Receita Líquida: ${formatCurrency(kpis.totalRevenueNet)}
Investimento Total: ${formatCurrency(kpis.totalInvestment)}
ROAS: ${kpis.roas.toFixed(2)}x
Lucro Líquido: ${formatCurrency(kpis.profit)}
Vendas Totais: ${kpis.totalSales}
Ticket Médio: ${formatCurrency(kpis.averageTicket)}

=== RESUMO DE REPASSE ===
Período: ${partnershipSummary.period}
Receita Total: ${formatCurrency(partnershipSummary.totalRevenue)}
Taxa MIDIAFY (6%): ${formatCurrency(partnershipSummary.midfyFee)}
Receita Líquida: ${formatCurrency(partnershipSummary.netRevenue)}

=== PRODUTOS ===
${productKpis.map(p => `${p.product}: ${p.sales} vendas - ${formatCurrency(p.revenueNet)} (${p.classification})`).join('\n')}

=== MÉTRICAS PERSONALIZADAS ===
${formData.customMetrics.map(m => `${m.label}: ${m.value}`).join('\n')}

=== DESTAQUES ===
${formData.highlights}

=== DESAFIOS ===
${formData.challenges}

=== PRÓXIMOS PASSOS ===
${formData.nextSteps}

---
Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumo-${projectName.toLowerCase().replace(/\s+/g, '-')}-${period}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPartnershipSummary = () => {
    const partnershipSummary = generatePartnershipSummary();
    const { kpis, productKpis } = dashboardData;
    
    const content = `RESUMO DE REPASSE - ${projectName}
Período: ${partnershipSummary.period}

=== PERFORMANCE GERAL ===
Receita Bruta Total: ${formatCurrency(kpis.totalRevenueGross)}
Receita Líquida Total: ${formatCurrency(partnershipSummary.totalRevenue)}
Investimento em Tráfego: ${formatCurrency(kpis.totalInvestment)}
ROAS: ${kpis.roas.toFixed(2)}x
Vendas Realizadas: ${kpis.totalSales}

=== CÁLCULO DE REPASSE ===
Receita Base: ${formatCurrency(partnershipSummary.totalRevenue)}
Taxa MIDIAFY (6%): ${formatCurrency(partnershipSummary.midfyFee)}
Valor Líquido para Repasse: ${formatCurrency(partnershipSummary.netRevenue)}

=== DETALHAMENTO POR PRODUTO ===
${productKpis.map(p => {
  const productFee = p.revenueNet * 0.06;
  const productNet = p.revenueNet - productFee;
  return `${p.product} (${p.classification}):
  - Vendas: ${p.sales}
  - Receita: ${formatCurrency(p.revenueNet)}
  - Taxa MIDIAFY: ${formatCurrency(productFee)}
  - Líquido: ${formatCurrency(productNet)}`;
}).join('\n\n')}

---
Relatório de repasse gerado em: ${new Date().toLocaleString('pt-BR')}`;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repasse-${projectName.toLowerCase().replace(/\s+/g, '-')}-${period}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo do Projeto - {projectName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="project" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project">Resumo do Projeto</TabsTrigger>
            <TabsTrigger value="partnership">Resumo de Repasse</TabsTrigger>
          </TabsList>

          {/* Project Summary Tab */}
          <TabsContent value="project" className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* KPIs Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Receita Líquida</Label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(dashboardData.kpis.totalRevenueNet)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ROAS</Label>
                  <p className="text-2xl font-bold text-primary">
                    {dashboardData.kpis.roas.toFixed(2)}x
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vendas</Label>
                  <p className="text-2xl font-bold text-primary">
                    {dashboardData.kpis.totalSales}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Lucro</Label>
                  <p className={`text-2xl font-bold ${
                    dashboardData.kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(dashboardData.kpis.profit)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Custom Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Métricas Personalizadas</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ label: '', value: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Nome da métrica"
                      {...register(`customMetrics.${index}.label`)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valor"
                      {...register(`customMetrics.${index}.value`)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Summary Sections */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Resumo de Performance</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSummary}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Automaticamente
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="highlights">Principais Destaques</Label>
                    <Textarea
                      id="highlights"
                      placeholder="Liste os principais sucessos e conquistas do período..."
                      className="min-h-[100px]"
                      {...register('highlights')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="challenges">Desafios Identificados</Label>
                    <Textarea
                      id="challenges"
                      placeholder="Quais foram os principais obstáculos e áreas de melhoria..."
                      className="min-h-[100px]"
                      {...register('challenges')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nextSteps">Próximos Passos</Label>
                    <Textarea
                      id="nextSteps"
                      placeholder="Ações e estratégias para o próximo período..."
                      className="min-h-[100px]"
                      {...register('nextSteps')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportSummary}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Resumo Completo
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Partnership Summary Tab */}
          <TabsContent value="partnership" className="space-y-6">
            {(() => {
              const partnershipSummary = generatePartnershipSummary();
              return (
                <div className="space-y-6">
                  {/* Partnership KPIs */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resumo de Repasse - {formatPeriodLabel(period)}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <Label className="text-sm text-muted-foreground">Receita Total</Label>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(partnershipSummary.totalRevenue)}
                        </p>
                      </Card>
                      
                      <Card className="p-4">
                        <Label className="text-sm text-muted-foreground">Taxa MIDIAFY (6%)</Label>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(partnershipSummary.midfyFee)}
                        </p>
                      </Card>
                      
                      <Card className="p-4">
                        <Label className="text-sm text-muted-foreground">Receita Líquida</Label>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(partnershipSummary.netRevenue)}
                        </p>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Performance Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Performance Geral</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>ROAS:</span>
                        <span className="font-medium">{dashboardData.kpis.roas.toFixed(2)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Investimento:</span>
                        <span className="font-medium">{formatCurrency(dashboardData.kpis.totalInvestment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendas:</span>
                        <span className="font-medium">{dashboardData.kpis.totalSales}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ticket Médio:</span>
                        <span className="font-medium">{formatCurrency(dashboardData.kpis.averageTicket)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Breakdown */}
                  {dashboardData.productKpis.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-semibold">Detalhamento por Produto</h4>
                        <div className="space-y-3">
                          {dashboardData.productKpis.map((product, index) => {
                            const productFee = product.revenueNet * 0.06;
                            const productNet = product.revenueNet - productFee;
                            return (
                              <Card key={index} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium">{product.product}</p>
                                    <p className="text-sm text-muted-foreground">{product.classification}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(productNet)}</p>
                                    <p className="text-sm text-muted-foreground">Líquido</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Vendas:</span>
                                    <p className="font-medium">{product.sales}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Receita:</span>
                                    <p className="font-medium">{formatCurrency(product.revenueNet)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Taxa:</span>
                                    <p className="font-medium">{formatCurrency(productFee)}</p>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={exportPartnershipSummary}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Resumo de Repasse
                    </Button>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}