import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  DollarSign, 
  Snowflake, 
  AlertTriangle, 
  ArrowRight, 
  Package,
  TrendingUp,
  Sparkles,
  Flame,
  Thermometer,
  Users,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductWithMetrics } from '@/types';

export type KeyProductType = 'top_seller' | 'most_profitable' | 'coldest' | 'at_risk';
export type CommercialState = 'hot' | 'warm' | 'cold';

export interface KeyProduct {
  type: KeyProductType;
  product: ProductWithMetrics;
  metric: string;
  metricLabel: string;
  secondaryMetric?: string;
  secondaryLabel?: string;
  tertiaryMetric?: string;
  tertiaryLabel?: string;
  commercialState?: CommercialState;
  changeVsPrevious?: number;
  action: {
    label: string;
    path: string;
  };
}

interface ProductSpotlightProps {
  keyProduct: KeyProduct | null;
  className?: string;
}

const typeConfig: Record<KeyProductType, { 
  icon: React.ElementType; 
  label: string; 
  gradient: string;
  iconBg: string;
  accentColor: string;
}> = {
  top_seller: {
    icon: Trophy,
    label: 'Más Vendido',
    gradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/12 text-amber-600',
    accentColor: 'text-amber-600',
  },
  most_profitable: {
    icon: DollarSign,
    label: 'Más Rentable',
    gradient: 'from-success/12 via-success/5 to-transparent',
    iconBg: 'bg-success/12 text-success',
    accentColor: 'text-success',
  },
  coldest: {
    icon: Snowflake,
    label: 'Producto Dormido',
    gradient: 'from-blue-500/12 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/12 text-blue-500',
    accentColor: 'text-blue-500',
  },
  at_risk: {
    icon: AlertTriangle,
    label: 'Por Cobrar',
    gradient: 'from-destructive/12 via-destructive/5 to-transparent',
    iconBg: 'bg-destructive/12 text-destructive',
    accentColor: 'text-destructive',
  },
};

const commercialStateConfig: Record<CommercialState, {
  icon: React.ElementType;
  label: string;
  className: string;
}> = {
  hot: {
    icon: Flame,
    label: 'Caliente',
    className: 'commercial-badge-hot',
  },
  warm: {
    icon: Thermometer,
    label: 'Tibio',
    className: 'commercial-badge-warm',
  },
  cold: {
    icon: Snowflake,
    label: 'Frío',
    className: 'commercial-badge-cold',
  },
};

