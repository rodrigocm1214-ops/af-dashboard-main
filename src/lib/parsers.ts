import * as XLSX from 'xlsx';

export interface ParsedMetaRow {
  date: string;
  investment: number;
}

export interface ParsedSaleRow {
  date: string;
  product: string;
  net: number;
  gross: number;
  source: 'hotmart' | 'kiwify' | 'manual';
}

export type ParsedData = ParsedMetaRow[] | ParsedSaleRow[];

// Normaliza data de dd/mm/yyyy para yyyy-mm-dd
function normalizeDate(input: string): string {
  try {
    // Remove timestamp se presente (ex: "15/08/2025 12:11:44" -> "15/08/2025")
    const dateOnly = String(input).split(' ')[0];
    
    if (dateOnly.includes('/')) {
      const [day, month, year] = dateOnly.split('/');
      const normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('Normalized date from/', { input, dateOnly, result: normalizedDate });
      return normalizedDate;
    }
    
    // Se já está em formato ISO (YYYY-MM-DD)
    if (dateOnly.includes('-') && dateOnly.length === 10) {
      console.log('Date already in ISO format:', dateOnly);
      return dateOnly;
    }
    
    // Tenta converter de Excel serial date
    const serialNumber = parseInt(dateOnly);
    if (!isNaN(serialNumber) && serialNumber > 0) {
      const date = new Date((serialNumber - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        console.log('Converted Excel serial date:', { input, serialNumber, result: isoDate });
        return isoDate;
      }
    }
    
    // Tenta usar Date constructor como último recurso
    const date = new Date(dateOnly);
    if (!isNaN(date.getTime())) {
      const isoDate = date.toISOString().split('T')[0];
      console.log('Converted using Date constructor:', { input, result: isoDate });
      return isoDate;
    }
    
    console.warn('Could not normalize date:', input);
    return dateOnly;
  } catch (error) {
    console.error('Error normalizing date:', input, error);
    return String(input);
  }
}

// Parser para Meta Ads com detecção automática de cabeçalho
export function parseMetaAds(file: File, headerRow?: number): Promise<ParsedMetaRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const parsed: ParsedMetaRow[] = [];
        
        // Prioriza linha 2 (índice 2) que é onde está o cabeçalho real
        const headersToTry = headerRow !== undefined ? [headerRow] : [2, 1, 0, 3, 4, 5, 6, 7, 8, 9];
        
        for (const currentHeaderRow of headersToTry) {
          try {
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              range: currentHeaderRow 
            });
            
            if (jsonData.length === 0) continue;
            
            const headerRowData = jsonData[0] as any[];
            if (!headerRowData) continue;
            
            // Busca direta pelos índices conhecidos quando na linha 2
            let dateColIndex = -1;
            let investmentColIndex = -1;
            
            if (currentHeaderRow === 2) {
              // Verifica se os índices conhecidos têm o conteúdo esperado
              const col19 = String(headerRowData[19] || '').toLowerCase();
              const col11 = String(headerRowData[11] || '').toLowerCase();
              
              if (col19.includes('início') || col19.includes('reporting')) {
                dateColIndex = 19;
              }
              
              if (col11.includes('valor usado') || col11.includes('amount spent')) {
                investmentColIndex = 11;
              }
            }
            
            // Se não encontrou pelos índices diretos, faz busca completa
            if (dateColIndex === -1 || investmentColIndex === -1) {
              const headers = headerRowData.map(h => String(h || '').toLowerCase());
              
              if (dateColIndex === -1) {
                dateColIndex = headers.findIndex(h => 
                  h.includes('início dos relatórios') || 
                  h.includes('reporting starts') ||
                  h.includes('inicio dos relatorios') ||
                  (h.includes('data') && h.length < 10)
                );
              }
              
              if (investmentColIndex === -1) {
                investmentColIndex = headers.findIndex(h => 
                  h.includes('valor usado') || 
                  h.includes('amount spent') ||
                  h.includes('valor gasto') ||
                  h.includes('investimento')
                );
              }
            }
            
            if (dateColIndex === -1 || investmentColIndex === -1) continue;
            
            // Processa os dados usando os índices corretos
            const dataRows = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              range: currentHeaderRow + 1 
            });
            
            for (const row of dataRows) {
              const rowArray = row as any[];
              if (!rowArray || rowArray.length === 0) continue;
              
              const dateValue = rowArray[dateColIndex];
              const investmentValue = rowArray[investmentColIndex];
              
              if (!dateValue || investmentValue === undefined || investmentValue === null) continue;
              
              // Limpa e converte o valor do investimento
              const investmentStr = String(investmentValue).replace(/[^\d.,\-]/g, '').replace(',', '.');
              const investment = parseFloat(investmentStr);
              
              if (isNaN(investment) || investment <= 0) continue;
              
              const normalizedDate = normalizeDate(String(dateValue));
              
              // Verifica se a data foi normalizada corretamente
              if (!normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
              
              parsed.push({
                date: normalizedDate,
                investment
              });
            }
            
            // Se encontrou dados válidos, para o loop
            if (parsed.length > 0) {
              console.log(`Meta Ads parser: Encontrou ${parsed.length} registros na linha ${currentHeaderRow}`);
              break;
            }
            
          } catch (error) {
            console.warn(`Erro ao processar linha ${currentHeaderRow}:`, error);
            continue;
          }
        }
        
        if (parsed.length === 0) {
          reject(new Error('Colunas "Início dos relatórios" e "Valor usado (BRL)" não foram encontradas. Verifique se a planilha está no formato correto do Meta Ads. Tente usar a linha 2 como cabeçalho.'));
          return;
        }
        
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Erro ao processar planilha Meta Ads: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// Parser para Hotmart
export function parseHotmart(file: File): Promise<ParsedSaleRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const parsed: ParsedSaleRow[] = [];
        
        console.log('=== HOTMART PARSER DEBUG ===');
        console.log(`Total rows in spreadsheet: ${jsonData.length}`);
        
        // Helper function to find column index
        const getIndex = (names: string[]) => {
          const firstRow = jsonData[0] as any;
          const headers = Object.keys(firstRow);
          
          for (let name of names) {
            const index = headers.findIndex(h => h?.toLowerCase()?.trim() === name.toLowerCase().trim());
            if (index !== -1) return index;
          }
          return -1;
        };
        
        // Find column indices with automatic fallback
        const col = {
          data: getIndex(["DATA CORRIGIDA", "Data da transação"]),
          status: getIndex(["STATUS DA TRANSAÇÃO"]),
          receitaProd: getIndex(["FATURAMENTO LÍQUIDO DO(A) PRODUTOR(A)"]),
          receitaCo: getIndex(["FATURAMENTO DO(A) COPRODUTOR(A)"]),
          produto: getIndex(["PRODUTO"])
        };
        
        if (col.data === -1 || col.status === -1 || col.receitaProd === -1) {
          reject(new Error('Colunas obrigatórias não encontradas. Verifique se a planilha está no formato correto da Hotmart.'));
          return;
        }
        
        const firstRow = jsonData[0] as any;
        const headers = Object.keys(firstRow);
        
        let skippedByStatus = 0;
        let skippedByDate = 0;
        let skippedByValue = 0;
        
        for (const rowData of jsonData) {
          // Verifica status - aceita transações "aprovado" ou "completo"
          const status = String(rowData[headers[col.status]] || "").toLowerCase().trim();
          const validStatuses = ["aprovado", "completo"];
          if (!validStatuses.includes(status)) {
            skippedByStatus++;
            continue;
          }
          
          // Busca data com fallback automático
          const rawDate = rowData[headers[col.data]];
          if (!rawDate) {
            skippedByDate++;
            continue;
          }
          
          // Converte data do formato brasileiro para ISO (dd/mm/yyyy -> yyyy-mm-dd)
          let dataFormatada;
          try {
            const dateStr = String(rawDate).split(" ")[0]; // Remove hora se presente
            const [day, month, year] = dateStr.split("/");
            
            if (!day || !month || !year) {
              skippedByDate++;
              continue;
            }
            
            dataFormatada = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          } catch {
            skippedByDate++;
            continue;
          }
          
          // Soma receitas do produtor + coprodutor
          const receita1 = parseFloat(String(rowData[headers[col.receitaProd]] || "0").replace(",", ".").replace(/[^\d.-]/g, ""));
          const receita2 = col.receitaCo !== -1 ? parseFloat(String(rowData[headers[col.receitaCo]] || "0").replace(",", ".").replace(/[^\d.-]/g, "")) : 0;
          
          const receitaTotal = (isNaN(receita1) ? 0 : receita1) + (isNaN(receita2) ? 0 : receita2);
          
          // Filtra apenas receita líquida > 0
          if (receitaTotal <= 0) {
            skippedByValue++;
            continue;
          }
          
          const produto = col.produto !== -1 ? String(rowData[headers[col.produto]] || "Produto Desconhecido").trim() : "Produto Desconhecido";
          
          parsed.push({
            date: dataFormatada,
            product: produto,
            net: receitaTotal,
            gross: receitaTotal, // Para Hotmart, assumimos que líquido = bruto
            source: 'hotmart'
          });
        }
        
        console.log('=== HOTMART PARSER SUMMARY ===');
        console.log(`Total rows: ${jsonData.length}`);
        console.log(`Skipped by status: ${skippedByStatus}`);
        console.log(`Skipped by date: ${skippedByDate}`);
        console.log(`Skipped by value: ${skippedByValue}`);
        console.log(`Successfully parsed: ${parsed.length}`);
        console.log(`Date column used: ${headers[col.data]}`);
        
        // Agrupa por período para debug
        const periods = new Set(parsed.map(row => row.date.substring(0, 7)));
        console.log(`Periods found: ${Array.from(periods).join(', ')}`);
        console.log('=== END HOTMART PARSER ===');
        
        if (parsed.length === 0) {
          reject(new Error('Nenhuma transação aprovada encontrada. Verifique se há vendas com status "Aprovado" e receita > 0.'));
          return;
        }
        
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Erro ao processar planilha Hotmart: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// Parser para Kiwify
export function parseKiwify(file: File): Promise<ParsedSaleRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const parsed: ParsedSaleRow[] = [];
        
        for (const row of jsonData) {
          const rowData = row as any;
          
          // Verifica status
          const status = String(rowData["Status"] || "").toLowerCase();
          if (status !== "paid") continue;
          
          // Busca data (remove hora se presente)
          let dateValue = rowData["Data de Criação"] || rowData["Created At"] || rowData["Data"];
          if (!dateValue) continue;
          
          dateValue = String(dateValue).split(' ')[0]; // Remove hora
          
          // Busca valores
          const preco = parseFloat(String(rowData["Preço base do produto"] || "0").replace(/[^\d.-]/g, ''));
          const taxas = parseFloat(String(rowData["Taxas"] || "0").replace(/[^\d.-]/g, ''));
          
          const net = preco - taxas;
          
          if (isNaN(net) || net <= 0) continue;
          
          const product = String(rowData["Produto"] || "Produto Desconhecido");
          const normalizedDate = normalizeDate(dateValue);
          
          parsed.push({
            date: normalizedDate,
            product,
            net,
            gross: preco,
            source: 'kiwify'
          });
        }
        
        if (parsed.length === 0) {
          reject(new Error('Nenhuma transação paga encontrada. Verifique se há vendas com status "paid".'));
          return;
        }
        
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Erro ao processar planilha Kiwify: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}