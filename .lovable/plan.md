
# Plan: Sistema de Seguimiento Post-Venta con Tareas Automaticas

## Resumen
Implementar estados operativos extendidos para ventas y generar tareas automaticas segun el metodo de pago. Cada cambio de estado crea o cierra tareas, impactando el Command Center con alertas y KPIs operativos.

---

## 1. Cambios en Base de Datos

### 1.1 Migracion: Agregar campo `operational_status` a `sales`

```sql
-- Crear enum para estados operativos
CREATE TYPE operational_status AS ENUM (
  'nuevo',
  'contactado',
  'confirmado',
  'sin_respuesta',
  'en_ruta',
  'entregado',
  'riesgo_devolucion'
);

-- Agregar columna a sales
ALTER TABLE sales ADD COLUMN operational_status operational_status DEFAULT 'nuevo';

-- Agregar campo para tracking de fechas de estado
ALTER TABLE sales ADD COLUMN status_updated_at TIMESTAMPTZ DEFAULT now();

-- Indice para consultas de seguimiento
CREATE INDEX idx_sales_operational_status ON sales(operational_status);
```

---

## 2. Actualizacion de Tipos TypeScript

### Archivo: `src/types/index.ts`

Agregar nuevo tipo:

```typescript
// Estados operativos de venta (ciclo post-venta)
export type OperationalStatus = 
  | 'nuevo'
  | 'contactado'
  | 'confirmado'
  | 'sin_respuesta'
  | 'en_ruta'
  | 'entregado'
  | 'riesgo_devolucion';
```

Actualizar interface `Sale`:

```typescript
export interface Sale {
  // ... campos existentes ...
  
  // Seguimiento operativo
  operationalStatus: OperationalStatus;
  statusUpdatedAt?: string;
}
```

---

## 3. Nuevas Reglas de Tareas Automaticas

### Archivo: `src/lib/taskRules.ts`

Agregar nueva funcion `generateSeguimientoTasks`:

### 3.1 Reglas para Contra Entrega

| Condicion | Tarea | Prioridad |
|-----------|-------|-----------|
| Venta nueva (< 1 dia) | "Confirmar pedido: {cliente}" | Alta |
| `nuevo` por > 2 dias | "Recordar confirmacion: {cliente}" | Alta |
| Sin respuesta > 3 dias | "Marcar riesgo: {cliente}" | Alta |
| `confirmado` sin envio > 2 dias | "Preparar envio: {cliente}" | Media |
| `en_ruta` > 3 dias sin entrega | "Verificar entrega: {cliente}" | Media |

### 3.2 Reglas para Transferencia

| Condicion | Tarea | Prioridad |
|-----------|-------|-----------|
| Venta nueva (< 1 dia) | "Enviar datos de pago: {cliente}" | Alta |
| `contactado` + pendiente > 2 dias | "Recordar pago: {cliente}" | Alta |
| Sin pago > 5 dias | "Marcar riesgo de no pago" | Alta |

### 3.3 Flujo de Estados (Diagrama)

```text
CONTRA ENTREGA:
nuevo -> contactado -> confirmado -> en_ruta -> entregado
              \-> sin_respuesta -> riesgo_devolucion

TRANSFERENCIA:
nuevo -> contactado -> [espera pago] -> confirmado -> en_ruta -> entregado
              \-> sin_respuesta -> riesgo_devolucion
```

### 3.4 Implementacion Tecnica