export function ProductSpotlight({ keyProduct, className }: ProductSpotlightProps) {
  const navigate = useNavigate();

  if (!keyProduct) {
    return null;
  }

  const config = typeConfig[keyProduct.type];
  const Icon = config.icon;
  const commercialConfig = keyProduct.commercialState ? commercialStateConfig[keyProduct.commercialState] : null;
  const CommercialIcon = commercialConfig?.icon;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <span className="text-sm font-bold text-foreground uppercase tracking-wide">
            Producto Estrella
          </span>
          <p className="text-xs text-muted-foreground">
            Foco operativo de la semana
          </p>
        </div>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Spotlight Card */}
      <div className={cn(
        "product-spotlight relative overflow-hidden rounded-2xl border border-border/50 bg-card",
        "hover:shadow-xl hover:border-border/80 transition-all duration-300"
      )}>
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          config.gradient
        )} />

        <div className="relative grid md:grid-cols-[280px,1fr] gap-8 p-8 md:p-10">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square w-full max-w-[280px] mx-auto md:mx-0 rounded-2xl bg-muted/40 overflow-hidden ring-2 ring-border/30">
              {keyProduct.product.imageUrl ? (
                <img
                  src={keyProduct.product.imageUrl}
                  alt={keyProduct.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                  <Package className="w-20 h-20 text-muted-foreground/20" />
                </div>
              )}
            </div>
            
            {/* Commercial State Badge */}
            {commercialConfig && CommercialIcon && (
              <div className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 commercial-badge",
                commercialConfig.className
              )}>
                <CommercialIcon className="w-3.5 h-3.5" />
                <span>{commercialConfig.label}</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between gap-6">
            {/* Top: Badge + Name */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold",
                  config.iconBg
                )}>
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-foreground line-clamp-2">
                {keyProduct.product.name}
              </h3>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
              {/* Primary Metric */}
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <p className={cn("text-3xl md:text-4xl font-bold", config.accentColor)} style={{ fontFeatureSettings: "'tnum'" }}>
                    {keyProduct.metric}
                  </p>
                  {keyProduct.changeVsPrevious !== undefined && keyProduct.changeVsPrevious !== 0 && (
                    <span className={cn(
                      "flex items-center gap-0.5 text-xs font-bold",
                      keyProduct.changeVsPrevious > 0 ? "text-success" : "text-destructive"
                    )}>
                      {keyProduct.changeVsPrevious > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {keyProduct.changeVsPrevious > 0 ? '+' : ''}{keyProduct.changeVsPrevious}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {keyProduct.metricLabel}
                </p>
              </div>
              
              {/* Secondary Metric */}
              {keyProduct.secondaryMetric && (
                <div className="space-y-1.5">
                  <p className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFeatureSettings: "'tnum'" }}>
                    {keyProduct.secondaryMetric}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {keyProduct.secondaryLabel}
                  </p>
                </div>
              )}

              {/* Tertiary Metric */}
              {keyProduct.tertiaryMetric && (
                <div className="space-y-1.5">
                  <p className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFeatureSettings: "'tnum'" }}>
                    {keyProduct.tertiaryMetric}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {keyProduct.tertiaryLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate(keyProduct.action.path)}
                className="gap-2 shadow-lg btn-gradient-primary text-white"
                size="lg"
              >
                <TrendingUp className="w-4 h-4" />
                {keyProduct.action.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => navigate('/creatives')}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                Nuevo Creativo
              </Button>

              <Button
                onClick={() => navigate('/sellers')}
                variant="ghost"
                className="gap-2"
                size="lg"
              >
                <Users className="w-4 h-4" />
                Enviar a Vendedores
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function identifyKeyProducts(
  smartProducts: ProductWithMetrics[],
  sales: Array<{ productId: string; paymentStatus: string; totalAmount: number; saleDate: string }>
): KeyProduct[] {
  const result: KeyProduct[] = [];
  const usedProductIds = new Set<string>();

  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const getSalesInPeriod = (productId: string, start: Date, end: Date) => {
    return sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      return s.productId === productId && saleDate >= start && saleDate < end;
    }).length;
  };

  const topSeller = smartProducts
    .filter(p => p.salesLast7Days > 0)
    .sort((a, b) => b.salesLast7Days - a.salesLast7Days)[0];
  
  if (topSeller && !usedProductIds.has(topSeller.id)) {
    usedProductIds.add(topSeller.id);
    const prevWeekSales = getSalesInPeriod(topSeller.id, twoWeeksAgo, oneWeekAgo);
    const changeVsPrev = topSeller.salesLast7Days - prevWeekSales;
    
    let commercialState: CommercialState = 'warm';
    if (topSeller.salesLast7Days >= 5) commercialState = 'hot';
    else if (topSeller.salesLast7Days <= 1) commercialState = 'cold';

    result.push({
      type: 'top_seller',
      product: topSeller,
      metric: `${topSeller.salesLast7Days} vendidos`,
      metricLabel: 'esta semana',
      secondaryMetric: `$${topSeller.revenueGenerated.toLocaleString()}`,
      secondaryLabel: 'generado',
      tertiaryMetric: `${Math.round(topSeller.marginPercent || 0)}%`,
      tertiaryLabel: 'margen',
      commercialState,
      changeVsPrevious: changeVsPrev,
      action: { label: 'Escalar', path: `/products/${topSeller.id}` },
    });
  }

  const mostProfitable = smartProducts
    .filter(p => p.salesLast30Days > 0 && (p.marginPercent || 0) > 30 && !usedProductIds.has(p.id))
    .sort((a, b) => (b.marginPercent || 0) - (a.marginPercent || 0))[0];
  
  if (mostProfitable) {
    usedProductIds.add(mostProfitable.id);
    result.push({
      type: 'most_profitable',
      product: mostProfitable,
      metric: `${Math.round(mostProfitable.marginPercent || 0)}% margen`,
      metricLabel: 'por unidad',
      secondaryMetric: `$${(mostProfitable.marginAmount || 0).toLocaleString()}`,
      secondaryLabel: 'ganancia unitaria',
      tertiaryMetric: `${mostProfitable.salesLast30Days}`,
      tertiaryLabel: 'vendidos (30d)',
      commercialState: mostProfitable.salesLast7Days >= 3 ? 'hot' : mostProfitable.salesLast7Days >= 1 ? 'warm' : 'cold',
      action: { label: 'Escalar', path: `/products/${mostProfitable.id}` },
    });
  }

  const coldest = smartProducts
    .filter(p => 
      p.status === 'activo' && 
      p.salesLast30Days === 0 && 
      (p.marginPercent || 0) > 25 &&
      !usedProductIds.has(p.id)
    )
    .sort((a, b) => (b.marginPercent || 0) - (a.marginPercent || 0))[0];
  
  if (coldest) {
    usedProductIds.add(coldest.id);
    result.push({
      type: 'coldest',
      product: coldest,
      metric: '0 ventas',
      metricLabel: 'últimos 30 días',
      secondaryMetric: `${Math.round(coldest.marginPercent || 0)}%`,
      secondaryLabel: 'margen potencial',
      commercialState: 'cold',
      action: { label: 'Activar', path: `/products/${coldest.id}` },
    });
  }

  const atRisk = smartProducts
    .filter(p => p.pendingToCollect > 0 && !usedProductIds.has(p.id))
    .sort((a, b) => b.pendingToCollect - a.pendingToCollect)[0];
  
  if (atRisk) {
    usedProductIds.add(atRisk.id);
    result.push({
      type: 'at_risk',
      product: atRisk,
      metric: `$${atRisk.pendingToCollect.toLocaleString()}`,
      metricLabel: 'por cobrar',
      action: { label: 'Cobrar', path: '/sales' },
    });
  }

  return result;
}
