import { ProductWithMetrics, MarginLevel } from '@/types';
import { Package, TrendingUp, Image as ImageIcon, Star, AlertTriangle, Sparkles, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SmartProductCardProps {
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
  activo: { className: 'bg-success w-2 h-2 rounded-full' },
  pausado: { className: 'bg-warning w-2 h-2 rounded-full' },
  agotado: { className: 'bg-destructive w-2 h-2 rounded-full' },
};

export function SmartProductCardNew({ 
  product, 
  onClick, 
  onCreateCreative,
  onRegisterSale,
  showCosts = false 
}: SmartProductCardProps) {
  const priorityInfo = priorityConfig[product.priorityScore];
  const marginLevel = product.marginLevel || 
    ((product.marginPercent ?? 0) >= 40 ? 'alto' : (product.marginPercent ?? 0) >= 20 ? 'medio' : 'bajo');
  const marginInfo = marginConfig[marginLevel];
  
  return (
    <div className="grc-card p-4 flex flex-col gap-3 group overflow-hidden">
      {/* Clickable header area */}
      <button
        onClick={onClick}
        className="text-left w-full flex flex-col gap-3"
      >
        {/* Image */}
        <div className="aspect-square w-full rounded-lg border border-border bg-secondary overflow-hidden flex items-center justify-center relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package className="w-12 h-12 text-muted-foreground" />
          )}
          
          {/* Status indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <div className={statusConfig[product.status].className} />
            {product.isFeatured && (
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Star className="w-3 h-3 text-accent-foreground fill-current" />
              </div>
            )}
          </div>
          
          {/* Priority badge */}
          <Badge 
            variant="outline"
            className={cn(
              "absolute top-2 right-2 text-xs font-medium",
              priorityInfo.className
            )}
          >
            {priorityInfo.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* SKU */}
          {product.sku && (
            <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
          )}
          
          <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {/* Prices */}
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">
              ${product.retailPrice.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </div>
            {product.wholesalePrice > 0 && (
              <div className="text-xs text-muted-foreground">
                Mayorista: ${product.wholesalePrice.toLocaleString('es-MX')}
              </div>
            )}
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{product.salesLast30Days} ventas</span>
            </div>
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>{product.creativesCount}</span>
            </div>
          </div>

          {/* Admin-only: margin info */}
          {showCosts && (product.marginPercent ?? 0) > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className={cn("text-xs", marginInfo.className)}>
                Margen {marginInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {(product.marginPercent ?? 0).toFixed(0)}% 
                <span className="ml-1">(${(product.marginAmount ?? 0).toFixed(0)})</span>
              </span>
            </div>
          )}

          {/* Recommended action */}
          {product.recommendedAction && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-warning pt-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{product.recommendedAction}</span>
            </div>
          )}
        </div>
      </button>

      {/* Quick actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        {onCreateCreative && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => { e.stopPropagation(); onCreateCreative(product.id); }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Creativo
          </Button>
        )}
        {onRegisterSale && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => { e.stopPropagation(); onRegisterSale(product.id); }}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Venta
          </Button>
        )}
      </div>
    </div>
  );
}
