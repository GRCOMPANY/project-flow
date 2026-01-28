
# Plan Maestro: GRC AI OS - Evolución a Sistema Operativo Completo

## Diagnóstico del Estado Actual

### Lo que YA existe y funciona bien:

| Módulo | Estado | Funcionalidades |
|--------|--------|-----------------|
| **Productos** | 70% | CRUD, precios (costo/mayoreo/retail), márgenes calculados, Smart Catalog con prioridades |
| **Ventas** | 60% | CRUD, estados de pago/entrega, canales de venta, relación con productos |
| **Creativos** | 65% | Tipos/canales/objetivos, estados, resultados (funcionó/no), learning |
| **Tareas** | 90% | Sistema operativo completo, reglas automáticas, cierre con outcomes |
| **Command Center** | 75% | Acciones del día, métricas de negocio, Daily Insight |

### Gaps Críticos Identificados:

```text
PRODUCTOS
┌─────────────────────────────────────────────────────────────────────┐
│ FALTA: Estado Comercial (Frío/Tibio/Caliente)                       │
│ FALTA: Sistema de Activaciones (historial de promociones)           │
│ FALTA: Rentabilidad REAL acumulada desde ventas                     │
│ FALTA: Días sin activación                                          │
└─────────────────────────────────────────────────────────────────────┘

VENTAS
┌─────────────────────────────────────────────────────────────────────┐
│ FALTA: Congelado financiero (cost_at_sale, margin_at_sale)          │
│ FALTA: Detección de ventas con pérdida                              │
│ FALTA: Relación con activación/creativo que generó la venta         │
└─────────────────────────────────────────────────────────────────────┘

CREATIVOS
┌─────────────────────────────────────────────────────────────────────┐
│ FALTA: Métricas manuales (mensajes recibidos, ventas generadas)     │
│ FALTA: Comparación con creativo anterior                            │
│ FALTA: Tareas automáticas por bajo rendimiento                      │
└─────────────────────────────────────────────────────────────────────┘

VENDEDORES
┌─────────────────────────────────────────────────────────────────────┐
│ FALTA: Tracking de productos enviados                               │
│ FALTA: Detección de envíos sin resultados                           │
│ FALTA: Tareas de reenvío                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Plan de Implementación por Fases

### FASE 1: Congelado Financiero de Ventas (Crítico)
**Prioridad: ALTA | Impacto: Dinero**

#### 1.1 Migración de Base de Datos

Agregar campos a tabla `sales`:
- `cost_at_sale` (numeric) - Costo del producto al momento de la venta
- `price_at_sale` (numeric) - Precio de venta real aplicado
- `margin_at_sale` (numeric) - Margen calculado y congelado
- `margin_percent_at_sale` (numeric) - Porcentaje de margen congelado
- `related_activation_id` (uuid) - Activación que originó la venta
- `related_creative_id` (uuid) - Creativo que originó la venta

#### 1.2 Lógica de Negocio

Al crear una venta:
1. Capturar `costPrice` del producto actual
2. Calcular margen: `margin = price_at_sale - cost_at_sale`
3. Calcular porcentaje: `marginPercent = (margin / cost_at_sale) * 100`
4. Guardar valores congelados en la venta

**Regla crítica**: El margen NUNCA cambia aunque el producto se edite después.

#### 1.3 Alertas de Ventas con Pérdida

Crear tarea automática cuando:
- `margin_at_sale < 0` → "Venta con pérdida: {producto} - Revisar precio"
- Mostrar alerta visual en el listado de ventas

---

### FASE 2: Sistema de Activaciones de Producto
**Prioridad: ALTA | Impacto: Crecimiento**

#### 2.1 Nueva Tabla `product_activations`

```sql
CREATE TABLE product_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Tipo de activación
  activation_type TEXT NOT NULL, -- 'nuevo' | 'refuerzo' | 'promocion'
  channel TEXT NOT NULL,          -- 'marketplace' | 'whatsapp' | 'instagram' | 'tiktok'
  
  -- Creativo usado (si aplica)
  creative_id UUID REFERENCES creatives(id),
  
  -- Resultado
  messages_received INTEGER DEFAULT 0,
  sales_generated INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 2.2 TypeScript

