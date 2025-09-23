import { Project, DashboardData, ProjectData } from '@/types/project';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Café Gerações',
    slug: 'cafe-geracoes',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Curso de Marketing Digital',
    slug: 'curso-marketing-digital',
    createdAt: new Date('2024-02-20')
  },
  {
    id: '3',
    name: 'Ebook Vendas Online',
    slug: 'ebook-vendas-online',
    createdAt: new Date('2024-03-10')
  }
];

export const mockDashboardData: DashboardData = {
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

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};