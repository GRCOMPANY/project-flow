

# Plan: Módulo Definitivo de Tareas para Ecommerce

## Diagnóstico del Estado Actual

### Lo que existe:
- Tabla `tasks` con campos básicos (`name`, `description`, `status`, `priority`, `source`)
- Hook `useSmartTasks` que genera tareas efímeras en memoria
- Estados limitados: `pendiente | en_progreso | terminada`
- Sources: `manual | automatic`
- No hay página `/tasks` dedicada
- Command Center consume tareas efímeras, no persistidas

### Problemas identificados:
1. Las tareas automáticas no se persisten - se pierden al recargar
2. No hay deduplicación - la misma tarea puede aparecer repetidamente
3. Estados insuficientes para operación real (falta `esperando_respuesta`, `programada`, etc.)
4. No hay registro del "por qué" ni del "qué pasa si no actúo"
5. No hay historial de acciones tomadas

---

## Fase 1: Migración de Base de Datos

### 1.1 Nuevos Tipos Enum

```sql
-- Estados extendidos para operación real
CREATE TYPE task_status_v2 AS ENUM (
  'pendiente',
  'en_progreso', 
  'esperando_respuesta',
  'programada',
  'completada',
  'cancelada',
  'resuelta_automaticamente'
);

-- Tipos de tarea por impacto operativo
CREATE TYPE task_type AS ENUM (
  'cobro',
  'seguimiento_venta',
  'creativo',
  'operacion',
  'estrategia'
);

-- Impacto económico
CREATE TYPE task_impact AS ENUM (
  'dinero',
  'crecimiento',
  'operacion'
);

-- Fuentes extendidas
CREATE TYPE task_source_v2 AS ENUM (
  'manual',
  'automatic',
  'ai_suggested',
  'external'
);
```

### 1.2 Nueva Estructura de Tabla `tasks`

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type task_type;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS impact task_impact;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS trigger_reason TEXT; -- Por qué existe
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS consequence TEXT;    -- Qué pasa si no actúo
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_label TEXT;   -- Texto del botón
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS action_path TEXT;    -- Ruta de navegación
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context JSONB;       -- Datos adicionales
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dedup_key TEXT UNIQUE; -- Para evitar duplicados
```

### 1.3 Índices para Performance

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_related_sale ON tasks(related_sale_id);
CREATE INDEX IF NOT EXISTS idx_tasks_related_product ON tasks(related_product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dedup ON tasks(dedup_key);
```

---

## Fase 2: Tipos TypeScript

### 2.1 Nuevas Interfaces en `src/types/index.ts`

```typescript
// Estados de tarea reales
export type TaskStatus = 
  | 'pendiente' 
  | 'en_progreso' 
  | 'esperando_respuesta'
  | 'programada'
  | 'completada'
  | 'cancelada'
  | 'resuelta_automaticamente';

// Tipos por impacto operativo
export type TaskType = 
  | 'cobro' 
  | 'seguimiento_venta' 
  | 'creativo' 
  | 'operacion' 
  | 'estrategia';

// Impacto económico
export type TaskImpact = 'dinero' | 'crecimiento' | 'operacion';

// Origen de la tarea
export type TaskSource = 'manual' | 'automatic' | 'ai_suggested' | 'external';

// Tarea completa del sistema
export interface OperationalTask {
  id: string;
  
  // Identificación
  name: string;
  description?: string;
  type: TaskType;
  
  // Estado y prioridad
  status: TaskStatus;
  priority: Priority;
  
  // Contexto operativo (CRÍTICO)
  triggerReason: string;    // "Existe porque..."
  consequence?: string;      // "Si no actúas..."
  impact: TaskImpact;
  
  // Acción
  actionLabel: string;
  actionPath?: string;
  
  // Relaciones
  relatedSaleId?: string;
  relatedSale?: Sale;
  relatedProductId?: string;
  relatedProduct?: Product;
  relatedCreativeId?: string;
  relatedCreative?: Creative;
  
  // Origen y deduplicación
  source: TaskSource;
  dedupKey?: string;
  
  // Resolución
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  // Programación
  dueDate?: string;
  assignedTo?: string;
  assignedUser?: Profile;
  
  // Metadata
  context?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

// Regla de generación automática
export interface TaskRule {
  id: string;
  name: string;
  type: TaskType;
  priority: Priority;
  impact: TaskImpact;
  condition: (data: TaskRuleContext) => boolean;
  generateTask: (data: TaskRuleContext) => Partial<OperationalTask>;
  dedupKey: (data: TaskRuleContext) => string;
}

export interface TaskRuleContext {
  sales: Sale[];
  products: Product[];
  creatives: Creative[];
  existingTasks: OperationalTask[];
}
```

---

## Fase 3: Motor de Reglas Automáticas

### 3.1 Crear `src/lib/taskRules.ts`

