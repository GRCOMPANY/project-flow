

# Plan: Rediseno Premium Dashboard Ejecutivo - GRC AI OS

## Vision del Producto

Transformar el Command Center actual en un **dashboard ejecutivo de decision** inspirado en Stripe, Linear y los mejores dashboards SaaS premium. El objetivo es que el dueno del ecommerce entienda su negocio en menos de 60 segundos y sepa exactamente que hacer.

---

## Analisis del Estado Actual

### Problemas Identificados

| Problema | Impacto |
|----------|---------|
| AlertStrip muy pequeno, no genera urgencia | El dinero en riesgo no destaca |
| "Acciones de Hoy" lista tareas como sistema tradicional | Abruma en lugar de guiar |
| BusinessMetricCard muestra metricas genericas | No informa tendencias ni contexto |
| No hay visualizacion de productos clave | Se pierde oportunidad de escalar/corregir |
| El insight esta oculto (DailyInsight no se usa) | No hay "voz del sistema" |
| Demasiadas secciones con igual peso visual | Fatiga cognitiva |

### Estructura Actual

```text
Header (Saludo)
AlertStrip (chips pequenos)
Acciones de Hoy (lista de ActionCards)
Estado del Negocio (4 cards metricas)
Resultados de Hoy (3 cards)
```

---

## Nueva Arquitectura Visual

### Estructura Propuesta (6 Bloques)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  BLOQUE 1: TENSION ECONOMICA (Hero Card)                            │
│  "Hoy tienes $405.000 en riesgo"                                    │
│  [3 sin confirmar] [2 en riesgo] [$140K pendiente]                  │
│  [Ver cobros pendientes]                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BLOQUE 2: RADAR DEL NEGOCIO (Alertas Inteligentes)                 │
│  🔴 "3 ventas sin confirmar hace mas de 2 dias"                     │
│  🟡 "1 producto rentable sin activacion reciente"                   │
│  🟢 "Hoy puedes recuperar $250K si actuas rapido"                   │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────┬────────────────────┐
│  BLOQUE 3: TENDENCIAS (Sparklines)                             │
│  📊 Ventas 7 dias  │  💰 Ganancia 7d    │  📈 Conversion      │
│  ▁▂▃▄▅▆▇ +23%      │  ▂▃▄▃▅▆▅ +12%      │  ▅▆▄▅▆▇▆ 18%       │
└────────────────────┴────────────────────┴────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BLOQUE 4: PRODUCTOS CLAVE DE LA SEMANA (4 Cards)                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │ 🥇 Mas    │ │ 💰 Mas    │ │ ❄ Mas     │ │ 🚨 En     │          │
│  │ vendido   │ │ rentable  │ │ frio      │ │ riesgo    │          │
│  │ [Escalar] │ │ [Escalar] │ │ [Activar] │ │ [Revisar] │          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BLOQUE 5: INSIGHT DIARIO (IA Light)                                │
│  💡 "Puedes recuperar $405.000 si confirmas estos 3 pedidos hoy"   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BLOQUE 6: ACCIONES INTELIGENTES (Botones Impacto)                  │
│  [💰 Cobrar ahora] [🔄 Cambiar creativo] [🚀 Escalar producto]      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Crear

### 1. TensionCard (Hero - Bloque 1)

**Archivo:** `src/components/command-center/TensionCard.tsx`

Card dominante que muestra el dinero en riesgo HOY.

```typescript
interface TensionCardProps {
  montoEnRiesgo: number;
  ventasSinConfirmar: number;
  ventasEnRiesgo: number;
  pendienteCobro: number;
  onAction: () => void;
}
```

**Diseno:**
- Background: Gradiente suave amarillo/naranja (urgencia sin alarma)
- Numero grande: `$405.000 en riesgo`
- Chips debajo: indicadores clickeables
- CTA prominente: "Ver cobros pendientes"
- Animacion sutil de pulso en el monto

### 2. BusinessRadar (Bloque 2)

**Archivo:** `src/components/command-center/BusinessRadar.tsx`

Radar de alertas inteligentes, NO lista de tareas.

```typescript
interface RadarAlert {
  id: string;
  severity: 'critical' | 'warning' | 'opportunity';
  icon: LucideIcon;
  message: string;
  subtext?: string;
  action: {
    label: string;
    path: string;
  };
}
```

**Logica de Alertas:**

