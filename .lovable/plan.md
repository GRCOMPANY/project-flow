

# Plan: Filtro de Periodo en Ventas

## Resumen
Agregar un selector de mes/ano arriba de las metricas del dashboard de Ventas. Todas las estadisticas y la lista de ventas se filtran segun el periodo seleccionado.

## Cambio

**Archivo unico: `src/pages/Sales.tsx`**

### 1. Nuevos estados
```typescript
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
```

### 2. Filtrar ventas por periodo
Crear un `filteredSales` con `useMemo` que filtre `sales` por mes/ano usando `saleDate`. Reemplazar `sales` por `filteredSales` en el calculo de `stats` y en la lista de ventas.

### 3. Selector de periodo (entre el header y las metricas, linea ~397)
- Select de mes (Enero-Diciembre) + Select de ano (dinamico desde datos)
- Boton "Mes anterior" con icono de flecha para retroceder un mes rapido
- Boton "Mes actual" para volver al presente
- Badge mostrando el periodo activo: "Marzo 2026"

### 4. Sin cambios en
- Diseno existente de cards, formularios, ni logica de addSale/updateSale
- Hook `useSales.ts` no se toca
- Solo se agrega la capa de filtro visual en Sales.tsx

