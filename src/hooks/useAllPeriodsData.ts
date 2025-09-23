import { useState, useEffect } from 'react';
import { DashboardData } from '@/types/project';
import { useProjectData } from './useProjectData';

interface PeriodData {
  period: string;
  data: DashboardData;
}

export const useAllPeriodsData = (projectId: string | null, availablePeriods: string[]) => {
  const [allPeriodsData, setAllPeriodsData] = useState<PeriodData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId || availablePeriods.length === 0) {
      setAllPeriodsData([]);
      return;
    }

    loadAllPeriodsData();
  }, [projectId, availablePeriods]);

  const loadAllPeriodsData = async () => {
    if (!projectId) return;

    setIsLoading(true);
    
    try {
      const storageKey = `project-data-${projectId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        setAllPeriodsData([]);
        return;
      }

      const projectData = JSON.parse(stored);
      const periodsData: PeriodData[] = [];

      // Import the calculation function
      const { calculateKPIs } = await import('@/lib/kpiCalculator');

      for (const period of availablePeriods) {
        const [year, month] = period.split('-');
        const periodData = projectData.periods.find(
          (p: any) => p.year === year && p.month === month
        );

        if (periodData) {
          const metaAds = periodData.metaAds || [];
          const sales = periodData.sales || [];
          
          const dashboardData = calculateKPIs(metaAds, sales);
          
          periodsData.push({
            period,
            data: dashboardData
          });
        }
      }

      setAllPeriodsData(periodsData);
    } catch (error) {
      console.error('Error loading all periods data:', error);
      setAllPeriodsData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    allPeriodsData,
    isLoading,
    refreshData: loadAllPeriodsData
  };
};