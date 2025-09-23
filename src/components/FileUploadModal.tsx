import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle, FileText, AlertTriangle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadHistoryModal } from './UploadHistoryModal';
import { useUploadHistory } from '@/hooks/useUploadHistory';
import { SpreadsheetPreview } from './SpreadsheetPreview';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName: string;
  onFileUpload: (file: File, type: 'meta' | 'hotmart' | 'kiwify', headerRow?: number) => Promise<number>;
}

type FileType = 'meta' | 'hotmart' | 'kiwify' | 'unknown';

export function FileUploadModal({ 
  open, 
  onOpenChange, 
  projectId,
  projectName,
  onFileUpload 
}: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('unknown');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [headerRow, setHeaderRow] = useState<number | undefined>(undefined);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadHistory, addUploadRecord, removeUploadRecord, clearHistory } = useUploadHistory(projectId);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if it's a spreadsheet file
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      setErrorMessage('Por favor, selecione um arquivo de planilha (.xlsx, .xls ou .csv)');
      setUploadStatus('error');
      return;
    }
    
    setSelectedFile(file);
    setFileType('unknown'); // User must select manually
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFile || fileType === 'unknown') return;

    // Para Meta Ads, mostrar preview se não tiver headerRow definido
    if (fileType === 'meta' && headerRow === undefined) {
      setShowPreview(true);
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');
    
    try {
      const recordsProcessed = await onFileUpload(selectedFile, fileType as 'meta' | 'hotmart' | 'kiwify', headerRow);
      
      // Adiciona ao histórico
      addUploadRecord({
        filename: selectedFile.name,
        type: fileType as 'meta' | 'hotmart' | 'kiwify',
        fileSize: selectedFile.size,
        recordsProcessed,
        status: 'success',
      });
      
      setUploadStatus('success');
      
      // Close modal after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      
      // Adiciona ao histórico mesmo em caso de erro
      addUploadRecord({
        filename: selectedFile.name,
        type: fileType as 'meta' | 'hotmart' | 'kiwify',
        fileSize: selectedFile.size,
        recordsProcessed: 0,
        status: 'error',
        errorMessage: errorMsg,
      });
      
      setUploadStatus('error');
      setErrorMessage(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileType('unknown');
    setUploadStatus('idle');
    setErrorMessage('');
    setDragActive(false);
    setShowPreview(false);
    setHeaderRow(undefined);
    onOpenChange(false);
  };

  const handleHeaderRowSelect = (row: number) => {
    setHeaderRow(row);
    setShowPreview(false);
    // Immediately trigger upload after header selection
    setTimeout(() => handleUpload(), 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Upload de Planilha</DialogTitle>
                <DialogDescription>
                  Faça upload das planilhas do {projectName} (Meta Ads, Hotmart ou Kiwify)
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="ml-4"
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </div>
          </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="text-center">
              {selectedFile ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Arraste o arquivo aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suporte para .xlsx, .xls e .csv
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Type Selection */}
          {selectedFile && (
            <div className="mt-4 p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="text-sm font-medium">Tipo de planilha:</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="meta"
                      name="fileType"
                      value="meta"
                      checked={fileType === 'meta'}
                      onChange={(e) => setFileType(e.target.value as FileType)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="meta" className="text-sm">Meta Ads (Tráfego/Investimento)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="hotmart"
                      name="fileType"
                      value="hotmart"
                      checked={fileType === 'hotmart'}
                      onChange={(e) => setFileType(e.target.value as FileType)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="hotmart" className="text-sm">Hotmart (Vendas)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="kiwify"
                      name="fileType"
                      value="kiwify"
                      checked={fileType === 'kiwify'}
                      onChange={(e) => setFileType(e.target.value as FileType)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="kiwify" className="text-sm">Kiwify (Vendas)</label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {fileType === 'unknown' && selectedFile && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Selecione o tipo de planilha</AlertTitle>
              <AlertDescription>
                Por favor, selecione o tipo correto da planilha para processamento adequado dos dados.
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <Alert className="border-success text-success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Arquivo processado com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && (
            <Alert className="border-destructive text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || fileType === 'unknown' || isUploading}
          >
            {isUploading ? 'Processando...' : fileType === 'meta' && headerRow === undefined ? 'Prévia da Planilha' : 'Fazer Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Spreadsheet Preview Modal */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview da Planilha Meta Ads</DialogTitle>
          <DialogDescription>
            Selecione qual linha contém os cabeçalhos das colunas
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {selectedFile && (
            <SpreadsheetPreview
              file={selectedFile}
              onHeaderRowSelect={handleHeaderRowSelect}
              onCancel={() => setShowPreview(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Upload History Modal */}
    <UploadHistoryModal
      open={showHistory}
      onOpenChange={setShowHistory}
      uploadHistory={uploadHistory}
      onDeleteRecord={removeUploadRecord}
      onClearHistory={clearHistory}
    />
  </>);
}