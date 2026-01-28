
# Plan: Rediseno UX Command Center - Modelo Alerta > Accion > Auditoria

## Diagnostico del Estado Actual

### Problemas Criticos Identificados

1. **Mezcla Conceptual**: Las "Alertas de Seguimiento" y "Acciones Prioritarias" tienen el mismo peso visual y estructura
2. **Sobrecarga Informativa**: TaskCard muestra "Existe porque..." siempre visible (deberia estar colapsado)
3. **Falta de Jerarquia**: Todo se presenta con igual prominencia
4. **Friccion de Ejecucion**: El boton principal navega en lugar de ejecutar directamente
5. **Ruido Visual**: Demasiados badges, iconos y texto compitiendo por atencion

### Flujo Actual vs Deseado

```text
ACTUAL:                              DESEADO:
┌─────────────────────┐              ┌─────────────────────┐
│ Saludo + Botones    │              │ Saludo compacto     │
├─────────────────────┤              ├─────────────────────┤
│ Daily Insight       │              │ ALERTAS (1 linea)   │
│ (card grande)       │              │ • 2 sin confirmar   │
├─────────────────────┤              │ • $140K pendiente   │
│ Alertas Seguimiento │              │ • 1 en riesgo       │
│ (cards medianas)    │              ├─────────────────────┤
├─────────────────────┤              │ ACCION 1            │
│ Acciones Priorit.   │              │ [EJECUTAR]          │
│ (cards grandes)     │              ├─────────────────────┤
│ - TaskCard          │              │ ACCION 2            │
│ - TaskCard          │              │ [EJECUTAR]          │
│ - TaskCard          │              ├─────────────────────┤
├─────────────────────┤              │ Estado Negocio      │
│ Estado Negocio      │              │ (metricas)          │
└─────────────────────┘              └─────────────────────┘
```

---

## Arquitectura de Componentes

### Componentes Nuevos

| Componente | Proposito |
|------------|-----------|
| `AlertStrip.tsx` | Barra de alertas compactas (diagnostico) |
| `ActionCard.tsx` | Tarjeta de accion ejecutable (ejecucion) |

### Componentes a Modificar

| Componente | Cambios |
|------------|---------|
| `CommandCenter.tsx` | Reorganizar estructura completa |
| `TaskCard.tsx` | Simplificar para auditoria, colapsar contexto |

---

## Diseno Detallado

### 1. AlertStrip - Barra de Alertas (Diagnostico)

Reemplaza: DailyInsight + Alertas de Seguimiento

```text
┌──────────────────────────────────────────────────────────────────────┐
│ 🔴 2 sin confirmar  │  💰 $140.000 por cobrar  │  ⚠️ 1 en riesgo     │
└──────────────────────────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Layout**: Flex horizontal, items compactos
- **Cada alerta**: `Icono + Numero/Monto + Label corto`
- **Interaccion**: Click navega al modulo correspondiente
- **Sin estado**: Las alertas NO se completan, solo informan
- **Colores semanticos**:
  - Rojo: dinero en peligro / riesgo
  - Amarillo: seguimiento pendiente
  - Verde: todo ok (ocultar si no hay alertas)

**Implementacion:**

```typescript
// src/components/command-center/AlertStrip.tsx
interface Alert {
  id: string;
  icon: LucideIcon;
  value: string | number;
  label: string;
  variant: 'danger' | 'warning' | 'info';
  path: string;
}

// Alertas a calcular:
// - sinConfirmar: sales con operationalStatus === 'nuevo' y >2 dias
// - pendienteCobro: suma de totalAmount donde paymentStatus === 'pendiente'
// - enRiesgo: sales con operationalStatus === 'riesgo_devolucion' | 'sin_respuesta'
// - pedidosSinEnviar: sales con operationalStatus === 'confirmado' y >2 dias
```

### 2. ActionCard - Tarjeta de Accion Ejecutable

Reemplaza: TaskCard en Command Center

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 💰 COBRO                                                            │
│                                                                     │
│ Confirmar pedido — Manuela Balbuena                                │
│ $140.000 · Contra entrega                                          │
│                                                                     │
│ [████ Marcar contactado ████]  ···                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Maximo 5 acciones** visibles
- **Titulo con verbo**: "Confirmar pedido", "Cobrar venta", "Recordar pago"
- **Subtitulo**: Cliente + monto + metodo
- **Boton principal**: Ejecuta directamente (sin modal, sin navegacion)
- **Icono secundario**: "···" para ver detalle/contexto expandible
- **Sin "Existe porque"** visible por defecto - colapsado en "···"

**Comportamiento del Boton Principal:**

| Tipo Tarea | Accion del Boton | Efecto |
|------------|------------------|--------|
| Seguimiento (nuevo) | "Marcar contactado" | updateOperationalStatus('contactado') |
| Seguimiento (contactado) | "Marcar confirmado" | updateOperationalStatus('confirmado') |
| Cobro | "Marcar pagado" | updateSale({paymentStatus: 'pagado'}) |
| Creativo | "Ir a crear" | navigate('/creatives') |

**Implementacion:**

```typescript
// src/components/command-center/ActionCard.tsx
interface ActionCardProps {
  task: OperationalTask;
  onExecute: () => Promise<void>;  // Accion principal
  onViewDetail?: () => void;       // Expandir contexto
}