Archivo central con las reglas de negocio para generación automática:

```typescript
// Reglas implementadas:

// 1. COBROS
// - Venta con pago pendiente > 10 días → "Cobrar a {cliente}"
// - Contra entrega entregada pero no pagada → "Confirmar cobro"

// 2. VENTAS  
// - Pedido en progreso sin avance en 3 días → "Dar seguimiento"
// - Cliente sin respuesta en 5 días → "Recontactar cliente"

// 3. CREATIVOS
// - Producto activo sin creativos → "Crear creativo para {producto}"
// - Creativo exitoso no replicado → "Repetir creativo exitoso"
// - Producto destacado sin contenido → "Priorizar contenido"

// 4. OPERACIÓN
// - Producto nuevo (< 7 días) sin comunicar → "Enviar a vendedores"
// - Stock agotado con ventas recientes → "Revisar restock"

// 5. ESTRATEGIA
// - Producto sin ventas en 30 días → "Revisar precio/contenido"
// - Canal con baja conversión → "Analizar rendimiento"
```

### 3.2 Crear `src/hooks/useTasks.ts`

Hook principal que:
1. Carga tareas de la base de datos
2. Ejecuta el motor de reglas
3. Sincroniza tareas automáticas (crear nuevas, cerrar resueltas)
4. Expone CRUD completo

```typescript
export function useTasks() {
  // Estados
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Funciones principales
  const fetchTasks = async () => {...}
  const syncAutomaticTasks = async () => {...}
  const createTask = async (task: CreateTaskInput) => {...}
  const updateTaskStatus = async (id: string, status: TaskStatus) => {...}
  const resolveTask = async (id: string, notes?: string) => {...}
  const dismissTask = async (id: string, reason: string) => {...}
  
  // Filtros útiles
  const todayTasks = useMemo(() => 
    tasks.filter(t => t.status === 'pendiente')
         .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
         .slice(0, 5),
    [tasks]
  );
  
  const pendingCollections = useMemo(() =>
    tasks.filter(t => t.type === 'cobro' && t.status === 'pendiente'),
    [tasks]
  );
  
  return {
    tasks,
    todayTasks,
    pendingCollections,
    loading,
    createTask,
    updateTaskStatus,
    resolveTask,
    dismissTask,
    refetch: fetchTasks,
  };
}
```

---

## Fase 4: Página de Tareas `/tasks`

### 4.1 Crear `src/pages/Tasks.tsx`

**Estructura de la página:**

```
┌─────────────────────────────────────────────────────────┐
│  [CommandCenterNav]                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TAREAS                              [+ Nueva tarea]    │
│  Tu lista de acciones prioritarias                      │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 🔴 5    │ │ ⏳ 2    │ │ ✅ 12   │ │ 🚫 3    │       │
│  │Pendiente│ │En prog. │ │Completad│ │Cancelad │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
│  [Tabs: Hoy | Todas | Por tipo]                        │
│                                                         │
│  Filtros: [Tipo ▾] [Prioridad ▾] [Origen ▾] [🔍]       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ▌ ACCIONES DE HOY (máx 5)                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🔴 COBRO PENDIENTE                   💰 Dinero    │ │
│  │                                                   │ │
│  │ Cobrar a María García                             │ │
│  │                                                   │ │
│  │ 📌 Existe porque: Venta de $450 pendiente hace   │ │
│  │    12 días (Aspiradora Pro - WhatsApp)           │ │
│  │                                                   │ │
│  │ ⚠️ Si no actúas: Riesgo de pérdida. El cliente   │ │
│  │    puede olvidar o desistir de la compra.        │ │
│  │                                                   │ │
│  │ [Marcar cobrado]  [Programar]  [···]              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🟡 CREAR CONTENIDO                   🚀 Crecimient│ │
│  │                                                   │ │
│  │ Crear creativo para Audífonos Pro                 │ │
│  │                                                   │ │
│  │ 📌 Existe porque: Producto destacado sin         │ │
│  │    creativos. Margen alto (67%).                 │ │
│  │                                                   │ │
│  │ [Crear creativo →]  [Descartar]  [···]            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Componentes de Tareas

**`src/components/tasks/TaskCard.tsx`**
- Card expandible con contexto completo
- Muestra "por qué existe" y "qué pasa si no actúo"
- Acciones rápidas según tipo
- Indicador visual de prioridad e impacto

**`src/components/tasks/TaskForm.tsx`**
- Modal para crear tarea manual
- Selector de tipo, prioridad, impacto
- Relación con entidades (producto, venta, creativo)
- Campo de motivo obligatorio

**`src/components/tasks/TaskFilters.tsx`**
- Filtros por tipo, prioridad, estado, origen
- Búsqueda por texto
- Ordenamiento

---

## Fase 5: Integración con Command Center

### 5.1 Actualizar `CommandCenter.tsx`

Cambiar de `useSmartTasks` (efímero) a `useTasks` (persistido):

```typescript
// ANTES
const smartTasks = useSmartTasks({ sales, products, creatives });

