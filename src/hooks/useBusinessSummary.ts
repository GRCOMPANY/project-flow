import { useMemo } from 'react';
import { Sale, Product, Creative, BusinessSummary } from '@/types';

interface UseBusinessSummaryParams {
  sales: Sale[];
  products: Product[];
  creatives: Creative[];
}

export function useBusinessSummary({ sales, products, creatives }: UseBusinessSummaryParams): BusinessSummary {
  return useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales this month
    const salesThisMonth = sales.filter(s => new Date(s.saleDate) >= startOfMonth);
    const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + s.totalAmount, 0);

    // Pending collections
    const pendingSales = sales.filter(s => s.paymentStatus === 'pendiente');
    const pendingCollectionAmount = pendingSales.reduce((sum, s) => sum + s.totalAmount, 0);

    // Products
    const activeProducts = products.filter(p => p.status === 'activo').length;
    const featuredProducts = products.filter(p => p.isFeatured).length;

    // Creatives
    const creativesPending = creatives.filter(c => c.status === 'pendiente').length;
    const creativesPublished = creatives.filter(c => c.status === 'publicado').length;

    return {
      salesThisMonth: salesThisMonth.length,
      revenueThisMonth,
      pendingCollections: pendingSales.length,
      pendingCollectionAmount,
      activeProducts,
      featuredProducts,
      creativesTotal: creatives.length,
      creativesPending,
      creativesPublished,
    };
  }, [sales, products, creatives]);
}