// Mapeo de acciones directas
const directActions: Record<TaskType, (task: OperationalTask) => Promise<void>> = {
  seguimiento_venta: async (task) => {
    if (task.relatedSaleId) {
      await updateOperationalStatus(task.relatedSaleId, getNextStatus(currentStatus));
    }
  },
  cobro: async (task) => {
    if (task.relatedSaleId) {
      await updateSale(task.relatedSaleId, { paymentStatus: 'pagado' });
    }
  },
  // ...
};
```

### 3. CommandCenter Reorganizado

**Nueva Estructura:**

```typescript
// src/pages/CommandCenter.tsx

return (
  <div className="min-h-screen bg-background">
    <CommandCenterNav />
    
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Header compacto */}
      <header className="mb-6">
        <h1 className="text-2xl">Buenos dias, {nombre}</h1>
      </header>

      {/* 1. ALERTAS - Diagnostico rapido */}
      <AlertStrip alerts={calculatedAlerts} className="mb-8" />

      {/* 2. ACCIONES PRIORITARIAS - Maximo 5 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Acciones de Hoy</h2>
        <div className="space-y-3">
          {priorityActions.slice(0, 5).map(task => (
            <ActionCard 
              key={task.id}
              task={task}
              onExecute={() => executeDirectAction(task)}
              onViewDetail={() => setExpandedTask(task)}
            />
          ))}
        </div>
        
        {/* Link secundario a auditoria */}
        <Button variant="ghost" onClick={() => navigate('/tasks')}>
          Ver historial completo →
        </Button>
      </section>

      {/* 3. ESTADO DEL NEGOCIO - Metricas */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Estado del Negocio</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* BusinessMetricCard existentes */}
        </div>
      </section>
    </div>
  </div>
);
```

### 4. TaskCard Simplificado (para /tasks)

La pagina `/tasks` se convierte en vista de **auditoria**:

**Cambios en TaskCard:**
- Contexto ("Existe porque...") colapsado por defecto
- Consecuencia colapsada por defecto
- Layout mas compacto
- Menos badges visibles
- Enfocado en historial, no ejecucion

```typescript
// src/components/tasks/TaskCard.tsx - Cambios

// 1. Mover triggerReason DENTRO del bloque expandible
// 2. Por defecto expanded = false
// 3. Reducir padding: p-5 -> p-4
// 4. Eliminar badges redundantes en vista compacta
```

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/command-center/AlertStrip.tsx` | Barra de alertas diagnostico |
| `src/components/command-center/ActionCard.tsx` | Tarjeta de accion ejecutable |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/CommandCenter.tsx` | Reorganizar estructura, usar nuevos componentes |
| `src/components/tasks/TaskCard.tsx` | Colapsar contexto por defecto, simplificar |
| `src/index.css` | Agregar clases para alertas compactas |

---

## Calculo de Alertas

```typescript
// En CommandCenter.tsx

const alerts = useMemo(() => {
  const result: Alert[] = [];
  
  // 1. Pendiente por cobrar (DINERO)
  const pendingAmount = sales
    .filter(s => s.paymentStatus === 'pendiente')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  if (pendingAmount > 0) {
    result.push({
      id: 'pending-payment',
      icon: DollarSign,
      value: `$${pendingAmount.toLocaleString()}`,
      label: 'por cobrar',
      variant: 'danger',
      path: '/sales?filter=pendiente'
    });
  }
  
  // 2. Sin confirmar > 2 dias (RIESGO)
  const sinConfirmarViejo = sales.filter(s => {
    if (s.operationalStatus !== 'nuevo') return false;
    const days = daysSince(s.statusUpdatedAt || s.saleDate);
    return days > 2;
  }).length;
  if (sinConfirmarViejo > 0) {
    result.push({
      id: 'unconfirmed',
      icon: PhoneCall,
      value: sinConfirmarViejo,
      label: 'sin confirmar',
      variant: 'warning',
      path: '/sales?status=nuevo'
    });
  }
  
  // 3. En riesgo (CRITICO)
  const enRiesgo = sales.filter(s => 
    s.operationalStatus === 'riesgo_devolucion' || 
    s.operationalStatus === 'sin_respuesta'
  ).length;
  if (enRiesgo > 0) {
    result.push({
      id: 'at-risk',
      icon: AlertTriangle,
      value: enRiesgo,
      label: 'en riesgo',
      variant: 'danger',
      path: '/sales?status=riesgo'
    });
  }
  
  return result;
}, [sales]);
```

---

## Mapeo de Acciones Directas

El boton principal de cada ActionCard ejecuta segun el tipo de tarea:

```typescript
const executeDirectAction = async (task: OperationalTask) => {
  const sale = sales.find(s => s.id === task.relatedSaleId);
  
  switch (task.type) {
    case 'seguimiento_venta':
      if (!sale) return;
      // Avanzar al siguiente estado logico
      const nextStatus = getNextOperationalStatus(sale.operationalStatus);
      await updateOperationalStatus(sale.id, nextStatus);
      // Cerrar tarea automaticamente
      await resolveTask(task.id);
      toast.success(`Estado actualizado: ${statusLabels[nextStatus]}`);
      break;
      
    case 'cobro':
      if (!sale) return;
      await updateSale(sale.id, { paymentStatus: 'pagado' });
      await resolveTask(task.id);
      toast.success('Venta marcada como pagada');
      break;
      
    case 'creativo':
      // Este tipo SI navega
      navigate('/creatives');
      break;
      
    default:
      // Fallback: abrir detalle
      setExpandedTask(task);
  }
};

