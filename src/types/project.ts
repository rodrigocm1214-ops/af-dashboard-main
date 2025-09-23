export interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface MetaAdsData {
  date: string;
  investment: number;
}

export interface SaleData {
  date: string;
  product: string;
  net: number;
  gross: number;
  source: 'hotmart' | 'kiwify' | 'manual';
}

export interface Period {
  month: string;
  year: string;
  metaAds: MetaAdsData[];
  sales: SaleData[];
}

export interface ProjectData {
  projectSlug: string;
  projectName: string;
  periods: Period[];
}

export interface KPIs {
  totalDays: number;
  totalInvestment: number;
  totalSales: number;
  totalRevenueNet: number;
  averageTicket: number;
  roas: number;
  profit: number;
  totalRevenueGross: number;
  effectiveSales: number;
  refunds: number;
}

export interface ProductKPI {
  product: string;
  sales: number;
  revenueNet: number;
  averageTicket: number;
  classification: 'Principal' | 'Upsell';
}

export interface DailyKPI {
  date: string;
  investment: number;
  cac: number;
  sales: number;
  averageTicket: number;
  revenue: number;
  roas: number;
}

export interface DashboardData {
  kpis: KPIs;
  productKpis: ProductKPI[];
  dailyKpis: DailyKPI[];
}