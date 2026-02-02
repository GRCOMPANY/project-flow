
# Plan: Creative Intelligence System - Rediseno Completo y Conectado

## Analisis del Estado Actual

### Lo que YA existe (bien implementado)

| Componente | Estado | Evaluacion |
|------------|--------|------------|
| Tabla `creatives` con campos extendidos | Completo | Todos los campos de los 6 bloques existen en DB |
| Types TypeScript | Completo | `Creative`, `CreativeIntelligence`, hooks, audiences definidos |
| `useCreativeIntelligence` hook | Funcional | Calcula performance, compara creativos, detecta patrones |
| `useCreatives` hook | Funcional | CRUD completo con mapeo de todos los campos |
| CreativeForm multi-bloque | Funcional | 4 tabs (Contexto, Mensaje, Metricas, Aprendizaje) |
| CreativeCard, Filters, Insights | Funcionales | UI basica implementada |
| `taskRules.ts` | Parcial | Solo genera tareas para productos sin creativos, no para creativos frios/calientes |
| Sales `relatedCreativeId` | Existe | Campo disponible pero no hay UI para usarlo |

### Lo que FALTA (segun requerimientos)

| Requerimiento | Estado | Prioridad |
|--------------|--------|-----------|
| Vista por Producto como principal | No implementada como principal | Alta |
| Crear creativo desde producto con datos auto-completados | No existe | Alta |
| Conexion Ventas-Creativos (atribucion) | Campo existe, sin UI | Alta |
| Tareas automaticas basadas en performance | Solo basicas | Alta |
| Integracion con Command Center | Parcial (no muestra creativos) | Media |
| Automation status tracking | Solo intent, falta status | Media |
| Carrusel/Historia como tipos | No existe en tipos | Baja |

---

## Cambios Propuestos

### FASE 1: Modelo de Datos (DB + Types)

#### 1.1 Migracion SQL - Agregar campo `automation_status`

Agregar campo faltante para tracking de automatizacion:

```sql
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS automation_status text DEFAULT NULL;
-- Valores: 'pending', 'processing', 'completed', 'failed'
```

#### 1.2 Actualizar Types

En `src/types/index.ts`:

- Agregar `AutomationStatus` type
- Agregar tipos de creativo adicionales: `historia`, `carrusel`, `anuncio`
- Agregar campo `automationStatus` a interface `Creative`

```typescript
export type CreativeType = 'imagen' | 'video' | 'copy' | 'historia' | 'carrusel' | 'anuncio';
export type AutomationStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

---

### FASE 2: Conexion Producto-Creativo

#### 2.1 Pestaña Creativos en ProductDetail

Modificar `src/pages/ProductDetail.tsx`:

1. Agregar Tab "Creativos" con contenido expandido
2. Mostrar todos los creativos del producto con metricas
3. Boton "Crear creativo desde este producto" que:
   - Pre-llena productId
   - Auto-completa titulo con nombre producto
   - Auto-completa descripcion
   - Muestra imagen del producto en preview
   - Pre-selecciona canal principal del producto

Layout propuesto para la seccion:
```text
┌─────────────────────────────────────────────────────────────────┐
│  📦 [Imagen] NOMBRE PRODUCTO                                    │
│                                                                  │
│  [Detalles] [Performance] [Creativos ★] [Ventas]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CREATIVOS DE ESTE PRODUCTO                                      │
│                                                                  │
│  📊 Estadisticas Rapidas                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ 5      │ │ 2 🔥   │ │ Hook:  │ │ Canal: │                  │
│  │ total  │ │ calient│ │ Benef. │ │ IG     │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
│                                                                  │
│  [+ Crear creativo para este producto]                          │
│                                                                  │
│  TIMELINE                                                        │
│  ────────────────────────────────────────                       │
│  [Card 5] 🔥 ↑ Mejor                                            │
│      ↓                                                          │
│  [Card 4] 🟡 → Igual                                            │
│      ↓                                                          │
│  [Card 3] ❄️ ↓ Peor                                              │
│                                                                  │
│  APRENDIZAJES ACUMULADOS                                         │
│  • "Video corto > imagen para este producto"                    │
│  • "Hook beneficio genera 2x mensajes"                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Nuevo Componente: ProductCreativesTab

Crear `src/components/products/ProductCreativesTab.tsx`:

