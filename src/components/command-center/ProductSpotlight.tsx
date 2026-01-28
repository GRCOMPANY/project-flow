import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  DollarSign, 
  Snowflake, 
  AlertTriangle, 
  ArrowRight, 
  Package,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductWithMetrics } from '@/types';

export type KeyProductType = 'top_seller' | 'most_profitable' | 'coldest' | 'at_risk';

export interface KeyProduct {
  type: KeyProductType;
  product: ProductWithMetrics;
  metric: string;
  metricLabel: string;
  secondaryMetric?: string;
  secondaryLabel?: string;
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
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/15 text-amber-600',
    accentColor: 'text-amber-600',
  },
  most_profitable: {
    icon: DollarSign,
    label: 'Más Rentable',
    gradient: 'from-success/15 via-success/5 to-transparent',
    iconBg: 'bg-success/15 text-success',
    accentColor: 'text-success',
  },
  coldest: {
    icon: Snowflake,
    label: 'Producto Dormido',
    gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/15 text-blue-500',
    accentColor: 'text-blue-500',
  },
  at_risk: {
    icon: AlertTriangle,
    label: 'Por Cobrar',
    gradient: 'from-destructive/15 via-destructive/5 to-transparent',
    iconBg: 'bg-destructive/15 text-destructive',
    accentColor: 'text-destructive',
  },
};

export function ProductSpotlight({ keyProduct, className }: ProductSpotlightProps) {
  const navigate = useNavigate();

  if (!keyProduct) {
    return null;
  }

  const config = typeConfig[keyProduct.type];
  const Icon = config.icon;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Producto Estrella
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Spotlight Card */}
      <div className={cn(
        "product-spotlight relative overflow-hidden rounded-2xl border border-border/50 bg-card",
        "hover:shadow-xl hover:border-border transition-all duration-300"
      )}>
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          config.gradient
        )} />

        <div className="relative grid md:grid-cols-[200px,1fr] gap-6 p-6">
          {/* Product Image */}
          <div className="aspect-square w-full max-w-[200px] mx-auto md:mx-0 rounded-xl bg-muted/50 overflow-hidden ring-1 ring-border/50">
            {keyProduct.product.imageUrl ? (
              <img
                src={keyProduct.product.imageUrl}
                alt={keyProduct.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between gap-4">
            {/* Top: Badge + Name */}
            <div className="space-y-3">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
                config.iconBg
              )}>
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </div>

              <h3 className="text-xl font-bold text-foreground line-clamp-2">
                {keyProduct.product.name}
              </h3>
            </div>

            {/* Middle: Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className={cn("text-2xl font-bold", config.accentColor)}>
                  {keyProduct.metric}
                </p>
                <p className="text-xs text-muted-foreground">
                  {keyProduct.metricLabel}
                </p>
              </div>
              
              {keyProduct.secondaryMetric && (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {keyProduct.secondaryMetric}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {keyProduct.secondaryLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom: Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate(keyProduct.action.path)}
                className="gap-2 shadow-lg"
              >
                <TrendingUp className="w-4 h-4" />
                {keyProduct.action.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => navigate('/creatives')}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Nuevo Creativo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to identify key products from smart catalog
export function identifyKeyProducts(
  smartProducts: ProductWithMetrics[],
  sales: Array<{ productId: string; paymentStatus: string; totalAmount: number }>
): KeyProduct[] {
  const result: KeyProduct[] = [];
  const usedProductIds = new Set<string>();

  // 1. Top Seller (most sales in 7 days)
  const topSeller = smartProducts
    .filter(p => p.salesLast7Days > 0)
    .sort((a, b) => b.salesLast7Days - a.salesLast7Days)[0];
  
  if (topSeller && !usedProductIds.has(topSeller.id)) {
    usedProductIds.add(topSeller.id);
    result.push({
      type: 'top_seller',
      product: topSeller,
      metric: `${topSeller.salesLast7Days} vendidos`,
      metricLabel: 'esta semana',
      secondaryMetric: `$${topSeller.revenueGenerated.toLocaleString()}`,
      secondaryLabel: 'generado',
      action: { label: 'Escalar', path: `/products/${topSeller.id}` },
    });
  }

  // 2. Most Profitable (highest margin with sales)
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
      action: { label: 'Escalar', path: `/products/${mostProfitable.id}` },
    });
  }

  // 3. Coldest (active, no sales 30d, but good margin)
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
      action: { label: 'Activar', path: `/products/${coldest.id}` },
    });
  }

  // 4. At Risk (pending collection)
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
