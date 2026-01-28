import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCreatives } from '@/hooks/useCreatives';
import { useSmartCatalog } from '@/hooks/useSmartCatalog';
import { CommandCenterNav } from '@/components/command-center/CommandCenterNav';
import { TensionCard } from '@/components/command-center/TensionCard';
import { BusinessRadar, generateRadarAlerts } from '@/components/command-center/BusinessRadar';
import { TrendSparklines, calculateTrendData } from '@/components/command-center/TrendSparklines';
import { KeyProductCards, identifyKeyProducts } from '@/components/command-center/KeyProductCards';
import { DailyInsightCard, generateDailyInsight } from '@/components/command-center/DailyInsightCard';
import { SmartActions, generateSmartActions } from '@/components/command-center/SmartActions';
import { Skeleton } from '@/components/ui/skeleton';

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
  // DATA CALCULATIONS
  // =========================================

  // Tension Card data
  const tensionData = useMemo(() => {
    const pendingAmount = sales
      .filter(s => s.paymentStatus === 'pendiente')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    
    const pendingCount = sales.filter(s => s.paymentStatus === 'pendiente').length;

    const unconfirmedOld = sales.filter(s => {
      if (s.operationalStatus !== 'nuevo') return false;
      const days = daysSince(s.statusUpdatedAt || s.saleDate);
      return days > 2;
    }).length;

    const atRisk = sales.filter(s =>
      s.operationalStatus === 'riesgo_devolucion' ||
      s.operationalStatus === 'sin_respuesta'
    ).length;

    // Money at risk = pending + (at risk sales * average sale)
    const avgSaleAmount = sales.length > 0
      ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length
      : 0;
    const montoEnRiesgo = pendingAmount + (atRisk * avgSaleAmount);

    return {
      montoEnRiesgo: Math.round(montoEnRiesgo),
      pendingAmount,
      pendingCount,
      unconfirmedOld,
      atRisk,
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

  // Radar alerts
  const radarAlerts = useMemo(() => {
    return generateRadarAlerts(
      {
        unconfirmedOld: tensionData.unconfirmedOld,
        atRisk: tensionData.atRisk,
        pendingAmount: tensionData.pendingAmount,
        pendingCount: tensionData.pendingCount,
      },
      productMetrics
    );
  }, [tensionData, productMetrics]);

  // Trend sparklines data
  const trendData = useMemo(() => {
    return calculateTrendData(sales);
  }, [sales]);

  // Key products
  const keyProducts = useMemo(() => {
    return identifyKeyProducts(smartProducts, sales);
  }, [smartProducts, sales]);

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
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-44 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
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

      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Header - Compact */}
        <header className="animate-fade-up">
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {profile?.fullName?.split(' ')[0]} 👋
          </h1>
        </header>

        {/* BLOQUE 1: Tension Card (Hero) */}
        <section className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <TensionCard
            montoEnRiesgo={tensionData.montoEnRiesgo}
            ventasSinConfirmar={tensionData.unconfirmedOld}
            ventasEnRiesgo={tensionData.atRisk}
            pendienteCobro={tensionData.pendingAmount}
          />
        </section>

        {/* BLOQUE 2: Business Radar */}
        {radarAlerts.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <BusinessRadar alerts={radarAlerts} />
          </section>
        )}

        {/* BLOQUE 3: Trend Sparklines */}
        <section className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <TrendSparklines
            salesData={trendData.salesData}
            profitData={trendData.profitData}
          />
        </section>

        {/* BLOQUE 4: Key Products */}
        {keyProducts.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <KeyProductCards products={keyProducts} />
          </section>
        )}

        {/* BLOQUE 5: Daily Insight */}
        <section className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <DailyInsightCard insight={dailyInsight} />
        </section>

        {/* BLOQUE 6: Smart Actions */}
        {smartActions.length > 0 && (
          <section className="animate-fade-up pb-8" style={{ animationDelay: '0.3s' }}>
            <SmartActions actions={smartActions} />
          </section>
        )}
      </div>
    </div>
  );
}
