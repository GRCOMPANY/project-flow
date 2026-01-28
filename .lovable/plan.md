
# Plan: Visualizar Congelado Financiero en UI de Ventas

## Resumen
Actualizar la interfaz del módulo de Ventas para mostrar los campos de congelado financiero existentes, nuevos KPIs de rentabilidad, alertas visuales de pérdida, y enlazar con el detalle del producto.

---

## Cambios a Realizar

### 1. Actualizar SaleCard con Información Financiera

**Archivo:** `src/pages/Sales.tsx` (componente SaleCard, líneas 550-693)

Agregar sección de margen en cada tarjeta de venta:

```text
┌────────────────────────────────────────────────────────────────┐
│ 📦 Producto Ejemplo ×2                              $1,200     │
│ 👤 Cliente · 📅 28 Ene · 💬 WhatsApp · 💳 Transferencia        │
├────────────────────────────────────────────────────────────────┤
│ Costo: $400 × 2 = $800    |    Margen: +$400 (50%)  🟢        │
│ [ALERTA ROJA si margen negativo]                              │
└────────────────────────────────────────────────────────────────┘
```

**Lógica visual:**
- Margen positivo: texto verde con icono ✓
- Margen negativo: texto rojo con icono ⚠️ y badge "PÉRDIDA"
- Mostrar: `Costo: $X × qty = $total | Margen: +$X (X%)`

---

### 2. Nuevos KPIs en Dashboard de Ventas

**Archivo:** `src/pages/Sales.tsx` (stats useMemo, líneas 108-123)

Agregar a las estadísticas existentes:

| KPI Actual | KPI Nuevo |
|------------|-----------|
| Total vendido | ✓ Ya existe |
| Pendiente por cobrar | ✓ Ya existe |
| Cobrado | ✓ Ya existe |
| - | **Costo total** (suma costAtSale × qty) |
| - | **Ganancia neta** (suma marginAtSale × qty) |
| - | **Margen promedio** (promedio marginPercentAtSale) |

**Nueva UI (agregar segunda fila de cards):**

```text
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Total vendido  │ │ Pend. por cobrar│ │     Cobrado     │
│    $12,500      │ │     $3,200      │ │     $9,300      │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Costo total   │ │  Ganancia neta  │ │ Margen promedio │
│    $7,500       │ │ +$5,000 🟢      │ │      40%        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

### 3. Alerta Visual de Ventas con Pérdida

**En Dashboard:**
- Si hay ventas con margen negativo, mostrar badge de alerta: `⚠️ X ventas con pérdida`
- Color rojo/destructive

**En SaleCard:**
- Badge prominente `PÉRDIDA` en rojo si `marginAtSale < 0`
- Icono de alerta junto al total

---

### 4. Rentabilidad Real en ProductDetail

**Archivo:** `src/pages/ProductDetail.tsx`

Agregar nueva Card "Rentabilidad Real" después de "Performance":

```text
┌─────────────────────────────────────────────────────────────┐
│  💰 Rentabilidad Real (datos de ventas)                     │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│ │  $8,500   │ │  $5,100   │ │  +$3,400  │ │    40.0%      │ │
│ │ Ingresos  │ │  Costos   │ │ Ganancia  │ │ Margen prom.  │ │
│ │ (pagados) │ │ reales    │ │   neta    │ │               │ │
│ └───────────┘ └───────────┘ └───────────┘ └───────────────┘ │
│                                                             │
│ [⚠️ 1 venta con pérdida - si aplica]                       │
└─────────────────────────────────────────────────────────────┘
```

**Cálculos usando ventas del producto:**
- Ingresos: suma de `totalAmount` de ventas pagadas
- Costos: suma de `costAtSale × quantity` de ventas pagadas
- Ganancia neta: Ingresos - Costos (usando marginAtSale)
- Margen promedio: promedio de `marginPercentAtSale`
- Conteo de ventas con pérdida

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Sales.tsx` | Stats useMemo + segunda fila KPIs + SaleCard con margen |
| `src/pages/ProductDetail.tsx` | Nueva card "Rentabilidad Real" |

---

## Detalle Técnico

### Cálculo de Stats en Sales.tsx

```typescript
const stats = useMemo(() => {
  const totalSold = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const pending = sales.filter(s => s.paymentStatus === 'pendiente');
  const paid = sales.filter(s => s.paymentStatus === 'pagado');
  const pendingAmount = pending.reduce((sum, s) => sum + s.totalAmount, 0);
  const paidAmount = paid.reduce((sum, s) => sum + s.totalAmount, 0);

  // NUEVO: KPIs de rentabilidad
  const totalCost = sales.reduce((sum, s) => 
    sum + ((s.costAtSale || 0) * s.quantity), 0
  );
  const netProfit = sales.reduce((sum, s) => 
    sum + ((s.marginAtSale || 0) * s.quantity), 0
  );
  const salesWithMargin = sales.filter(s => s.marginPercentAtSale !== undefined);
  const avgMargin = salesWithMargin.length > 0
    ? salesWithMargin.reduce((sum, s) => sum + (s.marginPercentAtSale || 0), 0) / salesWithMargin.length
    : 0;
  const salesWithLoss = sales.filter(s => (s.marginAtSale || 0) < 0).length;

  return {
    totalSold,
    totalSales: sales.length,
    pendingAmount,
    pendingCount: pending.length,
    paidAmount,
    paidCount: paid.length,
    // Nuevos
    totalCost,
    netProfit,
    avgMargin,
    salesWithLoss,
  };
}, [sales]);
```

### Visualización de Margen en SaleCard

```typescript
// Dentro de SaleCard, después del precio total
const marginColor = (sale.marginAtSale || 0) >= 0 ? 'text-emerald-600' : 'text-destructive';
const marginSign = (sale.marginAtSale || 0) >= 0 ? '+' : '';
const hasLoss = (sale.marginAtSale || 0) < 0;

// JSX
<div className="flex items-center gap-2 text-xs border-t pt-2 mt-2">
  <span className="text-muted-foreground">
    Costo: ${((sale.costAtSale || 0) * sale.quantity).toLocaleString()}
  </span>
  <span className="text-muted-foreground">|</span>
  <span className={marginColor}>
    Margen: {marginSign}${((sale.marginAtSale || 0) * sale.quantity).toLocaleString()} 
    ({(sale.marginPercentAtSale || 0).toFixed(0)}%)
  </span>
  {hasLoss && (
    <Badge variant="destructive" className="text-xs">
      ⚠️ PÉRDIDA
    </Badge>
  )}
</div>
```

---

## Orden de Implementación

1. Actualizar `stats` useMemo con nuevos cálculos
2. Agregar segunda fila de KPI cards al dashboard
3. Modificar SaleCard para mostrar margen y alertas
4. Agregar card de Rentabilidad Real en ProductDetail

---

## Resultado Visual Esperado

**Módulo de Ventas:**
- 6 KPIs en lugar de 3 (2 filas)
- Cada venta muestra su costo/margen con color semántico
- Badge de pérdida en rojo si aplica
- Alerta general si hay ventas con pérdida

**Detalle de Producto:**
- Nueva sección mostrando rentabilidad REAL basada en ventas
- Datos congelados, no teóricos
- Alerta si el producto tiene ventas con pérdida
