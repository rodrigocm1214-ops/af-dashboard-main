import { Trash2, FileSpreadsheet, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { UploadRecord } from '@/types/upload';
import { useState } from 'react';

interface UploadHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadHistory: UploadRecord[];
  onDeleteRecord: (recordId: string) => void;
  onClearHistory: () => void;
}

export function UploadHistoryModal({
  open,
  onOpenChange,
  uploadHistory,
  onDeleteRecord,
  onClearHistory
}: UploadHistoryModalProps) {
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meta': return 'Meta Ads';
      case 'hotmart': return 'Hotmart';
      case 'kiwify': return 'Kiwify';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meta': return 'bg-blue-100 text-blue-800';
      case 'hotmart': return 'bg-orange-100 text-orange-800';
      case 'kiwify': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Histórico de Uploads</span>
            </DialogTitle>
            <DialogDescription>
              Gerencie os arquivos que foram enviados para este projeto
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {uploadHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo foi enviado ainda</p>
                <p className="text-sm">Faça upload de uma planilha para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {uploadHistory.length} arquivo(s) no histórico
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Histórico
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[200px]" title={record.filename}>
                                {record.filename}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getTypeColor(record.type)}>
                              {getTypeLabel(record.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(record.uploadDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatFileSize(record.fileSize)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.recordsProcessed} registros
                          </TableCell>
                          <TableCell>
                            {record.status === 'success' ? (
                              <div className="flex items-center space-x-1 text-success">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Sucesso</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Erro</span>
                              </div>
                            )}
                            {record.errorMessage && (
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={record.errorMessage}>
                                {record.errorMessage}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRecordToDelete(record.id)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Record Confirmation */}
      <AlertDialog open={!!recordToDelete} onOpenChange={() => setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro do histórico? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (recordToDelete) {
                  onDeleteRecord(recordToDelete);
                  setRecordToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear History Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja limpar todo o histórico de uploads? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearHistory();
                setShowClearDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Limpar Histórico
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}