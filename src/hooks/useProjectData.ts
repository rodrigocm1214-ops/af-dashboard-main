import { useState, useEffect, useMemo } from 'react';
import { DashboardData, ProjectData, MetaAdsData, SaleData } from '@/types/project';
import { mockDashboardData } from '@/lib/mockData';
import { parseMetaAds, parseHotmart, parseKiwify, ParsedMetaRow, ParsedSaleRow } from '@/lib/parsers';
import { calculateKPIs } from '@/lib/kpiCalculator';
import { useManualSalesHistory } from './useManualSalesHistory';

const getStorageKey = (projectId: string) => `project-data-${projectId}`;

export const useProjectData = (projectId: string | null) => {
  const [data, setData] = useState<DashboardData>(mockDashboardData);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addManualSaleRecord } = useManualSalesHistory(projectId || undefined);

  // Load and calculate data when project changes
  const loadData = () => {
    if (!projectId) return;

    const storageKey = getStorageKey(projectId);
    const stored = localStorage.getItem(storageKey);
    
    console.log('=== LOADING DATA ===');
    console.log('Project ID:', projectId);
    console.log('Selected Period:', selectedPeriod);
    console.log('Storage Key:', storageKey);
    console.log('Raw stored data:', stored);
    
    if (stored) {
      try {
        const projectData: ProjectData = JSON.parse(stored);
        console.log('Parsed project data:', projectData);
        
        // Find current period data
        const currentPeriod = projectData.periods.find(
          p => `${p.year}-${p.month}` === selectedPeriod
        );
        
        console.log('All periods:', projectData.periods.map(p => ({ period: `${p.year}-${p.month}`, metaCount: p.metaAds?.length || 0, salesCount: p.sales?.length || 0 })));
        console.log('Current period found:', currentPeriod);
        
        if (currentPeriod) {
          // Calculate KPIs from real data - ensure both metaAds and sales are passed
          const metaAds = currentPeriod.metaAds || [];
          const sales = currentPeriod.sales || [];
          
          console.log('Loading period data:', {
            period: selectedPeriod,
            metaAdsCount: metaAds.length,
            salesCount: sales.length,
            metaAds: metaAds.slice(0, 3), // Show first 3 records
            sales: sales.slice(0, 3) // Show first 3 records
          });
          
          const aggregatedData = calculateKPIs(metaAds, sales);
          console.log('Calculated KPIs:', aggregatedData.kpis);
          setData(aggregatedData);
        } else {
          console.log('No data for period, using empty state');
          // No data for this period, use empty state
          setData({
            kpis: {
              totalDays: 0,
              totalInvestment: 0,
              totalSales: 0,
              totalRevenueNet: 0,
              totalRevenueGross: 0,
              averageTicket: 0,
              roas: 0,
              profit: 0,
              effectiveSales: 0,
              refunds: 0
            },
            productKpis: [],
            dailyKpis: []
          });
        }
      } catch (error) {
        console.error('Error loading project data:', error);
        setData(mockDashboardData);
      }
    } else {
      console.log('No data stored, using mock data');
      // No data stored, use mock data
      setData(mockDashboardData);
    }
  };

  // Load data when project or period changes
  useEffect(() => {
    loadData();
  }, [projectId, selectedPeriod]);

  const processFileUpload = async (file: File, type: 'meta' | 'hotmart' | 'kiwify', headerRow?: number): Promise<number> => {
    if (!projectId) throw new Error('No project selected');

    setIsLoading(true);

    try {
      let parsedData: ParsedMetaRow[] | ParsedSaleRow[] = [];
      
      // Parse file based on type
      if (type === 'meta') {
        parsedData = await parseMetaAds(file, headerRow);
      } else if (type === 'hotmart') {
        parsedData = await parseHotmart(file);
      } else if (type === 'kiwify') {
        parsedData = await parseKiwify(file);
      }

      if (parsedData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      console.log('=== PROCESSING FILE UPLOAD ===');
      console.log('File type:', type);
      console.log('Parsed data count:', parsedData.length);
      console.log('First few records:', parsedData.slice(0, 3));

      // Extract period from first date using robust method to ensure YYYY-MM format
      const firstDate = parsedData[0].date;
      const periodId = new Date(firstDate).toISOString().slice(0, 7); // Always results in "YYYY-MM"
      const [year, month] = periodId.split('-');

      console.log('Extracting period from date:', { firstDate, periodId, year, month });

      const storageKey = getStorageKey(projectId);
      let projectData: ProjectData;

      const existing = localStorage.getItem(storageKey);
      console.log('Existing project data:', existing);
      
      if (existing) {
        projectData = JSON.parse(existing);
        console.log('Parsed existing project data:', projectData);
      } else {
        projectData = {
          projectSlug: `project-${projectId}`,
          projectName: `Project ${projectId}`,
          periods: []
        };
        console.log('Created new project data:', projectData);
      }

      // Find existing period or create new
      let period = projectData.periods.find(p => p.month === month && p.year === year);
      console.log('Found existing period:', period);
      
      if (!period) {
        period = {
          month,
          year,
          metaAds: [],
          sales: []
        };
        projectData.periods.push(period);
        console.log('Created new period:', period);
      }

      console.log('Before data merge - period state:', {
        metaAdsCount: period.metaAds?.length || 0,
        salesCount: period.sales?.length || 0
      });

      // Store parsed data with merge logic
      if (type === 'meta') {
        // Replace Meta Ads data (since it's typically one file per period)
        period.metaAds = parsedData as ParsedMetaRow[];
        console.log('Replaced Meta Ads data, new count:', period.metaAds.length);
      } else {
        // Convert to SaleData format
        const newSales = (parsedData as ParsedSaleRow[]).map(item => ({
          date: item.date,
          product: item.product,
          net: item.net,
          gross: item.gross,
          source: item.source
        }));

        // Merge with existing sales data, filtering out same source to avoid duplicates
        const existingSales = period.sales || [];
        const filteredExisting = existingSales.filter(sale => sale.source !== (type as 'hotmart' | 'kiwify'));
        period.sales = [...filteredExisting, ...newSales];
        
        console.log('Sales data merge:', {
          existingCount: existingSales.length,
          filteredCount: filteredExisting.length,
          newCount: newSales.length,
          finalCount: period.sales.length
        });
      }

      console.log('After data merge - period state:', {
        metaAdsCount: period.metaAds?.length || 0,
        salesCount: period.sales?.length || 0
      });

      console.log('Final project data before save:', projectData);
      localStorage.setItem(storageKey, JSON.stringify(projectData));
      console.log('Data saved to localStorage');
      
      // Update selected period to the uploaded data period
      setSelectedPeriod(periodId);
      console.log('Updated selected period to:', periodId);
      
      // Reload data
      console.log('Reloading data...');
      loadData();

      return parsedData.length;

    } catch (error) {
      throw error; // Re-throw to be handled by caller
    } finally {
      setIsLoading(false);
    }
  };

  const addManualSale = async (saleData: { date: string; product: string; net: number; gross: number }): Promise<void> => {
    if (!projectId) throw new Error('No project selected');

    console.log('=== ADDING MANUAL SALE ===');
    console.log('Sale data:', saleData);

    // Validate and sanitize input data
    const sanitizedData = {
      date: saleData.date,
      product: saleData.product.trim(),
      net: Number(saleData.net) || 0,
      gross: Number(saleData.gross) || 0
    };

    console.log('Sanitized data:', sanitizedData);

    // Extract period from date
    const saleDate = new Date(sanitizedData.date);
    const periodId = saleDate.toISOString().slice(0, 7); // YYYY-MM format
    const [year, month] = periodId.split('-');

    console.log('Period info:', { periodId, year, month });

    const storageKey = getStorageKey(projectId);
    let projectData: ProjectData;

    const existing = localStorage.getItem(storageKey);
    if (existing) {
      projectData = JSON.parse(existing);
    } else {
      projectData = {
        projectSlug: `project-${projectId}`,
        projectName: `Project ${projectId}`,
        periods: []
      };
    }

    console.log('Current project data:', projectData);

    // Find existing period or create new
    let period = projectData.periods.find(p => p.month === month && p.year === year);
    if (!period) {
      period = {
        month,
        year,
        metaAds: [],
        sales: []
      };
      projectData.periods.push(period);
      console.log('Created new period:', period);
    }

    // Add manual sale with proper formatting
    const newSale = {
      date: sanitizedData.date,
      product: sanitizedData.product,
      net: sanitizedData.net,
      gross: sanitizedData.gross,
      source: 'manual' as const
    };

    console.log('Adding sale:', newSale);

    period.sales = [...(period.sales || []), newSale];

    console.log('Period after adding sale:', {
      month: period.month,
      year: period.year,
      salesCount: period.sales.length,
      metaAdsCount: period.metaAds?.length || 0
    });

    // Save updated data
    localStorage.setItem(storageKey, JSON.stringify(projectData));
    console.log('Project data saved to localStorage');
    
    // Record in manual sales history
    try {
      addManualSaleRecord(sanitizedData);
      console.log('Added to manual sales history');
    } catch (error) {
      console.error('Error adding to manual sales history:', error);
    }
    
    // Update selected period and reload data
    setSelectedPeriod(periodId);
    console.log('Updated selected period to:', periodId);
    
    loadData();
    console.log('Data reloaded');
  };

  const removeManualSale = (saleId: string) => {
    if (!projectId) return;

    console.log('=== REMOVING MANUAL SALE ===');
    console.log('Sale ID to remove:', saleId);

    const storageKey = getStorageKey(projectId);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const projectData: ProjectData = JSON.parse(stored);
        console.log('Current project data:', projectData);
        
        // Find and remove the manual sale from all periods
        let saleRemoved = false;
        projectData.periods.forEach(period => {
          const originalLength = period.sales?.length || 0;
          if (period.sales) {
            // Remove sales that match the manual sale ID
            // Since we don't have direct ID mapping, we'll use creation time pattern
            period.sales = period.sales.filter(sale => {
              if (sale.source === 'manual') {
                // Check if this manual sale should be removed by finding it in the history
                const saleDateTime = new Date(sale.date);
                const saleIdTimestamp = saleId.split('_')[1]; // Extract timestamp from ID
                if (saleIdTimestamp) {
                  const idTime = new Date(parseInt(saleIdTimestamp));
                  const timeDiff = Math.abs(saleDateTime.getTime() - idTime.getTime());
                  // If the sale was added within 24 hours of the ID timestamp, it's likely the same sale
                  if (timeDiff < 24 * 60 * 60 * 1000) {
                    console.log('Found matching manual sale to remove:', sale);
                    saleRemoved = true;
                    return false; // Remove this sale
                  }
                }
              }
              return true; // Keep this sale
            });
          }
          const newLength = period.sales?.length || 0;
          if (originalLength !== newLength) {
            console.log(`Removed sale from period ${period.year}-${period.month}. Count: ${originalLength} -> ${newLength}`);
          }
        });

        if (saleRemoved) {
          localStorage.setItem(storageKey, JSON.stringify(projectData));
          console.log('Updated project data saved');
          
          // Reload data to update dashboard
          loadData();
          console.log('Data reloaded after manual sale removal');
        } else {
          console.log('No matching manual sale found in project data');
        }
        
      } catch (error) {
        console.error('Error removing manual sale from project data:', error);
      }
    }
  };

  const clearProjectData = () => {
    if (!projectId) return;
    
    const storageKey = getStorageKey(projectId);
    localStorage.removeItem(storageKey);
    setData({
      kpis: {
        totalDays: 0,
        totalInvestment: 0,
        totalSales: 0,
        totalRevenueNet: 0,
        totalRevenueGross: 0,
        averageTicket: 0,
        roas: 0,
        profit: 0,
        effectiveSales: 0,
        refunds: 0
      },
      productKpis: [],
      dailyKpis: []
    });
  };

  const clearPeriodData = () => {
    if (!projectId || !selectedPeriod) return;
    
    const storageKey = getStorageKey(projectId);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const projectData: ProjectData = JSON.parse(stored);
        const [year, month] = selectedPeriod.split('-');
        
        // Remove the selected period from the project data
        projectData.periods = projectData.periods.filter(
          p => !(p.year === year && p.month === month)
        );
        
        localStorage.setItem(storageKey, JSON.stringify(projectData));
        
        // Reset to empty data for current view
        setData({
          kpis: {
            totalDays: 0,
            totalInvestment: 0,
            totalSales: 0,
            totalRevenueNet: 0,
            totalRevenueGross: 0,
            averageTicket: 0,
            roas: 0,
            profit: 0,
            effectiveSales: 0,
            refunds: 0
          },
          productKpis: [],
          dailyKpis: []
        });
        
        // If there are other periods, switch to the latest one
        if (projectData.periods.length > 0) {
          const sortedPeriods = projectData.periods
            .map(p => `${p.year}-${p.month}`)
            .sort((a, b) => b.localeCompare(a));
          setSelectedPeriod(sortedPeriods[0]);
        } else {
          setSelectedPeriod('');
        }
        
      } catch (error) {
        console.error('Error clearing period data:', error);
      }
    }
  };

  const getDataForPeriod = (period: string): DashboardData => {
    if (!projectId) return mockDashboardData;

    const storageKey = getStorageKey(projectId);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const projectData: ProjectData = JSON.parse(stored);
        const targetPeriod = projectData.periods.find(
          p => `${p.year}-${p.month}` === period
        );
        
        if (targetPeriod) {
          const metaAds = targetPeriod.metaAds || [];
          const sales = targetPeriod.sales || [];
          return calculateKPIs(metaAds, sales);
        }
      } catch (error) {
        console.error('Error getting data for period:', error);
      }
    }
    
    return {
      kpis: {
        totalDays: 0,
        totalInvestment: 0,
        totalSales: 0,
        totalRevenueNet: 0,
        totalRevenueGross: 0,
        averageTicket: 0,
        roas: 0,
        profit: 0,
        effectiveSales: 0,
        refunds: 0
      },
      productKpis: [],
      dailyKpis: []
    };
  };

  const getAvailablePeriods = (): string[] => {
    if (!projectId) return [];

    const storageKey = getStorageKey(projectId);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const projectData: ProjectData = JSON.parse(stored);
        const periods = projectData.periods.map(p => `${p.year}-${p.month}`);
        
        console.log('=== GETTING AVAILABLE PERIODS ===');
        console.log('Project periods:', projectData.periods.map(p => ({ 
          period: `${p.year}-${p.month}`, 
          metaCount: p.metaAds?.length || 0, 
          salesCount: p.sales?.length || 0 
        })));
        console.log('Mapped periods:', periods);
        
        // Remove duplicatas e ordena (formato YYYY-MM)
        const uniquePeriods = [...new Set(periods)].sort((a, b) => b.localeCompare(a));
        
        console.log('Unique periods after deduplication:', uniquePeriods);
        
        return uniquePeriods;
      } catch (error) {
        console.error('Error getting available periods:', error);
        return [];
      }
    }
    
    return [];
  };

  const availablePeriods = useMemo(() => getAvailablePeriods(), [projectId, data]);

  return {
    data,
    selectedPeriod,
    setSelectedPeriod,
    isLoading,
    processFileUpload,
    addManualSale,
    removeManualSale,
    clearProjectData,
    clearPeriodData,
    getDataForPeriod,
    availablePeriods,
  };
};