

# Plan: Ventas por Socio Interno (Digital / Presencial)

## Resumen

Agregar campos de origen de venta y reparto de ganancia al modulo de ventas, sin modificar la estructura multi-tenant existente.

---

## Fase 1: Base de Datos

### Migracion SQL

```sql
-- Enum para origen de venta
CREATE TYPE sale_source AS ENUM ('digital', 'presencial');

-- Nuevos campos en tabla sales
ALTER TABLE sales ADD COLUMN sale_source sale_source NOT NULL DEFAULT 'digital';
ALTER TABLE sales ADD COLUMN my_percentage numeric NOT NULL DEFAULT 100;
ALTER TABLE sales ADD COLUMN partner_percentage numeric NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN my_profit_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN partner_profit_amount numeric NOT NULL DEFAULT 0;
```

No se crean tablas nuevas ni se modifican politicas RLS.

---

## Fase 2: Tipos TypeScript

### Cambios en `src/types/index.ts`

- Agregar tipo: `export type SaleSource = 'digital' | 'presencial';`
- Agregar campos a interfaz `Sale`:
  - `saleSource: SaleSource`
  - `myPercentage: number`
  - `partnerPercentage: number`
  - `myProfitAmount: number`
  - `partnerProfitAmount: number`

---

## Fase 3: Hook `useSales.ts`

### Mapeo de datos
- Mapear los 5 campos nuevos desde snake_case de la DB al camelCase del frontend
- En `addSale`: calcular automaticamente `my_profit_amount` y `partner_profit_amount` antes de insertar:

```text
profit = totalAmount - (costAtSale * quantity)
my_profit_amount = profit * (my_percentage / 100)
partner_profit_amount = profit * (partner_percentage / 100)
```

- En `SaleInput`: agregar `saleSource`, `myPercentage`, `partnerPercentage`

---

## Fase 4: Formulario de Venta (`Sales.tsx`)

### Nuevo campo: Origen de venta

Despues de seleccionar el tipo de venta (directa/revendedor), agregar una seccion:

```text
ORIGEN DE VENTA
[Digital (yo)]  [Presencial (socio)]
```

### Logica condicional:
- Si "Digital": `myPercentage = 100`, `partnerPercentage = 0` (no editable)
- Si "Presencial": mostrar campos editables para ambos porcentajes (default 50/50 o configurable)
- Validar que `myPercentage + partnerPercentage = 100`

### Preview de distribucion:
Mostrar calculo en tiempo real debajo de los porcentajes:

```text
Ganancia bruta: $X
  Mi parte (70%): $Y
  Socio (30%): $Z
```

---

## Fase 5: Dashboard de Ventas (`Sales.tsx`)

### Seccion 1 - Total negocio (ya existe, sin cambios)
- Total vendido, Pendiente, Cobrado, Ganancia neta

### Seccion 2 - Ventas por origen (NUEVA)
Dos cards:
- Total Digital: monto + cantidad de ventas digitales
- Total Presencial: monto + cantidad de ventas presenciales

### Seccion 3 - Distribucion de ganancia (NUEVA)
Dos cards:
- Mi ganancia acumulada: suma de `my_profit_amount` de todas las ventas
- Ganancia socio acumulada: suma de `partner_profit_amount` de todas las ventas

---

## Fase 6: Tarjeta de Venta (SaleCard)

Agregar badge visual:
- "Digital" (azul) o "Presencial" (violeta) junto al tipo de venta
- Si es presencial, mostrar reparto: "70/30" como badge adicional

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| Nueva migracion SQL | Crear enum + 5 columnas nuevas |
| `src/types/index.ts` | Agregar SaleSource y 5 campos a Sale |
| `src/hooks/useSales.ts` | Mapear campos, calcular profit split en addSale |
| `src/pages/Sales.tsx` | Selector origen, campos porcentaje, dashboard sections |
| `src/integrations/supabase/types.ts` | Actualizar tipos generados |

---

## Seccion Tecnica

### Calculo de profit split

```typescript
// En addSale, despues de calcular marginAtSale:
const totalProfit = marginAtSale * quantity;
const myProfitAmount = totalProfit * (saleSource === 'digital' ? 100 : myPercentage) / 100;
const partnerProfitAmount = totalProfit * (saleSource === 'digital' ? 0 : partnerPercentage) / 100;
```

### Stats adicionales en useMemo

```typescript
// Ventas por origen
const digitalSales = sales.filter(s => s.saleSource === 'digital');
const presencialSales = sales.filter(s => s.saleSource === 'presencial');
const digitalTotal = digitalSales.reduce((sum, s) => sum + s.totalAmount, 0);
const presencialTotal = presencialSales.reduce((sum, s) => sum + s.totalAmount, 0);

// Distribucion de ganancia
const myTotalProfit = sales.reduce((sum, s) => sum + (s.myProfitAmount || 0), 0);
const partnerTotalProfit = sales.reduce((sum, s) => sum + (s.partnerProfitAmount || 0), 0);
```

### Orden de implementacion

```text
1. Migracion SQL (enum + columnas)
2. Actualizar tipos TypeScript
3. Actualizar hook useSales
4. Actualizar formulario y dashboard en Sales.tsx
```

