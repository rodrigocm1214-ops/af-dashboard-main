import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SpreadsheetPreviewProps {
  file: File;
  onHeaderRowSelect: (headerRow: number) => void;
  onCancel: () => void;
  onBack?: () => void;
  onCancelUpload?: () => void;
}

interface PreviewRow {
  rowIndex: number;
  data: string[];
  isHeaderCandidate?: boolean;
}

export function SpreadsheetPreview({ 
  file, 
  onHeaderRowSelect, 
  onCancel,
  onBack,
  onCancelUpload
}: SpreadsheetPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPreview();
  }, [file]);

  const loadPreview = async () => {
    setLoading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Get first 15 rows for preview
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            range: 0,
            defval: ''
          });
          
          const previewRows: PreviewRow[] = [];
          const maxPreviewRows = Math.min(15, jsonData.length);
          
          for (let i = 0; i < maxPreviewRows; i++) {
            const rowData = (jsonData[i] as any[]) || [];
            const stringData = rowData.map(cell => String(cell || ''));
            
            // Check if this row might be a header for Meta Ads
            const isHeaderCandidate = stringData.some(cell => {
              const lowerCell = cell.toLowerCase();
              return lowerCell.includes('início dos relatórios') || 
                     lowerCell.includes('reporting starts') ||
                     lowerCell.includes('valor usado') ||
                     lowerCell.includes('amount spent');
            });
            
            previewRows.push({
              rowIndex: i,
              data: stringData,
              isHeaderCandidate
            });
          }
          
          setPreviewData(previewRows);
          
          // Auto-select first header candidate
          const firstCandidate = previewRows.find(row => row.isHeaderCandidate);
          if (firstCandidate) {
            setSelectedRow(firstCandidate.rowIndex);
          }
          
        } catch (err) {
          setError('Erro ao ler planilha: ' + err);
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Erro ao ler arquivo');
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      setError('Erro ao processar arquivo: ' + err);
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedRow >= 0) {
      onHeaderRowSelect(selectedRow);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando preview da planilha...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted/20 p-4 rounded-lg flex-shrink-0">
        <h4 className="font-medium mb-2">Preview da Planilha Meta Ads</h4>
        <p className="text-sm text-muted-foreground">
          Selecione a linha que contém os cabeçalhos das colunas. Procure pelas colunas 
          "Início dos relatórios" e "Valor usado (BRL)".
        </p>
      </div>
      
      <div className="border rounded-lg overflow-hidden flex-1 min-h-0 mb-4">
        <div className="h-full overflow-auto">
          <table className="w-full text-xs">
            <tbody>
              {previewData.map((row) => (
                <tr 
                  key={row.rowIndex}
                  className={`cursor-pointer border-b hover:bg-muted/50 ${
                    selectedRow === row.rowIndex ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setSelectedRow(row.rowIndex)}
                >
                  <td className="p-2 text-center font-mono text-muted-foreground w-16">
                    {row.rowIndex + 1}
                    {row.isHeaderCandidate && (
                      <Badge variant="secondary" className="ml-1 scale-75">
                        Header
                      </Badge>
                    )}
                  </td>
                  {row.data.slice(0, 6).map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-2 truncate max-w-32 border-l">
                      {cell || '-'}
                    </td>
                  ))}
                  {row.data.length > 6 && (
                    <td className="p-2 text-muted-foreground">
                      ... +{row.data.length - 6} colunas
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow >= 0 && (
        <Alert className="border-success flex-shrink-0 mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Linha {selectedRow + 1} selecionada como cabeçalho. 
            Verifique se contém as colunas necessárias do Meta Ads.
          </AlertDescription>
        </Alert>
      )}

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur border-t shadow-lg p-4 mt-auto">
        <div className="flex justify-end space-x-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
          )}
          {onCancelUpload && (
            <Button variant="outline" onClick={onCancelUpload}>
              Cancelar
            </Button>
          )}
          {!onBack && !onCancelUpload && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleConfirm}
            disabled={selectedRow < 0}
            className="bg-gradient-primary hover:bg-primary/90"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}