- Recibe `productId` como prop
- Usa `useCreatives` filtrado por producto
- Usa `useCreativeIntelligence` para enriquecer datos
- Muestra timeline de creativos ordenados por fecha
- Calcula estadisticas del producto (hook top, canal top)
- Boton para crear creativo con producto pre-seleccionado

#### 2.3 Modificar CreativeForm para pre-llenado

En `src/components/creatives/CreativeForm.tsx`:

- Agregar prop `prefilledProduct?: Product`
- Si viene producto, auto-llenar:
  - `productId`
  - `title` = `Creativo - ${product.name}`
  - Mostrar preview de imagen del producto
  - Pre-seleccionar canal basado en `product.mainChannel`

---

### FASE 3: Conexion Ventas-Creativos

#### 3.1 Modificar Formulario de Venta

En el formulario de registro de venta (`src/pages/Sales.tsx` o componente de form):

- Agregar campo opcional: "Creativo origen"
- Dropdown con creativos recientes del producto seleccionado
- Filtrar creativos por `productId` cuando se selecciona producto

#### 3.2 Recalcular `metricSales` automaticamente

Modificar `src/hooks/useSales.ts`:

En `addSale`:
- Si se especifica `relatedCreativeId`, incrementar `metric_sales` del creativo
- Llamar `updateCreative(relatedCreativeId, { metricSales: current + quantity })`

En `updateSale`:
- Si cambia `relatedCreativeId`, ajustar contadores

#### 3.3 Vista de Atribucion en Creativo

Modificar `src/pages/Creatives.tsx` (Sheet de detalle):

- Agregar seccion "Ventas atribuidas"
- Mostrar lista de ventas con `relatedCreativeId` = este creativo
- Mostrar total atribuido

---

### FASE 4: Tareas Automaticas por Performance

#### 4.1 Nuevas Reglas en taskRules.ts

Agregar funcion `generateCreativePerformanceTasks`:

```typescript
export function generateCreativePerformanceTasks(
  creatives: Creative[],
  products: Product[]
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];

  for (const creative of creatives) {
    const performance = calculatePerformance(creative);
    const product = products.find(p => p.id === creative.productId);
    const productName = product?.name || 'producto';

    // Regla 1: Creativo FRIO con mas de 7 dias
    if (performance === 'frio' && daysSince(creative.createdAt) > 7) {
      tasks.push({
        name: `Cambiar creativo: ${productName}`,
        description: `Creativo frio sin resultados`,
        type: 'creativo',
        priority: 'media',
        impact: 'crecimiento',
        triggerReason: `Creativo publicado hace ${daysSince(creative.createdAt)} dias sin generar mensajes ni ventas`,
        consequence: 'Contenido que no funciona sigue ocupando atencion sin retorno.',
        actionLabel: 'Crear nuevo',
        actionPath: `/creatives?productId=${creative.productId}`,
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId,
        dedupKey: `creativo_frio:${creative.id}`,
      });
    }

    // Regla 2: Creativo INTERESANTE - optimizar
    if (performance === 'interesante' && creative.metricMessages >= 10 && creative.metricSales < 2) {
      tasks.push({
        name: `Optimizar oferta: ${productName}`,
        description: `${creative.metricMessages} mensajes pero ${creative.metricSales} ventas`,
        type: 'creativo',
        priority: 'media',
        impact: 'dinero',
        triggerReason: `Creativo genera interes (${creative.metricMessages} msgs) pero baja conversion (${creative.metricSales} ventas)`,
        consequence: 'Pierdes ventas. El mensaje atrae pero algo falla en cierre.',
        actionLabel: 'Revisar oferta',
        actionPath: `/products/${creative.productId}`,
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId,
        dedupKey: `creativo_baja_conversion:${creative.id}`,
      });
    }

    // Regla 3: Creativo CALIENTE - escalar
    if (performance === 'caliente' && !creative.automationIntent) {
      tasks.push({
        name: `Escalar creativo: ${productName}`,
        description: `🔥 Funcionando - listo para escalar`,
        type: 'creativo',
        priority: 'alta',
        impact: 'crecimiento',
        triggerReason: `Creativo caliente con ${creative.metricSales} ventas y ${creative.metricMessages} mensajes`,
        consequence: 'Desaprovechas un creativo que funciona. Podrias multiplicar resultados.',
        actionLabel: 'Escalar',
        actionPath: '/creatives',
        relatedCreativeId: creative.id,
        relatedProductId: creative.productId,
        dedupKey: `creativo_escalar:${creative.id}`,
      });
    }

    // Regla 4: Producto sin creativos activos
    // (ya existe pero mejorar contexto)
  }

  return tasks;
}
```

