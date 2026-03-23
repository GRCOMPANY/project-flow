

# Plan: Métricas del Mes en Centro de Comando

## Archivos a modificar

1. **`src/components/command-center/MetricsDashboard.tsx`** — Agregar selector de mes/año, cambiar título, cambiar lógica de cálculo de 7 días a mensual, cambiar texto "vs semana anterior" a "vs mes anterior"
2. **`src/pages/CommandCenter.tsx`** — Pasar `sales` directamente al `MetricsDashboard` en lugar de pre-calcular `trendData`, y dejar que el componente maneje internamente el filtrado por mes

## Cambios específicos

### MetricsDashboard.tsx

1. **Props**: Recibir `sales` (array crudo) en lugar de `salesData`/`profitData`/`marginData` pre-calculados
2. **Estado interno**: `selectedMonth` y `selectedYear` (default: mes actual)
3. **Selector de período**: Mismo estilo que Ventas — selects de mes/año + botón "Mes anterior" + botón "Mes actual"
4. **Título**: "MÉTRICAS 7 DÍAS" → "MÉTRICAS DEL MES"
5. **Subtítulo**: "Comparativa vs período anterior" → "Comparativa vs mes anterior"
6. **Cálculo**: Reemplazar `calculateTrendData` (basado en 7 días) por `calculateMonthlyTrendData` que:
   - Filtra ventas del mes seleccionado para ventas, ganancia y margen
   - Compara contra el mes anterior completo
   - Genera sparkline con datos diarios del mes (en lugar de 7 puntos)
7. **Texto**: "vs semana anterior" → "vs mes anterior"

### CommandCenter.tsx

- Eliminar el `useMemo` de `trendData` y pasar `sales` directo al componente
- Cambiar props de `<MetricsDashboard sales={sales} />`

## Sin cambios en
- Diseño de las cards de métricas (mismo layout, colores, sparklines)
- Resto del Centro de Comando
- Sección de Ventas

