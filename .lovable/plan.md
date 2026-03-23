

# Plan: Grafica de Ventas por Dia

## Archivo unico a modificar: `src/pages/Sales.tsx`

## Cambio

Insertar un componente de grafica de barras entre el selector de periodo (linea 476) y las cards de stats (linea 478).

### 1. Imports adicionales
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
```

### 2. Datos para la grafica
Nuevo `useMemo` llamado `dailyChartData` que:
- Genera un array con todos los dias del mes seleccionado (1 al 28/30/31)
- Para cada dia, suma `totalAmount` y ganancia (`marginAtSale * quantity`) de las ventas de ese dia
- Dias sin ventas quedan con total: 0, ganancia: 0

### 3. Componente visual
- `Card` con `ResponsiveContainer` + `BarChart`
- Barras color `#C1272D` (rojo marca)
- Eje X: dia del mes (1, 2, 3...)
- Eje Y: monto en pesos
- Tooltip personalizado mostrando: fecha completa, total vendido, ganancia del dia
- Altura fija ~250px

### 4. Ubicacion exacta
Despues de la linea 476 (`</div>` del selector de periodo), antes de linea 478 (`{/* Dashboard Stats */}`).

