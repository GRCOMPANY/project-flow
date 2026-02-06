
# Plan: Tipo de Venta Obligatorio - Separación Directa vs Revendedor

## Resumen Ejecutivo

Este plan implementa la separación explícita entre **Venta Directa** (al cliente final) y **Venta a Revendedor** (mayorista), eliminando cualquier ambiguedad conceptual. El campo "Tipo de Venta" será obligatorio y gobernará toda la lógica del formulario, cálculos y métricas.

---

## Estado Actual vs Estado Objetivo

| Aspecto | Actual | Objetivo |
|---------|--------|----------|
| Tipo de venta | Implícito (si hay reseller o no) | **Explícito y obligatorio** |
| Campo revendedor | Siempre visible (opcional) | Solo si tipo = "revendedor" |
| Precio final | Opcional en todos los casos | **Obligatorio** en venta directa |
| Precio revendedor | Siempre visible | Solo en venta a revendedor |
| Dashboard | Métricas globales | Métricas **separadas por tipo** |
| UX | Confusa | Clara con mensajes contextuales |

---

## Fase 1: Cambios en Base de Datos

### 1.1 Agregar campo `sale_type` a tabla `sales`

```sql
-- Tipo de venta obligatorio
CREATE TYPE sale_type AS ENUM ('directa', 'revendedor');

ALTER TABLE sales ADD COLUMN sale_type sale_type NOT NULL DEFAULT 'revendedor';

-- Migrar datos existentes
UPDATE sales 
SET sale_type = CASE 
  WHEN seller_id IS NOT NULL THEN 'revendedor'::sale_type
  ELSE 'directa'::sale_type
END;

COMMENT ON COLUMN sales.sale_type IS 
  'Tipo de venta: directa (cliente final) o revendedor (mayorista). Gobierna toda la lógica de precios y métricas.';
```

---

## Fase 2: Actualización de Tipos TypeScript

### 2.1 Nuevo tipo `SaleType`

```typescript
// src/types/index.ts

export type SaleType = 'directa' | 'revendedor';

export interface Sale {
  id: string;
  
  // NUEVO: Tipo de venta (obligatorio)
  saleType: SaleType;
  
  // Producto (siempre obligatorio)
  productId: string;
  product?: Product;
  
  // Revendedor (solo si saleType = 'revendedor')
  sellerId?: string;
  seller?: Seller;
  
  // Cliente final (nombre/telefono)
  // Obligatorio si saleType = 'directa'
  // Opcional si saleType = 'revendedor'
  clientName?: string;
  clientPhone?: string;
  
  // Precios
  quantity: number;
  unitPrice: number;           // Precio de venta (obligatorio)
  totalAmount: number;
  
  // Precio revendedor: solo si saleType = 'revendedor'
  resellerPrice?: number;
  
  // Precio final: 
  // - OBLIGATORIO si saleType = 'directa'
  // - Opcional (informativo) si saleType = 'revendedor'
  finalPrice?: number;
  
  // Ganancia del revendedor (informativo)
  resellerProfit?: number;
  
  // ... resto de campos existentes
}
```

---

## Fase 3: Lógica del Hook `useSales`

### 3.1 Actualizar `addSale` con validaciones por tipo

```text
VENTA DIRECTA (saleType = 'directa'):
├── Validaciones:
│   ├── finalPrice → OBLIGATORIO (es tu precio de venta)
│   ├── sellerId → IGNORAR (null)
│   └── resellerPrice → IGNORAR (null)
├── Cálculos:
│   ├── unitPrice = finalPrice
│   ├── totalAmount = finalPrice × quantity
│   ├── costAtSale = product.costPrice
│   ├── marginAtSale = finalPrice - costAtSale
│   └── marginPercentAtSale = ((finalPrice - cost) / cost) × 100

VENTA A REVENDEDOR (saleType = 'revendedor'):
├── Validaciones:
│   ├── sellerId → OBLIGATORIO
│   ├── resellerPrice → OBLIGATORIO
│   └── finalPrice → OPCIONAL (informativo)
├── Cálculos:
│   ├── unitPrice = resellerPrice
│   ├── totalAmount = resellerPrice × quantity
│   ├── costAtSale = product.costPrice
│   ├── marginAtSale = resellerPrice - costAtSale
│   ├── marginPercentAtSale = ((resellerPrice - cost) / cost) × 100
│   └── resellerProfit = finalPrice - resellerPrice (si hay finalPrice)
```

---

## Fase 4: Rediseño del Formulario "Nueva Venta"

### 4.1 Estructura del Formulario Condicional

