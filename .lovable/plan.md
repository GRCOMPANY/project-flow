

# Plan: Creative Intelligence System - Modulo de Aprendizaje de Contenido

## Vision del Modulo

Transformar el modulo de Creativos de un simple CRUD de contenido a un **Sistema de Inteligencia Creativa** que permita:
- Registrar creativos como **experimentos de venta** con hipotesis claras
- Medir desempeno de forma estructurada (manual ahora, automatizado despues)
- Comparar creativos entre si para aprender que funciona
- Extraer aprendizajes reutilizables para mejorar futuras campanas
- Servir como base para automatizaciones con n8n

---

## Analisis del Estado Actual

### Lo que existe hoy

| Aspecto | Estado Actual | Limitacion |
|---------|--------------|------------|
| Campos basicos | type, channel, objective, status, result | Faltan metricas de performance |
| Publico objetivo | No existe | No se puede segmentar aprendizajes |
| Hook / Mensaje | Solo copy generico | No hay tipologia de ganchos |
| Metricas | Solo "funciono/no funciono" | Sin datos cuantitativos |
| Comparacion | No existe | No hay aprendizaje automatico |
| Aprendizaje | Campo learning simple | Sin estructura |
| Vista | Grid generico | Sin vista por producto |

### Base de datos actual

```text
creatives table:
- id, product_id, type, channel, objective
- status, result, title, copy
- image_url, video_url, script
- learning, ai_prompt
- published_at, created_at, updated_at
```

---

## Nueva Arquitectura del Modulo

### Estructura de Bloques (6 Bloques segun requerimiento)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOQUE A: CONTEXTO DEL CREATIVO                                            │
│  Producto | Canal | Tipo | Objetivo | Publico Objetivo                      │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOQUE B: MENSAJE / HOOK                                                    │
│  Tipo de Hook | Texto del Hook | Variacion A/B | Enfoque del Mensaje        │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOQUE C: METRICAS DE PERFORMANCE                                           │
│  Organico: Likes, Comentarios, Mensajes, Ventas                             │
│  Meta Ads: Impresiones, Clicks, Mensajes, Ventas, Costo                     │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOQUE D: RESULTADO AUTOMATICO (Calculado)                                  │
│  No funciono | Interesante | Funciono (basado en reglas)                    │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOQUE E: COMPARACION INTELIGENTE                                           │
│  vs Creativo Anterior: Mejor / Peor / Igual | Que cambio | Impacto          │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│  BLOQUE F: APRENDIZAJE (Memoria del Negocio)                                 │
│  Texto libre obligatorio sobre que funciono y por que                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cambios en Base de Datos (Migracion SQL)

### Nuevos campos para creatives

```sql
-- BLOQUE A: Contexto extendido
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS target_audience text;
-- Valores: 'precio_bajo', 'precio_medio', 'regalo', 'uso_personal', 'reventa', 'otro'

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS audience_notes text;
-- Notas libres sobre el publico

-- BLOQUE B: Mensaje / Hook
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS hook_type text;
-- Valores: 'precio', 'problema', 'beneficio', 'urgencia', 'prueba_social', 'comparacion'

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS hook_text text;
-- El texto principal del gancho

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS variation text DEFAULT 'A';
-- Variacion A/B/C

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS message_approach text;
-- Valores: 'emocional', 'racional', 'promocional', 'educativo'

-- BLOQUE C: Metricas de Performance
-- Organico / Marketplace
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_likes integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_comments integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_messages integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_known_people text;
-- Valores: 'si', 'no', 'mixto'

-- Calculado desde sales pero tambien manual
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_sales integer DEFAULT 0;

-- Meta Ads
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_impressions integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_clicks integer DEFAULT 0;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS metric_cost numeric DEFAULT 0;

-- Engagement percibido
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS engagement_level text;
-- Valores: 'bajo', 'medio', 'alto'

-- BLOQUE D: Resultado calculado (actualizar enum)
-- Ya existe creative_result, pero agregar 'interesante'
-- Valores actuales: sin_evaluar, funciono, no_funciono
-- Nuevos valores: frio, interesante, caliente (mas semanticos)

-- BLOQUE E: Comparacion
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS vs_previous text;
-- Valores: 'mejor', 'peor', 'igual', null (si es el primero)

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS vs_previous_id uuid REFERENCES creatives(id);
-- Referencia al creativo anterior para comparacion

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS what_changed text;
-- Descripcion de que cambio respecto al anterior

-- Metadata para automatizacion
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS automation_intent text;
-- Acciones preparadas: 'generate_new', 'repeat', 'new_audience', 'send_sellers', 'landing'
```

### Nuevos enums