| Condicion | Tipo | Mensaje |
|-----------|------|---------|
| Ventas nuevo > 2 dias | critical | "X ventas sin confirmar hace mas de 2 dias" |
| operationalStatus = riesgo | critical | "X ventas en riesgo de devolucion" |
| Producto featured sin creativo | warning | "X producto rentable sin contenido activo" |
| Producto con ventas 30d = 0 | warning | "X producto sin movimiento en 30 dias" |
| Pendiente cobro > $X | opportunity | "Puedes recuperar $X si cobras hoy" |
| Producto hot (ventas 7d > 3) | opportunity | "X producto listo para escalar" |

**Diseno:**
- Cards minimalistas, una linea por alerta
- Icono semantico + texto + flecha
- Maximo 4-5 alertas visibles
- Sin checkboxes, sin estados de tarea

### 3. TrendSparklines (Bloque 3)

**Archivo:** `src/components/command-center/TrendSparklines.tsx`

Tres sparklines minimalistas mostrando tendencias.

```typescript
interface SparklineData {
  label: string;
  values: number[];  // 7 valores para 7 dias
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  currentValue: string;
}
```

**Metricas:**
1. **Ventas ultimos 7 dias** - Cantidad de ventas por dia
2. **Ganancia neta ultimos 7 dias** - Suma de margin_at_sale por dia
3. **Conversion mensajes → ventas** - Si hay data de mensajes, sino mostrar "Tasa de cierre"

**Diseno:**
- Sparklines sin ejes, sin grids
- Color verde si trend up, rojo si down
- Numero grande + porcentaje de cambio
- Layout horizontal en desktop, stack en mobile

### 4. KeyProductCards (Bloque 4)

**Archivo:** `src/components/command-center/KeyProductCards.tsx`

Cuatro productos estrategicos de la semana.

```typescript
interface KeyProduct {
  type: 'top_seller' | 'most_profitable' | 'coldest' | 'at_risk';
  product: Product;
  metric: string;
  metricLabel: string;
  action: {
    label: string;
    handler: () => void;
  };
}
```

**Categorias:**

| Tipo | Criterio de Seleccion | Metrica Mostrada | Accion |
|------|----------------------|------------------|--------|
| 🥇 Mas vendido | Max salesLast7Days | "12 vendidos esta semana" | Escalar |
| 💰 Mas rentable | Max marginPercent con ventas | "52% margen" | Escalar |
| ❄ Mas frio | Activo + salesLast30Days = 0 + marginPercent > 30 | "0 ventas, 45% margen" | Activar |
| 🚨 En riesgo | Ventas pero paymentStatus pendiente | "$180K por cobrar" | Cobrar |

**Diseno:**
- Grid 4 columnas en desktop, 2x2 en mobile
- Imagen del producto prominente
- 1 metrica clave grande
- 1 boton de accion
- Efecto hover sutil

### 5. DailyInsightCard (Bloque 5)

**Archivo:** `src/components/command-center/DailyInsightCard.tsx`

Una sola recomendacion fuerte del "sistema inteligente".

```typescript
interface DailyInsightCardProps {
  insight: {
    message: string;
    type: 'money' | 'growth' | 'warning' | 'celebration';
    action?: {
      label: string;
      path: string;
    };
  };
}
```

**Logica de Generacion (Prioridad):**

1. Si hay cobros pendientes > $100K → "Hoy puedes recuperar $X si cobras estos pedidos"
2. Si hay productos hot sin escalar → "X producto esta vendiendo. Es momento de escalar."
3. Si hay ventas sin confirmar > 2 dias → "Tienes X pedidos sin confirmar. Llama ahora."
4. Si todo esta bien → "Tu negocio esta sano. Enfocate en crecer."

**Diseno:**
- Card limpia, fondo sutil
- Icono de bombilla/cerebro
- Texto grande, muy legible
- Sin boton si no hay accion directa

### 6. SmartActions (Bloque 6)

**Archivo:** `src/components/command-center/SmartActions.tsx`

Botones de accion orientados a impacto economico.

```typescript
interface SmartAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant: 'primary' | 'secondary' | 'ghost';
  action: () => void;
  badge?: number;  // Contador opcional
}
```

**Acciones Contextuales (mostrar segun data):**

| Condicion | Boton |
|-----------|-------|
| pendingCollections > 0 | "Cobrar ahora" (primary) |
| smartProducts.some(needsCreatives) | "Cambiar creativo" |
| smartProducts.some(hot + canScale) | "Escalar producto" |
| smartProducts.some(cold + highMargin) | "Reactivar producto" |

**Diseno:**
- Layout horizontal, centrado
- Maximo 3-4 botones
- Botones con iconos
- El mas urgente es primary, resto secondary/ghost

---

## Archivos a Modificar

### CommandCenter.tsx - Reestructuracion Completa

**Cambios principales:**

