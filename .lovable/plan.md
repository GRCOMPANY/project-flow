

# Plan: Tienda de Conversión con Capas Psicológicas

Reescritura completa de `src/pages/TiendaPublica.tsx` con nueva paleta naranja, sistema de urgencia, FOMO visual y clasificación automática. Sin cambios en queries ni lógica de datos.

## Archivo: `src/pages/TiendaPublica.tsx` (reescritura completa)

### Nueva paleta (inline styles + Tailwind arbitrary values)
- Fondo: `#FAFAFA`, Header: `#1A1A1A`, Primario: `#E85D00`, Acento: `#FFF3EC`, Cards: `#FFFFFF`, WA: `#25D366`

### Estados nuevos
- `heroTextIndex` (number) — rota entre 3 frases cada 3s via `useEffect` + `setInterval`
- Se eliminan: `quantities` (ya no hay selector de cantidad en cards, solo en landing page)
- Se mantienen: `search`, `category`

### Categorías actualizadas
`["Todos", "Cocina", "Hogar", "Tecnología", "Organización", "General"]`

### Clasificación automática
Función `smartCategory(name, desc, category)` que clasifica por keywords en nombre/descripción:
- hervidor/batidora/lonchera/escurridor → Cocina
- cepillo/esquinero/ducha/baño/tensiómetro → Hogar
- watch/onn/proyector/aspirador → Tecnología
- caja/almacenamiento → Organización
- Default: usa `category` existente o "General"
- Se usa solo para filtrado visual; no modifica DB

### Anclaje de precio
Helper `getAnchorPrice(retail_price)`: retorna `Math.round(retail_price * 1.35)` — precio "antes" tachado

### Badges FOMO
Array `["🔥 Popular", "⚡ Viral", "🆕 Nuevo", "🚀 Más vendido"]`, asignado por `product.id.charCodeAt(0) % 4` (determinístico, no random en cada render)

### Componentes inline

**UrgencyTimer**: Countdown visual que inicia en 2h 59m 59s al montar, decrementa cada segundo. Muestra `HH:MM:SS`. Se reinicia al recargar (frontend only). Texto: "⏰ Oferta del día termina en:"

**SmartProductCard**: Card compacta con:
- Imagen 180px, hover zoom `scale-105`
- Badge FOMO (esquina superior)
- Precio naranja `#E85D00` grande + precio tachado `getAnchorPrice` arriba en gris
- "✅ Disponible ahora · Entrega Bogotá"
- "🔥 Alta demanda hoy" (texto naranja pequeño)
- Botón "Ver producto →" naranja → `navigate(/producto/:id)`
- Hover: shadow elevada + borde naranja `border-[#E85D00]`
- Animación: fadeSlideUp escalonado

**TrendingCarousel**: Sección "🔥 Lo que todos están comprando". Scroll horizontal automático con `useEffect` + `scrollLeft` increment cada 30ms. Muestra productos `is_featured` o los primeros 6. Cards mini (imagen + nombre + precio).

**SocialProofSection**: 3 testimonios hardcodeados (nombres colombianos, 5 estrellas, comentario corto). Encabezado: "+100 clientes satisfechos en Colombia"

**FloatingConversionButtons**: Dos botones fixed:
1. WhatsApp verde (bottom-right, 60px circle, bounce animation)
2. Naranja "💰 Gana vendiendo esto →" (bottom-left, pill shape) → `window.open("/catalogo", "_blank")`

### Estructura de la página

```text
[Top Bar naranja — "⏰ Oferta del día" + UrgencyTimer inline]
[Header sticky #1A1A1A — logo + badge "🔥 Tendencia hoy" pulsante + botón WA naranja shimmer]

HERO:
  Fondo degradado animado #FFF3EC → #FAFAFA (keyframe gradientShift lento)
  Texto dinámico rotante (heroTextIndex, fade transition)
  Badge naranja pulsante "🔥 Tendencia hoy"
  Botón "Ver productos" naranja + "WhatsApp" outline

TRUST BAR:
  4 items en fila, fondo blanco

FILTERS:
  Búsqueda + pills (activo: naranja, inactivo: blanco borde gris)

PRODUCT GRID:
  2 cols mobile / 3 tablet / 4 desktop
  SmartProductCard para cada producto
  Banner revendedor después del 3er producto (fondo naranja #E85D00)

TRENDING CAROUSEL:
  "🔥 Lo que todos están comprando"
  Auto-scroll horizontal

SOCIAL PROOF:
  3 testimonios + contador "+100 clientes"

GUARANTEE:
  3 cards (mismo contenido actual, colores adaptados)

FOOTER:
  Fondo #1A1A1A

FLOATING BUTTONS:
  WhatsApp verde (derecha) + "Gana vendiendo" naranja (izquierda)
```

### CSS Keyframes (en `<style>` tag)
- `fadeSlideUp`, `bounceSubtle`, `shimmer` (existentes, adaptados a naranja)
- `gradientShift` (nuevo): mueve background-position del hero lentamente
- `scrollCarousel` (nuevo): para auto-scroll
- Todos con `prefers-reduced-motion: reduce`

## Sin cambios en
- Query de Supabase (misma vista, mismo filtro)
- Interfaz `CatalogProduct`
- Constante `GRC_WHATSAPP`
- Otros archivos del proyecto
- Ruta en App.tsx (ya existe `/tienda`)
- `/catalogo`, `/producto/:id`, sistema interno

