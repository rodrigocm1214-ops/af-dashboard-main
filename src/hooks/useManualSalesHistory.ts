import { useState, useEffect } from 'react';

export interface ManualSaleRecord {
  id: string;
  date: string;
  product: string;
  net: number;
  gross: number;
  createdAt: string;
  projectId: string;
}

export function useManualSalesHistory(projectId?: string) {
  const [manualSales, setManualSales] = useState<ManualSaleRecord[]>([]);

  const getStorageKey = (projectId: string) => `manual_sales_history_${projectId}`;

  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem(getStorageKey(projectId));
      if (stored) {
        try {
          setManualSales(JSON.parse(stored));
        } catch {
          setManualSales([]);
        }
      } else {
        setManualSales([]);
      }
    }
  }, [projectId]);

  const addManualSaleRecord = (saleData: { date: string; product: string; net: number; gross: number }) => {
    if (!projectId) return;

    const newRecord: ManualSaleRecord = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: saleData.date,
      product: saleData.product,
      net: saleData.net,
      gross: saleData.gross,
      createdAt: new Date().toISOString(),
      projectId,
    };

    const updated = [newRecord, ...manualSales];
    setManualSales(updated);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
    
    return newRecord.id;
  };

  const updateManualSale = (id: string, saleData: { date: string; product: string; net: number; gross: number }) => {
    if (!projectId) return;

    const updated = manualSales.map(sale => 
      sale.id === id 
        ? { ...sale, ...saleData }
        : sale
    );
    setManualSales(updated);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  };

  const removeManualSale = (id: string) => {
    if (!projectId) return;

    const updated = manualSales.filter(sale => sale.id !== id);
    setManualSales(updated);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (!projectId) return;

    setManualSales([]);
    localStorage.removeItem(getStorageKey(projectId));
  };

  return {
    manualSales,
    addManualSaleRecord,
    updateManualSale,
    removeManualSale,
    clearHistory,
  };
}