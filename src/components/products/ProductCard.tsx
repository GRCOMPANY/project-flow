import { ProductWithMetrics, MarginLevel } from '@/types';
import { Package, TrendingUp, Image as ImageIcon, Star, AlertTriangle, Sparkles, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: ProductWithMetrics;
  onClick: () => void;
  onCreateCreative?: (productId: string) => void;
  onRegisterSale?: (productId: string) => void;
  showCosts?: boolean;
}

const priorityConfig = {
  alta: { label: 'Prioridad', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  media: { label: 'Revisar', className: 'bg-warning/10 text-warning border-warning/30' },
  baja: { label: 'OK', className: 'bg-success/10 text-success border-success/30' },
};

const marginConfig: Record<MarginLevel, { label: string; className: string }> = {
  alto: { label: 'Alto', className: 'bg-success/10 text-success' },
  medio: { label: 'Medio', className: 'bg-warning/10 text-warning' },
  bajo: { label: 'Bajo', className: 'bg-destructive/10 text-destructive' },
};

const statusConfig = {
  activo: { className: 'bg-success', dot: true },
  pausado: { className: 'bg-warning', dot: true },
  agotado: { className: 'bg-destructive', dot: true },
};

export function ProductCard({ 
  product, 
  onClick, 
  onCreateCreative,
  onRegisterSale,
  showCosts = false 
}: ProductCardProps) {
  const priorityInfo = priorityConfig[product.priorityScore];
  const marginLevel = product.marginLevel || 
    ((product.marginPercent ?? 0) >= 40 ? 'alto' : (product.marginPercent ?? 0) >= 20 ? 'medio' : 'bajo');
  const marginInfo = marginConfig[marginLevel];
  const statusInfo = statusConfig[product.status];
  
  return (
    <div className="interactive-card flex flex-col group overflow-hidden">
      {/* Clickable header area */}
      <button
        onClick={onClick}
        className="text-left w-full flex flex-col"
      >
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Overlays */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
            {/* Status dot */}
            <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
              <div className={cn("w-2 h-2 rounded-full", statusInfo.className)} />
              {product.isFeatured && <Star className="w-3 h-3 text-warning fill-warning" />}
            </div>
            
            {/* Priority badge */}
            <Badge variant="outline" className={cn("text-xs font-medium", priorityInfo.className)}>
              {priorityInfo.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
          )}
          
          {/* Name */}
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {/* Prices */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              ${product.retailPrice.toLocaleString('es-MX')}
            </span>
            {showCosts && product.wholesalePrice > 0 && (
              <span className="text-sm text-muted-foreground">
                May: ${product.wholesalePrice.toLocaleString('es-MX')}
              </span>
            )}
          </div>
          
          {/* Metrics row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{product.salesLast30Days} ventas</span>
            </div>
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>{product.creativesCount}</span>
            </div>
          </div>

          {/* Admin: Margin indicator */}
          {showCosts && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Margen</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs h-5 px-1.5", marginInfo.className)}>
                    {marginInfo.label}
                  </Badge>
                  <span className="font-semibold">{(product.marginPercent ?? 0).toFixed(0)}%</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    marginLevel === 'alto' ? 'bg-success' : 
                    marginLevel === 'medio' ? 'bg-warning' : 'bg-destructive'
                  )}
                  style={{ width: `${Math.min((product.marginPercent ?? 0), 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action hint */}
          {product.recommendedAction && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-warning">
              <AlertTriangle className="w-3 h-3" />
              <span className="line-clamp-1">{product.recommendedAction}</span>
            </div>
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex gap-2 p-4 pt-0">
        {onCreateCreative && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9"
            onClick={(e) => { e.stopPropagation(); onCreateCreative(product.id); }}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Creativo
          </Button>
        )}
        {onRegisterSale && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs h-9"
            onClick={(e) => { e.stopPropagation(); onRegisterSale(product.id); }}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Venta
          </Button>
        )}
      </div>
    </div>
  );
}
