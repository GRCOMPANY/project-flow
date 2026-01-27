

# Plan: Cierre de Ciclo de Tareas con Task Outcomes

## Resumen

Este plan implementa un sistema de registro de resultados al completar tareas, permitiendo al sistema aprender y priorizar mejor en el futuro. Se crea una nueva entidad `task_outcomes` relacionada 1:1 con `tasks`.

---

## Fase 1: Migración de Base de Datos

### 1.1 Crear tabla `task_outcomes`

```sql
-- Enum para resultados
CREATE TYPE task_outcome_result AS ENUM (
  'exitoso',
  'fallido', 
  'reprogramado',
  'cancelado'
);

-- Tabla de resultados
CREATE TABLE task_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Resultado operativo
  result task_outcome_result NOT NULL,
  
  -- Impacto económico
  generated_income BOOLEAN NOT NULL DEFAULT false,
  income_amount NUMERIC DEFAULT 0,
  
  -- Nota
  notes TEXT,
  
  -- Metadata
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_task_outcomes_task_id ON task_outcomes(task_id);
CREATE INDEX idx_task_outcomes_result ON task_outcomes(result);
CREATE INDEX idx_task_outcomes_completed_at ON task_outcomes(completed_at);
CREATE INDEX idx_task_outcomes_generated_income ON task_outcomes(generated_income);

-- RLS
ALTER TABLE task_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view outcomes"
  ON task_outcomes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert outcomes"
  ON task_outcomes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update outcomes"
  ON task_outcomes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
```

---

## Fase 2: Tipos TypeScript

### 2.1 Nuevos tipos en `src/types/index.ts`

```typescript
// Resultado del cierre de tarea
export type TaskOutcomeResult = 'exitoso' | 'fallido' | 'reprogramado' | 'cancelado';

// Registro de resultado de tarea
export interface TaskOutcome {
  id: string;
  taskId: string;
  result: TaskOutcomeResult;
  generatedIncome: boolean;
  incomeAmount: number;
  notes?: string;
  completedBy?: string;
  completedAt: string;
  createdAt: string;
}

// Input para crear outcome
export interface CreateTaskOutcomeInput {
  taskId: string;
  result: TaskOutcomeResult;
  generatedIncome: boolean;
  incomeAmount?: number;
  notes?: string;
}

// Extensión de OperationalTask para incluir outcome
export interface OperationalTask {
  // ... campos existentes ...
  outcome?: TaskOutcome; // Nuevo campo
}
```

---

## Fase 3: Hook de Task Outcomes

### 3.1 Crear `src/hooks/useTaskOutcomes.ts`

```typescript
export function useTaskOutcomes() {
  // createOutcome: crea el resultado Y marca la tarea como completada
  // getOutcomeByTaskId: obtiene el outcome de una tarea
  // getTodayStats: estadísticas de hoy (completadas, con ingreso, total)
  
  return {
    createOutcome,
    getOutcomeByTaskId,
    todayStats: {
      completedToday: number,
      withIncome: number,
      totalRecovered: number,
    },
    loading,
  };
}
```

---

## Fase 4: Modal de Cierre de Tarea

### 4.1 Crear `src/components/tasks/TaskCloseModal.tsx`

Estructura del modal:

```
┌─────────────────────────────────────────┐
│  ✓ Cerrar Tarea                         │
│  {nombre de la tarea}                   │
├─────────────────────────────────────────┤
│                                         │
│  ¿Cuál fue el resultado?                │
│  ┌─────────────────────────────────┐    │
│  │ ✓ Exitoso                       │    │
│  │ ✗ Fallido                       │    │
│  │ 🔄 Reprogramado                 │    │
│  │ ⊘ Cancelado                     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ¿Generó ingreso?                       │
│  ○ Sí   ○ No                            │
│                                         │
│  (Si aplica)                            │
│  Monto generado                         │
│  ┌─────────────────────────────────┐    │
│  │ $                               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Nota (opcional - máx 200 caracteres)   │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│           [Cancelar]  [Guardar]         │
└─────────────────────────────────────────┘
```

**Características:**
- Selección de resultado con radio buttons estilizados
- Toggle para indicar si generó ingreso
- Campo numérico para monto (solo si generó ingreso)
- Textarea con contador de caracteres (máx 200)
- Validación obligatoria del resultado
- UX rápida y sin fricción

---

## Fase 5: Actualizar TaskCard

### 5.1 Modificar `src/components/tasks/TaskCard.tsx`

**Cambios:**
1. Mostrar badge visual si la tarea tiene outcome
2. Mostrar indicador de ingreso generado (💰)
3. Para tareas completadas: mostrar resumen del resultado

```typescript
// Si la tarea tiene outcome, mostrar badge
{task.outcome && (
  <div className="flex items-center gap-2">
    <Badge variant={outcomeVariant[task.outcome.result]}>
      {outcomeLabels[task.outcome.result]}
    </Badge>
    {task.outcome.generatedIncome && (
      <Badge variant="success">
        💰 ${task.outcome.incomeAmount.toLocaleString()}
      </Badge>
    )}
  </div>
)}
```