```typescript
export interface ProductActivation {
  id: string;
  productId: string;
  activationType: 'nuevo' | 'refuerzo' | 'promocion';
  channel: SalesChannel;
  creativeId?: string;
  messagesReceived: number;
  salesGenerated: number;
  notes?: string;
  activatedAt: string;
  createdAt: string;
}
```

#### 2.3 Integración con Productos

Enriquecer `ProductWithMetrics`:
- `lastActivation?: ProductActivation`
- `daysSinceLastActivation: number`
- `activationsCount: number`
- `activationHistory: ProductActivation[]`

---

### FASE 3: Estado Comercial del Producto (Frío/Tibio/Caliente)
**Prioridad: ALTA | Impacto: Decisiones**

#### 3.1 Nuevo Tipo

```typescript
export type CommercialState = 'frio' | 'tibio' | 'caliente';
```

#### 3.2 Lógica de Clasificación (Reglas Fijas GRC)

```typescript
function calculateCommercialState(
  salesLast30Days: number,
  messagesReceived: number,  // de activaciones
  daysSinceLastActivation: number
): CommercialState {
  // CALIENTE: Mensajes + Ventas activas
  if (salesLast30Days >= 3 && messagesReceived > 5) {
    return 'caliente';
  }
  
  // TIBIO: Mensajes pero pocas ventas
  if (messagesReceived > 3 && salesLast30Days < 3) {
    return 'tibio';
  }
  
  // FRÍO: Sin ventas después de activación
  if (daysSinceLastActivation > 7 && salesLast30Days === 0) {
    return 'frio';
  }
  
  // Default basado en ventas
  return salesLast30Days > 0 ? 'tibio' : 'frio';
}
```

#### 3.3 Visualización

Actualizar `ProductCard` y `ProductDetail`:
- Badge de color: 🔴 Frío | 🟡 Tibio | 🟢 Caliente
- Tooltip con explicación
- Filtro por estado comercial en catálogo

---

### FASE 4: Métricas de Creativos y Comparación
**Prioridad: MEDIA | Impacto: Crecimiento**

#### 4.1 Nuevos Campos en `creatives`

```sql
ALTER TABLE creatives ADD COLUMN messages_received INTEGER DEFAULT 0;
ALTER TABLE creatives ADD COLUMN sales_generated INTEGER DEFAULT 0;
ALTER TABLE creatives ADD COLUMN compared_to_previous TEXT; -- 'mejor' | 'peor' | 'igual'
```

#### 4.2 Lógica de Comparación

Al actualizar métricas de un creativo:
1. Buscar creativo anterior del mismo producto
2. Comparar `salesGenerated`
3. Marcar como mejor/peor/igual
4. Si es "peor" → generar tarea automática

#### 4.3 UI de Creativos

Agregar en la card de creativo:
- Inputs para registrar mensajes/ventas manualmente
- Indicador visual de comparación vs anterior
- Badge de rendimiento

---

### FASE 5: Tracking de Productos a Vendedores
**Prioridad: MEDIA | Impacto: Operación**

#### 5.1 Nueva Tabla `seller_product_shares`