```text
┌─────────────────────────────────────────────────────────────────┐
│  NUEVA VENTA                                                     │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  🎯 TIPO DE VENTA (Obligatorio)                                  │
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────┐ ┌─────────────────────────┐        │
│  │ 🔵 VENTA DIRECTA        │ │ 🟢 VENTA A REVENDEDOR   │        │
│  │    Cliente final        │ │    Mayorista            │        │
│  │    Ingreso directo      │ │    Venta por volumen    │        │
│  └─────────────────────────┘ └─────────────────────────┘        │
│                                                                  │
│  [Mensaje contextual según selección]                            │
│                                                                  │
│══════════════════════════════════════════════════════════════   │
│                                                                  │
│  📦 PRODUCTO (siempre visible)                                   │
│  ─────────────────────────────────────────────────────────────  │
│  [Select: Producto *]         Cantidad: [1]                      │
│                                                                  │
│══════════════════════════════════════════════════════════════   │
│                                                                  │
│  [SECCIÓN CONDICIONAL SEGÚN TIPO]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Sección Condicional: VENTA DIRECTA

```text
┌─────────────────────────────────────────────────────────────────┐
│  💵 VENTA DIRECTA - Cliente Final                                │
│  ─────────────────────────────────────────────────────────────  │
│  "Esta venta genera ingreso directo para GRC"                    │
│                                                                  │
│  📞 CLIENTE                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐                │
│  │ Nombre *            │ │ Teléfono (WhatsApp) │                │
│  └─────────────────────┘ └─────────────────────┘                │
│                                                                  │
│  💰 PRECIO                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Precio de venta (final) *:  [$600]                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CÁLCULO AUTOMÁTICO (Admin)                                  ││
│  │ ───────────────────────────────────────────────────         ││
│  │ Tu costo:           $300                                    ││
│  │ Precio de venta:    $600                                    ││
│  │ ─────────────────────────────────────                       ││
│  │ TU GANANCIA:        +$300 (100%)  ✅                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  👤 Revendedor:  ❌ NO APLICA (oculto)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Sección Condicional: VENTA A REVENDEDOR

```text
┌─────────────────────────────────────────────────────────────────┐
│  🤝 VENTA A REVENDEDOR - Mayorista                               │
│  ─────────────────────────────────────────────────────────────  │
│  "GRC vende el producto al revendedor, no al cliente final"      │
│                                                                  │
│  👤 REVENDEDOR                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Seleccionar revendedor *:  [Dropdown]                       ││
│  │ + Crear nuevo revendedor                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  💰 PRECIOS                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐                │
│  │ Precio revendedor * │ │ Precio final (opc.) │                │
│  │ [$450]              │ │ [$600]              │                │
│  │ (tu ingreso)        │ │ (informativo)       │                │
│  └─────────────────────┘ └─────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CÁLCULO AUTOMÁTICO (Admin)                                  ││
│  │ ───────────────────────────────────────────────────         ││
│  │ Tu costo:                $300                               ││
│  │ Precio revendedor:       $450                               ││
│  │ ─────────────────────────────────────                       ││
│  │ TU GANANCIA:             +$150 (50%)  ✅                    ││
│  │                                                             ││
│  │ Ganancia revendedor:     $150 (informativo)                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  📞 CLIENTE FINAL (Opcional)                                     │
│  ┌─────────────────────┐ ┌─────────────────────┐                │
│  │ Nombre              │ │ Teléfono            │                │
│  │ (solo referencia)   │ │ (solo referencia)   │                │
│  └─────────────────────┘ └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 5: Rediseño del Dashboard

### 5.1 Métricas Separadas por Tipo

```text
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD DE VENTAS                                             │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  📊 RESUMEN GLOBAL                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ $75,000    │ │ $15,000    │ │ $60,000    │ │ $28,000    │   │
│  │ Total      │ │ Pendiente  │ │ Cobrado    │ │ Ganancia   │   │
│  │ vendido    │ │ por cobrar │ │            │ │ neta       │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  🔵 VENTAS DIRECTAS                🟢 VENTAS A REVENDEDORES     │
│  ─────────────────────────────     ─────────────────────────    │
│  │ $30,000 (12 ventas)     │       │ $45,000 (28 ventas)   │    │
│  │ Pendiente: $5,000       │       │ Pendiente: $10,000    │    │
│  │ Cobrado: $25,000        │       │ Cobrado: $35,000      │    │
│  │ Margen: 85%             │       │ Margen: 45%           │    │
│  └─────────────────────────┘       └─────────────────────────┘  │
│                                                                  │
│  📋 SEGUIMIENTO                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ 5          │ │ 2          │ │ 8          │                   │
│  │ Sin        │ │ En riesgo  │ │ Pendiente  │                   │
│  │ confirmar  │ │            │ │ acción     │                   │
│  └────────────┘ └────────────┘ └────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 6: Tarjeta de Venta (SaleCard) con Tipo Visible

### 6.1 Indicador Visual de Tipo