#### 4.2 Integrar en useTasks

Modificar `src/hooks/useTasks.ts`:

- Importar `generateCreativePerformanceTasks`
- Agregar al pipeline de generacion de tareas automaticas
- Pasar `creatives` y `products` como parametros

---

### FASE 5: Integracion Command Center

#### 5.1 Agregar Bloque de Creativos al Radar

Modificar `src/components/command-center/AIRadarPanel.tsx`:

En `generateRadarAlerts`, agregar alertas de creativos:

```typescript
// Agregar parametro creativesMetrics
interface CreativesMetrics {
  hotCreatives: number;
  coldCreatives: number;
  creativesWithoutSales: number;
  potentialFromScaling: number; // estimado si escalas calientes
}

// Nuevas alertas
if (creativesMetrics.hotCreatives > 0) {
  alerts.push({
    type: 'opportunity',
    title: `${creativesMetrics.hotCreatives} creativos listos para escalar`,
    description: `Contenido que funciona sin maximizar`,
    estimatedImpact: creativesMetrics.potentialFromScaling,
    causality: `Porque tienen ventas y mensajes altos sin accion de escalado`,
    actionPath: '/creatives?performance=caliente',
    urgencyLevel: 'today',
  });
}

if (creativesMetrics.coldCreatives >= 3) {
  alerts.push({
    type: 'warning',
    title: `${creativesMetrics.coldCreatives} creativos sin resultados`,
    description: `Contenido que no genera retorno`,
    actionPath: '/creatives?performance=frio',
    urgencyLevel: 'this_week',
  });
}
```

#### 5.2 Modificar CommandCenter para pasar datos

En `src/pages/CommandCenter.tsx`:

- Calcular metricas de creativos desde `useCreatives` + `useCreativeIntelligence`
- Pasar a `generateRadarAlerts` como nuevo parametro

---

### FASE 6: Vista Por Producto como Principal

#### 6.1 Reestructurar Creatives.tsx

Modificar `src/pages/Creatives.tsx`:

1. Cambiar default de `viewMode` a `'product'` (vista por producto primero)
2. Mejorar ProductView component:
   - Expandir header de producto con mas metricas
   - Agregar boton "Crear creativo" en cada producto
   - Mostrar aprendizajes acumulados
   - Timeline visual de creativos

Layout mejorado para Vista por Producto:
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CREATIVE INTELLIGENCE                                                       │
│  El cerebro de tu contenido de venta                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Por Producto ★] [Vista Global]                    [+ Nuevo Experimento]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📊 INSIGHTS RAPIDOS                                                         │
│  [Panel de insights existente]                                               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRODUCTOS CON CREATIVOS                                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📦 [IMG] iPhone Case Premium                                            ││
│  │ ────────────────────────────────────────────────────────────────────── ││
│  │ 5 creativos │ 2 🔥 calientes │ Hook top: Beneficio │ Canal top: IG     ││
│  │                                                                         ││
│  │ [+ Crear para este producto]                                            ││
│  │                                                                         ││
│  │ APRENDIZAJES:                                                           ││
│  │ "Video corto genera 2x mas mensajes"                                    ││
│  │                                                                         ││
│  │ CREATIVOS:                                                              ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       ││
│  │ │ [Card 1]    │ │ [Card 2]    │ │ [Card 3]    │                       ││
│  │ │ 🔥 Caliente │ │ 🟡 Interes. │ │ ❄️ Frio     │                       ││
│  │ │ ↑ Mejor     │ │ → Igual     │ │             │                       ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 📦 [IMG] Otro Producto                                                  ││
│  │ ...                                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### FASE 7: Automatizacion Ready (n8n)

#### 7.1 Crear tabla de intents (opcional pero recomendado)

Migracion SQL para tracking estructurado:

