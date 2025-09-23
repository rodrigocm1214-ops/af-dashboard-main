import { useState } from 'react';
import { format } from 'date-fns';
import { History, Edit2, Trash2, Package, DollarSign, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useManualSalesHistory, ManualSaleRecord } from '@/hooks/useManualSalesHistory';
import { formatCurrency } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface ManualSalesHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onEditSale?: (sale: ManualSaleRecord) => void;
  onRemoveManualSale?: (saleId: string) => void;
}

export function ManualSalesHistoryModal({ 
  open, 
  onOpenChange, 
  projectId,
  onEditSale,
  onRemoveManualSale 
}: ManualSalesHistoryModalProps) {
  const { toast } = useToast();
  const { manualSales, removeManualSale, clearHistory } = useManualSalesHistory(projectId);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleDelete = (id: string) => {
    // Remove from manual sales history
    removeManualSale(id);
    
    // Remove from project data (dashboard)
    if (onRemoveManualSale) {
      onRemoveManualSale(id);
    }
    
    setDeleteId(null);
    toast({
      title: "Venda removida",
      description: "A venda manual foi removida com sucesso dos dados e do dashboard.",
    });
  };

  const handleClearAll = () => {
    // Clear manual sales history
    clearHistory();
    
    // Clear all manual sales from project data
    if (onRemoveManualSale) {
      manualSales.forEach(sale => onRemoveManualSale(sale.id));
    }
    
    setShowClearDialog(false);
    toast({
      title: "Histórico limpo",
      description: "Todas as vendas manuais foram removidas dos dados e do dashboard.",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <History className="h-5 w-5 text-primary" />
              <span>Histórico de Vendas Manuais</span>
            </DialogTitle>
            <DialogDescription>
              Gerencie todas as vendas adicionadas manualmente ao projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {manualSales.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {manualSales.length} venda{manualSales.length !== 1 ? 's' : ''} manual{manualSales.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearDialog(true)}
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                </div>

                <div className="space-y-3">
                  {manualSales.map((sale) => (
                    <Card key={sale.id} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {sale.product}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(sale.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>Bruto: {formatCurrency(sale.gross)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>Líquido: {formatCurrency(sale.net)}</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Adicionado em: {formatDateTime(sale.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {onEditSale && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditSale(sale)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(sale.id)}
                            className="text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma venda manual encontrada</p>
                <p className="text-sm mt-2">
                  As vendas adicionadas manualmente aparecerão aqui para fácil gestão.
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Venda Manual</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta venda manual? Esta ação não pode ser desfeita 
              e afetará os cálculos do dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover todas as vendas manuais? Esta ação não pode ser desfeita 
              e afetará os cálculos do dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-danger hover:bg-danger/90 text-danger-foreground"
            >
              Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}