// Helper para determinar siguiente estado
function getNextOperationalStatus(current: OperationalStatus): OperationalStatus {
  const flow: Record<OperationalStatus, OperationalStatus> = {
    nuevo: 'contactado',
    contactado: 'confirmado',
    confirmado: 'en_ruta',
    en_ruta: 'entregado',
    sin_respuesta: 'contactado',
    riesgo_devolucion: 'contactado',
    entregado: 'entregado', // terminal
  };
  return flow[current] || current;
}
```

---

## Estilos Nuevos

```css
/* src/index.css - Agregar */

/* Alert Strip */
.alert-strip {
  @apply flex flex-wrap gap-2 p-3 rounded-xl bg-muted/30 border border-border/30;
}

.alert-chip {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all;
}

.alert-chip-danger {
  @apply bg-destructive/10 text-destructive hover:bg-destructive/20;
}

.alert-chip-warning {
  @apply bg-warning/10 text-warning hover:bg-warning/20;
}

.alert-chip-info {
  @apply bg-primary/10 text-primary hover:bg-primary/20;
}

/* Action Card */
.action-card {
  @apply grc-card p-4 border-l-4;
}

.action-card-cobro {
  @apply border-l-destructive bg-destructive/5;
}

.action-card-seguimiento {
  @apply border-l-warning bg-warning/5;
}

.action-card-creativo {
  @apply border-l-primary bg-primary/5;
}
```

---

## Resultado Visual Esperado

### Command Center Rediseñado

```text
┌──────────────────────────────────────────────────────────────────┐
│  Buenos dias, Carlos                                             │
├──────────────────────────────────────────────────────────────────┤
│  🔴 $140.000 por cobrar   ⚠️ 2 sin confirmar   🔴 1 en riesgo   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACCIONES DE HOY                                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 💰 COBRO                                                   │  │
│  │                                                            │  │
│  │ Confirmar pedido — Manuela Balbuena                       │  │
│  │ $140.000 · Contra entrega                                 │  │
│  │                                                            │  │
│  │ [████████ Marcar contactado ████████]           ···       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📈 SEGUIMIENTO                                             │  │
│  │                                                            │  │
│  │ Recordar pago — Juan Perez                                │  │
│  │ $85.000 · Transferencia · 3 dias sin pagar               │  │
│  │                                                            │  │
│  │ [████████ Enviar recordatorio ████████]         ···       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Ver historial completo →                                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  ESTADO DEL NEGOCIO                                              │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │    12    │ │  $2.4M   │ │    8     │ │    3     │            │
│  │  Ventas  │ │ Ingresos │ │Productos │ │Creativos │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Orden de Implementacion

1. Crear `AlertStrip.tsx`
2. Crear `ActionCard.tsx`
3. Actualizar `index.css` con nuevos estilos
4. Reorganizar `CommandCenter.tsx`
5. Simplificar `TaskCard.tsx` (colapsar contexto)

---

## Reglas de Diseno Aplicadas

| Regla | Aplicacion |
|-------|------------|
| Jerarquia visual clara | Alertas < Acciones < Metricas |
| Espacio en blanco | Container max-w-4xl, padding reducido |
| Colores semanticos | Rojo=riesgo, Amarillo=seguimiento, Verde=ok |
| Contexto colapsado | "Existe porque" y "Consecuencia" ocultos |
| Boton ejecuta | Sin modales innecesarios |
| Maximo 5 acciones | slice(0, 5) en priorityActions |

---

## Lo Que NO Cambia

- Logica de generacion de tareas en `taskRules.ts`
- Estructura de base de datos
- Hooks existentes (`useTasks`, `useSales`)
- Tipos TypeScript
- Pagina `/tasks` como destino (solo simplificada)
