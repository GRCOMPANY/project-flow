import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartCatalog } from '@/hooks/useSmartCatalog';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { HeroFinancialCard } from '@/components/command-center/HeroFinancialCard';
import { AIRadarPanel, generateRadarAlerts } from '@/components/command-center/AIRadarPanel';
import { MetricsDashboard, calculateTrendData } from '@/components/command-center/MetricsDashboard';
import { ProductSpotlight, identifyKeyProducts } from '@/components/command-center/ProductSpotlight';
import { AIInsightBanner, generateDailyInsight } from '@/components/command-center/AIInsightBanner';
import { QuickActionsBar, generateSmartActions } from '@/components/command-center/QuickActionsBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

// Helper to calculate days since a date
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { sales, loading: salesLoading } = useSales();
  const { creatives, loading: creativesLoading } = useCreatives();

  const loading = productsLoading || salesLoading || creativesLoading;

  // Smart catalog with metrics
  const smartProducts = useSmartCatalog({ products, sales, creatives });

  // =========================================
  // DATA CALCULATIONS — mirrors Sales.tsx stats exactly
  // =========================================

  const salesStats = useMemo(() => {
    const totalSold = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const pending = sales.filter(s => s.paymentStatus === 'pendiente');
    const pendingAmount = pending.reduce((sum, s) => sum + s.totalAmount, 0);
    const pendingCount = pending.length;
    const paidAmount = sales.filter(s => s.paymentStatus === 'pagado').reduce((sum, s) => sum + s.totalAmount, 0);
    const netProfit = sales.reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0);
    const salesWithMargin = sales.filter(s => s.marginPercentAtSale !== undefined && s.marginPercentAtSale !== null);
    const avgMargin = salesWithMargin.length > 0
      ? salesWithMargin.reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / salesWithMargin.length
      : 0;

    const unconfirmedOld = sales.filter(s => {
      if (s.operationalStatus !== 'nuevo') return false;
      const days = daysSince(s.statusUpdatedAt || s.saleDate);
      return days > 2;
    }).length;

    const atRisk = sales.filter(s =>
      s.operationalStatus === 'riesgo_devolucion' ||
      s.operationalStatus === 'sin_respuesta'
    ).length;

    // Weekly context
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const totalWeeklySales = sales
      .filter(s => new Date(s.saleDate) >= oneWeekAgo)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const percentOfWeeklySales = totalWeeklySales > 0
      ? Math.round((pendingAmount / totalWeeklySales) * 100)
      : 0;

    return {
      totalSold,
      pendingAmount,
      pendingCount,
      paidAmount,
      netProfit,
      avgMargin,
      unconfirmedOld,
      atRisk,
      totalWeeklySales,
      percentOfWeeklySales,
      actionsToStability: unconfirmedOld + atRisk,
    };
  }, [sales]);

  // Product metrics for radar and actions
  const productMetrics = useMemo(() => {
    const hotProducts = smartProducts.filter(p => p.salesLast7Days >= 3).length;
    const coldProducts = smartProducts.filter(p => 
      p.status === 'activo' && 
      p.salesLast30Days === 0 && 
      (p.marginPercent || 0) > 25
    ).length;
    const needsCreatives = smartProducts.filter(p => 
      p.isFeatured && p.needsCreatives
    ).length;

    return { hotProducts, coldProducts, needsCreatives };
  }, [smartProducts]);

  // Creative metrics for radar
  const creativeMetrics = useMemo(() => {
    const hotCreatives = creatives.filter(c => {
      const msgs = c.metricMessages || 0;
      const sales = c.metricSales || 0;
      return sales >= 3 || msgs >= 30 || c.engagementLevel === 'alto';
    }).length;
    
    const coldCreatives = creatives.filter(c => {
      const msgs = c.metricMessages || 0;
      const sales = c.metricSales || 0;
      return c.status === 'publicado' && sales < 1 && msgs < 10;
    }).length;
    
    const creativesWithHighMessagesLowSales = creatives.filter(c => {
      const msgs = c.metricMessages || 0;
      const sales = c.metricSales || 0;
      return msgs >= 10 && sales < 2;
    }).length;

    return { hotCreatives, coldCreatives, creativesWithHighMessagesLowSales };
  }, [creatives]);

  // Radar alerts with enhanced data including creatives
  const radarAlerts = useMemo(() => {
    return generateRadarAlerts(
      {
        unconfirmedOld: tensionData.unconfirmedOld,
        atRisk: tensionData.atRisk,
        pendingAmount: tensionData.pendingAmount,
        pendingCount: tensionData.pendingCount,
        avgSaleAmount: tensionData.avgSaleAmount,
      },
      productMetrics,
      creativeMetrics
    );
  }, [tensionData, productMetrics, creativeMetrics]);

  // Trend metrics data (now includes margin)
  const trendData = useMemo(() => {
    return calculateTrendData(sales);
  }, [sales]);

  // Key products (get the most important one for spotlight)
  const keyProducts = useMemo(() => {
    return identifyKeyProducts(smartProducts, sales);
  }, [smartProducts, sales]);

  const spotlightProduct = keyProducts[0] || null;

  // Daily insight
  const dailyInsight = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const paidToday = sales.filter(s => 
      s.paymentStatus === 'pagado' && 
      s.saleDate.startsWith(today)
    ).length;
    const revenueToday = sales
      .filter(s => s.paymentStatus === 'pagado' && s.saleDate.startsWith(today))
      .reduce((sum, s) => sum + s.totalAmount, 0);

    return generateDailyInsight(
      {
        pendingAmount: tensionData.pendingAmount,
        pendingCount: tensionData.pendingCount,
        unconfirmedOld: tensionData.unconfirmedOld,
        atRisk: tensionData.atRisk,
        paidToday,
        revenueToday,
      },
      {
        hotProducts: productMetrics.hotProducts,
        coldWithPotential: productMetrics.coldProducts,
      }
    );
  }, [tensionData, productMetrics, sales]);

  // Smart actions
  const smartActions = useMemo(() => {
    return generateSmartActions(
      {
        pendingCount: tensionData.pendingCount,
        pendingAmount: tensionData.pendingAmount,
      },
      productMetrics
    );
  }, [tensionData, productMetrics]);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // =========================================
  // LOADING STATE
  // =========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-10">
            {/* Header skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-72" />
            </div>
            
            {/* Hero skeleton */}
            <Skeleton className="h-56 w-full rounded-2xl" />
            
            {/* Two column skeleton */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            
            {/* Spotlight skeleton */}
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN RENDER
  // =========================================

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Premium Header */}
        <header className="animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Sistema Activo
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Actualizado ahora
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {getGreeting()}, {profile?.fullName?.split(' ')[0]}
              </h1>
            </div>
          </div>
        </header>

        {/* BLOQUE 1: Hero Financial Card - Premium */}
        <section className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <HeroFinancialCard
            montoEnRiesgo={tensionData.montoEnRiesgo}
            ventasSinConfirmar={tensionData.unconfirmedOld}
            ventasEnRiesgo={tensionData.atRisk}
            pendienteCobro={tensionData.pendingAmount}
            percentOfWeeklySales={tensionData.percentOfWeeklySales}
            changeVsYesterday={tensionData.changeVsYesterday}
            actionsToStability={tensionData.actionsToStability}
            totalWeeklySales={weeklyStats.totalWeeklySales}
          />
        </section>

        {/* Two Column Layout for Radar + Metrics */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* BLOQUE 2: AI Radar Panel - Premium */}
          {radarAlerts.length > 0 && (
            <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <AIRadarPanel alerts={radarAlerts} />
            </section>
          )}

          {/* BLOQUE 3: Metrics Dashboard - Premium with Margin */}
          <section 
            className={`animate-fade-up ${radarAlerts.length === 0 ? 'lg:col-span-2' : ''}`} 
            style={{ animationDelay: '0.15s' }}
          >
            <MetricsDashboard
              salesData={trendData.salesData}
              profitData={trendData.profitData}
              marginData={trendData.marginData}
            />
          </section>
        </div>

        {/* BLOQUE 4: Product Spotlight - Premium */}
        {spotlightProduct && (
          <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <ProductSpotlight keyProduct={spotlightProduct} />
          </section>
        )}

        {/* BLOQUE 5: AI Insight Banner - Premium */}
        <section className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <AIInsightBanner insight={dailyInsight} />
        </section>

        {/* BLOQUE 6: Quick Actions Bar - Premium */}
        <section className="animate-fade-up pb-10" style={{ animationDelay: '0.3s' }}>
          <QuickActionsBar actions={smartActions} />
        </section>
      </div>
    </div>
  );
}