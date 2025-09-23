import { useMemo } from 'react';
import { DashboardData } from '@/types/project';

interface TrendData {
  value: string | null;
  trend: 'up' | 'down' | 'neutral';
}

interface UseTrendAnalysisProps {
  currentData: DashboardData;
  currentPeriod: string;
  availablePeriods: string[];
  getDataForPeriod: (period: string) => DashboardData;
}

export const useTrendAnalysis = ({
  currentData,
  currentPeriod,
  availablePeriods,
  getDataForPeriod
}: UseTrendAnalysisProps) => {
  
  const getPreviousPeriod = (current: string): string | null => {
    if (!current) return null;
    
    // Sort periods in descending order to find the previous one
    const sortedPeriods = [...availablePeriods].sort((a, b) => b.localeCompare(a));
    const currentIndex = sortedPeriods.indexOf(current);
    
    if (currentIndex === -1 || currentIndex === sortedPeriods.length - 1) {
      return null; // No previous period found
    }
    
    return sortedPeriods[currentIndex + 1];
  };

  const calculateTrend = (current: number, previous: number): TrendData => {
    if (previous === 0) {
      return { value: null, trend: 'neutral' };
    }
    
    const percentChange = ((current - previous) / previous) * 100;
    const isPositive = percentChange > 0;
    
    return {
      value: `${isPositive ? '+' : ''}${percentChange.toFixed(1)}% vs mês anterior`,
      trend: isPositive ? 'up' : percentChange < 0 ? 'down' : 'neutral'
    };
  };

  const trends = useMemo(() => {
    const previousPeriod = getPreviousPeriod(currentPeriod);
    
    if (!previousPeriod) {
      return {
        revenue: { value: null, trend: 'neutral' as const },
        roas: { value: null, trend: 'neutral' as const },
        profit: { value: null, trend: 'neutral' as const },
        investment: { value: null, trend: 'neutral' as const }
      };
    }
    
    const previousData = getDataForPeriod(previousPeriod);
    
    return {
      revenue: calculateTrend(currentData.kpis.totalRevenueNet, previousData.kpis.totalRevenueNet),
      roas: calculateTrend(currentData.kpis.roas, previousData.kpis.roas),
      profit: calculateTrend(currentData.kpis.profit, previousData.kpis.profit),
      investment: calculateTrend(currentData.kpis.totalInvestment, previousData.kpis.totalInvestment)
    };
  }, [currentData, currentPeriod, availablePeriods, getDataForPeriod]);

  return trends;
};