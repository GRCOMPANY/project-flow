import { useMemo } from 'react';
import { Product, Sale, Creative, Priority, ProductWithMetrics } from '@/types';

export type ProductPriority = Priority;

// Re-export for backward compatibility
export interface SmartProduct extends ProductWithMetrics {}

interface UseSmartCatalogParams {
  products: Product[];
  sales: Sale[];
  creatives: Creative[];
}

export function useSmartCatalog({ products, sales, creatives }: UseSmartCatalogParams): SmartProduct[] {
  return useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return products.map((product) => {
      // Calculate sales metrics
      const productSales = sales.filter(s => s.productId === product.id);
      
      const salesLast7Days = productSales
        .filter(s => new Date(s.saleDate).getTime() > sevenDaysAgo)
        .reduce((sum, s) => sum + s.quantity, 0);
      
      const salesLast30Days = productSales
        .filter(s => new Date(s.saleDate).getTime() > thirtyDaysAgo)
        .reduce((sum, s) => sum + s.quantity, 0);

      // Revenue and pending
      const revenueGenerated = productSales
        .filter(s => s.paymentStatus === 'pagado')
        .reduce((sum, s) => sum + s.totalAmount, 0);
      
      const pendingToCollect = productSales
        .filter(s => s.paymentStatus === 'pendiente')
        .reduce((sum, s) => sum + s.totalAmount, 0);

      // Count creatives
      const productCreatives = creatives.filter(c => c.productId === product.id);
      const creativesCount = productCreatives.length;
      const needsCreatives = creativesCount === 0 || !productCreatives.some(c => c.status === 'publicado');
      
      const lastCreative = productCreatives
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const lastCreativeDate = lastCreative?.createdAt;

      // Calculate margin (fallback if not already calculated)
      const margin = product.marginAmount ?? (product.retailPrice - product.costPrice);
      const marginPercent = product.marginPercent ?? 
        (product.costPrice > 0 ? ((margin / product.costPrice) * 100) : 0);

      // Determine priority and recommended action
      let priorityScore: ProductPriority = 'baja';
      let recommendedAction: string | undefined = undefined;

      // HIGH priority conditions
      if (product.isFeatured && needsCreatives) {
        priorityScore = 'alta';
        recommendedAction = 'Crear creativo urgente';
      } else if (product.status === 'activo' && salesLast30Days === 0 && product.createdAt) {
        const productAge = now - new Date(product.createdAt).getTime();
        if (productAge > 7 * 24 * 60 * 60 * 1000) { // Más de 7 días
          priorityScore = 'alta';
          recommendedAction = 'Promocionar producto';
        }
      } else if (marginPercent > 50 && needsCreatives) {
        priorityScore = 'alta';
        recommendedAction = 'Lanzar campaña (alto margen)';
      } else if (pendingToCollect > 0) {
        priorityScore = 'alta';
        recommendedAction = `Cobrar $${pendingToCollect.toLocaleString()}`;
      }
      // MEDIUM priority conditions
      else if (salesLast7Days === 0 && salesLast30Days > 0) {
        priorityScore = 'media';
        recommendedAction = 'Revisar rendimiento';
      } else if (product.status === 'activo' && needsCreatives) {
        priorityScore = 'media';
        recommendedAction = 'Crear creativo';
      } else if (salesLast30Days < salesLast7Days * 4 && salesLast30Days > 0) {
        priorityScore = 'media';
        recommendedAction = 'Revisar precio';
      }
      // LOW priority - product is performing well
      else if (salesLast7Days > 0 && !needsCreatives) {
        priorityScore = 'baja';
        recommendedAction = undefined;
      }

      const smartProduct: SmartProduct = {
        ...product,
        salesLast7Days,
        salesLast30Days,
        revenueGenerated,
        pendingToCollect,
        creativesCount,
        needsCreatives,
        lastCreativeDate,
        priorityScore,
        recommendedAction,
        // Ensure margin values are set
        marginAmount: margin,
        marginPercent,
      };
      
      return smartProduct;
    }).sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { alta: 0, media: 1, baja: 2 };
      const priorityDiff = priorityOrder[a.priorityScore] - priorityOrder[b.priorityScore];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by margin (high margin first)
      return (b.marginPercent ?? 0) - (a.marginPercent ?? 0);
    });
  }, [products, sales, creatives]);
}