```sql
-- Actualizar creative_result para incluir 'interesante'
ALTER TYPE creative_result ADD VALUE IF NOT EXISTS 'interesante';

-- Nuevos tipos
CREATE TYPE hook_type AS ENUM (
  'precio', 
  'problema', 
  'beneficio', 
  'urgencia', 
  'prueba_social', 
  'comparacion'
);

CREATE TYPE target_audience_type AS ENUM (
  'precio_bajo',
  'precio_medio', 
  'regalo',
  'uso_personal',
  'reventa',
  'otro'
);

CREATE TYPE message_approach_type AS ENUM (
  'emocional',
  'racional',
  'promocional',
  'educativo'
);

CREATE TYPE engagement_level_type AS ENUM (
  'bajo',
  'medio',
  'alto'
);

CREATE TYPE comparison_result AS ENUM (
  'mejor',
  'peor',
  'igual'
);
```

---

## Nuevos Tipos TypeScript

### Archivo: src/types/index.ts

```typescript
// Bloque A: Contexto
export type TargetAudience = 
  | 'precio_bajo' 
  | 'precio_medio' 
  | 'regalo' 
  | 'uso_personal' 
  | 'reventa' 
  | 'otro';

// Bloque B: Hook
export type HookType = 
  | 'precio' 
  | 'problema' 
  | 'beneficio' 
  | 'urgencia' 
  | 'prueba_social' 
  | 'comparacion';

export type MessageApproach = 
  | 'emocional' 
  | 'racional' 
  | 'promocional' 
  | 'educativo';

// Bloque C: Metricas
export type KnownPeople = 'si' | 'no' | 'mixto';
export type EngagementLevel = 'bajo' | 'medio' | 'alto';

// Bloque D: Resultado
export type CreativePerformance = 'frio' | 'interesante' | 'caliente';

// Bloque E: Comparacion
export type ComparisonResult = 'mejor' | 'peor' | 'igual';

// Acciones de automatizacion
export type AutomationIntent = 
  | 'generate_new' 
  | 'repeat' 
  | 'new_audience' 
  | 'send_sellers' 
  | 'landing';

// Creative Intelligence extendido
export interface CreativeIntelligence extends Creative {
  // Bloque A
  targetAudience?: TargetAudience;
  audienceNotes?: string;
  
  // Bloque B
  hookType?: HookType;
  hookText?: string;
  variation?: string;
  messageApproach?: MessageApproach;
  
  // Bloque C - Metricas
  metricLikes: number;
  metricComments: number;
  metricMessages: number;
  metricKnownPeople?: KnownPeople;
  metricSales: number;
  metricImpressions: number;
  metricClicks: number;
  metricCost: number;
  engagementLevel?: EngagementLevel;
  
  // Bloque D - Resultado calculado
  calculatedPerformance: CreativePerformance;
  
  // Bloque E - Comparacion
  vsPrevious?: ComparisonResult;
  vsPreviousId?: string;
  whatChanged?: string;
  previousCreative?: Creative;
  
  // Automatizacion
  automationIntent?: AutomationIntent;
}
```

---

## Nuevos Componentes

### Estructura de archivos

```text
src/components/creatives/
├── CreativeCard.tsx           # Card inteligente con metricas
├── CreativeForm.tsx           # Formulario multi-bloque
├── CreativeDetail.tsx         # Vista detallada con comparacion
├── CreativeFilters.tsx        # Filtros avanzados
├── CreativeMetrics.tsx        # Bloque de metricas
├── CreativeComparison.tsx     # Comparacion vs anterior
├── CreativeLearning.tsx       # Bloque de aprendizaje
├── CreativeActions.tsx        # Botones de automatizacion
├── ProductCreativesView.tsx   # Vista por producto
└── CreativeInsights.tsx       # Panel de insights globales
```

### 1. CreativeCard.tsx

Card inteligente que muestra:
- Imagen/Video del creativo
- Badge de resultado (Frio / Interesante / Caliente)
- Metricas clave (mensajes, ventas)
- Hook type badge
- Indicador de comparacion vs anterior
- Quick actions

```text
┌─────────────────────────────────────┐
│  [Imagen/Video]                     │
│                                     │
│  🔥 CALIENTE                        │
│                                     │
│  Hook: Beneficio                    │
│  📩 45 mensajes  │  💰 8 ventas    │
│                                     │
│  ↑ Mejor que anterior (+120%)       │
│                                     │
│  [Ver detalle] [Repetir] [Escalar]  │
└─────────────────────────────────────┘
```

### 2. CreativeForm.tsx

Formulario estructurado en 6 bloques con tabs o acordeon:

