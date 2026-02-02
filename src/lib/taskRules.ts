/**
 * Motor de Reglas para Generación Automática de Tareas
 * 
 * Cada regla define:
 * - Condición: cuándo aplica la regla
 * - Generador: cómo crear la tarea
 * - Deduplicación: clave única para evitar duplicados
 */

import { Sale, Product, Creative, OperationalTask, TaskType, TaskImpact, Priority } from '@/types';

export interface TaskRuleContext {
  sale?: Sale;
  product?: Product;
  creative?: Creative;
}

export interface GeneratedTask {
  name: string;
  description: string;
  type: TaskType;
  priority: Priority;
  impact: TaskImpact;
  triggerReason: string;
  consequence: string;
  actionLabel: string;
  actionPath: string;
  relatedSaleId?: string;
  relatedProductId?: string;
  relatedCreativeId?: string;
  dedupKey: string;
  context?: Record<string, unknown>;
}

// Utilidad para calcular días transcurridos
const daysSince = (date: string | Date): number => {
  const then = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
};

// ====================================
// REGLAS DE COBRO
// ====================================

export function generateCobroTasks(sales: Sale[]): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const sale of sales) {
    if (sale.paymentStatus !== 'pendiente') continue;

    const days = daysSince(sale.saleDate);
    const clientName = sale.clientName || 'cliente';
    const productName = sale.product?.name || 'producto';
    const amount = sale.totalAmount.toLocaleString();

    // Regla 1: Cobro urgente (> 10 días)
    if (days > 10) {
      tasks.push({
        name: `Cobrar a ${clientName}`,
        description: `$${amount} pendiente hace ${days} días`,
        type: 'cobro',
        priority: 'alta',
        impact: 'dinero',
        triggerReason: `Venta de $${amount} pendiente de pago hace ${days} días (${productName} - ${sale.salesChannel || 'directo'})`,
        consequence: 'Riesgo de pérdida. El cliente puede olvidar o desistir de la compra.',
        actionLabel: 'Marcar cobrado',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        relatedProductId: sale.productId || undefined,
        dedupKey: `cobro:sale:${sale.id}`,
        context: {
          daysPending: days,
          amount: sale.totalAmount,
          channel: sale.salesChannel,
        },
      });
    }
    // Regla 2: Cobro normal (5-10 días)
    else if (days >= 5) {
      tasks.push({
        name: `Cobrar a ${clientName}`,
        description: `$${amount} pendiente hace ${days} días`,
        type: 'cobro',
        priority: 'media',
        impact: 'dinero',
        triggerReason: `Venta de $${amount} pendiente de pago hace ${days} días`,
        consequence: 'Puede convertirse en un cobro difícil si pasa más tiempo.',
        actionLabel: 'Marcar cobrado',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        relatedProductId: sale.productId || undefined,
        dedupKey: `cobro:sale:${sale.id}`,
        context: {
          daysPending: days,
          amount: sale.totalAmount,
        },
      });
    }

    // Regla 3: Entrega sin cobro
    if (sale.orderStatus === 'entregado' && sale.paymentStatus === 'pendiente') {
      tasks.push({
        name: `Confirmar cobro: ${clientName}`,
        description: `Entregado pero no pagado ($${amount})`,
        type: 'cobro',
        priority: 'alta',
        impact: 'dinero',
        triggerReason: `Pedido entregado hace ${days} días pero aún sin confirmar pago`,
        consequence: 'Pérdida de control sobre el inventario y flujo de caja.',
        actionLabel: 'Confirmar pago',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        relatedProductId: sale.productId || undefined,
        dedupKey: `cobro_entregado:sale:${sale.id}`,
        context: {
          orderStatus: sale.orderStatus,
          daysSinceDelivery: days,
        },
      });
    }

    // Regla 4: Venta con margen negativo (pérdida)
    if ((sale.marginAtSale ?? 0) < 0) {
      tasks.push({
        name: `Revisar precio: ${productName}`,
        description: `Venta con pérdida de $${Math.abs(sale.marginAtSale || 0).toLocaleString()}`,
        type: 'estrategia',
        priority: 'alta',
        impact: 'dinero',
        triggerReason: `Venta registrada con margen negativo ($${sale.marginAtSale?.toLocaleString()}). El precio de venta fue menor al costo.`,
        consequence: 'Cada venta de este producto a este precio genera pérdida directa.',
        actionLabel: 'Revisar producto',
        actionPath: `/products/${sale.productId}`,
        relatedSaleId: sale.id,
        relatedProductId: sale.productId || undefined,
        dedupKey: `venta_perdida:sale:${sale.id}`,
        context: {
          costAtSale: sale.costAtSale,
          unitPrice: sale.unitPrice,
          marginAtSale: sale.marginAtSale,
        },
      });
    }
  }

  return tasks;
}