**Variantes visuales:**
- Exitoso: Verde/Success
- Fallido: Rojo/Destructive  
- Reprogramado: Amarillo/Warning
- Cancelado: Gris/Muted

---

## Fase 6: Actualizar useTasks

### 6.1 Modificar `src/hooks/useTasks.ts`

**Cambios:**

1. Cargar outcomes junto con las tareas:
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    related_product:products(...),
    related_sale:sales(...),
    outcome:task_outcomes(*)  // NUEVO
  `)
```

2. Nueva función `completeWithOutcome`:
```typescript
const completeWithOutcome = async (input: CreateTaskOutcomeInput) => {
  // 1. Crear el outcome
  await supabase.from('task_outcomes').insert({
    task_id: input.taskId,
    result: input.result,
    generated_income: input.generatedIncome,
    income_amount: input.incomeAmount || 0,
    notes: input.notes,
  });
  
  // 2. Marcar tarea como completada
  await supabase.from('tasks').update({
    status: 'terminada',
    resolved_at: new Date().toISOString(),
  }).eq('id', input.taskId);
  
  // 3. Refrescar
  await fetchTasks();
};
```

3. Nuevas estadísticas:
```typescript
const outcomeStats = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completedToday = tasks.filter(t => 
    t.outcome && new Date(t.outcome.completedAt) >= today
  );
  
  const withIncome = completedToday.filter(t => 
    t.outcome?.generatedIncome
  );
  
  const totalRecovered = withIncome.reduce((sum, t) => 
    sum + (t.outcome?.incomeAmount || 0), 0
  );
  
  return { completedToday: completedToday.length, withIncome: withIncome.length, totalRecovered };
}, [tasks]);
```

---

## Fase 7: Actualizar Command Center

### 7.1 Modificar `src/pages/CommandCenter.tsx`

**Agregar sección de resultados del día:**

```
┌─────────────────────────────────────────────────┐
│  ▌ RESULTADOS DE HOY                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │   ✓ 5    │ │  💰 3    │ │   $2,450         │ │
│  │ Cerradas │ │Con ingreso│ │ Recuperado hoy  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Ubicación:** Después de "Estado del Negocio", solo si hay tareas cerradas hoy.

---

## Fase 8: Integrar Modal en Flujo

### 8.1 Actualizar TaskCard y Tasks.tsx

**Flujo del botón "Completar":**

1. Usuario hace clic en "Completar"
2. Se abre `TaskCloseModal` con la tarea seleccionada
3. Usuario llena el formulario obligatorio
4. Al guardar:
   - Se crea el outcome
   - Se marca la tarea como completada
   - Se cierra el modal
   - Se actualiza la UI

```typescript
// En Tasks.tsx
const [closeModalTask, setCloseModalTask] = useState<OperationalTask | null>(null);

const handleResolve = (id: string) => {
  const task = tasks.find(t => t.id === id);
  if (task) {
    setCloseModalTask(task); // Abre el modal
  }
};

// Modal
<TaskCloseModal
  task={closeModalTask}
  open={!!closeModalTask}
  onOpenChange={(open) => !open && setCloseModalTask(null)}
  onSubmit={completeWithOutcome}
/>
```

---

## Resumen de Archivos

| Acción | Archivo |
|--------|---------|
| MIGRAR | Nueva tabla `task_outcomes` |
| MODIFICAR | `src/types/index.ts` - Nuevos tipos |
| CREAR | `src/components/tasks/TaskCloseModal.tsx` |
| MODIFICAR | `src/components/tasks/TaskCard.tsx` - Badge de outcome |
| MODIFICAR | `src/hooks/useTasks.ts` - Cargar outcomes + nueva función |
| MODIFICAR | `src/pages/Tasks.tsx` - Integrar modal |
| MODIFICAR | `src/pages/CommandCenter.tsx` - Stats del día |

---

## Orden de Implementación

1. **Migración BD** - Crear tabla `task_outcomes`
2. **Tipos TypeScript** - Nuevas interfaces
3. **TaskCloseModal** - Componente del modal
4. **useTasks** - Cargar outcomes + completeWithOutcome
5. **TaskCard** - Mostrar badges de resultado
6. **Tasks.tsx** - Integrar modal en flujo
7. **CommandCenter** - Mostrar estadísticas del día

---

## Resultado Esperado

Al finalizar:

1. **Cada tarea completada** tiene un registro de su resultado
2. **Datos económicos** quedan registrados para análisis futuro
3. **Visualización clara** del estado final de cada tarea
4. **Command Center** muestra resumen diario de productividad
5. **Base lista** para futuras decisiones automáticas e IA

---

## Notas Técnicas

- La relación `task_outcomes` es 1:1 con `tasks` (constraint UNIQUE en `task_id`)
- El outcome se crea ANTES de marcar la tarea completada (transacción lógica)
- Los outcomes no se eliminan aunque se elimine la tarea (ON DELETE CASCADE opcional)
- El campo `notes` tiene límite de 200 caracteres validado en frontend
- Compatible 100% con el motor de reglas existente