```text
┌─────────────────────────────────────────────────────────────────┐
│  NUEVO CREATIVO                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [A. Contexto] [B. Mensaje] [C. Metricas] [F. Aprendizaje]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BLOQUE A: CONTEXTO                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Producto    │ │ Canal       │ │ Tipo        │               │
│  │ [Select]    │ │ [Select]    │ │ [Select]    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                  │
│  ┌─────────────┐ ┌─────────────────────────────┐               │
│  │ Objetivo    │ │ Publico Objetivo            │               │
│  │ [Select]    │ │ [Select]                    │               │
│  └─────────────┘ └─────────────────────────────┘               │
│                                                                  │
│  [Siguiente →]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. CreativeMetrics.tsx

Panel para registrar metricas segun canal:

```text
┌─────────────────────────────────────────────────────────────────┐
│  METRICAS DE PERFORMANCE                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Canal: Instagram (Organico)                                     │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ ❤️ Likes │ │ 💬 Com. │ │ 📩 Msgs │ │ 💰 Ventas│              │
│  │   124   │ │   23    │ │   45    │ │    8    │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                  │
│  Personas conocidas: [Si] [No] [Mixto]                          │
│                                                                  │
│  Engagement percibido: [Bajo] [Medio] [Alto]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. CreativeComparison.tsx

Comparacion automatica con creativo anterior:

```text
┌─────────────────────────────────────────────────────────────────┐
│  🔍 COMPARACION CON ANTERIOR                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐      vs      ┌─────────────────┐          │
│  │ Este creativo   │              │ Anterior        │          │
│  │ Hook: Beneficio │              │ Hook: Precio    │          │
│  │ 📩 45 mensajes  │              │ 📩 20 mensajes  │          │
│  │ 💰 8 ventas     │              │ 💰 3 ventas     │          │
│  └─────────────────┘              └─────────────────┘          │
│                                                                  │
│  Resultado: ✅ MEJOR (+125% mensajes, +166% ventas)             │
│                                                                  │
│  Que cambio:                                                     │
│  • Hook: Precio → Beneficio                                      │
│  • Formato: Imagen → Video                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. CreativeActions.tsx

Botones preparados para n8n:

```text
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ ACCIONES INTELIGENTES                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [🔄 Generar nuevo basado en este]                              │
│  [🔁 Repetir creativo exitoso]                                   │
│  [👥 Probar nuevo publico]                                       │
│  [📤 Enviar a vendedores]                                        │
│  [🌐 Preparar landing page]                                      │
│                                                                  │
│  ℹ️ Estas acciones quedan registradas para automatizacion       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Vista Hibrida de Creativos

### Archivo: src/pages/Creatives.tsx (Rediseno completo)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CREATIVE INTELLIGENCE SYSTEM                                               │
│  El cerebro de tu contenido de venta                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Vista Global] [Por Producto]                      [+ Nuevo Creativo]      │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  FILTROS                                                                     │
│  Canal: [Todos] [Instagram] [WhatsApp] [TikTok] [Facebook] [Marketplace]    │
│  Resultado: [Todos] [🔥 Caliente] [🟡 Interesante] [❄️ Frio]                │
│  Publico: [Todos] [Precio bajo] [Regalo] [Reventa]                          │
│  Hook: [Todos] [Precio] [Beneficio] [Urgencia] [Prueba social]              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📊 INSIGHTS RAPIDOS                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ 12 creativos │ │ 5 calientes  │ │ Hook top:    │ │ Aprendizaje: │       │
│  │ este mes     │ │ (42%)        │ │ Beneficio    │ │ Video > Img  │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CREATIVOS                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ [Card 1]    │ │ [Card 2]    │ │ [Card 3]    │ │ [Card 4]    │          │
│  │ 🔥 Caliente │ │ 🟡 Interes. │ │ 🔥 Caliente │ │ ❄️ Frio     │          │
│  │ Instagram   │ │ WhatsApp    │ │ TikTok      │ │ Facebook    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Vista por Producto

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Volver                                      CREATIVOS DE: iPhone Case   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Imagen Producto]  │  Estadisticas del Producto                            │
│                     │  ─────────────────────────                            │
│                     │  12 creativos totales                                  │
│                     │  5 calientes (42%)                                     │
│                     │  Hook mas exitoso: Beneficio                           │
│                     │  Mejor canal: Instagram                                │
│                     │                                                        │
│                     │  [+ Nuevo Creativo para este producto]                 │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TIMELINE DE CREATIVOS (ordenados por fecha)                                │
│                                                                              │
│  [Creativo 5] 🔥 ↑ Mejor → [Creativo 4] 🟡 ↓ Peor → [Creativo 3] 🔥 ...   │
│                                                                              │
│  APRENDIZAJES ACUMULADOS                                                     │
│  • "Video corto genera 2x mas mensajes que imagen"                          │
│  • "Hook de beneficio supera a precio en 40%"                                │
│  • "Publico reventa convierte mejor"                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hook: useCreativeIntelligence