```text
┌─────────────────────────────────────────────────────────────────┐
│  [🔵 DIRECTA] o [🟢 REVENDEDOR]                                  │
│                                                                  │
│  📦 iPhone Case ×2                                    $900      │
│                                                                  │
│  👤 María González  📱 +52 55 1234 5678                          │
│  📅 06 Feb 2026  💬 WhatsApp  💳 Contra entrega                  │
│                                                                  │
│  [Si es REVENDEDOR, mostrar:]                                    │
│  🤝 Revendedor: Carlos Mendoza                                   │
│                                                                  │
│  [Badges de estado...]                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

### Base de Datos
| Archivo | Cambios |
|---------|---------|
| Nueva migración | Crear tipo `sale_type`, agregar columna a `sales` |

### Tipos
| Archivo | Cambios |
|---------|---------|
| `src/types/index.ts` | Agregar `SaleType`, actualizar `Sale` interface |

### Hooks
| Archivo | Cambios |
|---------|---------|
| `src/hooks/useSales.ts` | Validaciones por tipo, lógica de cálculos condicional |

### Páginas
| Archivo | Cambios |
|---------|---------|
| `src/pages/Sales.tsx` | Formulario condicional, dashboard separado, SaleCard con tipo |

### Integración Supabase
| Archivo | Cambios |
|---------|---------|
| `src/integrations/supabase/types.ts` | Actualizar con nuevo campo `sale_type` |

---

## Orden de Implementación

```text
Paso 1: Migración de base de datos
        ├── Crear enum sale_type
        ├── Agregar columna sale_type a sales
        └── Migrar datos existentes

Paso 2: Actualizar tipos TypeScript
        ├── Agregar SaleType
        └── Actualizar Sale interface

Paso 3: Actualizar hook useSales
        ├── Agregar validaciones por tipo
        ├── Lógica de cálculos condicional
        └── Mapear nuevo campo desde/hacia DB

Paso 4: Rediseñar formulario Sales.tsx
        ├── Selector de tipo de venta (obligatorio)
        ├── Secciones condicionales
        └── Mensajes contextuales

Paso 5: Actualizar dashboard
        ├── Métricas separadas por tipo
        └── Totales globales

Paso 6: Actualizar SaleCard
        ├── Badge de tipo visible
        └── Info condicional según tipo
```

---

## Validaciones Críticas

| Validación | Venta Directa | Venta Revendedor |
|------------|---------------|------------------|
| Tipo de venta | OBLIGATORIO | OBLIGATORIO |
| Producto | OBLIGATORIO | OBLIGATORIO |
| Revendedor | NO APLICA | OBLIGATORIO |
| Precio revendedor | NO APLICA | OBLIGATORIO |
| Precio final | OBLIGATORIO | Opcional |
| Cliente nombre | Recomendado | Opcional |
| Cliente teléfono | Recomendado | Opcional |

---

## Mensajes de UI

### Venta Directa
- Header: "💵 Venta directa al cliente final"
- Subtítulo: "Esta venta genera ingreso directo para GRC"

### Venta a Revendedor
- Header: "🤝 Venta a revendedor (mayorista)"
- Subtítulo: "GRC vende el producto al revendedor, no al cliente final"

---

## Resultado Esperado

1. **Claridad total**: El tipo de venta es explícito y obligatorio
2. **Sin ambigüedades**: Campos y cálculos dependen del tipo seleccionado
3. **Dashboard informativo**: Métricas separadas por tipo de venta
4. **Validaciones robustas**: No se pueden crear ventas inconsistentes
5. **UI intuitiva**: Mensajes claros que explican cada tipo
6. **Escalable**: Preparado para filtros, reportes y automatización futura

---

## Sección Técnica

### Enum en PostgreSQL

```sql
CREATE TYPE sale_type AS ENUM ('directa', 'revendedor');
```

### Validación en Hook

```typescript
const addSale = async (sale: SaleInput) => {
  // Validación obligatoria
  if (!sale.saleType) {
    toast({ title: 'Error', description: 'Debes seleccionar el tipo de venta', variant: 'destructive' });
    return null;
  }
  
  if (sale.saleType === 'revendedor' && !sale.sellerId) {
    toast({ title: 'Error', description: 'Debes seleccionar un revendedor', variant: 'destructive' });
    return null;
  }
  
  if (sale.saleType === 'directa' && !sale.finalPrice) {
    toast({ title: 'Error', description: 'El precio final es obligatorio en ventas directas', variant: 'destructive' });
    return null;
  }
  
  // Cálculos según tipo...
};
```

### Estado del Formulario

```typescript
// Nuevo estado
const [saleType, setSaleType] = useState<SaleType | null>(null);

// Computed: mostrar/ocultar secciones
const showResellerSection = saleType === 'revendedor';
const showDirectPricingSection = saleType === 'directa';
const isResellerRequired = saleType === 'revendedor';
const isFinalPriceRequired = saleType === 'directa';
```

### Cálculo de Stats Separados

```typescript
const stats = useMemo(() => {
  const directSales = sales.filter(s => s.saleType === 'directa');
  const resellerSales = sales.filter(s => s.saleType === 'revendedor');
  
  return {
    // Globales
    totalSold: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    // Por tipo
    directTotal: directSales.reduce((sum, s) => sum + s.totalAmount, 0),
    directCount: directSales.length,
    resellerTotal: resellerSales.reduce((sum, s) => sum + s.totalAmount, 0),
    resellerCount: resellerSales.length,
    // ... más métricas
  };
}, [sales]);
```