```typescript
export function generateSeguimientoTasks(sales: Sale[]): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const sale of sales) {
    if (sale.orderStatus === 'entregado' && sale.paymentStatus === 'pagado') continue;
    
    const daysSinceStatus = daysSince(sale.statusUpdatedAt || sale.saleDate);
    const isContraEntrega = sale.paymentMethod === 'contra_entrega';
    const isTransferencia = sale.paymentMethod === 'transferencia';
    const clientName = sale.clientName || 'Cliente';

    // === CONTRA ENTREGA ===
    if (isContraEntrega) {
      // Regla 1: Confirmar pedido nuevo
      if (sale.operationalStatus === 'nuevo' && daysSinceStatus <= 1) {
        tasks.push({
          name: `Confirmar pedido: ${clientName}`,
          description: `$${sale.totalAmount.toLocaleString()} - llamar para confirmar`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Venta contra entrega registrada. Confirmar disponibilidad del cliente.`,
          consequence: 'Sin confirmacion, el pedido puede perderse o generar devolucion.',
          actionLabel: 'Marcar contactado',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          dedupKey: `seguimiento:confirmar:${sale.id}`,
        });
      }
      
      // Regla 2: Recordar confirmacion si no hay respuesta
      if (sale.operationalStatus === 'nuevo' && daysSinceStatus > 2) {
        tasks.push({
          name: `Recordar confirmacion: ${clientName}`,
          description: `Sin respuesta hace ${daysSinceStatus} dias`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Cliente no ha confirmado pedido despues de ${daysSinceStatus} dias`,
          consequence: 'Alto riesgo de perdida de venta o devolucion.',
          actionLabel: 'Contactar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          dedupKey: `seguimiento:recordar:${sale.id}`,
        });
      }
      
      // Regla 3: Marcar riesgo
      if (sale.operationalStatus === 'sin_respuesta' && daysSinceStatus > 3) {
        tasks.push({
          name: `Venta en riesgo: ${clientName}`,
          description: `Sin respuesta - considerar cancelacion`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Cliente sin respuesta por ${daysSinceStatus} dias`,
          consequence: 'Probable perdida de venta y costos de envio si se despacha.',
          actionLabel: 'Evaluar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          dedupKey: `seguimiento:riesgo:${sale.id}`,
        });
      }
    }

    // === TRANSFERENCIA ===
    if (isTransferencia) {
      // Regla 1: Enviar datos de pago
      if (sale.operationalStatus === 'nuevo' && sale.paymentStatus === 'pendiente') {
        tasks.push({
          name: `Enviar datos de pago: ${clientName}`,
          description: `$${sale.totalAmount.toLocaleString()} pendiente`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Venta por transferencia sin datos de pago enviados`,
          consequence: 'El cliente no puede pagar sin los datos bancarios.',
          actionLabel: 'Marcar contactado',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          dedupKey: `seguimiento:datos:${sale.id}`,
        });
      }
      
      // Regla 2: Recordar pago
      if (sale.operationalStatus === 'contactado' && sale.paymentStatus === 'pendiente' && daysSinceStatus > 2) {
        tasks.push({
          name: `Recordar pago: ${clientName}`,
          description: `$${sale.totalAmount.toLocaleString()} - ${daysSinceStatus} dias sin pagar`,
          type: 'seguimiento_venta',
          priority: 'alta',
          impact: 'dinero',
          triggerReason: `Cliente contactado pero sin transferir despues de ${daysSinceStatus} dias`,
          consequence: 'Riesgo de perdida de venta.',
          actionLabel: 'Recordar',
          actionPath: '/sales',
          relatedSaleId: sale.id,
          dedupKey: `seguimiento:recordar_pago:${sale.id}`,
        });
      }
    }

    // === REGLAS GENERALES ===
    
    // En ruta sin entrega > 3 dias
    if (sale.operationalStatus === 'en_ruta' && daysSinceStatus > 3) {
      tasks.push({
        name: `Verificar entrega: ${clientName}`,
        description: `En ruta hace ${daysSinceStatus} dias`,
        type: 'seguimiento_venta',
        priority: 'media',
        impact: 'operacion',
        triggerReason: `Pedido marcado en ruta hace ${daysSinceStatus} dias sin confirmacion de entrega`,
        consequence: 'Posible problema logistico o devolucion no reportada.',
        actionLabel: 'Verificar',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        dedupKey: `seguimiento:verificar_entrega:${sale.id}`,
      });
    }
    
    // Riesgo de devolucion
    if (sale.operationalStatus === 'riesgo_devolucion') {
      tasks.push({
        name: `Resolver riesgo: ${clientName}`,
        description: `$${sale.totalAmount.toLocaleString()} en riesgo`,
        type: 'seguimiento_venta',
        priority: 'alta',
        impact: 'dinero',
        triggerReason: `Venta marcada con riesgo de devolucion o perdida`,
        consequence: 'Perdida directa de la venta y posibles costos adicionales.',
        actionLabel: 'Resolver',
        actionPath: '/sales',
        relatedSaleId: sale.id,
        dedupKey: `seguimiento:resolver_riesgo:${sale.id}`,
      });
    }
  }

  return tasks;
}
```

---

## 4. Actualizacion de Hook useSales

### Archivo: `src/hooks/useSales.ts`

Agregar:
- Mapeo de `operational_status` y `status_updated_at`
- Funcion `updateOperationalStatus(id, newStatus)` que actualiza estado y `status_updated_at`
- Auto-cierre de tareas relacionadas al cambiar estado

```typescript
const updateOperationalStatus = async (
  id: string, 
  newStatus: OperationalStatus
): Promise<boolean> => {
  const { error } = await supabase
    .from('sales')
    .update({
      operational_status: newStatus,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    toast({ title: 'Error', variant: 'destructive' });
    return false;
  }

  toast({ title: `Estado: ${statusLabels[newStatus]}` });
  fetchSales();
  return true;
};
```

---

## 5. UI del Modulo de Ventas

### Archivo: `src/pages/Sales.tsx`

### 5.1 Nuevo Selector de Estado Operativo

Agregar dropdown en `SaleCard` para cambiar estado:

```text
Estados visuales:
- nuevo        -> Gris       -> "Nuevo"
- contactado   -> Azul       -> "Contactado"
- confirmado   -> Verde      -> "Confirmado"
- sin_respuesta-> Amarillo   -> "Sin respuesta"
- en_ruta      -> Morado     -> "En ruta"
- entregado    -> Verde      -> "Entregado"
- riesgo_devolucion -> Rojo  -> "En riesgo"
```

### 5.2 Nuevos KPIs en Dashboard

Agregar tercera fila de cards (solo admin):

```text
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Sin confirmar   │ │   En riesgo     │ │ Pendiente accion│
│      3          │ │       1         │ │       5         │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

Calculos:
- **Sin confirmar**: `operationalStatus === 'nuevo'` 
- **En riesgo**: `operationalStatus === 'riesgo_devolucion' || operationalStatus === 'sin_respuesta'`
- **Pendiente accion**: ventas que no estan en estado final

### 5.3 Filtro por Estado Operativo

Agregar filtro en la lista de ventas para ver solo:
- Nuevos
- En riesgo
- Por confirmar
- En ruta

---

## 6. Command Center

### Archivo: `src/pages/CommandCenter.tsx`

### 6.1 Nueva Seccion: Alertas de Seguimiento

Despues de "Estado del Negocio", mostrar alertas si hay ventas en riesgo:

```text
┌─────────────────────────────────────────────────────────────┐
│ ALERTAS DE SEGUIMIENTO                                      │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ 2 ventas sin confirmar > 2 dias                         │
│ 🔴 1 venta en riesgo de devolucion                         │
│ ⏰ 3 ventas pendientes de accion hoy                       │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Metricas Actualizadas

En "Estado del Negocio", agregar:
- "Ventas en seguimiento" (no entregadas)
- "En riesgo" (contador con badge rojo)

---

## 7. Archivos a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/migrations/[timestamp]_sales_operational_status.sql` | Nueva columna y enum |
| `src/types/index.ts` | Nuevo tipo `OperationalStatus`, actualizar `Sale` |
| `src/lib/taskRules.ts` | Nueva funcion `generateSeguimientoTasks`, integrar en `generateAllTasks` |
| `src/hooks/useSales.ts` | Mapear nuevos campos, agregar `updateOperationalStatus` |
| `src/pages/Sales.tsx` | Selector de estado, nuevos KPIs, filtros |
| `src/pages/CommandCenter.tsx` | Alertas de seguimiento, metricas |

---

## 8. Orden de Implementacion

```text
1. Migracion DB (agregar campo operational_status)
2. Actualizar tipos TypeScript
3. Actualizar useSales.ts (mapeo y nueva funcion)
4. Implementar reglas en taskRules.ts
5. Actualizar UI de Sales.tsx (selector + KPIs)
6. Actualizar Command Center (alertas)
```

---

## 9. Flujo de Usuario Esperado

**Escenario: Venta contra entrega**

1. Usuario registra venta → Estado: `nuevo`
2. Sistema genera tarea: "Confirmar pedido: Juan"
3. Usuario contacta al cliente → Cambia a `contactado` → Tarea se cierra
4. Sistema genera tarea: "Esperar confirmacion"
5. Cliente confirma → Cambia a `confirmado` → Nueva tarea: "Preparar envio"
6. Se despacha → Cambia a `en_ruta` → Nueva tarea: "Verificar entrega"
7. Se entrega → Cambia a `entregado` → Todas las tareas cerradas

**Si no hay respuesta:**
1. Despues de 2 dias sin cambio → Tarea: "Recordar confirmacion"
2. Despues de 3+ dias → Cambia a `sin_respuesta`
3. Sistema genera tarea: "Marcar riesgo"
4. Usuario puede cambiar a `riesgo_devolucion` o reintentar

---

## Resultado Esperado

- Cada venta tiene un estado operativo claro
- Las tareas se generan automaticamente segun el flujo
- El Command Center muestra alertas de ventas en riesgo
- El dashboard de ventas muestra KPIs de seguimiento
- El sistema esta preparado para futura automatizacion de WhatsApp
