import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Copy, Share, Eye, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/mockData';

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

interface PublishedReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  availablePeriods: string[];
  reportData: {
    period: string;
    totalRevenue: number;
    totalInvestment: number;
    totalProfit: number;
    roas: number;
  };
  fullDashboardData?: {
    kpis: any;
    productKpis: any[];
    dailyKpis: any[];
  };
}

export function PublishedReportModal({
  open,
  onOpenChange,
  projectId,
  availablePeriods,
  reportData,
  fullDashboardData
}: PublishedReportModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);
  const [publishedReport, setPublishedReport] = useState<PublishedReport | null>(null);

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  const publishReport = () => {
    const reportId = `report-${Date.now()}`;
    const expiresAt = hasExpiration 
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
      : undefined;

    const report: PublishedReport = {
      id: reportId,
      title: title || `Relatório ${formatPeriodLabel(reportData.period)}`,
      description,
      projectId,
      availablePeriods,
      period: reportData.period,
      data: reportData,
      fullData: fullDashboardData,
      isPublic,
      createdAt: new Date(),
      expiresAt
    };

    // Salvar no localStorage
    const existingReports = JSON.parse(localStorage.getItem('published-reports') || '[]');
    existingReports.push(report);
    localStorage.setItem('published-reports', JSON.stringify(existingReports));

    setPublishedReport(report);
    
    toast({
      title: "Relatório publicado!",
      description: "O relatório foi publicado com sucesso.",
    });
  };

  const copyShareLink = () => {
    if (!publishedReport) return;
    
    const shareUrl = `${window.location.origin}/report/${publishedReport.id}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copiado!",
      description: "O link do relatório foi copiado para a área de transferência.",
    });
  };

  const viewReport = () => {
    if (!publishedReport) return;
    
    const reportUrl = `/report/${publishedReport.id}`;
    window.open(reportUrl, '_blank');
  };

  const resetModal = () => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setHasExpiration(false);
    setExpirationDays(30);
    setPublishedReport(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share className="h-5 w-5" />
            <span>Publicar Relatório</span>
          </DialogTitle>
        </DialogHeader>

        {!publishedReport ? (
          <div className="space-y-4">
            {/* Preview dos dados */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Dados do Relatório</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Período:</span>
                  <span>{formatPeriodLabel(reportData.period)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Faturamento:</span>
                  <span>{formatCurrency(reportData.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investimento:</span>
                  <span>{formatCurrency(reportData.totalInvestment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro:</span>
                  <span>{formatCurrency(reportData.totalProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ROAS:</span>
                  <span>{reportData.roas.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="title">Título do Relatório</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Relatório ${formatPeriodLabel(reportData.period)}`}
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione uma descrição para o relatório..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Relatório Público</Label>
                  <p className="text-xs text-muted-foreground">
                    Permitir acesso via link compartilhável
                  </p>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Definir Expiração</Label>
                  <Switch
                    checked={hasExpiration}
                    onCheckedChange={setHasExpiration}
                  />
                </div>
                
                {hasExpiration && (
                  <div>
                    <Label htmlFor="expiration">Dias para expirar</Label>
                    <Input
                      id="expiration"
                      type="number"
                      min="1"
                      max="365"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={publishReport} className="flex-1">
                Publicar Relatório
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Share className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-medium">Relatório Publicado!</h4>
              <p className="text-sm text-muted-foreground">
                Seu relatório está disponível para compartilhamento
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg">
                <h5 className="font-medium text-sm">{publishedReport.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {publishedReport.id}
                </p>
                {publishedReport.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Expira em: {publishedReport.expiresAt.toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={copyShareLink}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  onClick={viewReport}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={() => handleClose(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}