### Archivo: src/hooks/useCreativeIntelligence.ts

```typescript
// Funciones principales:

// 1. Calcular performance automatico
function calculatePerformance(creative: Creative): CreativePerformance {
  // Reglas:
  // - Caliente: mensajes > 30 O ventas > 5 O engagement = alto
  // - Interesante: mensajes > 10 O ventas > 2 O engagement = medio
  // - Frio: todo lo demas
}

// 2. Comparar con anterior
function compareWithPrevious(
  creative: Creative, 
  previous: Creative | null
): ComparisonResult {
  // Logica de comparacion basada en metricas
}

// 3. Detectar patrones globales
function detectPatterns(creatives: Creative[]): Insights {
  // - Hook mas exitoso
  // - Canal mas efectivo
  // - Publico con mejor conversion
  // - Tendencias temporales
}

// 4. Generar insights
function generateInsights(
  productId: string, 
  creatives: Creative[]
): string[] {
  // Generar aprendizajes automaticos
}

// 5. Obtener creativo anterior
function getPreviousCreative(
  productId: string,
  channel: string,
  currentId: string
): Creative | null {
  // Buscar el creativo anterior del mismo producto y canal
}
```

---

## Logica de Calculo Automatico de Resultado

```typescript
// Reglas para calcular performance
const calculateAutoResult = (creative: CreativeIntelligence): CreativePerformance => {
  const { 
    metricMessages, 
    metricSales, 
    engagementLevel,
    vsPrevious 
  } = creative;

  // Prioridad 1: Ventas directas
  if (metricSales >= 5) return 'caliente';
  if (metricSales >= 2) return 'interesante';
  
  // Prioridad 2: Mensajes recibidos
  if (metricMessages >= 30) return 'caliente';
  if (metricMessages >= 10) return 'interesante';
  
  // Prioridad 3: Engagement percibido
  if (engagementLevel === 'alto') return 'caliente';
  if (engagementLevel === 'medio') return 'interesante';
  
  // Prioridad 4: Comparacion con anterior
  if (vsPrevious === 'mejor') return 'interesante';
  
  return 'frio';
};
```

---

## Orden de Implementacion

### Fase 1: Base de Datos (Migracion)

1. Crear migracion SQL con nuevos campos
2. Actualizar enums existentes
3. Agregar indices para queries eficientes

### Fase 2: Tipos y Hook

1. Actualizar `src/types/index.ts` con nuevos tipos
2. Crear `src/hooks/useCreativeIntelligence.ts`
3. Actualizar `src/hooks/useCreatives.ts` para mapear nuevos campos

### Fase 3: Componentes Base

1. `CreativeCard.tsx` - Card inteligente
2. `CreativeMetrics.tsx` - Panel de metricas
3. `CreativeComparison.tsx` - Comparador
4. `CreativeLearning.tsx` - Bloque aprendizaje
5. `CreativeActions.tsx` - Acciones n8n

### Fase 4: Formulario

1. `CreativeForm.tsx` - Formulario multi-bloque
2. Validaciones y flujo

### Fase 5: Vistas

1. `CreativeFilters.tsx` - Filtros avanzados
2. `ProductCreativesView.tsx` - Vista por producto
3. `CreativeInsights.tsx` - Panel insights
4. Redisenar `Creatives.tsx` completo

### Fase 6: Integracion

1. Conectar con ventas (related_creative_id)
2. Logica de comparacion automatica
3. Generacion de insights

---

## Preparacion para n8n

Cada accion registra un "intent" en la base de datos:

```typescript
interface AutomationIntent {
  creativeId: string;
  action: 'generate_new' | 'repeat' | 'new_audience' | 'send_sellers' | 'landing';
  triggeredAt: string;
  status: 'pending' | 'processing' | 'completed';
  metadata?: Record<string, unknown>;
}
```

n8n puede:
1. Polling: Consultar intents pendientes
2. Webhook: Recibir notificacion cuando se crea intent
3. Ejecutar flujo correspondiente
4. Actualizar status a completed

---

## Lo Que NO Cambia

- Logica de ventas existente
- Sistema de tareas
- Otros modulos
- Navegacion principal

---

## Criterio de Exito

El modulo estara completo cuando:

1. Un usuario pueda crear un creativo con contexto completo (producto, canal, publico, hook)
2. Pueda registrar metricas manuales de forma estructurada
3. Vea automaticamente si el creativo funciono vs el anterior
4. El aprendizaje quede guardado y visible
5. Pueda filtrar creativos por multiples criterios
6. Vea insights globales de que funciona
7. Las acciones de automatizacion queden registradas para n8n

