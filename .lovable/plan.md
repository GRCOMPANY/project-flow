

# Plan: Correccion de Calculo de Ganancias y Recalculo Global

## Problemas Identificados

### 1. Build Error
El archivo `ResellerDetailSheet.tsx` linea 77 tiene un cast incorrecto. Supabase devuelve `product` como un array `{ name: any }[]` pero se castea como objeto `{ name: string }`. Necesita castear como array y tomar el primer elemento.

### 2. Calculo de "Mi Ganancia" incorrecto
En `useSales.ts` linea 251, cuando `myPercentage` es 0 y `saleSource` es 'presencial', el codigo usa `sale.myPercentage || 100`. El operador `||` trata `0` como falsy y lo reemplaza por `100`. Resultado: una venta presencial con 0% para mi, suma 100% a "Mi ganancia".

**Linea problematica:**
```typescript
const effectiveMyPct = sale.saleSource === "digital" ? 100 : sale.myPercentage || 100;
```

**Correccion:** Usar `??` en lugar de `||`:
```typescript
const effectiveMyPct = sale.saleSource === "digital" ? 100 : (sale.myPercentage ?? 100);
```

### 3. updateSale NO recalcula profit split
La funcion `updateSale` (linea 319-353) solo mapea campos basicos. No recalcula `my_profit_amount`, `partner_profit_amount`, `cost_at_sale`, `margin_at_sale`, etc. Esto causa que al editar una venta, los montos de ganancia queden desactualizados.

### 4. No existe mecanismo de recalculo global
No hay forma de corregir ventas historicas que se guardaron con calculos erroneos.

---

## Solucion

### Paso 1: Fix build error en ResellerDetailSheet.tsx

Cambiar linea 77 para manejar correctamente el tipo de retorno de Supabase:
```typescript
product_name: (Array.isArray(s.product) ? s.product[0]?.name : (s.product as any)?.name) || 'Producto eliminado',
```

### Paso 2: Fix operador || por ?? en addSale

En `useSales.ts`, cambiar las lineas 251-252:
```typescript
// ANTES (bug: 0 || 100 = 100)
const effectiveMyPct = sale.saleSource === "digital" ? 100 : sale.myPercentage || 100;
const effectivePartnerPct = sale.saleSource === "digital" ? 0 : sale.partnerPercentage || 0;

// DESPUES (correcto: 0 ?? 100 = 0)
const effectiveMyPct = sale.saleSource === "digital" ? 100 : (sale.myPercentage ?? 100);
const effectivePartnerPct = sale.saleSource === "digital" ? 0 : (sale.partnerPercentage ?? 0);
```

### Paso 3: Reescribir updateSale con recalculo completo

La funcion `updateSale` debe:
1. Recibir todos los campos editables (incluyendo saleSource, myPercentage, partnerPercentage)
2. Re-obtener el producto para recalcular costos
3. Recalcular: costAtSale, marginAtSale, marginPercentAtSale, unitPrice, totalAmount, myProfitAmount, partnerProfitAmount
4. Guardar todos los campos recalculados en la DB

### Paso 4: Funcion de recalculo global

Agregar funcion `recalculateAllSales` en `useSales.ts` que:
1. Lee TODAS las ventas de la DB
2. Para cada venta, obtiene el costo del producto (usando cost_at_sale ya guardado)
3. Recalcula myProfitAmount y partnerProfitAmount usando los porcentajes guardados y el operador `??`
4. Actualiza cada venta en batch

### Paso 5: Boton "Recalcular metricas" en Sales.tsx

Agregar boton en la parte superior derecha del dashboard, junto a "Nueva venta":
- Icono de recarga
- Texto: "Recalcular"
- Confirmacion antes de ejecutar
- Indicador de progreso durante ejecucion
- Toast de exito/error al terminar

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/resellers/ResellerDetailSheet.tsx` | Fix cast de product (linea 77) |
| `src/hooks/useSales.ts` | Fix `\|\|` por `??`, reescribir updateSale, agregar recalculateAllSales |
| `src/pages/Sales.tsx` | Agregar boton "Recalcular metricas" |

## Notas Tecnicas

- Las metricas del dashboard ya se calculan dinamicamente con `useMemo` desde los datos de ventas - esto es correcto
- Los campos `my_profit_amount` y `partner_profit_amount` en la DB son valores por-venta, no acumulados - esto tambien es correcto
- El problema principal es el operador `||` que trata `0` como falsy, y que `updateSale` no recalcula nada
- El recalculo global se hace desde frontend con queries individuales. Para un volumen mayor se podria usar una edge function, pero para el volumen actual es suficiente

