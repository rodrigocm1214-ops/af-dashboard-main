import { ParsedMetaRow, ParsedSaleRow } from './parsers';
import { KPIs, ProductKPI, DailyKPI } from '@/types/project';

export interface AggregatedData {
  kpis: KPIs;
  productKpis: ProductKPI[];
  dailyKpis: DailyKPI[];
}

// Determina se um produto é upsell baseado no nome
function isUpsellProduct(productName: string): boolean {
  const upsellKeywords = ['upsell', 'bump', 'complementar', 'adicional', 'extra', 'plus'];
  const lowerName = productName.toLowerCase();
  return upsellKeywords.some(keyword => lowerName.includes(keyword));
}

// Calcula todos os KPIs baseado nos dados parseados
export function calculateKPIs(metaData: ParsedMetaRow[], salesData: ParsedSaleRow[]): AggregatedData {
  // Agrega dados por data
  const dailyData: { [date: string]: { investment: number; sales: number; revenue: number; grossRevenue: number } } = {};
  
  // Processa dados do Meta Ads
  metaData.forEach(row => {
    if (!dailyData[row.date]) {
      dailyData[row.date] = { investment: 0, sales: 0, revenue: 0, grossRevenue: 0 };
    }
    dailyData[row.date].investment += row.investment;
  });
  
  // Processa dados de vendas
  salesData.forEach(row => {
    if (!dailyData[row.date]) {
      dailyData[row.date] = { investment: 0, sales: 0, revenue: 0, grossRevenue: 0 };
    }
    dailyData[row.date].sales += 1;
    dailyData[row.date].revenue += row.net;
    dailyData[row.date].grossRevenue += row.gross;
  });
  
  // Calcula KPIs totais
  const totalDays = Object.keys(dailyData).length;
  const totalInvestment = Object.values(dailyData).reduce((sum, day) => sum + day.investment, 0);
  const totalSales = Object.values(dailyData).reduce((sum, day) => sum + day.sales, 0);
  const totalRevenueNet = Object.values(dailyData).reduce((sum, day) => sum + day.revenue, 0);
  const totalRevenueGross = Object.values(dailyData).reduce((sum, day) => sum + day.grossRevenue, 0);
  const averageTicket = totalSales > 0 ? totalRevenueNet / totalSales : 0;
  const roas = totalInvestment > 0 ? totalRevenueNet / totalInvestment : 0;
  const profit = totalRevenueNet - totalInvestment;
  
  const kpis: KPIs = {
    totalDays,
    totalInvestment,
    totalSales,
    totalRevenueNet,
    totalRevenueGross,
    averageTicket,
    roas,
    profit,
    effectiveSales: totalSales, // Assumimos que todas são efetivas por enquanto
    refunds: 0 // Precisaria ser detectado na planilha
  };
  
  // Calcula KPIs por produto
  const productData: { [product: string]: { sales: number; revenue: number } } = {};
  
  salesData.forEach(row => {
    if (!productData[row.product]) {
      productData[row.product] = { sales: 0, revenue: 0 };
    }
    productData[row.product].sales += 1;
    productData[row.product].revenue += row.net;
  });
  
  const productKpis: ProductKPI[] = Object.entries(productData).map(([product, data]) => ({
    product,
    sales: data.sales,
    revenueNet: data.revenue,
    averageTicket: data.sales > 0 ? data.revenue / data.sales : 0,
    classification: isUpsellProduct(product) ? 'Upsell' : 'Principal'
  }));
  
  // Calcula KPIs diários
  const dailyKpis: DailyKPI[] = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      const cac = data.sales > 0 ? data.investment / data.sales : 0;
      const dailyTicket = data.sales > 0 ? data.revenue / data.sales : 0;
      const dailyRoas = data.investment > 0 ? data.revenue / data.investment : 0;
      
      return {
        date,
        investment: data.investment,
        cac,
        sales: data.sales,
        averageTicket: dailyTicket,
        revenue: data.revenue,
        roas: dailyRoas
      };
    });
  
  return {
    kpis,
    productKpis,
    dailyKpis
  };
}