// ====================================
// REGLAS DE CREATIVOS
// ====================================

export function generateCreativoTasks(
  products: Product[],
  creatives: Creative[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  // Crear set de productos con creativos
  const productsWithCreatives = new Set(
    creatives.filter(c => c.productId).map(c => c.productId)
  );

  for (const product of products) {
    if (product.status !== 'activo') continue;

    const hasCreatives = productsWithCreatives.has(product.id);
    const margin = product.retailPrice && product.costPrice
      ? Math.round(((product.retailPrice - product.costPrice) / product.retailPrice) * 100)
      : 0;

    // Regla 1: Producto destacado sin creativos (prioridad alta)
    if (product.isFeatured && !hasCreatives) {
      tasks.push({
        name: `Priorizar contenido: ${product.name}`,
        description: 'Producto destacado sin creativos',
        type: 'creativo',
        priority: 'alta',
        impact: 'crecimiento',
        triggerReason: `Producto marcado como destacado pero sin ningún creativo publicitario${margin > 0 ? `. Margen: ${margin}%` : ''}`,
        consequence: 'Pierdes oportunidad de ventas con tu mejor producto.',
        actionLabel: 'Crear creativo',
        actionPath: '/creatives',
        relatedProductId: product.id,
        dedupKey: `creativo_destacado:product:${product.id}`,
        context: {
          isFeatured: true,
          margin,
        },
      });
    }
    // Regla 2: Producto activo sin creativos (prioridad media)
    else if (!hasCreatives) {
      tasks.push({
        name: `Crear creativo: ${product.name}`,
        description: 'Producto sin contenido publicitario',
        type: 'creativo',
        priority: 'media',
        impact: 'crecimiento',
        triggerReason: `Producto activo sin ningún creativo para publicitar`,
        consequence: 'Sin contenido, es difícil generar ventas orgánicas.',
        actionLabel: 'Crear creativo',
        actionPath: '/creatives',
        relatedProductId: product.id,
        dedupKey: `creativo:product:${product.id}`,
        context: {
          margin,
        },
      });
    }
  }

  // Regla 3: Creativos exitosos para repetir
  const successfulCreatives = creatives.filter(
    c => c.result === 'funciono' && c.status === 'publicado'
  );

  for (const creative of successfulCreatives.slice(0, 2)) {
    const productName = creative.product?.name || 'producto';
    tasks.push({
      name: `Repetir creativo exitoso`,
      description: `"${creative.title || productName}" funcionó bien`,
      type: 'creativo',
      priority: 'baja',
      impact: 'crecimiento',
      triggerReason: `Este creativo tuvo buenos resultados y puede replicarse`,
      consequence: 'Desaprovechas una fórmula que ya funcionó.',
      actionLabel: 'Duplicar',
      actionPath: '/creatives',
      relatedCreativeId: creative.id,
      relatedProductId: creative.productId || undefined,
      dedupKey: `repetir_creativo:creative:${creative.id}`,
      context: {
        result: creative.result,
        channel: creative.channel,
      },
    });
  }

  return tasks;
}

// ====================================
// REGLAS DE ESTRATEGIA
// ====================================

export function generateEstrategiaTasks(
  products: Product[],
  sales: Sale[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  // Productos con ventas en últimos 30 días
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentSaleProductIds = new Set(
    sales
      .filter(s => new Date(s.saleDate).getTime() > thirtyDaysAgo)
      .map(s => s.productId)
  );

  for (const product of products) {
    if (product.status !== 'activo') continue;

    const hasRecentSales = recentSaleProductIds.has(product.id);
    const productAge = daysSince(product.createdAt);

    // Regla 1: Producto sin ventas en 30 días (solo si tiene más de 30 días)
    if (!hasRecentSales && productAge > 30) {
      tasks.push({
        name: `Revisar producto: ${product.name}`,
        description: 'Sin ventas en los últimos 30 días',
        type: 'estrategia',
        priority: 'baja',
        impact: 'dinero',
        triggerReason: `Este producto no ha generado ventas en más de un mes`,
        consequence: 'Inventario estancado y capital inmovilizado.',
        actionLabel: 'Ver producto',
        actionPath: `/products/${product.id}`,
        relatedProductId: product.id,
        dedupKey: `sin_ventas:product:${product.id}`,
        context: {
          daysSinceLastSale: 30,
          productAge,
        },
      });
    }

    // Regla 2: Producto nuevo sin comunicar (< 7 días)
    if (productAge <= 7) {
      tasks.push({
        name: `Comunicar producto nuevo`,
        description: `${product.name} - creado hace ${productAge} días`,
        type: 'operacion',
        priority: 'media',
        impact: 'crecimiento',
        triggerReason: `Producto nuevo que debe comunicarse a vendedores y canales`,
        consequence: 'Los vendedores no sabrán que existe este producto.',
        actionLabel: 'Ver producto',
        actionPath: `/products/${product.id}`,
        relatedProductId: product.id,
        dedupKey: `nuevo:product:${product.id}`,
        context: {
          daysOld: productAge,
        },
      });
    }
  }

  return tasks;
}

// ====================================
// REGLAS DE SEGUIMIENTO POST-VENTA
// ====================================

export function generateSeguimientoTasks(sales: Sale[]): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const sale of sales) {
    // Skip ventas en estado final
    if (sale.orderStatus === 'entregado' && sale.paymentStatus === 'pagado') continue;
    if (sale.operationalStatus === 'entregado') continue;
    
    const daysSinceStatus = daysSince(sale.statusUpdatedAt || sale.saleDate);
    const isContraEntrega = sale.paymentMethod === 'contra_entrega';
    const isTransferencia = sale.paymentMethod === 'transferencia';
    const clientName = sale.clientName || 'Cliente';
    const amount = sale.totalAmount.toLocaleString();

    // === CONTRA ENTREGA ===
    if (isContraEntrega) {
      // Regla 1: Confirmar pedido nuevo
      if (sale.operationalStatus === 'nuevo' && daysSinceStatus <= 1) {
        tasks.push({
          name: `Confirmar pedido: ${clientName}`,
          description: `$${amount} - llamar para confirmar`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Venta contra entrega registrada. Confirmar disponibilidad del cliente.`,
          consequence: 'Sin confirmación, el pedido puede perderse o generar devolución.',
          actionLabel: 'Marcar contactado',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:confirmar:${sale.id}`,
        });
      }
      
      // Regla 2: Recordar confirmación si no hay respuesta
      if (sale.operationalStatus === 'nuevo' && daysSinceStatus > 2) {
        tasks.push({
          name: `Recordar confirmación: ${clientName}`,
          description: `Sin respuesta hace ${daysSinceStatus} días`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Cliente no ha confirmado pedido después de ${daysSinceStatus} días`,
          consequence: 'Alto riesgo de pérdida de venta o devolución.',
          actionLabel: 'Contactar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:recordar:${sale.id}`,
        });
      }
      
      // Regla 3: Marcar riesgo
      if (sale.operationalStatus === 'sin_respuesta' && daysSinceStatus > 3) {
        tasks.push({
          name: `Venta en riesgo: ${clientName}`,
          description: `Sin respuesta - considerar cancelación`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Cliente sin respuesta por ${daysSinceStatus} días`,
          consequence: 'Probable pérdida de venta y costos de envío si se despacha.',
          actionLabel: 'Evaluar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:riesgo:${sale.id}`,
        });
      }

      // Regla 4: Preparar envío (confirmado pero sin despachar)
      if (sale.operationalStatus === 'confirmado' && daysSinceStatus > 2) {
        tasks.push({
          name: `Preparar envío: ${clientName}`,
          description: `Confirmado hace ${daysSinceStatus} días sin despachar`,
          type: 'seguimiento_venta',
          priority: 'media',
          impact: 'operacion',
          triggerReason: `Pedido confirmado esperando despacho hace ${daysSinceStatus} días`,
          consequence: 'Demoras pueden generar cancelaciones.',
          actionLabel: 'Despachar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:despachar:${sale.id}`,
        });
      }
    }

    // === TRANSFERENCIA ===
    if (isTransferencia) {
      // Regla 1: Enviar datos de pago
      if (sale.operationalStatus === 'nuevo' && sale.paymentStatus === 'pendiente') {
        tasks.push({
          name: `Enviar datos de pago: ${clientName}`,
          description: `$${amount} pendiente`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Venta por transferencia sin datos de pago enviados`,
          consequence: 'El cliente no puede pagar sin los datos bancarios.',
          actionLabel: 'Marcar contactado',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:datos:${sale.id}`,
        });
      }
      
      // Regla 2: Recordar pago
      if (sale.operationalStatus === 'contactado' && sale.paymentStatus === 'pendiente' && daysSinceStatus > 2) {
        tasks.push({
          name: `Recordar pago: ${clientName}`,
          description: `$${amount} - ${daysSinceStatus} días sin pagar`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Cliente contactado pero sin transferir después de ${daysSinceStatus} días`,
          consequence: 'Riesgo de pérdida de venta.',
          actionLabel: 'Recordar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:recordar_pago:${sale.id}`,
        });
      }

      // Regla 3: Riesgo de no pago
      if (sale.operationalStatus === 'contactado' && sale.paymentStatus === 'pendiente' && daysSinceStatus > 5) {
        tasks.push({
          name: `Riesgo no pago: ${clientName}`,
          description: `$${amount} sin transferir hace ${daysSinceStatus} días`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Transferencia pendiente por más de 5 días`,
          consequence: 'Alta probabilidad de venta perdida.',
          actionLabel: 'Evaluar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          relatedProductId: sale.productId || undefined,
          dedupKey: `seguimiento:riesgo_no_pago:${sale.id}`,
        });
      }
    }

    // === REGLAS GENERALES ===
    
    // En ruta sin entrega > 3 días
    if (sale.operationalStatus === 'en_ruta' && daysSinceStatus > 3) {
      tasks.push({
        name: `Verificar entrega: ${clientName}`,
        description: `En ruta hace ${daysSinceStatus} días`,
        type: 'seguimiento_venta',
        priority: 'media',
        impact: 'operacion',
        triggerReason: `Pedido marcado en ruta hace ${daysSinceStatus} días sin confirmación de entrega`,
        consequence: 'Posible problema logístico o devolución no reportada.',
        actionLabel: 'Verificar',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        relatedProductId: sale.productId || undefined,
        dedupKey: `seguimiento:verificar_entrega:${sale.id}`,
      });
    }
    
    // Riesgo de devolución
    if (sale.operationalStatus === 'riesgo_devolucion') {
      tasks.push({
        name: `Resolver riesgo: ${clientName}`,
        description: `$${amount} en riesgo`,
        type: 'seguimiento_venta',
        priority: 'alta',
        impact: 'dinero',
        triggerReason: `Venta marcada con riesgo de devolución o pérdida`,
        consequence: 'Pérdida directa de la venta y posibles costos adicionales.',
        actionLabel: 'Resolver',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        relatedProductId: sale.productId || undefined,
        dedupKey: `seguimiento:resolver_riesgo:${sale.id}`,
      });
    }
  }

  return tasks;
}

// ====================================
// REGLAS DE CREATIVOS POR PERFORMANCE
// ====================================

export function generateCreativePerformanceTasks(
  creatives: Creative[],
  products: Product[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const creative of creatives) {
    // Skip if no metrics
    const metricMessages = creative.metricMessages || 0;
    const metricSales = creative.metricSales || 0;
    const engagementLevel = creative.engagementLevel;
    
    // Calculate performance
    let performance: 'frio' | 'interesante' | 'caliente' = 'frio';
    if (metricSales >= 3 || metricMessages >= 30 || engagementLevel === 'alto') {
      performance = 'caliente';
    } else if (metricSales >= 1 || metricMessages >= 10) {
      performance = 'interesante';
    }

    const product = products.find(p => p.id === creative.productId);
    const productName = product?.name || 'producto';
    const days = daysSince(creative.createdAt);

    // Regla 1: Creativo FRÍO con más de 7 días
    if (performance === 'frio' && days > 7 && creative.status === 'publicado') {
      tasks.push({
        name: `Cambiar creativo: ${productName}`,
        description: `Creativo frío sin resultados`,
        type: 'creativo',
        priority: 'media',
        impact: 'crecimiento',
        triggerReason: `Creativo publicado hace ${days} días sin generar mensajes ni ventas`,
        consequence: 'Contenido que no funciona sigue ocupando atención sin retorno.',
        actionLabel: 'Crear nuevo',
        actionPath: `/creatives?productId=${creative.productId}`,
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId || undefined,
        dedupKey: `creativo_frio:${creative.id}`,
      });
    }

    // Regla 2: Creativo INTERESANTE con muchos mensajes pero pocas ventas
    if (performance === 'interesante' && metricMessages >= 10 && metricSales < 2) {
      tasks.push({
        name: `Optimizar oferta: ${productName}`,
        description: `${metricMessages} mensajes pero ${metricSales} ventas`,
        type: 'creativo',
        priority: 'media',
        impact: 'dinero',
        triggerReason: `Creativo genera interés (${metricMessages} msgs) pero baja conversión (${metricSales} ventas)`,
        consequence: 'Pierdes ventas. El mensaje atrae pero algo falla en cierre.',
        actionLabel: 'Revisar oferta',
        actionPath: `/products/${creative.productId}`,
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId || undefined,
        dedupKey: `creativo_baja_conversion:${creative.id}`,
      });
    }

    // Regla 3: Creativo CALIENTE sin intent de escalado
    if (performance === 'caliente' && !creative.automationIntent) {
      tasks.push({
        name: `Escalar creativo: ${productName}`,
        description: `🔥 Funcionando - listo para escalar`,
        type: 'creativo',
        priority: 'alta',
        impact: 'crecimiento',
        triggerReason: `Creativo caliente con ${metricSales} ventas y ${metricMessages} mensajes`,
        consequence: 'Desaprovechas un creativo que funciona. Podrías multiplicar resultados.',
        actionLabel: 'Escalar',
        actionPath: '/creatives',
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId || undefined,
        dedupKey: `creativo_escalar:${creative.id}`,
      });
    }
  }

  return tasks;
}

// ====================================
// GENERADOR PRINCIPAL
// ====================================

export function generateAllTasks(
  sales: Sale[],
  products: Product[],
  creatives: Creative[]
): GeneratedTask[] {
  const allTasks: GeneratedTask[] = [];

  // Generar tareas de cada categoría
  allTasks.push(...generateCobroTasks(sales));
  allTasks.push(...generateSeguimientoTasks(sales));
  allTasks.push(...generateCreativoTasks(products, creatives));
  allTasks.push(...generateCreativePerformanceTasks(creatives, products));
  allTasks.push(...generateEstrategiaTasks(products, sales));

  // Ordenar por prioridad
  const priorityOrder: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };
  allTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return allTasks;
}

// ====================================
// VERIFICACIÓN DE CONDICIONES
// ====================================

export function checkTaskStillApplies(
  task: OperationalTask,
  sales: Sale[],
  products: Product[],
  creatives: Creative[]
): boolean {
  // Tareas manuales siempre aplican
  if (task.source === 'manual') return true;

  // Verificar según el tipo de tarea
  if (task.dedupKey?.startsWith('cobro:sale:')) {
    const saleId = task.relatedSaleId;
    const sale = sales.find(s => s.id === saleId);
    // La tarea ya no aplica si la venta fue pagada
    return sale ? sale.paymentStatus === 'pendiente' : false;
  }

  if (task.dedupKey?.startsWith('cobro_entregado:sale:')) {
    const saleId = task.relatedSaleId;
    const sale = sales.find(s => s.id === saleId);
    return sale ? sale.paymentStatus === 'pendiente' : false;
  }

  if (task.dedupKey?.startsWith('creativo:product:') || task.dedupKey?.startsWith('creativo_destacado:product:')) {
    const productId = task.relatedProductId;
    const product = products.find(p => p.id === productId);
    if (!product || product.status !== 'activo') return false;
    
    // Verificar si ahora tiene creativos
    const hasCreatives = creatives.some(c => c.productId === productId);
    return !hasCreatives;
  }

  // Creative performance tasks
  if (task.dedupKey?.startsWith('creativo_frio:') || task.dedupKey?.startsWith('creativo_escalar:') || task.dedupKey?.startsWith('creativo_baja_conversion:')) {
    const creativeId = task.relatedCreativeId;
    const creative = creatives.find(c => c.id === creativeId);
    // Remove task if creative has automation intent or is no longer active
    if (!creative || creative.automationIntent || creative.status === 'descartado') return false;
    return true;
  }

  if (task.dedupKey?.startsWith('sin_ventas:product:')) {
    const productId = task.relatedProductId;
    const product = products.find(p => p.id === productId);
    if (!product || product.status !== 'activo') return false;

    // Verificar si tuvo ventas recientes
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const hasRecentSales = sales.some(
      s => s.productId === productId && new Date(s.saleDate).getTime() > thirtyDaysAgo
    );
    return !hasRecentSales;
  }

  if (task.dedupKey?.startsWith('nuevo:product:')) {
    const productId = task.relatedProductId;
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    // Ya no es "nuevo" después de 7 días
    return daysSince(product.createdAt) <= 7;
  }

  // Por defecto, la tarea sigue aplicando
  return true;
}
