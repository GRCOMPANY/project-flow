

# Plan: Mejora Visual Premium del Centro de Comando

Rediseno visual inspirado en Stripe/Linear/Vercel manteniendo toda la funcionalidad intacta. Solo cambios de tipografia, espaciado, colores y layout.

## Archivos a modificar

1. **`src/components/command-center/HeroFinancialCard.tsx`** -- Numero hero mas grande, mejor tipografia, mas espacio
2. **`src/components/command-center/MetricsDashboard.tsx`** -- Cards mas grandes, numeros en #C1272D, iconos limpios, mejor separacion
3. **`src/components/command-center/AIRadarPanel.tsx`** -- Alertas con mas espacio, iconos mas claros, mejor diseno
4. **`src/components/command-center/ProductSpotlight.tsx`** -- Card mas visual, margen con badge, mejor layout
5. **`src/components/command-center/AIInsightBanner.tsx`** -- Mas limpio, mejor jerarquia
6. **`src/components/command-center/QuickActionsBar.tsx`** -- Botones mas refinados
7. **`src/pages/CommandCenter.tsx`** -- Mas espaciado entre secciones (space-y-10 -> space-y-14)
8. **`src/index.css`** -- Actualizar clases premium existentes

## Cambios por componente

### 1. HeroFinancialCard
- Numero principal: `text-5xl md:text-6xl lg:text-7xl` (actualmente 4xl/5xl/6xl)
- Agregar `font-feature-settings: 'tnum'` para numeros tabulares
- Padding interno: `p-8 md:p-10` (actualmente p-6 md:p-8)
- Label "Balance Critico del Dia" con tipografia Playfair Display
- Mas separacion interna entre bloques (space-y-8)

### 2. MetricsDashboard
- Numeros de metricas en color `text-[#C1272D]` (rojo marca)
- Cards mas altas: padding `p-6` (actualmente p-5)
- Grid gap `gap-6` (actualmente gap-4)
- Iconos con fondo mas prominente: `w-12 h-12 rounded-2xl`
- Sparkline mas ancha y alta

### 3. AIRadarPanel
- Alertas con `gap-4 p-5` (actualmente gap-3 p-4)
- Espacio entre alertas: `space-y-3` (actualmente space-y-2.5)
- Iconos de alerta mas grandes: `w-11 h-11`
- Dot de severidad mas grande: `w-3 h-3`
- Texto de accion siempre visible en desktop

### 4. ProductSpotlight
- Margen destacado con badge/pill rojo `bg-[#C1272D]`
- Imagen mas grande: `max-w-[280px]`
- Metricas con numeros mas prominentes `text-3xl md:text-4xl`
- Padding `p-8 md:p-10`

### 5. AIInsightBanner
- Icono mas grande: `w-18 h-18`
- Mensaje con `text-2xl` (actualmente text-xl)
- Padding `p-8 md:p-10`

### 6. CommandCenter.tsx
- `space-y-14` en container principal (actualmente space-y-10)
- Grid gap entre columnas `gap-10` (actualmente gap-8)
- Greeting con Playfair Display `font-['Playfair_Display']`

### 7. index.css
- `.metric-card-premium` con mayor shadow y radius
- `.radar-alert` con padding y gap incrementados
- `.hero-financial-number` con font-feature-settings tnum
- `.hero-financial-card` con shadow mas pronunciada

## Lo que NO cambia
- Toda la logica de datos, filtros, calculos
- Props, interfaces, funciones helper (generateRadarAlerts, identifyKeyProducts, etc.)
- Estructura de componentes y rutas
- Selector de periodo del MetricsDashboard

