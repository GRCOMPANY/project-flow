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
import { MetricsDashboard } from '@/components/command-center/MetricsDashboard';
import { ProductSpotlight, identifyKeyProducts } from '@/components/command-center/ProductSpotlight';
import { AIInsightBanner, generateDailyInsight } from '@/components/command-center/AIInsightBanner';
import { QuickActionsBar, generateSmartActions } from '@/components/command-center/QuickActionsBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

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

  const smartProducts = useSmartCatalog({ products, sales, creatives });

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

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const totalWeeklySales = sales
      .filter(s => new Date(s.saleDate) >= oneWeekAgo)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const percentOfWeeklySales = totalWeeklySales > 0
      ? Math.round((pendingAmount / totalWeeklySales) * 100)
      : 0;

    return {
      totalSold, pendingAmount, pendingCount, paidAmount, netProfit, avgMargin,
      unconfirmedOld, atRisk, totalWeeklySales, percentOfWeeklySales,
      actionsToStability: unconfirmedOld + atRisk,
    };
  }, [sales]);

  const productMetrics = useMemo(() => {
    const hotProducts = smartProducts.filter(p => p.salesLast7Days >= 3).length;
    const coldProducts = smartProducts.filter(p => 
      p.status === 'activo' && p.salesLast30Days === 0 && (p.marginPercent || 0) > 25
    ).length;
    const needsCreatives = smartProducts.filter(p => p.isFeatured && p.needsCreatives).length;
    return { hotProducts, coldProducts, needsCreatives };
  }, [smartProducts]);

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

  const radarAlerts = useMemo(() => {
    return generateRadarAlerts(
      { unconfirmedOld: salesStats.unconfirmedOld, atRisk: salesStats.atRisk, pendingAmount: salesStats.pendingAmount, pendingCount: salesStats.pendingCount },
      productMetrics, creativeMetrics
    );
  }, [salesStats, productMetrics, creativeMetrics]);

  const keyProducts = useMemo(() => identifyKeyProducts(smartProducts, sales), [smartProducts, sales]);
  const spotlightProduct = keyProducts[0] || null;

  const dailyInsight = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const paidToday = sales.filter(s => s.paymentStatus === 'pagado' && s.saleDate.startsWith(today)).length;
    const revenueToday = sales.filter(s => s.paymentStatus === 'pagado' && s.saleDate.startsWith(today)).reduce((sum, s) => sum + s.totalAmount, 0);
    return generateDailyInsight(
      { pendingAmount: salesStats.pendingAmount, pendingCount: salesStats.pendingCount, unconfirmedOld: salesStats.unconfirmedOld, atRisk: salesStats.atRisk, paidToday, revenueToday },
      { hotProducts: productMetrics.hotProducts, coldWithPotential: productMetrics.coldProducts }
    );
  }, [salesStats, productMetrics, sales]);

  const smartActions = useMemo(() => {
    return generateSmartActions(
      { pendingCount: salesStats.pendingCount, pendingAmount: salesStats.pendingAmount },
      productMetrics
    );
  }, [salesStats, productMetrics]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommandCenterNav />
        <div className="container max-w-7xl mx-auto px-4 py-10">
          <div className="space-y-14">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-72" />
            </div>
            <Skeleton className="h-56 w-full rounded-2xl" />
            <div className="grid lg:grid-cols-2 gap-10">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommandCenterNav />

      <div className="container max-w-7xl mx-auto px-4 py-10 space-y-14">
        {/* Premium Header */}
        <header className="animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">
                  Sistema Activo
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Actualizado ahora
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-['Playfair_Display'] font-bold text-foreground tracking-tight">
                {getGreeting()}, {profile?.fullName?.split(' ')[0]}
              </h1>
            </div>
          </div>
        </header>

        {/* BLOQUE 1: Hero Financial Card */}
        <section className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <HeroFinancialCard
            montoEnRiesgo={salesStats.pendingAmount}
            ventasSinConfirmar={salesStats.unconfirmedOld}
            ventasEnRiesgo={salesStats.atRisk}
            pendienteCobro={salesStats.pendingAmount}
            percentOfWeeklySales={salesStats.percentOfWeeklySales}
            changeVsYesterday={0}
            actionsToStability={salesStats.actionsToStability}
            totalWeeklySales={salesStats.totalWeeklySales}
          />
        </section>

        {/* Two Column Layout for Radar + Metrics */}
        <div className="grid lg:grid-cols-2 gap-10">
          {radarAlerts.length > 0 && (
            <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <AIRadarPanel alerts={radarAlerts} />
            </section>
          )}

          <section 
            className={`animate-fade-up ${radarAlerts.length === 0 ? 'lg:col-span-2' : ''}`} 
            style={{ animationDelay: '0.15s' }}
          >
            <MetricsDashboard sales={sales} />
          </section>
        </div>

        {/* BLOQUE 4: Product Spotlight */}
        {spotlightProduct && (
          <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <ProductSpotlight keyProduct={spotlightProduct} />
          </section>
        )}

        {/* BLOQUE 5: AI Insight Banner */}
        <section className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <AIInsightBanner insight={dailyInsight} />
        </section>

        {/* BLOQUE 6: Quick Actions Bar */}
        <section className="animate-fade-up pb-10" style={{ animationDelay: '0.3s' }}>
          <QuickActionsBar actions={smartActions} />
        </section>
      </div>
    </div>
  );
}