1. **Eliminar:** DailyInsight actual (no se usa)
2. **Eliminar:** AlertStrip (se reemplaza por TensionCard + BusinessRadar)
3. **Eliminar:** Lista de ActionCards (se reemplaza por SmartActions)
4. **Eliminar:** Seccion "Resultados de Hoy" (mover a /tasks como historico)
5. **Agregar:** Los 6 nuevos bloques en orden

### index.css - Nuevos Estilos Premium

```css
/* Tension Card */
.tension-card {
  background: linear-gradient(135deg, 
    hsl(var(--warning) / 0.08) 0%, 
    hsl(var(--warning) / 0.02) 100%
  );
  border: 1px solid hsl(var(--warning) / 0.15);
}

/* Radar Alerts */
.radar-alert {
  @apply flex items-center gap-3 p-4 rounded-xl transition-all;
  @apply hover:bg-muted/30 cursor-pointer;
}

.radar-alert-critical {
  @apply border-l-4 border-l-destructive;
}

.radar-alert-warning {
  @apply border-l-4 border-l-warning;
}

.radar-alert-opportunity {
  @apply border-l-4 border-l-success;
}

/* Sparklines */
.sparkline-container {
  @apply flex flex-col items-center p-4 rounded-xl bg-card;
}

.sparkline-trend-up {
  @apply text-success;
}

.sparkline-trend-down {
  @apply text-destructive;
}

/* Key Product Card */
.key-product-card {
  @apply relative overflow-hidden rounded-2xl border bg-card p-4;
  @apply hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300;
}

/* Smart Actions */
.smart-actions {
  @apply flex flex-wrap items-center justify-center gap-3;
}

.smart-action-primary {
  @apply shadow-lg;
}
```

---

## Logica de Datos (useMemo)

### Tension Card Data

```typescript
const tensionData = useMemo(() => {
  const pendingAmount = sales
    .filter(s => s.paymentStatus === 'pendiente')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  
  const unconfirmed = sales.filter(s => {
    if (s.operationalStatus !== 'nuevo') return false;
    const days = daysSince(s.statusUpdatedAt || s.saleDate);
    return days > 2;
  }).length;
  
  const atRisk = sales.filter(s => 
    s.operationalStatus === 'riesgo_devolucion' || 
    s.operationalStatus === 'sin_respuesta'
  ).length;
  
  // Monto en riesgo = pendiente + (ventas en riesgo * promedio)
  const avgSaleAmount = sales.length > 0 
    ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length 
    : 0;
  const montoEnRiesgo = pendingAmount + (atRisk * avgSaleAmount);
  
  return {
    montoEnRiesgo,
    pendingAmount,
    unconfirmed,
    atRisk,
    hasUrgency: montoEnRiesgo > 0 || unconfirmed > 0 || atRisk > 0,
  };
}, [sales]);
```

### Key Products Data

```typescript
const keyProducts = useMemo(() => {
  const result: KeyProduct[] = [];
  
  // 1. Top Seller
  const topSeller = smartProducts
    .filter(p => p.salesLast7Days > 0)
    .sort((a, b) => b.salesLast7Days - a.salesLast7Days)[0];
  if (topSeller) {
    result.push({
      type: 'top_seller',
      product: topSeller,
      metric: `${topSeller.salesLast7Days} vendidos`,
      metricLabel: 'esta semana',
      action: { label: 'Escalar', handler: () => navigate(`/products/${topSeller.id}`) }
    });
  }
  
  // 2. Most Profitable
  const mostProfitable = smartProducts
    .filter(p => p.salesLast30Days > 0 && (p.marginPercent || 0) > 30)
    .sort((a, b) => (b.marginPercent || 0) - (a.marginPercent || 0))[0];
  // ...
  
  // 3. Coldest (with potential)
  const coldest = smartProducts
    .filter(p => p.status === 'activo' && p.salesLast30Days === 0 && (p.marginPercent || 0) > 30)
    .sort((a, b) => (b.marginPercent || 0) - (a.marginPercent || 0))[0];
  // ...
  
  // 4. At Risk (sales pending payment)
  const atRiskProduct = smartProducts
    .filter(p => p.pendingToCollect > 0)
    .sort((a, b) => b.pendingToCollect - a.pendingToCollect)[0];
  // ...
  
  return result;
}, [smartProducts, navigate]);
```

### Trend Data (Sparklines)