```sql
CREATE TABLE IF NOT EXISTS creative_automation_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid REFERENCES creatives(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  intent_type text NOT NULL, -- 'generate_new', 'repeat', 'new_audience', 'send_sellers', 'landing'
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  metadata jsonb DEFAULT '{}',
  triggered_by uuid,
  triggered_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  result_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE creative_automation_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage intents" ON creative_automation_intents
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view intents" ON creative_automation_intents
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

#### 7.2 Hook para Intents

Crear `src/hooks/useAutomationIntents.ts`:

- `registerIntent(creativeId, intentType, metadata)`
- `getIntentsByStatus(status)`
- `updateIntentStatus(id, status, notes)`

#### 7.3 Actualizar CreativeActions

Modificar `src/components/creatives/CreativeActions.tsx`:

- Usar `useAutomationIntents` en lugar de solo actualizar campo
- Guardar metadata completa (producto, canal, metricas actuales)
- Mostrar intents pendientes del creativo

---

## Archivos a Modificar/Crear

### Crear (Nuevos)

| Archivo | Descripcion |
|---------|-------------|
| `src/components/products/ProductCreativesTab.tsx` | Tab de creativos en detalle producto |
| `src/hooks/useAutomationIntents.ts` | Hook para tracking de intents n8n |
| Migracion `automation_status` | Campo adicional para creativos |
| Migracion `creative_automation_intents` | Tabla de intents (opcional) |

### Modificar (Existentes)

| Archivo | Cambios |
|---------|---------|
| `src/types/index.ts` | Agregar `AutomationStatus`, tipos de creativo adicionales |
| `src/pages/ProductDetail.tsx` | Agregar Tab Creativos con ProductCreativesTab |
| `src/pages/Creatives.tsx` | Vista por producto como default, mejorar ProductView |
| `src/components/creatives/CreativeForm.tsx` | Soporte para producto pre-llenado |
| `src/pages/Sales.tsx` | Campo para atribuir venta a creativo |
| `src/hooks/useSales.ts` | Auto-incrementar metricSales al atribuir |
| `src/hooks/useCreatives.ts` | Mapear `automation_status` |
| `src/lib/taskRules.ts` | Agregar `generateCreativePerformanceTasks` |
| `src/hooks/useTasks.ts` | Integrar nuevas reglas de creativos |
| `src/components/command-center/AIRadarPanel.tsx` | Agregar alertas de creativos |
| `src/pages/CommandCenter.tsx` | Calcular y pasar metricas de creativos |
| `src/components/creatives/CreativeActions.tsx` | Usar intents estructurados |

---

## Orden de Implementacion

```text
FASE 1: Modelo de Datos (30 min)
├── 1.1 Migracion SQL (automation_status)
├── 1.2 Actualizar types
└── 1.3 Actualizar useCreatives

FASE 2: Conexion Producto-Creativo (45 min)
├── 2.1 ProductCreativesTab component
├── 2.2 Modificar ProductDetail con tabs
└── 2.3 CreativeForm con pre-llenado

FASE 3: Conexion Ventas-Creativos (30 min)
├── 3.1 Campo en form de venta
├── 3.2 Auto-incremento de metricSales
└── 3.3 Vista de atribucion

FASE 4: Tareas Automaticas (30 min)
├── 4.1 generateCreativePerformanceTasks
├── 4.2 Integrar en useTasks
└── 4.3 Probar generacion

FASE 5: Command Center (20 min)
├── 5.1 Alertas de creativos en Radar
└── 5.2 Calculos en CommandCenter

FASE 6: Vista Por Producto (30 min)
├── 6.1 Default a vista producto
├── 6.2 Mejorar ProductView
└── 6.3 Aprendizajes acumulados

FASE 7: Automation Ready (30 min)
├── 7.1 Tabla intents (opcional)
├── 7.2 useAutomationIntents hook
└── 7.3 Actualizar CreativeActions
```

---

## Criterios de Exito

El modulo estara completo cuando:

1. Desde ProductDetail puedo ver todos los creativos del producto con metricas y aprendizajes
2. Puedo crear un creativo pre-llenado desde cualquier producto
3. Al registrar una venta, puedo atribuirla a un creativo
4. Las ventas atribuidas incrementan automaticamente `metricSales` del creativo
5. Creativos frios generan tarea "Cambiar creativo"
6. Creativos con mensajes pero sin ventas generan tarea "Optimizar oferta"
7. Creativos calientes generan tarea "Escalar"
8. El Command Center muestra alertas de creativos calientes para escalar
9. Los intents de automatizacion quedan registrados con metadata para n8n
10. La vista por producto es la principal y muestra timeline + aprendizajes

---

## Lo Que NO Cambia

- Logica de calculo de performance (ya funciona bien)
- Sistema de comparacion entre creativos (ya implementado)
- Estructura de 6 bloques en el formulario (ya correcto)
- Flujos de navegacion principales
- RLS policies existentes