```sql
CREATE TABLE seller_product_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel TEXT DEFAULT 'whatsapp',
  
  -- Resultado
  sales_generated INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 5.2 Integración

- Botón "Enviar a vendedores" funcional en ProductDetail
- Modal para seleccionar vendedores
- Registro automático de fecha
- Detección de productos enviados sin ventas → Tarea automática

---

### FASE 6: Rentabilidad Real Acumulada
**Prioridad: MEDIA | Impacto: Dinero**

#### 6.1 Enriquecer ProductWithMetrics

```typescript
// Calculado desde ventas con márgenes congelados
interface ProductProfitability {
  totalRevenue: number;          // Suma de ventas pagadas
  totalCost: number;             // Suma de costos de ventas
  netProfit: number;             // Revenue - Cost
  averageMarginPercent: number;  // Promedio de márgenes
  salesWithLoss: number;         // Conteo de ventas con pérdida
}
```

#### 6.2 Visualización

Nueva sección en ProductDetail: "Rentabilidad Real"
- Total vendido
- Costo acumulado
- Ganancia neta
- Alerta si hay ventas con pérdida

---

### FASE 7: Command Center Mejorado
**Prioridad: MEDIA | Impacto: Decisiones**

#### 7.1 Nuevas Secciones

1. **Productos Calientes/Fríos**
   - Grid visual de productos por estado comercial
   - Click para ver acciones recomendadas

2. **Alertas de Rentabilidad**
   - Ventas con pérdida recientes
   - Productos con margen bajo
   - Tendencias negativas

3. **Guía Diaria Mejorada**
   - "Si solo haces esto hoy..."
   - 3 acciones de máximo impacto
   - Estimación de dinero recuperable

---

## Nuevas Reglas Automáticas de Tareas

| Condición | Tarea | Prioridad |
|-----------|-------|-----------|
| Producto sin activación > 14 días | "Activar {producto}" | Alta |
| Producto frío + margen alto | "Promocionar urgente: {producto}" | Alta |
| Creativo con peor rendimiento | "Revisar estrategia: {producto}" | Media |
| Producto enviado a vendedores sin ventas > 7 días | "Reenviar o revisar: {producto}" | Media |
| Venta con margen negativo | "Revisar precio: {producto}" | Alta |
| Activación sin ventas > 5 días | "Analizar activación: {producto}" | Baja |

---

## Archivos a Crear/Modificar

### Nuevos Archivos
| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/[timestamp]_sales_financial_freeze.sql` | Campos de congelado |
| `supabase/migrations/[timestamp]_product_activations.sql` | Tabla de activaciones |
| `supabase/migrations/[timestamp]_seller_product_shares.sql` | Tracking vendedores |
| `supabase/migrations/[timestamp]_creatives_metrics.sql` | Métricas manuales |
| `src/hooks/useProductActivations.ts` | Hook de activaciones |
| `src/hooks/useSellerShares.ts` | Hook de envíos a vendedores |
| `src/components/products/ActivationForm.tsx` | Modal de nueva activación |
| `src/components/products/ActivationTimeline.tsx` | Historial de activaciones |
| `src/components/creatives/CreativeMetricsForm.tsx` | Input de métricas manuales |

### Archivos a Modificar
| Archivo | Cambios |
|---------|---------|
| `src/types/index.ts` | Nuevos tipos (Activation, CommercialState, etc) |
| `src/hooks/useSales.ts` | Congelado financiero al crear venta |
| `src/hooks/useSmartCatalog.ts` | Añadir estado comercial y activaciones |
| `src/lib/taskRules.ts` | Nuevas reglas automáticas |
| `src/pages/ProductDetail.tsx` | Secciones de activaciones y rentabilidad |
| `src/components/products/ProductCard.tsx` | Badge de estado comercial |
| `src/pages/CommandCenter.tsx` | Nuevas secciones |

---

## Orden de Implementación Recomendado

```text
SEMANA 1: Fundamentos Financieros
├── Fase 1: Congelado financiero de ventas
└── Fase 6: Rentabilidad real (parcial)

SEMANA 2: Sistema de Activaciones
├── Fase 2: Tabla y CRUD de activaciones
└── Fase 3: Estado comercial (Frío/Tibio/Caliente)

SEMANA 3: Creativos y Vendedores
├── Fase 4: Métricas de creativos
└── Fase 5: Tracking de vendedores

SEMANA 4: Command Center y Polish
└── Fase 7: Mejoras visuales y guía diaria
```

---

## Resultado Esperado

Al completar todas las fases, el usuario de GRC AI OS podrá:

1. **Cada mañana** ver exactamente qué productos mover, con qué creativo y en qué canal
2. **Saber la rentabilidad real** de cada producto, no solo la teórica
3. **Entender el estado comercial** de su catálogo de un vistazo (caliente/tibio/frío)
4. **Nunca olvidar** activar productos estancados o cobrar ventas pendientes
5. **Aprender qué funciona** gracias a la comparación de creativos
6. **Controlar a los vendedores** sin necesidad de acceder al sistema

El sistema se convierte en un verdadero **copiloto operativo** que reduce el caos mental y maximiza el tiempo del dueño del negocio.