```typescript
const trendData = useMemo(() => {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  // Sales per day
  const salesPerDay = last7Days.map(date => 
    sales.filter(s => s.saleDate.startsWith(date)).length
  );
  
  // Profit per day
  const profitPerDay = last7Days.map(date =>
    sales
      .filter(s => s.saleDate.startsWith(date) && s.paymentStatus === 'pagado')
      .reduce((sum, s) => sum + ((s.marginAtSale || 0) * s.quantity), 0)
  );
  
  // Calculate trends
  const calcTrend = (values: number[]) => {
    const firstHalf = values.slice(0, 3).reduce((a, b) => a + b, 0);
    const secondHalf = values.slice(4).reduce((a, b) => a + b, 0);
    if (secondHalf > firstHalf) return { trend: 'up', percent: Math.round(((secondHalf - firstHalf) / Math.max(firstHalf, 1)) * 100) };
    if (secondHalf < firstHalf) return { trend: 'down', percent: Math.round(((firstHalf - secondHalf) / Math.max(firstHalf, 1)) * 100) };
    return { trend: 'stable', percent: 0 };
  };
  
  return {
    sales: { values: salesPerDay, ...calcTrend(salesPerDay), label: 'Ventas', current: salesPerDay.reduce((a, b) => a + b, 0) },
    profit: { values: profitPerDay, ...calcTrend(profitPerDay), label: 'Ganancia', current: profitPerDay.reduce((a, b) => a + b, 0) },
  };
}, [sales]);
```

---

## Orden de Implementacion

```text
1. Crear TensionCard.tsx (Hero principal)
2. Crear BusinessRadar.tsx (Alertas inteligentes)
3. Crear TrendSparklines.tsx (Graficas de tendencia)
4. Crear KeyProductCards.tsx (Productos clave)
5. Crear DailyInsightCard.tsx (Insight unico)
6. Crear SmartActions.tsx (Botones de impacto)
7. Actualizar index.css (Estilos premium)
8. Reestructurar CommandCenter.tsx (Integrar todo)
```

---

## Resultado Visual Esperado

### Desktop (max-w-5xl)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Buenos dias, Carlos                                    [≡] [👤]    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️                                                                 │
│     $405.000 en riesgo hoy                                         │
│                                                                     │
│  [3 sin confirmar]  [2 en riesgo]  [$140K por cobrar]              │
│                                                                     │
│                    [Ver cobros pendientes →]                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  RADAR                                                              │
│  ─────                                                              │
│  🔴 3 ventas llevan mas de 2 dias sin confirmacion          →      │
│  🟡 1 producto rentable no tiene contenido activo           →      │
│  🟢 Puedes recuperar $250K si cobras estas 3 ventas         →      │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────┬───────────────────┬───────────────────┐
│   📊 Ventas       │    💰 Ganancia    │   📈 Conversion   │
│   ▁▂▃▄▅▆▇        │    ▂▃▄▃▅▆▅        │    ▅▆▄▅▆▇▆       │
│   18 esta semana  │    +$245K         │    18.5%          │
│   +23% ↑          │    +12% ↑         │    +5% ↑          │
└───────────────────┴───────────────────┴───────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  PRODUCTOS CLAVE ESTA SEMANA                                       │
│  ────────────────────────────                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│  │ [  📷  ]     │ │ [  📷  ]     │ │ [  📷  ]     │ │ [  📷  ]   ││
│  │ 🥇 Mas       │ │ 💰 Mas       │ │ ❄ Producto   │ │ 🚨 En      ││
│  │ vendido      │ │ rentable     │ │ dormido      │ │ riesgo     ││
│  │              │ │              │ │              │ │            ││
│  │ 12 vendidos  │ │ 52% margen   │ │ 0 ventas     │ │ $180K      ││
│  │ [Escalar]    │ │ [Escalar]    │ │ [Activar]    │ │ [Cobrar]   ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘│
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  💡                                                                 │
│     "Hoy puedes recuperar $405.000 si confirmas estos 3 pedidos"   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│   [💰 Cobrar ahora (3)]  [🎨 Crear creativo]  [🚀 Escalar top]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lo Que NO Cambia

- **Logica de negocio:** taskRules.ts se mantiene intacto
- **Base de datos:** No hay migraciones
- **Hooks:** useSales, useProducts, useTasks, useSmartCatalog sin cambios
- **Pagina /tasks:** Se mantiene como vista de auditoria
- **Tipos TypeScript:** Se mantienen todos los tipos existentes

---

## Principios de Diseno Aplicados

| Principio | Aplicacion |
|-----------|------------|
| Jerarquia visual clara | Tension > Radar > Trends > Products > Insight > Actions |
| Espacio en blanco | Padding generoso, max-w-5xl |
| Colores semanticos | Rojo=riesgo, Amarillo=atencion, Verde=oportunidad |
| Una accion por elemento | Cada card tiene un solo CTA |
| Escaneable en 60 segundos | Numeros grandes, texto minimo |
| Sensacion premium | Sombras suaves, transiciones, gradientes sutiles |