// DESPUÉS
const { todayTasks, loading: tasksLoading } = useTasks();
```

### 5.2 Mantener Compatibilidad

- `PriorityTaskCard` debe aceptar `OperationalTask`
- `DailyInsight` debe consumir las tareas persistidas
- Link a `/tasks` para ver todas

---

## Fase 6: Reglas Automáticas Iniciales

Implementar estas reglas desde el inicio:

| Regla | Condición | Tarea Generada | Prioridad |
|-------|-----------|----------------|-----------|
| Cobro urgente | Venta pendiente > 10 días | "Cobrar a {cliente}" | Alta |
| Cobro normal | Venta pendiente 5-10 días | "Cobrar a {cliente}" | Media |
| Entrega sin cobro | Entregado + no pagado | "Confirmar cobro" | Alta |
| Sin creativos | Producto activo sin creativos | "Crear creativo" | Media |
| Destacado sin contenido | Featured + sin creativos | "Priorizar contenido" | Alta |
| Sin ventas | Producto activo sin ventas 30d | "Revisar precio" | Baja |
| Producto nuevo | Creado < 7 días | "Comunicar a vendedores" | Media |

---

## Fase 7: Sincronización y Deduplicación

### 7.1 Lógica de Deduplicación

Cada tarea automática tiene un `dedupKey` único:

```typescript
// Ejemplos de dedupKey:
"cobro:sale:abc123"           // Tarea de cobro para venta abc123
"creativo:product:xyz789"     // Tarea de creativo para producto xyz789
"sin_ventas:product:def456"   // Tarea de revisar producto sin ventas
```

### 7.2 Resolución Automática

Cuando la condición deja de aplicar:
- Venta marcada como pagada → Cerrar tarea de cobro
- Creativo creado para producto → Cerrar tarea de "crear creativo"
- Producto desactivado → Cerrar todas las tareas relacionadas

```typescript
// En syncAutomaticTasks:
for (const existingTask of automaticTasks) {
  const stillApplies = checkConditionStillApplies(existingTask);
  if (!stillApplies) {
    await updateTaskStatus(existingTask.id, 'resuelta_automaticamente');
  }
}
```

---

## Fase 8: Navegación y Rutas

### 8.1 Actualizar `App.tsx`

```typescript
<Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
```

### 8.2 Actualizar `CommandCenterNav`

Agregar link a Tareas en la navegación:
- Mostrar badge con número de tareas pendientes
- Resaltar si hay tareas de alta prioridad

---

## Archivos a Crear/Modificar

| Acción | Archivo |
|--------|---------|
| MIGRAR | Base de datos (nuevos enums, columnas, índices) |
| MODIFICAR | `src/types/index.ts` (nuevas interfaces) |
| CREAR | `src/lib/taskRules.ts` (motor de reglas) |
| CREAR | `src/hooks/useTasks.ts` (hook principal) |
| CREAR | `src/pages/Tasks.tsx` (página de tareas) |
| CREAR | `src/components/tasks/TaskCard.tsx` |
| CREAR | `src/components/tasks/TaskForm.tsx` |
| CREAR | `src/components/tasks/TaskFilters.tsx` |
| MODIFICAR | `src/pages/CommandCenter.tsx` (usar nuevo hook) |
| MODIFICAR | `src/components/command-center/PriorityTaskCard.tsx` |
| MODIFICAR | `src/App.tsx` (agregar ruta /tasks) |
| MODIFICAR | `src/components/command-center/CommandCenterNav.tsx` |
| ELIMINAR | `src/hooks/useSmartTasks.ts` (reemplazado) |

---

## Orden de Implementación

1. **Migración de BD** - Nuevos enums y columnas
2. **Tipos TypeScript** - Interfaces actualizadas
3. **Motor de reglas** - `taskRules.ts`
4. **Hook useTasks** - CRUD + sincronización
5. **Página Tasks** - UI completa
6. **Componentes** - TaskCard, TaskForm, TaskFilters
7. **Integración Command Center** - Consumir nuevo sistema
8. **Navegación** - Ruta y nav link
9. **Cleanup** - Eliminar código legacy

---

## Resultado Esperado

Al finalizar, el usuario:

1. **Abre la app** y ve exactamente qué hacer hoy
2. **Entiende el por qué** de cada tarea (no es una lista arbitraria)
3. **Sabe el impacto** económico de cada acción
4. **Puede actuar** directamente desde la tarea
5. **No olvida nada** - el sistema genera tareas automáticamente
6. **Tiene historial** de qué hizo y cuándo

Este módulo convierte a GRC AI OS en un copiloto operativo indispensable.

