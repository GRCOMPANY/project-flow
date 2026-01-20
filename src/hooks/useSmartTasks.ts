import { useMemo } from 'react';
import { Sale, Product, Creative, SmartTask } from '@/types';

interface UseSmartTasksParams {
  sales: Sale[];
  products: Product[];
  creatives: Creative[];
}

export function useSmartTasks({ sales, products, creatives }: UseSmartTasksParams): SmartTask[] {
  return useMemo(() => {
    const tasks: SmartTask[] = [];

    // 1. Cobros pendientes (prioridad alta)
    const pendingSales = sales.filter(s => s.paymentStatus === 'pendiente');
    pendingSales.slice(0, 3).forEach((sale, index) => {
      const daysSinceSale = Math.floor(
        (Date.now() - new Date(sale.saleDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const isUrgent = daysSinceSale > 7;
      
      tasks.push({
        id: `cobro-${sale.id}`,
        type: 'cobro',
        title: `Cobrar a ${sale.clientName || 'cliente'}`,
        description: `$${sale.totalAmount.toLocaleString()} pendiente${daysSinceSale > 0 ? ` hace ${daysSinceSale} días` : ''}`,
        impact: 'cobro',
        priority: isUrgent ? 'alta' : 'media',
        relatedSaleId: sale.id,
        actionLabel: 'Marcar cobrado',
        actionPath: '/sales',
      });
    });

    // 2. Productos destacados sin creativos
    const featuredProducts = products.filter(p => p.isFeatured && p.status === 'activo');
    const productsWithCreatives = new Set(creatives.map(c => c.productId));
    
    featuredProducts
      .filter(p => !productsWithCreatives.has(p.id))
      .slice(0, 2)
      .forEach((product) => {
        tasks.push({
          id: `creativo-${product.id}`,
          type: 'creativo',
          title: `Crear contenido para ${product.name}`,
          description: 'Producto destacado sin creativos publicitarios',
          impact: 'crecimiento',
          priority: 'alta',
          relatedProductId: product.id,
          actionLabel: 'Crear creativo',
          actionPath: '/creatives',
        });
      });

    // 3. Productos activos sin ventas recientes (oportunidad)
    const recentSaleProductIds = new Set(
      sales
        .filter(s => {
          const daysSince = Math.floor(
            (Date.now() - new Date(s.saleDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSince < 30;
        })
        .map(s => s.productId)
    );

    const productsWithoutRecentSales = products
      .filter(p => p.status === 'activo' && !recentSaleProductIds.has(p.id))
      .slice(0, 2);

    productsWithoutRecentSales.forEach((product) => {
      tasks.push({
        id: `promocion-${product.id}`,
        type: 'promocion',
        title: `Promocionar ${product.name}`,
        description: 'Sin ventas en los últimos 30 días',
        impact: 'ventas',
        priority: 'media',
        relatedProductId: product.id,
        actionLabel: 'Ver producto',
        actionPath: '/products',
      });
    });

    // 4. Creativos que funcionaron - repetir
    const successfulCreatives = creatives
      .filter(c => c.result === 'funciono' && c.status === 'publicado')
      .slice(0, 1);

    successfulCreatives.forEach((creative) => {
      tasks.push({
        id: `repetir-${creative.id}`,
        type: 'creativo',
        title: `Repetir creativo exitoso`,
        description: `"${creative.title || creative.product?.name || 'Sin título'}" funcionó bien`,
        impact: 'crecimiento',
        priority: 'baja',
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId,
        actionLabel: 'Duplicar',
        actionPath: '/creatives',
      });
    });

    // Sort by priority
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
  }, [sales, products, creatives]);
}
