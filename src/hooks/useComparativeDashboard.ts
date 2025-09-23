import { useState, useEffect, useMemo } from 'react';
import { DashboardData, Project } from '@/types/project';
import { calculateKPIs } from '@/lib/kpiCalculator';

export interface ComparativeProjectData {
  projectId: string;
  projectName: string;
  period: string;
  data: DashboardData;
}

export interface ComparativePeriodData {
  period: string;
  kpis: DashboardData['kpis'];
  projects: Array<{
    projectId: string;
    projectName: string;
    data: DashboardData;
  }>;
}

export const useComparativeDashboard = (projects: Project[]) => {
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [projectsData, setProjectsData] = useState<ComparativeProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load available periods from all projects
  useEffect(() => {
    const allPeriods = new Set<string>();
    const projectsWithData: string[] = [];
    
    projects.forEach(project => {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          if (projectData.periods?.length > 0) {
            projectsWithData.push(project.id);
            projectData.periods.forEach((period: any) => {
              allPeriods.add(`${period.year}-${period.month}`);
            });
          }
        } catch (error) {
          console.error(`Error loading periods for project ${project.id}:`, error);
        }
      }
    });

    const sortedPeriods = Array.from(allPeriods).sort().reverse();
    setAvailablePeriods(sortedPeriods);
    
    // Auto-select recent periods and projects with data if nothing selected
    if (sortedPeriods.length > 0 && selectedPeriods.length === 0) {
      setSelectedPeriods(sortedPeriods.slice(0, Math.min(3, sortedPeriods.length)));
    }
    
    if (projectsWithData.length > 0 && selectedProjects.length === 0) {
      setSelectedProjects(projectsWithData.slice(0, Math.min(3, projectsWithData.length)));
    }
  }, [projects]);

  // Load comparative data when selections change
  useEffect(() => {
    loadComparativeData();
  }, [selectedProjects, selectedPeriods, projects]);

  const loadComparativeData = async () => {
    if (selectedProjects.length === 0 && selectedPeriods.length === 0) {
      setProjectsData([]);
      return;
    }
    
    setIsLoading(true);
    const periodData: ComparativeProjectData[] = [];

    const projectsToLoad = selectedProjects.length > 0 ? 
      projects.filter(p => selectedProjects.includes(p.id)) : 
      projects;
    
    const periodsToLoad = selectedPeriods.length > 0 ? 
      selectedPeriods :
      availablePeriods.slice(0, 3);

    for (const project of projectsToLoad) {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          
          for (const periodStr of periodsToLoad) {
            const [year, month] = periodStr.split('-');
            const period = projectData.periods?.find(
              (p: any) => p.year === year && p.month === month
            );

            if (period) {
              const metaAds = period.metaAds || [];
              const sales = period.sales || [];
              
              if (metaAds.length > 0 || sales.length > 0) {
                const dashboardData = calculateKPIs(metaAds, sales);
                
                periodData.push({
                  projectId: project.id,
                  projectName: project.name,
                  period: periodStr,
                  data: dashboardData
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error loading data for project ${project.id}:`, error);
        }
      }
    }

    setProjectsData(periodData);
    setIsLoading(false);
  };

  // Group data by periods for period comparison
  const periodComparisonData = useMemo((): ComparativePeriodData[] => {
    const grouped: { [period: string]: ComparativePeriodData } = {};
    
    projectsData.forEach(item => {
      if (!grouped[item.period]) {
        grouped[item.period] = {
          period: item.period,
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
          projects: []
        };
      }
      
      grouped[item.period].projects.push({
        projectId: item.projectId,
        projectName: item.projectName,
        data: item.data
      });
      
      // Aggregate KPIs for the period
      const periodKpis = grouped[item.period].kpis;
      const itemKpis = item.data.kpis;
      
      periodKpis.totalInvestment += itemKpis.totalInvestment;
      periodKpis.totalSales += itemKpis.totalSales;
      periodKpis.totalRevenueNet += itemKpis.totalRevenueNet;
      periodKpis.totalRevenueGross += itemKpis.totalRevenueGross;
      periodKpis.profit += itemKpis.profit;
      periodKpis.effectiveSales += itemKpis.effectiveSales;
      periodKpis.refunds += itemKpis.refunds;
    });
    
    // Calculate derived metrics for each period
    Object.values(grouped).forEach(period => {
      if (period.kpis.totalSales > 0) {
        period.kpis.averageTicket = period.kpis.totalRevenueNet / period.kpis.totalSales;
      }
      if (period.kpis.totalInvestment > 0) {
        period.kpis.roas = period.kpis.totalRevenueNet / period.kpis.totalInvestment;
      }
    });
    
    return Object.values(grouped).sort((a, b) => b.period.localeCompare(a.period));
  }, [projectsData]);

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  return {
    availablePeriods,
    selectedProjects,
    selectedPeriods,
    projectsData,
    periodComparisonData,
    isLoading,
    setSelectedProjects,
    setSelectedPeriods,
    formatPeriodLabel,
    refreshData: loadComparativeData,
  };
};