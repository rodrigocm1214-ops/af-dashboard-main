import { useState, useEffect } from 'react';
import { supabase, MetaAdsData, WebhookSalesData } from '@/lib/supabase';
import { DashboardData } from '@/types/project';
import { calculateKPIs } from '@/lib/kpiCalculator';
import { ParsedMetaRow, ParsedSaleRow } from '@/lib/parsers';

export const useSupabaseData = (projectId?: string) => {
  const [data, setData] = useState<DashboardData>({
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
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadAvailablePeriods();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && selectedPeriod) {
      loadPeriodData();
    }
  }, [projectId, selectedPeriod]);

  const loadAvailablePeriods = async () => {
    if (!projectId) return;

    try {
      // Get periods from Meta Ads data
      const { data: metaData } = await supabase
        .from('meta_ads_data')
        .select('date_start')
        .eq('project_id', projectId);

      // Get periods from webhook sales data
      const { data: salesData } = await supabase
        .from('webhook_sales_data')
        .select('sale_date')
        .eq('project_id', projectId);

      const periods = new Set<string>();

      // Extract periods from Meta Ads data
      metaData?.forEach((record: MetaAdsData) => {
        const date = new Date(record.date_start);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.add(period);
      });

      // Extract periods from sales data
      salesData?.forEach((record: WebhookSalesData) => {
        const date = new Date(record.sale_date);
        const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.add(period);
      });

      const sortedPeriods = Array.from(periods).sort().reverse();
      setAvailablePeriods(sortedPeriods);

      // Auto-select most recent period
      if (sortedPeriods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(sortedPeriods[0]);
      }
    } catch (error) {
      console.error('Error loading available periods:', error);
    }
  };

  const loadPeriodData = async () => {
    if (!projectId || !selectedPeriod) return;

    setLoading(true);
    try {
      const [year, month] = selectedPeriod.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;

      // Load Meta Ads data for the period
      const { data: metaData, error: metaError } = await supabase
        .from('meta_ads_data')
        .select('*')
        .eq('project_id', projectId)
        .gte('date_start', startDate)
        .lte('date_start', endDate);

      if (metaError) {
        console.error('Error loading Meta Ads data:', metaError);
      }

      // Load sales data for the period
      const { data: salesData, error: salesError } = await supabase
        .from('webhook_sales_data')
        .select('*')
        .eq('project_id', projectId)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);

      if (salesError) {
        console.error('Error loading sales data:', salesError);
      }

      // Convert to format expected by calculateKPIs
      const metaAdsFormatted: ParsedMetaRow[] = (metaData || []).map((record: MetaAdsData) => ({
        date: record.date_start,
        investment: record.spend
      }));

      const salesFormatted: ParsedSaleRow[] = (salesData || []).map((record: WebhookSalesData) => ({
        date: record.sale_date.split('T')[0], // Extract date part
        product: record.product_name,
        net: record.net_amount,
        gross: record.gross_amount,
        source: record.integration_id.includes('hotmart') ? 'hotmart' : 'kiwify'
      }));

      // Calculate KPIs
      const dashboardData = calculateKPIs(metaAdsFormatted, salesFormatted);
      setData(dashboardData);

    } catch (error) {
      console.error('Error loading period data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDataForPeriod = async (period: string): Promise<DashboardData> => {
    if (!projectId) return data;

    try {
      const [year, month] = period.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;

      // Load data for specific period
      const { data: metaData } = await supabase
        .from('meta_ads_data')
        .select('*')
        .eq('project_id', projectId)
        .gte('date_start', startDate)
        .lte('date_start', endDate);

      const { data: salesData } = await supabase
        .from('webhook_sales_data')
        .select('*')
        .eq('project_id', projectId)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);

      // Convert and calculate
      const metaAdsFormatted: ParsedMetaRow[] = (metaData || []).map((record: MetaAdsData) => ({
        date: record.date_start,
        investment: record.spend
      }));

      const salesFormatted: ParsedSaleRow[] = (salesData || []).map((record: WebhookSalesData) => ({
        date: record.sale_date.split('T')[0],
        product: record.product_name,
        net: record.net_amount,
        gross: record.gross_amount,
        source: record.integration_id.includes('hotmart') ? 'hotmart' : 'kiwify'
      }));

      return calculateKPIs(metaAdsFormatted, salesFormatted);
    } catch (error) {
      console.error('Error getting data for period:', error);
      return data;
    }
  };

  return {
    data,
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    loading,
    getDataForPeriod,
    refreshData: () => {
      loadAvailablePeriods();
      if (selectedPeriod) {
        loadPeriodData();
      }
    }
  };
};