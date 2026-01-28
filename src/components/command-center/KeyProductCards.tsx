import { useNavigate } from 'react-router-dom';
import { Trophy, DollarSign, Snowflake, AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductWithMetrics } from '@/types';

export type KeyProductType = 'top_seller' | 'most_profitable' | 'coldest' | 'at_risk';

export interface KeyProduct {
  type: KeyProductType;
  product: ProductWithMetrics;
  metric: string;
  metricLabel: string;
  action: {
    label: string;
    path: string;
  };
}

interface KeyProductCardsProps {
  products: KeyProduct[];
  className?: string;
}

const typeConfig: Record<KeyProductType, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  top_seller: {
    icon: Trophy,
    label: 'Más vendido',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  most_profitable: {
    icon: DollarSign,
    label: 'Más rentable',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  coldest: {
    icon: Snowflake,
    label: 'Dormido',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  at_risk: {
    icon: AlertTriangle,
    label: 'Por cobrar',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

function KeyProductCard({ keyProduct }: { keyProduct: KeyProduct }) {
  const navigate = useNavigate();
  const config = typeConfig[keyProduct.type];
  const Icon = config.icon;

  return (
    <div className="key-product-card group">
      {/* Type badge */}
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mb-3",
        config.bgColor,
        config.color
      )}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </div>

      {/* Product image */}
      <div className="aspect-square w-full rounded-xl bg-muted/50 overflow-hidden mb-3">
        {keyProduct.product.imageUrl ? (
          <img
            src={keyProduct.product.imageUrl}
            alt={keyProduct.product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Product info */}
      <h4 className="font-medium text-sm text-foreground line-clamp-1 mb-1">
        {keyProduct.product.name}
      </h4>
      
      <p className="text-lg font-bold text-foreground mb-0.5">
        {keyProduct.metric}
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {keyProduct.metricLabel}
      </p>

      {/* Action button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-xs"
        onClick={() => navigate(keyProduct.action.path)}
      >
        {keyProduct.action.label}
        <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function KeyProductCards({ products, className }: KeyProductCardsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Productos clave esta semana
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map((product) => (
          <KeyProductCard key={product.product.id} keyProduct={product} />
        ))}
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
      metricLabel: `$${(mostProfitable.marginAmount || 0).toLocaleString()} por unidad`,
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
      metricLabel: `${Math.round(coldest.marginPercent || 0)}% margen potencial`,
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
