import { Product } from '@/types';
import { Package, Store, DollarSign } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="sketch-card p-4 text-left w-full flex flex-col gap-3 group overflow-hidden"
    >
      <div className="aspect-square w-full rounded-lg border-2 border-border bg-secondary overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 text-xl font-bold text-primary mt-1">
          <DollarSign className="w-5 h-5" />
          {product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>

        {product.storeName && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Store className="w-3.5 h-3.5" />
            <span className="truncate">{product.storeName}</span>
          </div>
        )}
      </div>
    </button>
  );
}
