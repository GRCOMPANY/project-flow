import { useMemo } from 'react';
import { Product, Sale, Creative } from '@/types';

export type ProductPriority = 'alta' | 'media' | 'baja';

export interface SmartProduct extends Product {
  salesLast7Days: number;
  salesLast30Days: number;
  creativesCount: number;
  priorityScore: ProductPriority;
  recommendedAction: string | null;
  margin: number;
  marginPercent: number;
}

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
      const salesLast7Days = productSales.filter(s => 
        new Date(s.saleDate).getTime() > sevenDaysAgo
      ).reduce((sum, s) => sum + s.quantity, 0);
      
      const salesLast30Days = productSales.filter(s => 
        new Date(s.saleDate).getTime() > thirtyDaysAgo
      ).reduce((sum, s) => sum + s.quantity, 0);

      // Count creatives
      const creativesCount = creatives.filter(c => c.productId === product.id).length;

      // Calculate margin
      const margin = product.suggestedPrice - product.supplierPrice;
      const marginPercent = product.supplierPrice > 0 
        ? ((margin / product.supplierPrice) * 100) 
        : 0;

      // Determine priority and recommended action
      let priorityScore: ProductPriority = 'baja';
      let recommendedAction: string | null = null;

      // HIGH priority conditions
      if (product.isFeatured && creativesCount === 0) {
        priorityScore = 'alta';
        recommendedAction = 'Crear creativo urgente';
      } else if (product.status === 'activo' && salesLast30Days === 0) {
        priorityScore = 'alta';
        recommendedAction = 'Promocionar producto';
      } else if (marginPercent > 50 && creativesCount === 0) {
        priorityScore = 'alta';
        recommendedAction = 'Lanzar campaña (alto margen)';
      }
      // MEDIUM priority conditions
      else if (salesLast7Days === 0 && salesLast30Days > 0) {
        priorityScore = 'media';
        recommendedAction = 'Revisar rendimiento';
      } else if (product.status === 'activo' && creativesCount === 0) {
        priorityScore = 'media';
        recommendedAction = 'Crear creativo';
      } else if (salesLast30Days < salesLast7Days * 4 && salesLast30Days > 0) {
        // Declining trend
        priorityScore = 'media';
        recommendedAction = 'Revisar precio';
      }
      // LOW priority - product is performing well
      else if (salesLast7Days > 0 && creativesCount > 0) {
        priorityScore = 'baja';
        recommendedAction = null;
      }

      return {
        ...product,
        salesLast7Days,
        salesLast30Days,
        creativesCount,
        priorityScore,
        recommendedAction,
        margin,
        marginPercent,
      };
    }).sort((a, b) => {
      // Sort by priority
      const priorityOrder = { alta: 0, media: 1, baja: 2 };
      return priorityOrder[a.priorityScore] - priorityOrder[b.priorityScore];
    });
  }, [products, sales, creatives]);
}
