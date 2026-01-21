import { Product } from '@/types';
import { SmartProduct, ProductPriority } from '@/hooks/useSmartCatalog';
import { Package, TrendingUp, Image as ImageIcon, Star, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SmartProductCardProps {
  product: SmartProduct;
  onClick: () => void;
  showCosts?: boolean; // Admin can see costs
}

const priorityConfig: Record<ProductPriority, { label: string; className: string }> = {
  alta: { label: 'Alta', className: 'priority-high border' },
  media: { label: 'Media', className: 'priority-medium border' },
  baja: { label: 'Normal', className: 'priority-low border' },
};

export function SmartProductCard({ product, onClick, showCosts = false }: SmartProductCardProps) {
  const priorityInfo = priorityConfig[product.priorityScore];
  
  return (
    <button
      onClick={onClick}
      className="grc-card p-4 text-left w-full flex flex-col gap-3 group overflow-hidden"
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
        
        {/* Priority badge */}
        <Badge 
          className={cn(
            "absolute top-2 right-2 text-xs font-medium",
            priorityInfo.className
          )}
        >
          {priorityInfo.label}
        </Badge>
        
        {/* Featured indicator */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-accent-foreground fill-current" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="text-lg font-bold text-primary">
          ${product.suggestedPrice.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
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

        {/* Recommended action */}
        {product.recommendedAction && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <AlertTriangle className="w-3 h-3" />
            <span className="truncate">{product.recommendedAction}</span>
          </div>
        )}

        {/* Admin-only: margin info */}
        {showCosts && product.marginPercent > 0 && (
          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            <span>Margen: </span>
            <span className={cn(
              "font-medium",
              product.marginPercent > 30 ? "text-success" : "text-foreground"
            )}>
              {product.marginPercent.toFixed(0)}%
            </span>
            <span className="ml-2">
              (${product.margin.toLocaleString('es-MX', { minimumFractionDigits: 0 })})
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
